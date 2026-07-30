import { apiFetch } from "./apiClient";

export const fetchHotelPrice = async (city, country) => {
  try {
    return await apiFetch(
      `/hotel-price?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
  } catch (error) {
    console.error("Hotel Price Fetch Error:", error);
    return { available: false };
  }
};
