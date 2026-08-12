import { apiFetch } from "./apiClient";

export const createBooking = async (booking) => {
  return apiFetch("/bookings", {
    method: "POST",
    body: JSON.stringify(booking),
  });
};

export const fetchBookings = async () => {
  try {
    const data = await apiFetch("/bookings");
    return data.bookings;
  } catch (error) {
    console.error("Bookings Fetch Error:", error);
    return [];
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    await apiFetch(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
    return true;
  } catch (error) {
    console.error("Booking Cancel Error:", error);
    return false;
  }
};
