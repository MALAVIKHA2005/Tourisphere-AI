import { apiFetch } from "./apiClient";

export const fetchHotels = async (city, country) => {
  try {
    const data = await apiFetch(
      `/hotels?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
    return data.hotels || [];
  } catch (error) {
    console.error("Hotels Fetch Error:", error);
    return [];
  }
};
