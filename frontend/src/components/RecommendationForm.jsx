import { fetchDynamicDestinations } from "../services/dynamicDestinationService";
import {
  fetchTravelHistory,
  saveTravelHistory,
} from "../services/travelHistoryService";
import {
  fetchFavorites,
  addFavorite,
} from "../services/favoritesService";
import { logSearch } from "../services/searchHistoryService";
import { getDestinationKey } from "../utils/destinationKey";
import {
  fetchExchangeRates,
} from "../services/currencyService";
import React, {
  useState,
  useEffect,
} from "react";
import { fetchWeather } from "../services/weatherService";
import {
  fetchDestinations,
} from "../services/destinationService";
import { retryFetch } from "../utils/retry";
import DestinationModal from "./DestinationModal";
import AnalyticsCharts from "./AnalyticsCharts";

const RecommendationForm = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [budget, setBudget] = useState("");
  const [interest, setInterest] = useState("");
  const [travelType, setTravelType] = useState("");
  const [month, setMonth] = useState("");
  const [climate, setClimate] = useState("");

  const [currency, setCurrency] = useState("INR");

  const [results, setResults] = useState([]);
  const [travelHistory, setTravelHistory] = useState([]);
  const [destinationsData,setDestinationsData,] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsFailed, setDestinationsFailed] = useState(false);

  const [selectedDestination, setSelectedDestination] =
    useState(null);
  const [weatherData, setWeatherData] =
  useState({});

  const [exchangeRates, setExchangeRates] =
  useState({
    INR: 1,
  });
  const [favorites, setFavorites] = useState([]);

  const countries = [
    ...new Set(
    destinationsData.map(
        (d) => d.country
    )
),
];

  const states = [
    ...new Set(
      destinationsData
        .filter(
          (d) => !country || d.country === country
        )
        .map((d) => d.state)
    ),
  ];
  const averageRating =
  results.length > 0
    ? (
        results.reduce(
          (sum, place) => sum + place.rating,
          0
        ) / results.length
      ).toFixed(1)
    : 0;

const bestMatchScore =
  results.length > 0
    ? results[0].matchScore
    : 0;


  const addToFavorites = async (destination) => {
    const key = getDestinationKey(destination);

    const exists = favorites.find(
      (item) => getDestinationKey(item.destination || item) === key
    );

    if (exists) return;

    const added = await addFavorite(destination);

    if (added) {
      setFavorites([
        ...favorites,
        { destination, destination_key: key },
      ]);
    }
  };
 const handleGenerateRecommendations = async () => {
  if (!country) {
    alert("Please select a country");
    return;
  }

  // filter static dataset
  let filtered = destinationsData.filter(
    (d) => d.country === country
  );

  if (state)
    filtered = filtered.filter(
      (d) => d.state === state
    );

  if (budget)
    filtered = filtered.filter(
      (d) => d.budget === budget
    );

  if (interest)
    filtered = filtered.filter(
      (d) =>
        d.interests &&
        d.interests.includes(interest)
    );

  if (travelType)
    filtered = filtered.filter(
      (d) =>
        d.suitableFor &&
        d.suitableFor.includes(travelType)
    );

  if (month)
    filtered = filtered.filter(
      (d) =>
        d.bestMonths &&
        d.bestMonths.includes(month)
    );

  if (climate)
    filtered = filtered.filter(
      (d) => d.climate === climate
    );

  // fetch dynamic places
  const dynamicPlaces =
    await fetchDynamicDestinations(country);
    console.log("Dynamic Places:", dynamicPlaces);

  // combine both
  const combined = [
    ...filtered,
    ...dynamicPlaces
  ];
  console.log("Combined:", combined);
  console.log("STATIC:", filtered);
  console.log("DYNAMIC:", dynamicPlaces);
  console.log("COMBINED:", combined);

  setResults(combined);

  logSearch(
    { country, state, budget, climate, interest, travelType, month },
    combined.length
  );

};
    
     
  useEffect(() => {
  const loadWeather = async () => {
    const weatherResults = {};

    for (const destination of results) {
      const weather =
        await fetchWeather(destination.city);

      weatherResults[destination.name] =
        weather;
    }

    setWeatherData(weatherResults);
  };

  if (results.length > 0) {
    loadWeather();
  }
}, [results]);
useEffect(() => {
  const loadRates = async () => {
    const rates =
      await fetchExchangeRates();

    setExchangeRates(rates);
  };

  loadRates();
}, []);
useEffect(() => {
  const loadTravelHistory = async () => {
    const history = await fetchTravelHistory(10);
    console.log("Travel History:", history);
    setTravelHistory(history);
  };

  loadTravelHistory();
}, []);
useEffect(() => {
  const loadFavorites = async () => {
    const favoritesData = await fetchFavorites();
    setFavorites(favoritesData);
  };

  loadFavorites();
}, []);
const loadDestinations = async () => {

  setDestinationsLoading(true);
  setDestinationsFailed(false);

  const data = await retryFetch(fetchDestinations, {
    isValid: (result) => Array.isArray(result) && result.length > 0,
  });

  setDestinationsData(data || []);
  setDestinationsFailed(!data || data.length === 0);

  // initially show all cards
  setResults([]);

  setDestinationsLoading(false);

};

