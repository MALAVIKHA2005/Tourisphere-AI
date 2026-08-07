import React, { useEffect, useState } from "react";
import { fetchDestinations } from "../services/destinationService";
import { fetchSentiment } from "../services/sentimentService";

const ROWS = [
  { key: "positive", emoji: "😊", label: "Positive", barClass: "bg-green-400", textClass: "text-green-700" },
  { key: "neutral", emoji: "😐", label: "Neutral", barClass: "bg-gray-300", textClass: "text-gray-600" },
  { key: "negative", emoji: "😞", label: "Negative", barClass: "bg-red-400", textClass: "text-red-700" },
];

const OVERALL_STYLES = {
  positive: { emoji: "😊", label: "Mostly Positive", className: "text-green-700 bg-green-50" },
  neutral: { emoji: "😐", label: "Mostly Neutral", className: "text-gray-600 bg-gray-50" },
  negative: { emoji: "😞", label: "Mostly Negative", className: "text-red-700 bg-red-50" },
  mixed: { emoji: "🤔", label: "Mixed", className: "text-amber-700 bg-amber-50" },
};

export default function Sentiment() {
  const [destinations, setDestinations] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDestinations().then((data) => {
      setDestinations(data);
      if (data.length > 0) {
        setSelectedKey(`${data[0].name}|${data[0].country}`);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedKey) return;

    const destination = destinations.find(
      (d) => `${d.name}|${d.country}` === selectedKey
    );

    if (!destination) return;

    setSentiment(null);
    setLoading(true);

    fetchSentiment(destination)
      .then(setSentiment)
      .finally(() => setLoading(false));
  }, [selectedKey, destinations]);

  const overall = sentiment?.overallLabel ? OVERALL_STYLES[sentiment.overallLabel] : null;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 16 • SENTIMENT ANALYSIS
        </p>

        <h1 className="text-5xl font-bold mt-2">Review Sentiment</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          Every real review's text is scored with VADER, a lexicon-based sentiment
          analyzer -- not a trained model (there's no labeled training data for
          travel reviews here), just a transparent, rule-based read of the actual
          words people wrote. Honestly empty for destinations with no reviews yet.
        </p>

        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
              Destination
            </label>

            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 mb-6"
            >
              {destinations.map((d) => (
                <option key={`${d.name}|${d.country}`} value={`${d.name}|${d.country}`}>
                  {d.name}, {d.country}
                </option>
              ))}
            </select>

            {loading && <p className="text-sm text-gray-500">Loading reviews...</p>}

            {!loading && sentiment?.count === 0 && (
              <p className="text-sm text-gray-500">
                No reviews yet for this destination -- open it from Recommendation
                and be the first to leave one.
              </p>
            )}

            {!loading && sentiment?.count > 0 && (
              <>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-6 ${overall.className}`}>
                  <span className="text-2xl">{overall.emoji}</span>
                  <div>
                    <p className="font-bold">{overall.label}</p>
                    <p className="text-xs opacity-75">
                      Based on {sentiment.count} real review{sentiment.count === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {ROWS.map((row) => {
                    const n = sentiment.breakdown[row.key];
                    const pct = Math.round((n / sentiment.count) * 100);

                    return (
                      <div key={row.key}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className={`font-medium ${row.textClass}`}>
                            {row.emoji} {row.label}
                          </span>
                          <span className="text-gray-500">{n} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${row.barClass}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
