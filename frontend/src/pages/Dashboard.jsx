import { useEffect, useState } from "react";
import VisitorsRevenueChart from "../components/VisitorsRevenueChart";
import TopDestinations from "../components/TopDestinations";
import SourceCountriesChart from "../components/SourceCountriesChart";
import TravelPurposeChart from "../components/TravelPurposeChart";
import { fetchPlatformStats } from "../services/platformAnalyticsService";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const totals = stats?.totals || {};

  return (
    <div className="flex bg-gray-50 min-h-screen">

      <div className="flex-1 p-12 overflow-auto">

        {/* Header */}
        <p className="text-orange-500 tracking-widest text-sm">
          REAL PLATFORM DATA
        </p>

        <h1 className="text-5xl font-bold mt-2">
          Tourism Intelligence,
          <br />
          at a glance.
        </h1>

        <p className="text-gray-500 mt-4 mb-10">
          Live stats pulled directly from the destination catalogue and
          real user activity — no sample data.
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">
              Destinations
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {loading ? "—" : totals.destinations ?? 0}
            </h2>

            <p className="text-gray-500 mt-2">
              Across {loading ? "—" : totals.countries_covered ?? 0} countries
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">
              Avg Destination Rating
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {loading ? "—" : totals.average_rating ?? "No data"}
            </h2>

            <p className="text-gray-500 mt-2">
              Out of 5
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">
              Destination Views
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {loading ? "—" : totals.views ?? 0}
            </h2>

            <p className="text-gray-500 mt-2">
              {loading ? "—" : totals.searches ?? 0} searches ·{" "}
              {loading ? "—" : totals.favorites ?? 0} favorites
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">
              Registered Users
            </p>

            <h2 className="text-4xl font-bold mt-2">
              {loading ? "—" : totals.users ?? 0}
            </h2>

            <p className="text-gray-500 mt-2">
              Since launch
            </p>
          </div>

        </div>

        {/* Views Chart + Top Destinations */}
        <div className="grid grid-cols-3 gap-6 mt-10">

          <div className="col-span-2">
            <VisitorsRevenueChart data={stats?.views_over_time} />
          </div>

          <div>
            <TopDestinations data={stats?.top_destinations} />
          </div>

        </div>

        {/* Most Viewed Countries + Search Interest */}
        <div className="grid grid-cols-3 gap-6 mt-10">

          <div className="col-span-2">
            <SourceCountriesChart data={stats?.top_countries} />
          </div>

          <div>
            <TravelPurposeChart data={stats?.interest_distribution} />
          </div>

        </div>

      </div>
    </div>
  );
}
