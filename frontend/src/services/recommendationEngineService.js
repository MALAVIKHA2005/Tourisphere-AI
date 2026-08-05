import { apiFetch } from "./apiClient";

export const fetchSimilarDestinations = async (destination, limit = 4) => {
  try {
    return await apiFetch(`/similar-destinations?limit=${limit}`, {
      method: "POST",
      body: JSON.stringify(destination),
    });
  } catch (error) {
    console.error("Similar Destinations Fetch Error:", error);
    return [];
  }
};

export const fetchRecommendedForYou = async (limit = 8) => {
  try {
    return await apiFetch(`/recommended-for-you?limit=${limit}`);
  } catch (error) {
    console.error("Recommended For You Fetch Error:", error);
    return [];
  }
};
