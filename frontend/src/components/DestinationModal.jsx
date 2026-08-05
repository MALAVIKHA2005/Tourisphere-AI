import React, { useEffect, useState } from "react";
import { fetchHotelPrice } from "../services/hotelPriceService";
import { fetchRestaurants } from "../services/restaurantService";
import { fetchHotels } from "../services/hotelService";
import { fetchExchangeRates } from "../services/currencyService";
import { fetchRoute } from "../services/routeService";
import { fetchLifestyle } from "../services/lifestyleService";
import { fetchEducation } from "../services/educationService";
import { fetchEssentialServices } from "../services/essentialServicesService";
import { fetchSimilarDestinations } from "../services/recommendationEngineService";
import { fetchInterestTrend } from "../services/forecastService";
import InterestTrendChart from "./InterestTrendChart";

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

const LIFESTYLE_TABS = [
  { key: "shopping", label: "🛍️ Shopping" },
  { key: "nightlife", label: "🍸 Nightlife" },
  { key: "entertainment", label: "🎬 Entertainment" },
  { key: "culture", label: "🖼️ Culture" },
  { key: "family", label: "👨‍👩‍👧 Family" },
];

const EDUCATION_TABS = [
  { key: "university", label: "🎓 Universities" },
  { key: "college", label: "📘 Colleges" },
  { key: "school", label: "🏫 Schools" },
];

const ESSENTIAL_SERVICES_TABS = [
  { key: "healthcare", label: "🏥 Healthcare" },
  { key: "supermarket", label: "🛒 Supermarkets" },
  { key: "banking", label: "🏦 Banking" },
  { key: "transport", label: "🚌 Public Transport" },
];

const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);

  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};
