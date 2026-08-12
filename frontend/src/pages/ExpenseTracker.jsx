import React, { useEffect, useMemo, useState } from "react";
import { fetchDestinations } from "../services/destinationService";
import { fetchExchangeRates } from "../services/currencyService";
import { fetchExpenses, addExpense, deleteExpense } from "../services/expenseService";

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥" };
const CURRENCIES = Object.keys(CURRENCY_SYMBOLS);

const CATEGORY_STYLE = {
  Accommodation: { emoji: "🏨", barClass: "bg-blue-400", textClass: "text-blue-700" },
  Food: { emoji: "🍽️", barClass: "bg-orange-400", textClass: "text-orange-700" },
  Transport: { emoji: "🚗", barClass: "bg-purple-400", textClass: "text-purple-700" },
  Activities: { emoji: "🎟️", barClass: "bg-pink-400", textClass: "text-pink-700" },
  Shopping: { emoji: "🛍️", barClass: "bg-teal-400", textClass: "text-teal-700" },
  Other: { emoji: "📦", barClass: "bg-gray-400", textClass: "text-gray-600" },
};

const today = () => new Date().toISOString().split("T")[0];

// rates is INR-based (INR: 1, others = amount of that currency per 1 INR),
// same convention used everywhere else this app converts currency.
const convert = (amount, from, to, rates) => {
  if (!rates || !rates[from] || !rates[to]) return amount;
  return (amount / rates[from]) * rates[to];
};

const destinationLabel = (d) =>
  d ? [d.name, d.city, d.country].filter(Boolean).join(", ") : "No destination";

export default function ExpenseTracker() {
  const [destinations, setDestinations] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rates, setRates] = useState({ USD: 1 });
  const [loading, setLoading] = useState(true);

  const [destChoice, setDestChoice] = useState("none");
  const [useCustom, setUseCustom] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [filterKey, setFilterKey] = useState("all");
  const [displayCurrency, setDisplayCurrency] = useState("USD");

  const loadAll = async () => {
    const [destData, expenseData, rateData] = await Promise.all([
      fetchDestinations(),
      fetchExpenses(),
      fetchExchangeRates(),
    ]);

    setDestinations(destData);
    setExpenses(expenseData.expenses);
    setCategories(expenseData.categories);
    setRates(rateData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const destinationKey = (d) =>
    d ? `${d.name || ""}|${d.city || ""}|${d.country || ""}` : "none";

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");

    let destination = null;

    if (useCustom) {
      if (customCity.trim()) {
        destination = { name: customCity.trim(), city: customCity.trim(), country: customCountry.trim() };
      }
    } else if (destChoice !== "none") {
      destination = destinations.find((d) => `${d.name}|${d.country}` === destChoice) || null;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    setSaving(true);

    try {
      const created = await addExpense({
        category,
        amount: Number(amount),
        currency,
        date,
        note: note.trim(),
        destination,
      });

      setExpenses((prev) => [created, ...prev]);
      setAmount("");
      setNote("");
    } catch (err) {
      setError(err.message || "Couldn't save that expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const deleted = await deleteExpense(id);
    if (deleted) setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const filterOptions = useMemo(() => {
    const seen = new Map();
    expenses.forEach((e) => {
      const key = destinationKey(e.destination);
      if (!seen.has(key)) seen.set(key, e.destination);
    });
    return Array.from(seen.entries());
  }, [expenses]);

  const filtered = useMemo(() => {
    if (filterKey === "all") return expenses;
    return expenses.filter((e) => destinationKey(e.destination) === filterKey);
  }, [expenses, filterKey]);

  const grandTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates), 0),
    [filtered, displayCurrency, rates]
  );

  const byCategory = useMemo(() => {
    const totals = {};
    filtered.forEach((e) => {
      const converted = convert(e.amount, e.currency, displayCurrency, rates);
      totals[e.category] = (totals[e.category] || 0) + converted;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [filtered, displayCurrency, rates]);

  const symbol = CURRENCY_SYMBOLS[displayCurrency] || "";

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 20 • EXPENSE TRACKER
        </p>

        <h1 className="text-5xl font-bold mt-2">Expense Tracker</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          Log what you actually spend on a trip -- every number here is one you
          entered, nothing estimated or invented. Totals across currencies are
          converted using the same live exchange rates used elsewhere on this
          platform, for reference only.
        </p>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl">

            {/* ADD EXPENSE */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">Add an expense</h2>

                <form onSubmit={handleAdd} className="space-y-3">

                  <div className="flex gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => setUseCustom(false)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        !useCustom
                          ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white border-transparent"
                          : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"
                      }`}
                    >
                      Curated / none
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
                      Custom destination
                    </button>
                  </div>

                  {useCustom ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        placeholder="City"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <input
                        type="text"
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        placeholder="Country (optional)"
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
                  ) : (
                    <select
                      value={destChoice}
                      onChange={(e) => setDestChoice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="none">No specific destination</option>
                      {destinations.map((d) => (
                        <option key={`${d.name}|${d.country}`} value={`${d.name}|${d.country}`}>
                          {d.name}, {d.country}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {(categories.length ? categories : Object.keys(CATEGORY_STYLE)).map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_STYLE[c]?.emoji} {c}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />

                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Add Expense"}
                  </button>
                </form>
              </div>
            </div>

            {/* SUMMARY + LIST */}
            <div className="lg:col-span-3 space-y-6">

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <h2 className="text-lg font-bold">Summary</h2>

                  <div className="flex items-center gap-2">
                    <select
                      value={filterKey}
                      onChange={(e) => setFilterKey(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="all">All destinations</option>
                      {filterOptions.map(([key, dest]) => (
                        <option key={key} value={key}>{destinationLabel(dest)}</option>
                      ))}
                    </select>

                    <select
                      value={displayCurrency}
                      onChange={(e) => setDisplayCurrency(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-500">No expenses logged yet.</p>
                ) : (
                  <>
                    <p className="text-4xl font-bold mb-6">
                      {symbol}{grandTotal.toFixed(2)}
                    </p>

                    <div className="space-y-3">
                      {byCategory.map(([cat, total]) => {
                        const style = CATEGORY_STYLE[cat] || CATEGORY_STYLE.Other;
                        const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;

                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className={`font-medium ${style.textClass}`}>
                                {style.emoji} {cat}
                              </span>
                              <span className="text-gray-500">{symbol}{total.toFixed(2)} ({pct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${style.barClass}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">All expenses</h2>

                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-500">Nothing here yet -- add your first expense.</p>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((e) => {
                      const style = CATEGORY_STYLE[e.category] || CATEGORY_STYLE.Other;

                      return (
                        <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <div>
                            <p className="font-semibold text-sm">
                              {style.emoji} {e.category}
                              {e.note ? <span className="text-gray-400 font-normal"> · {e.note}</span> : null}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {e.date}{e.destination ? ` · ${destinationLabel(e.destination)}` : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                              {CURRENCY_SYMBOLS[e.currency]}{e.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleDelete(e.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
