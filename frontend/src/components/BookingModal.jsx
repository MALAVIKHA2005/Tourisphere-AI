import React, { useState } from "react";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const dayAfter = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split("T")[0];
};

// Booking.com's public search URL -- no API key or partnership needed.
// We don't have Booking.com's own hotel IDs (our hotel data comes from
// Xotelo/TripAdvisor), so this can't deep-link to the exact same listing,
// but it opens a real, live search for the same city and dates, and any
// booking made there is a real one completed on Booking.com's system.
const buildBookingComUrl = (destination, checkIn, checkOut, guests) => {
  const params = new URLSearchParams({
    ss: `${destination.city || destination.name}${destination.country ? ", " + destination.country : ""}`,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: String(guests),
  });
  return `https://www.booking.com/searchresults.html?${params.toString()}`;
};

const BookingModal = ({ place, destination, onClose }) => {
  const [checkIn, setCheckIn] = useState(tomorrow());
  const [checkOut, setCheckOut] = useState(dayAfter());
  const [guests, setGuests] = useState(2);

  const handleSubmit = () => {
    window.open(
      buildBookingComUrl(destination, checkIn, checkOut, guests),
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-1">🏨 {place.name}</h3>
        <p className="text-sm text-gray-500 mb-1">
          {destination.city || destination.name}{destination.country ? `, ${destination.country}` : ""}
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Pick your dates and we'll open a real, live search on Booking.com for
          this city -- the actual booking happens there, not here.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={tomorrow()}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs uppercase tracking-wide text-gray-400 mb-1 block">Adults</label>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-2.5 rounded-xl font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            Search on Booking.com →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