const DestinationModal = ({ destination, onClose, onSelectDestination }) => {
  const [hotelPrice, setHotelPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [fromPlace, setFromPlace] = useState("");
  const [routeMode, setRouteMode] = useState("drive");
  const [route, setRoute] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [lifestyle, setLifestyle] = useState(null);
  const [loadingLifestyle, setLoadingLifestyle] = useState(false);
  const [lifestyleTab, setLifestyleTab] = useState("shopping");
  const [education, setEducation] = useState(null);
  const [loadingEducation, setLoadingEducation] = useState(false);
  const [educationTab, setEducationTab] = useState("university");
  const [essentialServices, setEssentialServices] = useState(null);
  const [loadingEssentialServices, setLoadingEssentialServices] = useState(false);
  const [essentialServicesTab, setEssentialServicesTab] = useState("healthcare");
  const [similarDestinations, setSimilarDestinations] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [interestTrend, setInterestTrend] = useState(null);
  const [loadingInterestTrend, setLoadingInterestTrend] = useState(false);

  useEffect(() => {
    fetchExchangeRates().then(setExchangeRates);
  }, []);

  // Live hotel prices come from Xotelo in USD -- rates from /currency-rates
  // are INR-based (INR: 1, others are INR->target multipliers), so convert
  // through INR to get a USD->target rate.
  const convertPrice = (usdAmount) => {
    const rate = exchangeRates[currency];
    const usdRate = exchangeRates.USD;

    if (!rate || !usdRate) return `$${usdAmount}`;

    const converted = usdAmount * (rate / usdRate);
    return `${CURRENCY_SYMBOLS[currency] || ""}${converted.toFixed(2)}`;
  };

  useEffect(() => {
    if (!destination) return;

    setHotelPrice(null);
    setLoadingPrice(true);

    fetchHotelPrice(destination.city || destination.name, destination.country)
      .then(setHotelPrice)
      .finally(() => setLoadingPrice(false));

    setRestaurants([]);
    setCuisineFilter("All");
    setLoadingRestaurants(true);

    fetchRestaurants(destination.city || destination.name, destination.country)
      .then(setRestaurants)
      .finally(() => setLoadingRestaurants(false));

    setHotels([]);
    setLoadingHotels(true);

    fetchHotels(destination.city || destination.name, destination.country)
      .then(setHotels)
      .finally(() => setLoadingHotels(false));

    setFromPlace("");
    setRoute(null);
    setRouteMode("drive");

    setLifestyle(null);
    setLifestyleTab("shopping");
    setLoadingLifestyle(true);

    fetchLifestyle(destination.city || destination.name, destination.country)
      .then(setLifestyle)
      .finally(() => setLoadingLifestyle(false));

    setEducation(null);
    setEducationTab("university");
    setLoadingEducation(true);

    fetchEducation(destination.city || destination.name, destination.country)
      .then((data) => {
        setEducation(data);

        // Small towns (most of the static catalogue -- Ooty, Kodaikanal,
        // Munnar) genuinely have zero universities, only colleges/schools.
        // Defaulting to "university" made the section look broken on
        // first open even when real data existed one tab over.
        const firstNonEmpty = EDUCATION_TABS.find(
          (tab) => data[tab.key]?.length > 0
        );

        if (firstNonEmpty) setEducationTab(firstNonEmpty.key);
      })
      .finally(() => setLoadingEducation(false));

    setEssentialServices(null);
    setEssentialServicesTab("healthcare");
    setLoadingEssentialServices(true);

    fetchEssentialServices(destination.city || destination.name, destination.country)
      .then((data) => {
        setEssentialServices(data);

        const firstNonEmpty = ESSENTIAL_SERVICES_TABS.find(
          (tab) => data[tab.key]?.length > 0
        );

        if (firstNonEmpty) setEssentialServicesTab(firstNonEmpty.key);
      })
      .finally(() => setLoadingEssentialServices(false));

    setSimilarDestinations([]);
    setLoadingSimilar(true);

    fetchSimilarDestinations(destination, 4)
      .then(setSimilarDestinations)
      .finally(() => setLoadingSimilar(false));

    setInterestTrend(null);
    setLoadingInterestTrend(true);

    fetchInterestTrend(destination.name, destination.city)
      .then(setInterestTrend)
      .finally(() => setLoadingInterestTrend(false));
  }, [destination]);

  if (!destination) return null;

  const handleFindRoute = () => {
    if (!fromPlace.trim()) return;

    const toPlace =
      destination.latitude && destination.longitude
        ? `${destination.latitude},${destination.longitude}`
        : `${destination.city || destination.name}, ${destination.country}`;

    setLoadingRoute(true);
    setRoute(null);

    fetchRoute(fromPlace.trim(), toPlace, routeMode)
      .then(setRoute)
      .finally(() => setLoadingRoute(false));
  };

  const costLabel = () => {
    if (loadingPrice) return "Checking live prices...";

    if (hotelPrice?.available) {
      return `${convertPrice(hotelPrice.average_price)} / night (live, ${hotelPrice.sample_size} hotels)`;
    }

    return "No data";
  };

  // Derived from the real live hotel price -- not the flat "Medium" every
  // dynamic destination used to carry (same fabricated-data issue rating
  // had). Thresholds are USD/night, matching Xotelo's currency.
  const budgetLabel = () => {
    if (loadingPrice) return "Checking...";

    if (!hotelPrice?.available) return null;

    const price = hotelPrice.average_price;

    if (price < 40) return "Low";
    if (price <= 100) return "Medium";
    return "High";
  };

  // Real Wikipedia monthly page views -- not a fabricated 0-100 score.
  // No honest per-city safety data source exists anywhere (see backend
  // popularity_service.py), so Safety Score was dropped entirely rather
  // than faked.
  const popularityLabel = () => {
    if (destination.popularity === null || destination.popularity === undefined) {
      return "No data";
    }

    return `${destination.popularity.toLocaleString()} views/mo (Wikipedia)`;
  };

  // Real count of nearby parks/playgrounds/zoos/aquariums (from the same
  // Lifestyle fetch below) -- replaces the fabricated 0-100 Family
  // Score, which had no honest data source.
  const familyLabel = () => {
    if (loadingLifestyle) return "Checking...";

    const count = lifestyle?.family?.length;

    if (count === undefined) return "No data";
    return count > 0 ? `${count} nearby` : "None found nearby";
  };

  const stat = (label, value) => (
    <div className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-semibold">{value || "No data"}</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold shadow hover:bg-white hover:scale-110 transition-all z-10"
        >
          ✖
        </button>

        {/* Image */}
        {destination.image ? (
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-56 md:h-64 object-cover rounded-t-2xl"
          />
        ) : (
          <div className="w-full h-56 md:h-64 bg-gray-200 rounded-t-2xl flex items-center justify-center text-2xl">
            📍 No Image Available
          </div>
        )}

        <div className="p-6">

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent inline-block">
            {destination.name || "Unknown Destination"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {stat("Country", destination.country)}
            {stat("State / City", destination.state || destination.city)}
            {stat("Budget", budgetLabel())}
            {stat("Climate", destination.climate)}
            {stat("Popularity", popularityLabel())}
            {stat("Family-Friendly Spots", familyLabel())}
            {stat("Average Hotel Cost", costLabel())}
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Best Months:</strong>{" "}
              {destination.bestMonths?.join(", ") || "No data"}
            </p>

            <p>
              <strong>Interests:</strong>{" "}
              {destination.interests?.join(", ") || "No data"}
            </p>

            {(destination.latitude || destination.longitude) && (
              <p>
                <strong>Coordinates:</strong>{" "}
                {destination.latitude}, {destination.longitude}
              </p>
            )}
          </div>

          <div className="mt-6">
            <InterestTrendChart trend={interestTrend} loading={loadingInterestTrend} />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">🏨 Hotels Nearby</h3>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="USD">$ USD</option>
                <option value="INR">₹ INR</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
                <option value="JPY">¥ JPY</option>
              </select>
            </div>

            {loadingHotels && (
              <p className="text-sm text-gray-500">Checking live hotel prices...</p>
            )}

            {!loadingHotels && hotels.length === 0 && (
              <p className="text-sm text-gray-500">No hotel data available for this area.</p>
            )}

            {!loadingHotels && hotels.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotels.map((h, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {h.image && (
                      <img
                        src={h.image}
                        alt={h.name}
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="font-semibold">{h.name}</p>
                      {h.address && (
                        <p className="text-xs text-gray-400 mt-1">{h.address}</p>
                      )}
                      {h.rates?.length > 0 ? (
                        <p className="text-sm text-green-700 font-semibold mt-1">
                          From {convertPrice(h.rates[0].price)} / night ({h.rates[0].provider})
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1">No live rates found</p>
                      )}
                      {h.url && (
                        <a
                          href={h.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-orange-600 hover:text-orange-700 hover:underline mt-1 inline-block font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View & Book on TripAdvisor →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">🚗 Getting There</h3>

            <p className="text-xs text-gray-400 mb-3">
              Real road distance &amp; time via routing -- no free source exists for
              real flight/train/bus fares, so this covers road trips only. Cost is a
              rough per-km estimate, not a live price.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={fromPlace}
                onChange={(e) => setFromPlace(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFindRoute()}
                placeholder="Starting city or place..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              />

              <select
                value={routeMode}
                onChange={(e) => setRouteMode(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-2 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="drive">🚗 Drive</option>
                <option value="bicycle">🚴 Bicycle</option>
                <option value="walk">🚶 Walk</option>
              </select>

              <button
                onClick={handleFindRoute}
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Find Route
              </button>
            </div>

            {loadingRoute && (
              <p className="text-sm text-gray-500">Calculating route...</p>
            )}

            {!loadingRoute && route && !route.available && (
              <p className="text-sm text-gray-500">
                {route.reason || "Couldn't find a road route between those two places."}
              </p>
            )}

            {!loadingRoute && route?.available && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Distance</p>
                  <p className="font-semibold">{route.distance_km} km</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Travel Time</p>
                  <p className="font-semibold">{formatDuration(route.duration_minutes)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Est. Cost</p>
                  <p className="font-semibold">{convertPrice(route.estimated_cost_usd)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">🎭 Lifestyle</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {LIFESTYLE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLifestyleTab(tab.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    lifestyleTab === tab.key
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingLifestyle && (
              <p className="text-sm text-gray-500">Finding places nearby...</p>
            )}

            {!loadingLifestyle && lifestyle?.[lifestyleTab]?.length === 0 && (
              <p className="text-sm text-gray-500">No data available for this area.</p>
            )}

            {!loadingLifestyle && lifestyle?.[lifestyleTab]?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lifestyle[lifestyleTab].map((place, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-gray-400 mt-1">{place.address}</p>
                    )}
                    {place.latitude && place.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:underline mt-1 inline-block font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Map →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">🎓 Education</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {EDUCATION_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setEducationTab(tab.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    educationTab === tab.key
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingEducation && (
              <p className="text-sm text-gray-500">Finding institutions nearby...</p>
            )}

            {!loadingEducation && education?.[educationTab]?.length === 0 && (
              <p className="text-sm text-gray-500">No data available for this area.</p>
            )}

            {!loadingEducation && education?.[educationTab]?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {education[educationTab].map((place, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-gray-400 mt-1">{place.address}</p>
                    )}
                    {place.latitude && place.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:underline mt-1 inline-block font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Map →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">🏘️ Essential Services</h3>

            <p className="text-xs text-gray-400 mb-3">
              What's actually here for daily living -- housing prices and cost of
              living have no honest free data source, so this covers real nearby
              services instead.
            </p>

            <div className="flex flex-wrap gap-2 mb-3">
              {ESSENTIAL_SERVICES_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setEssentialServicesTab(tab.key)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    essentialServicesTab === tab.key
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loadingEssentialServices && (
              <p className="text-sm text-gray-500">Finding services nearby...</p>
            )}

            {!loadingEssentialServices && essentialServices?.[essentialServicesTab]?.length === 0 && (
              <p className="text-sm text-gray-500">No data available for this area.</p>
            )}

            {!loadingEssentialServices && essentialServices?.[essentialServicesTab]?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {essentialServices[essentialServicesTab].map((place, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-3 hover:shadow-md transition-shadow"
                  >
                    <p className="font-semibold">{place.name}</p>
                    {place.address && (
                      <p className="text-xs text-gray-400 mt-1">{place.address}</p>
                    )}
                    {place.latitude && place.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:text-orange-700 hover:underline mt-1 inline-block font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View on Map →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">🍽️ Nearby Restaurants</h3>

            {loadingRestaurants && (
              <p className="text-sm text-gray-500">Finding restaurants nearby...</p>
            )}

            {!loadingRestaurants && restaurants.length === 0 && (
              <p className="text-sm text-gray-500">No restaurant data available for this area.</p>
            )}

            {!loadingRestaurants && restaurants.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["All", ...new Set(restaurants.map((r) => r.cuisine))].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCuisineFilter(c)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        cuisineFilter === c
                          ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent shadow-sm"
                          : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {restaurants
                    .filter((r) => cuisineFilter === "All" || r.cuisine === cuisineFilter)
                    .map((r, i) => (
                      <div
                        key={i}
                        className="bg-gray-50 rounded-xl p-3 hover:shadow-md transition-shadow"
                      >
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-xs text-gray-500">{r.cuisine}</p>
                        {r.address && (
                          <p className="text-xs text-gray-400 mt-1">{r.address}</p>
                        )}
                        {r.openingHours && (
                          <p className="text-xs text-gray-400 mt-1">🕒 {r.openingHours}</p>
                        )}
                        {r.latitude && r.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-orange-600 hover:text-orange-700 hover:underline mt-1 inline-block font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View on Map →
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-bold mb-3">✨ You Might Also Like</h3>

            <p className="text-xs text-gray-400 mb-3">
              Real similarity based on shared interests, climate, budget and
              country -- not a trained model, just transparent matching.
            </p>

            {loadingSimilar && (
              <p className="text-sm text-gray-500">Finding similar destinations...</p>
            )}

            {!loadingSimilar && similarDestinations.length === 0 && (
              <p className="text-sm text-gray-500">No similar destinations found.</p>
            )}

            {!loadingSimilar && similarDestinations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {similarDestinations.map((place, i) => (
                  <div
                    key={i}
                    onClick={() => onSelectDestination && onSelectDestination(place)}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {place.image && (
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-24 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">{place.name}</p>
                        <span className="text-xs font-bold text-orange-600 whitespace-nowrap">
                          {place.similarityScore}% similar
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {[place.state, place.country].filter(Boolean).join(", ")}
                      </p>
                      {place.matchReasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {place.matchReasons.map((reason) => (
                            <span
                              key={reason}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default DestinationModal;
