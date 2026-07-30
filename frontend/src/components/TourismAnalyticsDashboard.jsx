import React from "react";

const TourismAnalyticsDashboard = ({ dashboard }) => {
  const topOrFallback = (value) => value || "No Data";

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-8">

      <h2 className="text-2xl font-bold mb-4">
        Tourism Analytics Dashboard
      </h2>
      <div className="bg-red-100 p-4 rounded-lg mb-4">
        <h3 className="font-bold">
            Top Destination
            </h3>
            <p>
                {topOrFallback(dashboard?.top_destination)}
                </p>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-bold">
            Top Budget
          </h3>

          <p>
            {topOrFallback(dashboard?.top_budget)}
          </p>
        </div>

        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-bold">
            Top Climate
          </h3>

          <p>
            {topOrFallback(dashboard?.top_climate)}
          </p>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-bold">
            Top Interest
          </h3>

          <p>
            {topOrFallback(dashboard?.top_interest)}
          </p>
        </div>

        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-bold">
            Top Travel Type
          </h3>

          <p>
            {topOrFallback(dashboard?.top_travel_type)}
          </p>
        </div>

      </div>

    </div>
  );
};

export default TourismAnalyticsDashboard;
