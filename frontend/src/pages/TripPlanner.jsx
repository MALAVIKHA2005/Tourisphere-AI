import React, { useEffect, useState } from "react";
import { fetchDestinations } from "../services/destinationService";
import { generateItinerary } from "../services/tripPlannerService";

const parseItinerary = (text) => {
  if (!text) return [];

  const blocks = text
    .split(/\n(?=Day\s*\d+)/i)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [];

  return blocks.map((block) => {
    const [firstLine, ...rest] = block.split("\n");
    const bullets = rest
      .join("\n")
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean);

    return { title: firstLine.replace(/:$/, "").trim(), bullets };
  });
};

const LIFESTYLE_LABELS = {
  culture: "🖼️ Culture",
  shopping: "🛍️ Shopping",
  entertainment: "🎬 Entertainment",
  nightlife: "🍸 Nightlife",
  family: "👨‍👩‍👧 Family",
};

export default function TripPlanner() {
  const [destinations, setDestinations] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [days, setDays] = useState(3);
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");

  useEffect(() => {
    fetchDestinations().then((data) => {
      setDestinations(data);
      if (data.length > 0) {
        setSelectedKey(`${data[0].name}|${data[0].country}`);
      }
    });
  }, []);

  const handleGenerate = async () => {
    let destination;

    if (useCustom) {
      if (!customCity.trim()) return;
      destination = {
        name: customCity.trim(),
        city: customCity.trim(),
        country: customCountry.trim(),
      };
    } else {
      destination = destinations.find(
        (d) => `${d.name}|${d.country}` === selectedKey
      );
      if (!destination) return;
    }

    setLoading(true);
    setResult(null);

    const data = await generateItinerary(destination, days, interests.trim());
    setResult(data);
    setLoading(false);
  };

  const days_parsed = result ? parseItinerary(result.itinerary) : [];
  const sources = result?.sources || {};
  const hasLifestyleSources = Object.values(sources.lifestyle || {}).some(
    (arr) => arr.length > 0
  );

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 18 • AI TRIP PLANNER
        </p>

        <h1 className="text-5xl font-bold mt-2">Plan Your Trip</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          A real day-by-day itinerary built from this platform's own real
          data -- actual nearby restaurants, hotels, and lifestyle spots --
          not invented places. Honest about it when there isn't enough real
          data to fill every day.
        </p>

        <div className="max-w-3xl">
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUseCustom(false)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  !useCustom
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                }`}
              >
                Curated catalogue
              </button>
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  useCustom
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                }`}
              >
                Any destination
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {useCustom ? (
                <>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                      City
                    </label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="e.g. Coimbatore"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                      Country (optional)
                    </label>
                    <input
                      type="text"
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="e.g. India"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                    Destination
                  </label>
                  <select
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    {destinations.map((d) => (
                      <option key={`${d.name}|${d.country}`} value={`${d.name}|${d.country}`}>
                        {d.name}, {d.country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
                  Days (max 14)
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <label className="text-xs uppercase tracking-wide text-gray-400 mb-2 block">
              Interests (optional)
            </label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. nature and photography, nightlife, culture..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 mb-6"
            />

            <button
              onClick={handleGenerate}
              disabled={loading || (useCustom ? !customCity.trim() : !selectedKey)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Building your itinerary..." : "Generate Itinerary"}
            </button>
          </div>

          {result && (
            <div className="space-y-4">
              {days_parsed.length > 0 ? (
                days_parsed.map((day, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-bold text-lg mb-3">{day.title}</h3>
                    <ul className="space-y-1.5 text-sm text-gray-700 list-disc list-inside">
                      {day.bullets.map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {result.itinerary}
                  </p>
                </div>
              )}

              {(sources.restaurants?.length > 0 || sources.hotels?.length > 0 || hasLifestyleSources) && (
                <div className="bg-gray-50 rounded-2xl p-6">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
                    Real data this itinerary was built from
                  </p>

                  <div className="space-y-2">
                    {sources.restaurants?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs font-semibold text-gray-500">🍽️ Restaurants:</span>
                        {sources.restaurants.map((name) => (
                          <span key={name} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {sources.hotels?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-xs font-semibold text-gray-500">🏨 Hotels:</span>
                        {sources.hotels.map((name) => (
                          <span key={name} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {Object.entries(sources.lifestyle || {}).map(([key, names]) =>
                      names.length > 0 ? (
                        <div key={key} className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-xs font-semibold text-gray-500">
                            {LIFESTYLE_LABELS[key] || key}:
                          </span>
                          {names.map((name) => (
                            <span key={name} className="text-xs bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
