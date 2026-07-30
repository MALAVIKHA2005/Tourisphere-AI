import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const AnalyticsCharts = ({ results }) => {
  const popularityData = {
    labels: results.map((d) => d.name),

    datasets: [
      {
        label: "Popularity Score",
        data: results.map(
          (d) => d.popularity
        ),
      },
    ],
  };

  const budgetCounts = {
    Low: 0,
    Medium: 0,
    High: 0,
  };

  results.forEach((d) => {
    budgetCounts[d.budget]++;
  });

  const budgetData = {
    labels: Object.keys(budgetCounts),

    datasets: [
      {
        data: Object.values(budgetCounts),
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Destination Popularity
        </h2>

        <Bar data={popularityData} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">
          Budget Distribution
        </h2>

        <Pie data={budgetData} />
      </div>

    </div>
  );
};

export default AnalyticsCharts;