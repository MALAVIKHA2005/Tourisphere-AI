import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatTrendMonth = (monthLabel) => {
  const [year, month] = monthLabel.split("-");
  return `${MONTH_ABBR[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

const buildTrendChartData = (trend) => {
  // Last ~15 months of real history plus the real forecast -- the full
  // 3-year series is too dense to read in a compact chart.
  const recentHistorical = trend.historical.slice(-15);
  const labels = [...recentHistorical, ...trend.forecast].map((p) =>
    formatTrendMonth(p.month)
  );

  const historicalData = [
    ...recentHistorical.map((p) => p.views),
    ...trend.forecast.map(() => null),
  ];

  // Forecast dataset starts at the last real historical point (not
  // null) so the dashed line visually connects to the solid one
  // instead of leaving a gap.
  const forecastData = [
    ...recentHistorical.slice(0, -1).map(() => null),
    ...(recentHistorical.length ? [recentHistorical[recentHistorical.length - 1].views] : []),
    ...trend.forecast.map((p) => p.projectedViews),
  ];

  return {
    labels,
    datasets: [
      {
        label: "Wikipedia views",
        data: historicalData,
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.25,
      },
      {
        label: "Forecast",
        data: forecastData,
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        borderWidth: 2,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.25,
      },
    ],
  };
};

const TREND_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) =>
          context.dataset.label === "Forecast"
            ? `~${context.parsed.y?.toLocaleString()} views (projected)`
            : `${context.parsed.y?.toLocaleString()} views`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
    },
    y: {
      grid: { color: "#f3f4f6" },
      ticks: { callback: (value) => value.toLocaleString() },
    },
  },
};

// Shared by the destination modal and the standalone Forecasting page --
// same real data, same chart, same honesty caveat, in one place instead
// of two copies that could quietly drift apart.
const InterestTrendChart = ({ trend, loading }) => (
  <div>
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-lg font-bold">📈 Interest Trend</h3>

      {trend?.available && trend.medianYoyGrowthPercent !== null && (
        <span className="text-xs font-semibold text-gray-500">
          {trend.medianYoyGrowthPercent > 0 ? "↑" : "↓"}{" "}
          {Math.abs(trend.medianYoyGrowthPercent)}% YoY
        </span>
      )}
    </div>

    <p className="text-xs text-gray-400 mb-3">
      Real Wikipedia search interest over time, with a 3-month projection
      based on the real year-over-year trend -- no visitor-arrival data
      exists anywhere for free, so this is a search-interest proxy, not a
      visitor forecast.
    </p>

    {loading && <p className="text-sm text-gray-500">Loading trend...</p>}

    {!loading && !trend?.available && (
      <p className="text-sm text-gray-500">No data available for this place.</p>
    )}

    {!loading && trend?.available && trend.historical.length === 0 && (
      <p className="text-sm text-gray-500">
        Not enough Wikipedia history for this place yet.
      </p>
    )}

    {!loading && trend?.available && trend.historical.length > 0 && (
      <div className="h-48">
        <Line data={buildTrendChartData(trend)} options={TREND_CHART_OPTIONS} />
      </div>
    )}
  </div>
);

export default InterestTrendChart;
