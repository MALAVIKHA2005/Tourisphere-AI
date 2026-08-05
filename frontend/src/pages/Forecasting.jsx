import React, { useEffect, useState } from "react";
import { fetchDestinations } from "../services/destinationService";
import { fetchInterestTrend } from "../services/forecastService";
import InterestTrendChart from "../components/InterestTrendChart";

export default function Forecasting() {
  const [destinations, setDestinations] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [trend, setTrend] = useState(null);
  const [loadingTrend, setLoadingTrend] = useState(false);

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

    setTrend(null);
    setLoadingTrend(true);

    fetchInterestTrend(destination.name, destination.city)
      .then(setTrend)
      .finally(() => setLoadingTrend(false));
  }, [selectedKey, destinations]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 14 • FORECASTING
        </p>

        <h1 className="text-5xl font-bold mt-2">Interest Trend Forecasting</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          No free source exists anywhere for real tourist-arrival numbers, so
          this uses real multi-year Wikipedia search-interest history per
          destination, projected 3 months forward from the real
          year-over-year trend -- a genuine, widely-used industry proxy for
          travel demand, not a visitor-count forecast.
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

            <InterestTrendChart trend={trend} loading={loadingTrend} />
          </div>
        </div>

      </div>
    </div>
  );
}
