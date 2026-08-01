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
import { searchCountries } from "../services/countrySearchService";
import { fetchDishes } from "../services/dishService";
import DestinationModal from "./DestinationModal";
import AnalyticsCharts from "./AnalyticsCharts";

const RecommendationForm = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const [countryQuery, setCountryQuery] = useState("");
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
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
  const [dishesByCountry, setDishesByCountry] = useState({});

  // Built from BOTH the static catalogue and the most recent search
  // results (which include real, live-fetched dynamic places) -- the
  // static catalogue alone only has meaningful state coverage for India,
  // leaving this empty for almost every other country.
  const states = [
    ...new Set(
      [...destinationsData, ...results]
        .filter(
          (d) =>
            !countryQuery.trim() ||
            d.country?.toLowerCase() === countryQuery.trim().toLowerCase()
        )
        .map((d) => d.state)
        .filter(Boolean)
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
  const typed = countryQuery.trim();

  if (!typed) {
    alert("Please type a country");
    return;
  }

  // Validate against real countries -- a raw typed string (e.g. a region,
  // territory, or misspelling) can otherwise get passed straight to the
  // geocoder and silently resolve to the wrong place entirely.
  const matches = await searchCountries(typed);
  const country = matches[0]?.name;

  if (!country) {
    alert(
      `"${typed}" doesn't look like a real country. Please check the spelling or pick a suggestion from the list.`
    );
    return;
  }

  setCountryQuery(country);

  const staticMatches = destinationsData.filter(
    (d) => d.country.toLowerCase() === country.toLowerCase()
  );

  // fetch dynamic places
  const dynamicPlaces =
    await fetchDynamicDestinations(country);
    console.log("Dynamic Places:", dynamicPlaces);

  // Apply filters to the FULL combined set (static + dynamic) -- applying
  // them only to the static subset meant these filters silently did
  // nothing for dynamic results, which are the majority of results for
  // most non-seeded countries.
  let combined = [...staticMatches, ...dynamicPlaces];

  if (state)
    combined = combined.filter(
      (d) => d.state === state
    );

  if (budget)
    combined = combined.filter(
      (d) => d.budget === budget
    );

  if (interest)
    combined = combined.filter(
      (d) =>
        d.interests &&
        d.interests.includes(interest)
    );

  if (travelType)
    combined = combined.filter(
      (d) =>
        d.suitableFor &&
        d.suitableFor.includes(travelType)
    );

  if (month)
    combined = combined.filter(
      (d) =>
        d.bestMonths &&
        d.bestMonths.includes(month)
    );

  if (climate)
    combined = combined.filter(
      (d) => d.climate === climate
    );

  // surface the most notable places first -- Geoapify's country-wide
  // sight search has no fame/popularity signal, so without this,
  // well-known curated destinations (e.g. Agra/Taj Mahal, rating 4.9)
  // can get buried among arbitrary dynamic results that all share the
  // same flat rating.
  combined = combined.sort((a, b) => (b.rating || 0) - (a.rating || 0));

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

useEffect(() => {
  if (countryQuery.trim().length < 2) {
    setCountrySuggestions([]);
    return;
  }

  const timeout = setTimeout(async () => {
    const results = await searchCountries(countryQuery);
    setCountrySuggestions(results);
  }, 300);

  return () => clearTimeout(timeout);
}, [countryQuery]);

const handleSelectCountry = (name) => {
  setCountryQuery(name);
  setShowCountrySuggestions(false);
  setCountrySuggestions([]);
  setState("");
};

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

  // Quick live search over the curated catalogue -- independent of the
  // country/Generate flow, so typing a destination name jumps straight to
  // matching cards without needing to pick a country first.
  const term = searchTerm.trim().toLowerCase();
  const displayedResults = term
    ? destinationsData.filter((d) =>
        [d.name, d.city, d.state, d.country].some((v) =>
          v?.toLowerCase().includes(term)
        )
      )
    : results;

  const uniqueCountries = [
    ...new Set(displayedResults.map((p) => p.country).filter(Boolean)),
  ];
  const countriesKey = [...uniqueCountries].sort().join("|");

  useEffect(() => {
    const missing = uniqueCountries.filter((c) => !(c in dishesByCountry));

    if (missing.length === 0) return;

    (async () => {
      const entries = await Promise.all(
        missing.map(async (c) => [c, await fetchDishes(c)])
      );

      setDishesByCountry((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countriesKey]);

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
                : `Curated Catalogue: ${destinationsData.length} destinations (plus live results for any country you search)`}
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

          <div className="relative">
            <input
              type="text"
              className="border p-3 rounded-lg w-full"
              placeholder="Type any country..."
              value={countryQuery}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setShowCountrySuggestions(true);
                setState("");
              }}
              onFocus={() => setShowCountrySuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowCountrySuggestions(false), 150)
              }
            />

            {showCountrySuggestions && countrySuggestions.length > 0 && (
              <div className="absolute z-20 bg-white border rounded-lg mt-1 w-full max-h-56 overflow-y-auto shadow-lg">
                {countrySuggestions.map((c) => (
                  <button
                    type="button"
                    key={c.country_code}
                    onClick={() => handleSelectCountry(c.name)}
                    className="block w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

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

        {displayedResults.map((place, index) => (
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
                {place.averageCost
                  ? convertCost(place.averageCost)
                  : "View live price →"}
            </p>

              <p className="text-green-600 font-bold mt-2">
                 Match Score:
                 {place.matchScore || 0}
                 </p>

              {dishesByCountry[place.country]?.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  🍲 Popular Dishes: {dishesByCountry[place.country].join(", ")}
                </p>
              )}

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