import { apiFetch } from "./apiClient";

export const fetchRestaurants = async (city, country) => {
  try {
    const data = await apiFetch(
      `/restaurants?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
    return data.restaurants || [];
  } catch (error) {
    console.error("Restaurant Fetch Error:", error);
    return [];
  }
};
