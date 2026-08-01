import React, { useEffect, useState } from "react";
import { fetchHotelPrice } from "../services/hotelPriceService";
import { fetchRestaurants } from "../services/restaurantService";
import { fetchHotels } from "../services/hotelService";
import { fetchExchangeRates } from "../services/currencyService";

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };

const DestinationModal = ({ destination, onClose }) => {
  const [hotelPrice, setHotelPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });

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
  }, [destination]);

  if (!destination) return null;

  const costLabel = () => {
    if (loadingPrice) return "Checking live prices...";

    if (hotelPrice?.available) {
      return `${convertPrice(hotelPrice.average_price)} / night (live, ${hotelPrice.sample_size} hotels)`;
    }

    return "No data";
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
            {stat("Budget", destination.budget)}
            {stat("Climate", destination.climate)}
            {stat("Rating", destination.rating ? `⭐ ${destination.rating}` : null)}
            {stat("Popularity", destination.popularity)}
            {stat("Safety Score", destination.safetyScore)}
            {stat("Family Score", destination.familyScore)}
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

        </div>

      </div>

    </div>
  );
};

export default DestinationModal;