useEffect(() => {
  loadDestinations();
}, []);

const convertCost = (cost) => {
  if (currency === "INR") {
    return `₹${cost}`;
  }

  const converted =
    cost * exchangeRates[currency];

  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };

  return `${symbols[currency]}${converted.toFixed(
    2
  )}`;
};

  return (
    <div>
      {/* FILTER SECTION */}
     
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">

        <input
          type="text"
          placeholder="Search destination..."
          className="w-full border p-3 rounded-lg mb-6"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
        />
        <h2 className="text-xl font-bold flex items-center gap-3">
            {destinationsLoading
              ? "Loading destinations... (first request may take up to a minute while the server wakes up)"
              : destinationsFailed
                ? "Couldn't reach the server."
                : `Available Destinations: ${destinationsData.length}`}
            {destinationsFailed && !destinationsLoading && (
              <button
                onClick={loadDestinations}
                className="text-sm bg-black text-white px-3 py-1 rounded-lg font-normal"
              >
                Retry
              </button>
            )}
            </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Country */}

          <select
            className="border p-3 rounded-lg"
            value={country}
            onChange={(e) =>
              setCountry(e.target.value)
            }
          >
            <option value="">
              Select Country
            </option>

            {countries.map((countryName) => (
              <option
                key={countryName}
                value={countryName}
              >
                {countryName}
              </option>
            ))}
          </select>

          {/* State */}

          <select
            className="border p-3 rounded-lg"
            value={state}
            onChange={(e) =>
              setState(e.target.value)
            }
          >
            <option value="">
              Select State
            </option>

            {states.map((stateName) => (
              <option
                key={stateName}
                value={stateName}
              >
                {stateName}
              </option>
            ))}
          </select>

          {/* Budget */}

          <select
            className="border p-3 rounded-lg"
            value={budget}
            onChange={(e) =>
              setBudget(e.target.value)
            }
          >
            <option value="">
              Budget
            </option>

            <option value="Low">
              Low
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="High">
              High
            </option>
          </select>

          {/* Interest */}

          <select
            className="border p-3 rounded-lg"
            value={interest}
            onChange={(e) =>
              setInterest(e.target.value)
            }
          >
            <option value="">
              Interest
            </option>

            <option value="Beach">
              Beach
            </option>

            <option value="Nature">
              Nature
            </option>

            <option value="Hill Station">
              Hill Station
            </option>

            <option value="Photography">
              Photography
            </option>

            <option value="Culture">
              Culture
            </option>

            <option value="Adventure">
              Adventure
            </option>

            <option value="Luxury">
              Luxury
            </option>
          </select>

          {/* Travel Type */}

          <select
            className="border p-3 rounded-lg"
            value={travelType}
            onChange={(e) =>
              setTravelType(e.target.value)
            }
          >
            <option value="">
              Travel Type
            </option>

            <option value="Solo">
              Solo
            </option>

            <option value="Couple">
              Couple
            </option>

            <option value="Family">
              Family
            </option>

            <option value="Friends">
              Friends
            </option>
          </select>

          {/* Month */}

          <select
            className="border p-3 rounded-lg"
            value={month}
            onChange={(e) =>
              setMonth(e.target.value)
            }
          >
            <option value="">
              Travel Month
            </option>

            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((m) => (
              <option
                key={m}
                value={m}
              >
                {m}
              </option>
            ))}
          </select>

          {/* Climate */}

          <select
            className="border p-3 rounded-lg"
            value={climate}
            onChange={(e) =>
              setClimate(e.target.value)
            }
          >
            <option value="">
              Climate
            </option>

            <option value="Cool">
              Cool
            </option>

            <option value="Warm">
              Warm
            </option>

            <option value="Tropical">
              Tropical
            </option>
          </select>

          {/* Currency */}

          <select
            className="border p-3 rounded-lg"
            value={currency}
            onChange={(e) =>
              setCurrency(e.target.value)
            }
          >
            <option value="INR">
              ₹ INR
            </option>

            <option value="USD">
              $ USD
            </option>

            <option value="EUR">
              € EUR
            </option>
            <option value="GBP">
                £ GBP
                </option>
                <option value="JPY">
                    ¥ JPY
            </option>
          </select>

        </div>

        <button
          onClick={handleGenerateRecommendations}
          className="mt-6 bg-black text-white px-6 py-3 rounded-lg"
        >
          Generate Recommendations
        </button>

      </div>
{/* RECENTLY VIEWED */}

