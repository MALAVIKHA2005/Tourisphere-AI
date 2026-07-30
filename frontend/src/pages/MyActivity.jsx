import React, { useEffect, useState } from "react";
import { fetchDashboard } from "../services/analyticsService";
import { fetchTravelHistory } from "../services/travelHistoryService";
import { fetchSearchHistory } from "../services/searchHistoryService";
import { fetchFavorites, removeFavorite } from "../services/favoritesService";
import { fetchMe, exportMyData, deleteAccount } from "../services/authService";
import TourismAnalyticsDashboard from "../components/TourismAnalyticsDashboard";
import TourismTrendDashboard from "../components/TourismTrendDashboard";

export default function MyActivity() {
  const [dashboard, setDashboard] = useState(null);
  const [travelHistory, setTravelHistory] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    const [dashboardData, historyData, searchData, favoritesData, currentUser] =
      await Promise.all([
        fetchDashboard(),
        fetchTravelHistory(10),
        fetchSearchHistory(10),
        fetchFavorites(),
        fetchMe(),
      ]);

    setDashboard(dashboardData);
    setTravelHistory(historyData);
    setSearchHistory(searchData);
    setFavorites(favoritesData);
    setUser(currentUser);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleExportData = async () => {
    const data = await exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-tourisphere-data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "This permanently deletes your account and all your history, searches and favorites. This cannot be undone. Continue?"
    );

    if (!confirmed) return;

    await deleteAccount();
    window.location.reload();
  };

  const handleRemoveFavorite = async (favorite) => {
    const removed = await removeFavorite(favorite.destination);

    if (removed) {
      setFavorites(
        favorites.filter(
          (item) => item.destination_key !== favorite.destination_key
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-12">
        <p className="text-gray-500">Loading your activity...</p>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 5 • USER ANALYTICS
        </p>

        <h1 className="text-5xl font-bold mt-2">My Activity</h1>

        <p className="text-gray-500 mt-4 mb-10">
          Your travel history, favorites and search behaviour, all in one place.
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">Destinations Viewed</p>
            <h2 className="text-4xl font-bold mt-2">
              {dashboard?.totals?.views ?? 0}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">Searches Made</p>
            <h2 className="text-4xl font-bold mt-2">
              {dashboard?.totals?.searches ?? 0}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <p className="text-gray-400 uppercase text-xs">Favorites Saved</p>
            <h2 className="text-4xl font-bold mt-2">
              {dashboard?.totals?.favorites ?? 0}
            </h2>
          </div>
        </div>

        <TourismAnalyticsDashboard dashboard={dashboard} />
        <TourismTrendDashboard destinationViews={dashboard?.destination_views} />

        {/* FAVORITES */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">❤️ Favorites</h2>

          {favorites.length === 0 ? (
            <p className="text-gray-500">No favorites saved yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {favorites.map((favorite) => (
                <div
                  key={favorite.destination_key}
                  className="bg-gray-50 rounded-lg p-4 border"
                >
                  <h3 className="font-bold">
                    {favorite.destination?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {favorite.destination?.country}
                  </p>
                  <button
                    onClick={() => handleRemoveFavorite(favorite)}
                    className="mt-3 text-sm text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEARCH HISTORY */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">🔍 Search History</h2>

          {searchHistory.length === 0 ? (
            <p className="text-gray-500">No searches logged yet.</p>
          ) : (
            <div className="space-y-3">
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"
                >
                  <span>
                    {[item.country, item.budget, item.climate, item.interest, item.travel_type]
                      .filter(Boolean)
                      .join(" · ") || "No filters"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.result_count} results ·{" "}
                    {new Date(item.searched_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENTLY VIEWED */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">🕒 Recently Viewed</h2>

          {travelHistory.length === 0 ? (
            <p className="text-gray-500">No destinations viewed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {travelHistory.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border"
                >
                  <h3 className="font-bold">{item.destination}</h3>
                  <p className="text-sm text-gray-500">{item.country}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(item.viewed_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACCOUNT & PRIVACY */}
        {user && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-2">🔒 Account & Privacy</h2>
            <p className="text-gray-500 text-sm mb-4">
              Signed in as {user.email}. You can download everything this
              platform holds about you, or permanently delete your account.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200"
              >
                Export My Data
              </button>

              <button
                onClick={handleDeleteAccount}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100"
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
