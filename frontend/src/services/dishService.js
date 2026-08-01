import { apiFetch } from "./apiClient";

export const fetchDishes = async (country) => {
  try {
    const data = await apiFetch(`/dishes?country=${encodeURIComponent(country || "")}`);
    return data.dishes || [];
  } catch (error) {
    console.error("Dishes Fetch Error:", error);
    return [];
  }
};
