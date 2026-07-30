from datetime import datetime, timedelta

from app.database.mongodb import (
    destinations_collection,
    favorites_collection,
    search_history_collection,
    travel_history_collection,
    users_collection,
)

VIEWS_OVER_TIME_DAYS = 14


def _top_counts(records, field, limit):
    counts = {}

    for record in records:
        value = record.get(field)

        if not value:
            continue

        counts[value] = counts.get(value, 0) + 1

    ranked = sorted(counts.items(), key=lambda item: item[1], reverse=True)

    return ranked[:limit]


def get_platform_stats():
    destinations = list(destinations_collection.find({}, {"_id": 0}))
    history = list(travel_history_collection.find({}, {"_id": 0}))
    searches = list(search_history_collection.find({}, {"_id": 0}))

    ratings = [d["rating"] for d in destinations if isinstance(d.get("rating"), (int, float))]
    average_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

    top_destinations = [
        {"name": name, "views": count}
        for name, count in _top_counts(history, "destination", 5)
    ]

    top_countries = [
        {"country": country, "views": count}
        for country, count in _top_counts(history, "country", 5)
    ]

    interest_distribution = [
        {"name": interest, "value": count}
        for interest, count in _top_counts(searches, "interest", 6)
    ]

    today = datetime.utcnow().date()
    day_labels = [today - timedelta(days=offset) for offset in range(VIEWS_OVER_TIME_DAYS - 1, -1, -1)]
    day_counts = {day: 0 for day in day_labels}

    for record in history:
        viewed_at = record.get("viewed_at")

        if not viewed_at:
            continue

        day = viewed_at.date() if hasattr(viewed_at, "date") else None

        if day in day_counts:
            day_counts[day] += 1

    views_over_time = [
        {"date": day.strftime("%b %d"), "views": count}
        for day, count in day_counts.items()
    ]

    return {
        "totals": {
            "destinations": len(destinations),
            "countries_covered": len({d.get("country") for d in destinations if d.get("country")}),
            "average_rating": average_rating,
            "views": len(history),
            "searches": len(searches),
            "favorites": favorites_collection.count_documents({}),
            "users": users_collection.count_documents({}),
        },
        "top_destinations": top_destinations,
        "top_countries": top_countries,
        "interest_distribution": interest_distribution,
        "views_over_time": views_over_time,
    }
