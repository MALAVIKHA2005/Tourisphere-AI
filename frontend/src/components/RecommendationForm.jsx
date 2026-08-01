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
  const [countryQuery, setCountryQuery] = useState("");
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [state, setState] = useState("");
  const [budget, setBudget] = useState("");
  const [interest, setInterest] = useState("");
  const [travelType, setTravelType] = useState("");
  const [month, setMonth] = useState("");
  const [climate, setClimate] = useState("");

  const [results, setResults] = useState([]);
  const [travelHistory, setTravelHistory] = useState([]);
  const [destinationsData,setDestinationsData,] = useState([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [destinationsFailed, setDestinationsFailed] = useState(false);

  const [selectedDestination, setSelectedDestination] =
    useState(null);
  const [weatherData, setWeatherData] =
  useState({});

  const [favorites, setFavorites] = useState([]);
  const [countryDishes, setCountryDishes] = useState([]);

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
 // Fetches (static + dynamic) results for a resolved, canonical country
 // name. Called both from "Generate Recommendations" and immediately when
 // a country is picked from the autocomplete list -- waiting for a manual
 // Generate click meant the State dropdown (built from these results)
 // looked empty/broken for every country until you'd already searched it.
 const fetchForCountry = async (country) => {
  const staticMatches = destinationsData.filter(
    (d) => d.country.toLowerCase() === country.toLowerCase()
  );

  const dynamicPlaces =
    await fetchDynamicDestinations(country);
    console.log("Dynamic Places:", dynamicPlaces);

  const combined = [...staticMatches, ...dynamicPlaces];

  setResults(combined);

  logSearch(
    { country, state, budget, climate, interest, travelType, month },
    combined.length
  );

  const dishes = await fetchDishes(country);
  setCountryDishes(dishes);
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
  await fetchForCountry(country);
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
  fetchForCountry(name);
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

  // Match Score: a genuine percentage of the SELECTED soft criteria
  // (budget/interest/travelType/month/climate) this place satisfies --
  // not a fabricated number. State is a hard filter below (it's a real
  // geographic constraint, not a preference to rank by). With no soft
  // criteria selected, score falls back to rating -- but only curated
  // catalogue entries have a real (hand-researched) rating; live-fetched
  // places have none (Geoapify doesn't provide one), so those get `null`
  // rather than a fabricated score.
  const computeMatchScore = (place) => {
    const softCriteria = [
      [budget, place.budget === budget],
      [interest, (place.interests || []).includes(interest)],
      [travelType, (place.suitableFor || []).includes(travelType)],
      [month, (place.bestMonths || []).includes(month)],
      [climate, place.climate === climate],
    ].filter(([selected]) => Boolean(selected));

    if (softCriteria.length === 0) {
      return place.rating ? Math.round((place.rating / 5) * 100) : null;
    }

    const matched = softCriteria.filter(([, isMatch]) => isMatch).length;
    return Math.round((matched / softCriteria.length) * 100);
  };

  const displayedResults = results
    .filter((place) => !state || place.state === state)
    .map((place) => ({ ...place, matchScore: computeMatchScore(place) }))
    .sort(
      (a, b) =>
        (b.matchScore ?? -1) - (a.matchScore ?? -1) ||
        (b.rating || 0) - (a.rating || 0)
    );

  const ratedResults = displayedResults.filter((place) => place.rating);
  const averageRating =
    ratedResults.length > 0
      ? (
          ratedResults.reduce((sum, place) => sum + place.rating, 0) /
          ratedResults.length
        ).toFixed(1)
      : "N/A";

  const bestMatchScore =
    displayedResults.length > 0 ? displayedResults[0].matchScore : null;

  const fieldClass =
    "border border-gray-200 p-3 rounded-xl w-full bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all";

  return (
    <div>
      {/* FILTER SECTION */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">

        <h2 className="text-xl font-bold flex items-center gap-3">
            {destinationsLoading
              ? "Loading destinations... (first request may take up to a minute while the server wakes up)"
              : destinationsFailed
                ? "Couldn't reach the server."
                : `Curated Catalogue: ${destinationsData.length} destinations (plus live results for any country you search)`}
            {destinationsFailed && !destinationsLoading && (
              <button
                onClick={loadDestinations}
                className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-1 rounded-lg font-normal hover:opacity-90 transition-opacity"
              >
                Retry
              </button>
            )}
            </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">

          {/* Country */}

          <div className="relative">
            <input
              type="text"
              className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
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
            className={fieldClass}
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

        </div>

        <button
          onClick={handleGenerateRecommendations}
          className="mt-6 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          <h3 className="font-bold text-lg">
            {item.destination}
          </h3>

          <p className="text-gray-600">{item.country}</p>

          <p className="text-gray-400 text-sm">{item.state}</p>

          <p className="text-yellow-600 mt-1">
            ⭐ {item.rating}
          </p>

          <p className="text-sm text-gray-400">
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

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-orange-400 hover:shadow-md transition-shadow">
    <h3 className="text-gray-500 text-sm">
      Total Destinations
    </h3>

    <p className="text-3xl font-bold mt-1">
      {displayedResults.length}
    </p>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-yellow-400 hover:shadow-md transition-shadow">
    <h3 className="text-gray-500 text-sm">
      Average Rating
    </h3>

    <p className="text-3xl font-bold mt-1">
      ⭐ {averageRating}
    </p>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-pink-400 hover:shadow-md transition-shadow">
    <h3 className="text-gray-500 text-sm">
      Favorites
    </h3>

    <p className="text-3xl font-bold mt-1">
      ❤️ {favorites.length}
    </p>
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 border-t-4 border-t-green-400 hover:shadow-md transition-shadow">
    <h3 className="text-gray-500 text-sm">
      Best Match Score
    </h3>

    <p className="text-3xl font-bold text-green-600 mt-1">
      {bestMatchScore !== null ? `${bestMatchScore}%` : "N/A"}
    </p>
  </div>

</div>

      {/* RESULTS */}

      {countryDishes.length > 0 && (
        <div className="bg-orange-50 rounded-2xl border-l-4 border-orange-400 p-5 mb-6">
          <h3 className="font-bold text-lg mb-2">
            🍲 Popular Dishes in {countryQuery}
          </h3>
          <p className="text-gray-700">{countryDishes.join(", ")}</p>
        </div>
      )}

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
            className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
          >

            <div className="overflow-hidden">
              <img
              src={
                place.image ||
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
              }
              alt={place.name}
              className="h-48 w-full object-cover flex-shrink-0 group-hover:scale-110 transition-transform duration-500"
              />
            </div>

            <div className="p-4 flex flex-col flex-1">

              {index === 0 && place.matchScore !== null && (
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold inline-block mb-2 self-start shadow-sm">
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
                {place.rating ? `⭐ ${place.rating}` : "⭐ No rating data"}
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
                Avg Cost: View live price →
            </p>

              <p className="text-green-600 font-bold mt-2">
                 Match Score: {place.matchScore !== null ? `${place.matchScore}%` : "N/A"}
                 </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToFavorites(place);
                }}
                className="mt-auto bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full self-start shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200"
              >
                ❤️ Add to Favorites
              </button>

            </div>

          </div>
        ))}

      </div>

      <AnalyticsCharts results={displayedResults} />
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