import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Recommendation from "./pages/Recommendation";
import MyActivity from "./pages/MyActivity";
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

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-6">
        <h1 className="text-3xl font-bold mb-8">
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
                className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                  activePage === "login"
                    ? "bg-black text-white"
                    : "bg-gray-100"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActivePage("register")}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm ${
                  activePage === "register"
                    ? "bg-black text-white"
                    : "bg-gray-100"
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">

          <button
            onClick={() => setActivePage("overview")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activePage === "overview"
                ? "bg-black text-white"
                : "bg-gray-100"
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActivePage("recommendation")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activePage === "recommendation"
                ? "bg-black text-white"
                : "bg-gray-100"
            }`}
          >
            Recommendation
          </button>

          <button
            onClick={() => setActivePage("myActivity")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              activePage === "myActivity"
                ? "bg-black text-white"
                : "bg-gray-100"
            }`}
          >
            My Activity
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-100">
            Forecasting
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-100">
            Segmentation
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-100">
            Sentiment
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-100">
            Dataset
          </button>

        </div>

        <button
          onClick={() => setActivePage("privacy")}
          className="w-full text-left px-4 py-2 mt-6 text-xs text-gray-400 hover:text-gray-600"
        >
          Privacy Notice
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">

        {activePage === "overview" && <Dashboard />}

        {activePage === "recommendation" && <Recommendation />}

        {activePage === "myActivity" && <MyActivity />}

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
