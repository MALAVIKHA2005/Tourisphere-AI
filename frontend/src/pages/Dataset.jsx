import React, { useEffect, useMemo, useState } from "react";
import { fetchDestinations } from "../services/destinationService";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "country", label: "Country" },
  { key: "state", label: "State" },
  { key: "climate", label: "Climate" },
  { key: "budget", label: "Budget" },
  { key: "rating", label: "Rating" },
  { key: "popularity", label: "Popularity (views/mo)" },
  { key: "bestMonths", label: "Best Months" },
  { key: "interests", label: "Interests" },
  { key: "suitableFor", label: "Suitable For" },
];

const cellValue = (row, key) => {
  const value = row[key];

  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
};

const csvEscape = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const download = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function Dataset() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchDestinations()
      .then(setDestinations)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;

    return destinations.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.country?.toLowerCase().includes(q) ||
        d.state?.toLowerCase().includes(q)
    );
  }, [destinations, query]);

  const handleDownloadCsv = () => {
    const header = COLUMNS.map((c) => csvEscape(c.label)).join(",");
    const rows = filtered.map((row) =>
      COLUMNS.map((c) => csvEscape(cellValue(row, c.key))).join(",")
    );

    download(
      "tourisphere-destinations.csv",
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8"
    );
  };

  const handleDownloadJson = () => {
    download(
      "tourisphere-destinations.json",
      JSON.stringify(filtered, null, 2),
      "application/json"
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          CURATED DATASET
        </p>

        <h1 className="text-5xl font-bold mt-2">The Data Behind Tourisphere</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          The {destinations.length || "23"}-destination curated catalogue this
          platform is built on, straight from the database -- Popularity and Best
          Months are fetched live per request (real Wikipedia page views and
          Open-Meteo historical climate data), not stored as flat numbers.
        </p>

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, country or state..."
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all sm:w-80"
            />

            <div className="flex gap-2">
              <button
                onClick={handleDownloadCsv}
                disabled={loading || filtered.length === 0}
                className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Download CSV
              </button>
              <button
                onClick={handleDownloadJson}
                disabled={loading || filtered.length === 0}
                className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Download JSON
              </button>
            </div>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading dataset...</p>}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-gray-500">No destinations match "{query}".</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    {COLUMNS.map((c) => (
                      <th key={c.key} className="py-2 pr-4 whitespace-nowrap">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      {COLUMNS.map((c) => (
                        <td key={c.key} className="py-2 pr-4 whitespace-nowrap">
                          {cellValue(row, c.key) || (
                            <span className="text-gray-300">No data</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            {filtered.length} of {destinations.length} destinations shown.
          </p>
        </div>

      </div>
    </div>
  );
}
