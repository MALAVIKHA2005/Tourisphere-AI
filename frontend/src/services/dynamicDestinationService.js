import { apiFetch } from "./apiClient";

export const fetchDynamicDestinations = async (country) => {
  try {
    return await apiFetch(
      `/dynamic-destinations?country=${encodeURIComponent(country)}`
    );
  } catch (error) {
    console.error("Dynamic destination error:", error);
    return [];
  }
};
