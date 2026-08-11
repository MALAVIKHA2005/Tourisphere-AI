import os
from concurrent.futures import ThreadPoolExecutor

from google import genai
from google.genai import errors as genai_errors
from google.genai import types as genai_types
from groq import Groq, RateLimitError

from app.services.climate_service import get_best_months
from app.services.hotel_price_service import get_budget_tier, get_hotels
from app.services.lifestyle_service import get_lifestyle
from app.services.restaurant_service import get_restaurants

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

GEMINI_MODEL = "gemini-flash-latest"
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_FALLBACK_MODEL = "llama-3.1-8b-instant"

_gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
_groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

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


def _generate(system_prompt, user_message, max_tokens):
    """
    Gemini is the primary generator -- a completely separate API key and
    quota from the RAG assistant's Groq usage, so heavy trip-planning use
    can no longer starve (or be starved by) the chat assistant. Falls
    through to Groq's own two-model chain only if Gemini is unavailable
    or rate-limited. Gemini's thinking budget shares the same output
    token pool as the visible answer (confirmed directly -- a tight cap
    left the real answer empty because thinking alone used it up), so
    this is given generous headroom rather than the tight budget tuned
    for Groq's hard daily cap.
    """

    if _gemini_client:
        try:
            response = _gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=f"{system_prompt}\n\n{user_message}",
                config=genai_types.GenerateContentConfig(
                    max_output_tokens=max_tokens + 1500,
                    temperature=0.5,
                    thinking_config=genai_types.ThinkingConfig(thinking_level="low"),
                ),
            )
            if response.text:
                return response.text
        except genai_errors.APIError as e:
            print(f"Gemini error ({e.code}), falling back to Groq:", e)
        except Exception as e:
            print("Gemini error, falling back to Groq:", e)

    if _groq_client:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ]
        for model in (GROQ_MODEL, GROQ_FALLBACK_MODEL):
            try:
                response = _groq_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.5,
                )
                return response.choices[0].message.content
            except RateLimitError as e:
                print(f"Groq rate limit on {model}, trying next:", e)
                continue
            except Exception as e:
                print("Groq Error:", e)
                break

    return None


def generate_itinerary(destination_name, city, country, days, interests=None):
    if not _gemini_client and not _groq_client:
        return {
            "itinerary": "The AI trip planner isn't configured yet -- no GEMINI_API_KEY or GROQ_API_KEY is set on the server.",
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

    system_prompt = f"{SYSTEM_PROMPT}\n\nREAL DATA FOR {destination_name}:\n{context}"
    max_tokens = min(1800, 120 * days + 300)

    itinerary = _generate(system_prompt, user_message, max_tokens)

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
