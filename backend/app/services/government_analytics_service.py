from app.database.mongodb import (
    expenses_collection,
    reviews_collection,
    search_history_collection,
    travel_history_collection,
)
from app.services.currency_service import get_exchange_rates

TOP_STATES_LIMIT = 8

"""
A public-sector-style rollup of this platform's own real usage data --
NOT official government tourism statistics. No free source exists for
real visitor-arrival counts, tourism revenue, or foreign-exchange
earnings (same dead end as everywhere else in this app that needed
data nobody publishes for free), so this deliberately stays honest
about what it actually is: real aggregate behaviour across everyone
who has used Tourisphere -- what real travelers search for, how they
rate real places, and what they say they spend -- not a substitute for
an actual national tourism ministry's dataset.
"""


def _counts(records, field, limit=None):
    counts = {}

    for record in records:
        value = record.get(field)

        if not value:
            continue

        counts[value] = counts.get(value, 0) + 1

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)

    return ranked[:limit] if limit else ranked


def _convert_to_usd(amount, currency, rates):
    if not rates.get(currency) or not rates.get("USD"):
        return amount

    return (amount / rates[currency]) * rates["USD"]


def get_sentiment_overview():
    reviews = list(
        reviews_collection.find(
            {"sentiment.label": {"$exists": True}}, {"_id": 0, "sentiment": 1}
        )
    )

    count = len(reviews)

    if count == 0:
        return {"count": 0, "overallLabel": None, "breakdown": None}

    breakdown = {"positive": 0, "neutral": 0, "negative": 0}

    for review in reviews:
        breakdown[review["sentiment"]["label"]] += 1

    top_count = max(breakdown.values())
    tied_labels = [label for label, n in breakdown.items() if n == top_count]
    overall_label = tied_labels[0] if len(tied_labels) == 1 else "mixed"

    return {"count": count, "overallLabel": overall_label, "breakdown": breakdown}


def get_spending_overview():
    """
    Real, self-reported expenses from the Expense Tracker (Phase 20),
    aggregated across everyone -- no per-user amounts exposed, just
    category totals. Mixed-currency entries are converted to USD using
    the same live exchange rates used elsewhere on this platform, so
    it's a real computed total, not a guess -- but still self-reported
    spending, not verified transactions.
    """

    expenses = list(expenses_collection.find({}, {"_id": 0}))

    if not expenses:
        return {"count": 0, "totalUsd": 0, "byCategory": [], "contributors": 0}

    rates = get_exchange_rates()
    totals = {}
    contributors = set()

    for expense in expenses:
        usd = _convert_to_usd(expense["amount"], expense["currency"], rates)
        totals[expense["category"]] = totals.get(expense["category"], 0) + usd
        contributors.add(expense["user_id"])

    by_category = sorted(
        (
            {"category": category, "totalUsd": round(total, 2)}
            for category, total in totals.items()
        ),
        key=lambda item: item["totalUsd"],
        reverse=True,
    )

    return {
        "count": len(expenses),
        "totalUsd": round(sum(totals.values()), 2),
        "byCategory": by_category,
        "contributors": len(contributors),
    }


def get_government_analytics():
    history = list(travel_history_collection.find({}, {"_id": 0, "state": 1}))
    searches = list(
        search_history_collection.find({}, {"_id": 0, "budget": 1, "climate": 1})
    )

    top_states = [
        {"state": state, "views": count}
        for state, count in _counts(history, "state", TOP_STATES_LIMIT)
    ]

    budget_demand = [
        {"budget": budget, "count": count}
        for budget, count in _counts(searches, "budget")
    ]

    climate_demand = [
        {"climate": climate, "count": count}
        for climate, count in _counts(searches, "climate")
    ]

    return {
        "sentiment": get_sentiment_overview(),
        "topStates": top_states,
        "budgetDemand": budget_demand,
        "climateDemand": climate_demand,
        "spending": get_spending_overview(),
    }
