import os
from concurrent.futures import ThreadPoolExecutor

from groq import Groq, RateLimitError

from app.services.climate_service import get_best_months
from app.services.hotel_price_service import get_budget_tier, get_hotels
from app.services.lifestyle_service import get_lifestyle
from app.services.restaurant_service import get_restaurants

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"

_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MAX_DAYS = 14

SYSTEM_PROMPT = (
    "You are Tourisphere's trip planner. Build a realistic day-by-day "
    "itinerary using ONLY the real restaurants, hotels, and lifestyle spots "
    "listed below -- never invent a place name, address, or price that "
    "isn't in the data given. Spread real activities sensibly across the "
    "requested number of days (morning/afternoon/evening), pairing real "
    "restaurants for meals with real lifestyle spots for activities. Only "
    "a limited number of real places are listed, so for longer trips you "
    "will run out of new ones -- that's fine, reuse real favorites on "
    "later days like a real traveler revisiting a place they liked (note "
    "briefly that it's a repeat visit), rather than treating it as a gap "
    "to apologize for. Only say a day can't be filled meaningfully if "
    "there is truly no real data left to draw from at all. Format clearly "
    "as \"Day 1\", \"Day 2\", etc., each with a short list of real activities."
)

LIFESTYLE_LABELS = {
    "culture": "Culture/sightseeing spots",
    "shopping": "Shopping spots",
    "entertainment": "Entertainment spots",
    "nightlife": "Nightlife spots",
    "family": "Family-friendly spots",
}


def _format_context(restaurants, lifestyle, hotels, budget, best_months):
    lines = []

    if best_months:
        lines.append(f"Best months to visit (real climate data): {', '.join(best_months)}")
    if budget:
        lines.append(f"Typical budget tier (real live hotel price): {budget}")

    if hotels:
        lines.append("\nReal hotels available:")
        for h in hotels[:5]:
            price_note = ""
            if h.get("rates"):
                rate = h["rates"][0]
                price_note = f" (${rate['price']}/night from {rate['provider']})"
            lines.append(f"- {h['name']}{price_note}")

    if restaurants:
        lines.append("\nReal restaurants nearby:")
        for r in restaurants[:12]:
            lines.append(f"- {r['name']} ({r['cuisine']})")

    for key, label in LIFESTYLE_LABELS.items():
        places = lifestyle.get(key) or []
        if places:
            lines.append(f"\nReal {label.lower()}:")
            for p in places[:8]:
                lines.append(f"- {p['name']}")

    return "\n".join(lines) if lines else "No real data available for this destination."


def generate_itinerary(destination_name, city, country, days, interests=None):
    if not _client:
        return {
            "itinerary": "The AI trip planner isn't configured yet -- no GROQ_API_KEY is set on the server.",
            "sources": {},
        }

    try:
        days = max(1, min(int(days or 1), MAX_DAYS))
    except (TypeError, ValueError):
        days = 3

    with ThreadPoolExecutor(max_workers=4) as pool:
        restaurants_f = pool.submit(get_restaurants, city, country)
        lifestyle_f = pool.submit(get_lifestyle, city, country)
        hotels_f = pool.submit(get_hotels, city, country)
        best_months_f = pool.submit(get_best_months, city, country)

        restaurants = restaurants_f.result()
        lifestyle = lifestyle_f.result()
        hotels = hotels_f.result()
        best_months = best_months_f.result()

    budget = get_budget_tier(city, country)

    context = _format_context(restaurants, lifestyle, hotels, budget, best_months)

    interest_note = f" The traveler is interested in: {interests}." if interests else ""
    user_message = (
        f"Plan a {days}-day trip to {destination_name} ({city}, {country}).{interest_note}"
    )

    messages = [
        {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\nREAL DATA FOR {destination_name}:\n{context}",
        },
        {"role": "user", "content": user_message},
    ]

    max_tokens = min(1800, 120 * days + 300)
    itinerary = None

    for model in (MODEL, FALLBACK_MODEL):
        try:
            response = _client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.5,
            )
            itinerary = response.choices[0].message.content
            break
        except RateLimitError as e:
            print(f"Groq rate limit on {model}, trying fallback:", e)
            continue
        except Exception as e:
            print("Groq Error:", e)
            break

    if itinerary is None:
        itinerary = "Something went wrong generating your itinerary. Please try again."

    return {
        "itinerary": itinerary,
        "sources": {
            "restaurants": [r["name"] for r in restaurants[:12]],
            "lifestyle": {k: [p["name"] for p in v[:8]] for k, v in lifestyle.items() if v},
            "hotels": [h["name"] for h in hotels[:5]],
            "bestMonths": best_months,
            "budget": budget,
        },
    }
