import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Recommendation from "./pages/Recommendation";
import MyActivity from "./pages/MyActivity";
import Forecasting from "./pages/Forecasting";
import Segmentation from "./pages/Segmentation";
import Sentiment from "./pages/Sentiment";
import Dataset from "./pages/Dataset";
import Assistant from "./pages/Assistant";
import TripPlanner from "./pages/TripPlanner";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Privacy from "./pages/Privacy";
import CookieConsent from "./components/CookieConsent";
import { fetchMe, logout } from "./services/authService";

function App() {
  const [activePage, setActivePage] = useState("overview");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetchMe().then((data) => {
      setUser(data);
      setAuthLoading(false);
    });
  }, []);

  const handleAuthSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setActivePage("overview");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setActivePage("overview");
  };

  const navButtonClass = (isActive) =>
    `w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md shadow-orange-200"
        : "bg-transparent text-gray-600 hover:bg-orange-50 hover:text-orange-600"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6 sticky top-0 h-screen overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
          Tourisphere
        </h1>

        {/* Auth status */}
        <div className="mb-6 pb-6 border-b">
          {authLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : user ? (
            <div>
              <p className="text-xs text-gray-400 uppercase">Signed in as</p>
              <p className="font-semibold truncate">{user.name}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-sm text-red-500 hover:underline"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setActivePage("login")}
                className={navButtonClass(activePage === "login").replace("py-3", "py-2 text-sm")}
              >
                Sign In
              </button>
              <button
                onClick={() => setActivePage("register")}
                className={navButtonClass(activePage === "register").replace("py-3", "py-2 text-sm")}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">

          <button
            onClick={() => setActivePage("overview")}
            className={navButtonClass(activePage === "overview")}
          >
            Overview
          </button>

          <button
            onClick={() => setActivePage("recommendation")}
            className={navButtonClass(activePage === "recommendation")}
          >
            Recommendation
          </button>

          <button
            onClick={() => setActivePage("myActivity")}
            className={navButtonClass(activePage === "myActivity")}
          >
            My Activity
          </button>

          <button
            onClick={() => setActivePage("forecasting")}
            className={navButtonClass(activePage === "forecasting")}
          >
            Forecasting
          </button>

          <button
            onClick={() => setActivePage("segmentation")}
            className={navButtonClass(activePage === "segmentation")}
          >
            Segmentation
          </button>

          <button
            onClick={() => setActivePage("sentiment")}
            className={navButtonClass(activePage === "sentiment")}
          >
            Sentiment
          </button>

          <button
            onClick={() => setActivePage("dataset")}
            className={navButtonClass(activePage === "dataset")}
          >
            Dataset
          </button>

          <button
            onClick={() => setActivePage("assistant")}
            className={navButtonClass(activePage === "assistant")}
          >
            AI Assistant
          </button>

          <button
            onClick={() => setActivePage("tripPlanner")}
            className={navButtonClass(activePage === "tripPlanner")}
          >
            Trip Planner
          </button>

          <button
            onClick={() => setActivePage("bookings")}
            className={navButtonClass(activePage === "bookings")}
          >
            My Bookings
          </button>

        </div>

        <button
          onClick={() => setActivePage("privacy")}
          className="w-full text-left px-4 py-2 mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Privacy Notice
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">

        {activePage === "overview" && <Dashboard />}

        {activePage === "recommendation" && <Recommendation />}

        {activePage === "myActivity" && <MyActivity />}

        {activePage === "forecasting" && <Forecasting />}

        {activePage === "segmentation" && <Segmentation />}

        {activePage === "sentiment" && <Sentiment />}

        {activePage === "dataset" && <Dataset />}

        {activePage === "assistant" && <Assistant />}

        {activePage === "tripPlanner" && <TripPlanner />}

        {activePage === "bookings" && <Bookings />}

        {activePage === "login" && (
          <Login
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setActivePage("register")}
          />
        )}

        {activePage === "register" && (
          <Register
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setActivePage("login")}
          />
        )}

        {activePage === "privacy" && <Privacy />}

      </div>

      <CookieConsent onOpenPrivacy={() => setActivePage("privacy")} />

    </div>
  );
}

export default App;
