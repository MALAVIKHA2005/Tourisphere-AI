import React, { useEffect, useState } from "react";
import { fetchGovernmentAnalytics } from "../services/governmentAnalyticsService";
import { retryFetch } from "../utils/retry";

const SENTIMENT_ROWS = [
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

const BUDGET_STYLE = {
  Low: { barClass: "bg-sky-400", textClass: "text-sky-700" },
  Medium: { barClass: "bg-indigo-400", textClass: "text-indigo-700" },
  High: { barClass: "bg-fuchsia-400", textClass: "text-fuchsia-700" },
};

const CLIMATE_STYLE = {
  Cool: { emoji: "❄️", barClass: "bg-cyan-400", textClass: "text-cyan-700" },
  Warm: { emoji: "☀️", barClass: "bg-amber-400", textClass: "text-amber-700" },
  Tropical: { emoji: "🌴", barClass: "bg-lime-400", textClass: "text-lime-700" },
};

const CATEGORY_STYLE = {
  Accommodation: { emoji: "🏨", barClass: "bg-blue-400", textClass: "text-blue-700" },
  Food: { emoji: "🍽️", barClass: "bg-orange-400", textClass: "text-orange-700" },
  Transport: { emoji: "🚗", barClass: "bg-purple-400", textClass: "text-purple-700" },
  Activities: { emoji: "🎟️", barClass: "bg-pink-400", textClass: "text-pink-700" },
  Shopping: { emoji: "🛍️", barClass: "bg-teal-400", textClass: "text-teal-700" },
  Other: { emoji: "📦", barClass: "bg-gray-400", textClass: "text-gray-600" },
};

const BarRow = ({ emoji, label, textClass, barClass, value, pct }) => (
  <div>
    <div className="flex items-center justify-between text-sm mb-1">
      <span className={`font-medium ${textClass}`}>{emoji} {label}</span>
      <span className="text-gray-500">{value}</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const Card = ({ title, caption, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6">
    <h2 className="text-lg font-bold mb-1">{title}</h2>
    {caption && <p className="text-xs text-gray-400 mb-4">{caption}</p>}
    {children}
  </div>
);

export default function GovernmentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setFailed(false);

    retryFetch(fetchGovernmentAnalytics).then((result) => {
      setData(result);
      setFailed(!result);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <div className="flex-1 p-12">
          <p className="text-gray-500">Loading platform-wide data...</p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex bg-gray-50 min-h-screen">
        <div className="flex-1 p-12">
          <p className="text-gray-500 mb-4">
            Couldn't reach the server. It may still be waking up from being
            idle -- this can take up to a minute on the free hosting tier.
          </p>
          <button onClick={load} className="bg-black text-white px-4 py-2 rounded-lg text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sentiment = data.sentiment;
  const overall = sentiment?.overallLabel ? OVERALL_STYLES[sentiment.overallLabel] : null;
  const maxStateViews = Math.max(1, ...data.topStates.map((s) => s.views));
  const budgetTotal = data.budgetDemand.reduce((sum, d) => sum + d.count, 0);
  const climateTotal = data.climateDemand.reduce((sum, d) => sum + d.count, 0);
  const spending = data.spending;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 21 • GOVERNMENT TOURISM ANALYTICS DASHBOARD
        </p>

        <h1 className="text-5xl font-bold mt-2">Public Tourism Insights</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          A real rollup of everyone's activity on this platform -- what travelers
          search for, how they rate real places, and what they say they spend --
          not official government tourism statistics. No free source publishes
          real visitor-arrival counts or tourism revenue, so this stays honest
          about what it actually is: real platform behaviour, not national data.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

          <Card
            title="😊 Traveler Sentiment"
            caption="Aggregated from every real review's VADER sentiment score across the whole platform."
          >
            {!sentiment?.count ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <>
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 mb-4 ${overall.className}`}>
                  <span className="text-2xl">{overall.emoji}</span>
                  <div>
                    <p className="font-bold">{overall.label}</p>
                    <p className="text-xs opacity-75">Based on {sentiment.count} real reviews</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {SENTIMENT_ROWS.map((row) => {
                    const n = sentiment.breakdown[row.key];
                    const pct = Math.round((n / sentiment.count) * 100);
                    return (
                      <BarRow key={row.key} emoji={row.emoji} label={row.label}
                        textClass={row.textClass} barClass={row.barClass}
                        value={`${n} (${pct}%)`} pct={pct} />
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          <Card
            title="🗺️ Most-Viewed States"
            caption="Real destination-view counts from the curated catalogue's state field."
          >
            {data.topStates.length === 0 ? (
              <p className="text-sm text-gray-500">No views logged yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topStates.map((s) => (
                  <BarRow key={s.state} emoji="📍" label={s.state}
                    textClass="text-gray-700" barClass="bg-orange-400"
                    value={`${s.views} views`} pct={Math.round((s.views / maxStateViews) * 100)} />
                ))}
              </div>
            )}
          </Card>

          <Card
            title="💰 Search Demand by Budget"
            caption="Real filter usage from every search made on the Recommendation page."
          >
            {budgetTotal === 0 ? (
              <p className="text-sm text-gray-500">No searches logged yet.</p>
            ) : (
              <div className="space-y-3">
                {data.budgetDemand.map((d) => {
                  const style = BUDGET_STYLE[d.budget] || BUDGET_STYLE.Medium;
                  const pct = Math.round((d.count / budgetTotal) * 100);
                  return (
                    <BarRow key={d.budget} emoji="💵" label={d.budget}
                      textClass={style.textClass} barClass={style.barClass}
                      value={`${d.count} (${pct}%)`} pct={pct} />
                  );
                })}
              </div>
            )}
          </Card>

          <Card
            title="🌡️ Search Demand by Climate"
            caption="Real filter usage from every search made on the Recommendation page."
          >
            {climateTotal === 0 ? (
              <p className="text-sm text-gray-500">No searches logged yet.</p>
            ) : (
              <div className="space-y-3">
                {data.climateDemand.map((d) => {
                  const style = CLIMATE_STYLE[d.climate] || CLIMATE_STYLE.Warm;
                  const pct = Math.round((d.count / climateTotal) * 100);
                  return (
                    <BarRow key={d.climate} emoji={style.emoji} label={d.climate}
                      textClass={style.textClass} barClass={style.barClass}
                      value={`${d.count} (${pct}%)`} pct={pct} />
                  );
                })}
              </div>
            )}
          </Card>

          <div className="lg:col-span-2">
            <Card
              title="🧾 Self-Reported Spending"
              caption="Real entries from the Expense Tracker (Phase 20), converted to USD using live exchange rates and aggregated across everyone -- self-reported, not verified transactions, and no per-user amounts are shown."
            >
              {spending.count === 0 ? (
                <p className="text-sm text-gray-500">No expenses logged yet.</p>
              ) : (
                <>
                  <p className="text-3xl font-bold mb-1">${spending.totalUsd.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mb-4">
                    {spending.count} expenses logged by {spending.contributors} traveler{spending.contributors === 1 ? "" : "s"}
                  </p>
                  <div className="space-y-3">
                    {spending.byCategory.map((c) => {
                      const style = CATEGORY_STYLE[c.category] || CATEGORY_STYLE.Other;
                      const pct = spending.totalUsd > 0 ? Math.round((c.totalUsd / spending.totalUsd) * 100) : 0;
                      return (
                        <BarRow key={c.category} emoji={style.emoji} label={c.category}
                          textClass={style.textClass} barClass={style.barClass}
                          value={`$${c.totalUsd.toFixed(2)} (${pct}%)`} pct={pct} />
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </div>

        </div>

      </div>
    </div>
  );
}
