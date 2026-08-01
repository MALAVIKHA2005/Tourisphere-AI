import { apiFetch } from "./apiClient";

export const fetchDynamicDestinations = async (country, state) => {
  try {
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : "";

    return await apiFetch(
      `/dynamic-destinations?country=${encodeURIComponent(country)}${stateParam}`
    );
  } catch (error) {
    console.error("Dynamic destination error:", error);
    return [];
  }
};
