import { apiFetch } from "./apiClient";

export const fetchRecommendations = async (
  country,
  budget,
  climate,
  interest
) => {
  try {
    return await apiFetch(
      `/recommendations?country=${encodeURIComponent(country)}` +
        `&budget=${encodeURIComponent(budget)}` +
        `&climate=${encodeURIComponent(climate)}` +
        `&interest=${encodeURIComponent(interest)}`
    );
  } catch (error) {
    console.error("Recommendation API Error", error);
    return [];
  }
};