{travelHistory.length > 0 && (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">
      🕒 Recently Viewed
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {travelHistory.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-4"
        >
          <h3 className="font-bold text-lg">
            {item.destination}
          </h3>

          <p>{item.country}</p>

          <p>{item.state}</p>

          <p className="text-yellow-600">
            ⭐ {item.rating}
          </p>

          <p className="text-sm text-gray-500">
            {new Date(item.viewed_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

      {/* FAVORITES */}

      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          ❤️ Favorites ({favorites.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

  <div className="bg-white rounded-xl shadow-md p-5">
    <h3 className="text-gray-500">
      Total Destinations
    </h3>

    <p className="text-3xl font-bold">
      {results.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow-md p-5">
    <h3 className="text-gray-500">
      Average Rating
    </h3>

    <p className="text-3xl font-bold">
      ⭐ {averageRating}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow-md p-5">
    <h3 className="text-gray-500">
      Favorites
    </h3>

    <p className="text-3xl font-bold">
      ❤️ {favorites.length}
    </p>
  </div>

  <div className="bg-white rounded-xl shadow-md p-5">
    <h3 className="text-gray-500">
      Best Match Score
    </h3>

    <p className="text-3xl font-bold text-green-600">
      {bestMatchScore}
    </p>
  </div>

</div>

      {/* RESULTS */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {results.map((place, index) => (
          <div
            key={index}
           onClick={() => {
            saveTravelHistory(place);
            setSelectedDestination(
              place
            );
          }}
            className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition flex flex-col h-full"
          >

            <img
            src={
              place.image ||
              "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
            }
            alt={place.name}
            className="h-48 w-full object-cover flex-shrink-0"
            />

            <div className="p-4 flex flex-col flex-1">

              {index === 0 && (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold inline-block mb-2 self-start">
                  🏆 Best Match
                </div>
              )}

              <h3 className="font-bold text-xl leading-snug line-clamp-2">
                {place.name}
              </h3>

              <p className="text-gray-500 text-sm mt-1">
                {[place.state, place.country].filter(Boolean).join(", ")}
              </p>

              <p className="mt-2">
                ⭐ {place.rating}
              </p>
              <p className="text-blue-600 mt-2">
                🌡️{" "}
                {weatherData[place.name]?.temperature ??
                 "--"}
                 °C
              </p>
              <p className="text-gray-600">
                ☁️{" "}
                {weatherData[place.name]?.condition ??
                "Loading..."}
              </p>
              <p className="text-gray-600">
                💧{" "}
                {weatherData[place.name]?.humidity ??
                "--"}
                %
              </p>

             <p className="font-semibold mt-2">
                Avg Cost:
                {" "}
                {convertCost(
                    place.averageCost
                    )}
            </p>

              <p className="text-green-600 font-bold mt-2">
                 Match Score:
                 {place.matchScore || 0}
                 </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToFavorites(place);
                }}
                className="mt-auto bg-red-500 text-white px-4 py-2 rounded-lg self-start"
              >
                ❤️ Add to Favorites
              </button>

            </div>

          </div>
        ))}

      </div>

      <AnalyticsCharts results={results} />
      <DestinationModal
        destination={selectedDestination}
        onClose={() =>
          setSelectedDestination(null)
        }
      />

    </div>
  );
};

export default RecommendationForm;