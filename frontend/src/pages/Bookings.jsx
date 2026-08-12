import React, { useEffect, useState } from "react";
import { fetchBookings, cancelBooking } from "../services/bookingService";

const todayStr = () => new Date().toISOString().split("T")[0];

const isPast = (booking) => {
  const relevantDate = booking.type === "hotel" ? booking.check_out : booking.reservation_date;
  return relevantDate < todayStr();
};

const StatusBadge = ({ status, past }) => {
  if (status === "cancelled") {
    return (
      <span className="text-xs font-semibold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
        Cancelled
      </span>
    );
  }

  if (past) {
    return (
      <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
        Completed
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold bg-green-50 text-green-600 px-2.5 py-1 rounded-full">
      Confirmed
    </span>
  );
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchBookings()
      .then(setBookings)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (booking) => {
    const confirmed = window.confirm(`Cancel your booking at ${booking.place?.name}?`);
    if (!confirmed) return;

    setCancellingId(booking.id);
    const ok = await cancelBooking(booking.id);
    setCancellingId(null);

    if (ok) {
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-12">
        <p className="text-gray-500">Loading your bookings...</p>
      </div>
    );
  }

  const upcoming = bookings.filter((b) => b.status !== "cancelled" && !isPast(b));
  const past = bookings.filter((b) => b.status === "cancelled" || isPast(b));

  const renderCard = (booking) => {
    const past_ = isPast(booking);

    return (
      <div key={booking.id} className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {booking.type === "hotel" ? "🏨 Hotel" : "🍽️ Restaurant"} · {booking.booking_reference}
            </p>
            <h3 className="font-bold text-lg">{booking.place?.name}</h3>
            <p className="text-sm text-gray-500">
              {booking.destination?.city || booking.destination?.name}
              {booking.destination?.country ? `, ${booking.destination.country}` : ""}
            </p>
          </div>
          <StatusBadge status={booking.status} past={past_} />
        </div>

        <div className="text-sm text-gray-700 mt-3">
          {booking.type === "hotel" ? (
            <p>{booking.check_in} → {booking.check_out} · {booking.guests} guest(s)</p>
          ) : (
            <p>{booking.reservation_date} at {booking.reservation_time} · party of {booking.party_size}</p>
          )}
        </div>

        {booking.status !== "cancelled" && !past_ && (
          <button
            onClick={() => handleCancel(booking)}
            disabled={cancellingId === booking.id}
            className="mt-4 text-sm text-red-500 hover:underline disabled:opacity-50"
          >
            {cancellingId === booking.id ? "Cancelling..." : "Cancel booking"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 p-12 overflow-auto">

        <p className="text-orange-500 tracking-widest text-sm">
          PHASE 19 • BOOKING SYSTEM
        </p>

        <h1 className="text-5xl font-bold mt-2">My Bookings</h1>

        <p className="text-gray-500 mt-4 mb-10 max-w-2xl">
          Real reservations against this platform's own real hotel and restaurant
          data -- booked from a destination's page, tracked here, cancellable
          any time. No payment is taken; this is a reservation record, not a
          checkout.
        </p>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-500">
            No bookings yet. Open a destination and book a hotel or restaurant
            to see it here.
          </div>
        ) : (
          <div className="space-y-10 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold mb-4">Upcoming ({upcoming.length})</h2>
              {upcoming.length === 0 ? (
                <p className="text-gray-500 text-sm">No upcoming bookings.</p>
              ) : (
                <div className="space-y-4">{upcoming.map(renderCard)}</div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">Past &amp; Cancelled ({past.length})</h2>
              {past.length === 0 ? (
                <p className="text-gray-500 text-sm">Nothing here yet.</p>
              ) : (
                <div className="space-y-4">{past.map(renderCard)}</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
