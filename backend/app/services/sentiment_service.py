from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.database.mongodb import reviews_collection

_analyzer = SentimentIntensityAnalyzer()

POSITIVE_THRESHOLD = 0.05
NEGATIVE_THRESHOLD = -0.05


def analyze_text(text: str) -> dict:
    """
    VADER: a lexicon + rule-based sentiment scorer, not a trained model --
    no labeled training data exists for travel reviews here, so this is
    the honest choice over pretending a classifier was "trained". Real,
    widely-used technique (tuned for short informal text, which reviews
    are), fully transparent, works from the first real review submitted.
    """

    compound = _analyzer.polarity_scores(text)["compound"]

    if compound >= POSITIVE_THRESHOLD:
        label = "positive"
    elif compound <= NEGATIVE_THRESHOLD:
        label = "negative"
    else:
        label = "neutral"

    return {"compound": compound, "label": label}


def get_destination_sentiment(destination_key: str) -> dict:

    reviews = list(
        reviews_collection.find(
            {"destination_key": destination_key, "sentiment.label": {"$exists": True}},
            {"_id": 0, "sentiment": 1},
        )
    )

    count = len(reviews)

    if count == 0:
        return {
            "count": 0,
            "overallLabel": None,
            "breakdown": None,
            "averageCompound": None,
        }

    breakdown = {"positive": 0, "neutral": 0, "negative": 0}

    for review in reviews:
        breakdown[review["sentiment"]["label"]] += 1

    average_compound = round(
        sum(review["sentiment"]["compound"] for review in reviews) / count, 3
    )

    top_count = max(breakdown.values())
    tied_labels = [label for label, n in breakdown.items() if n == top_count]
    overall_label = tied_labels[0] if len(tied_labels) == 1 else "mixed"

    return {
        "count": count,
        "overallLabel": overall_label,
        "breakdown": breakdown,
        "averageCompound": average_compound,
    }
