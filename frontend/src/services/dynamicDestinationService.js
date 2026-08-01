import { apiFetch } from "./apiClient";

export const fetchDynamicDestinations = async (country, state, city) => {
  try {
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : "";
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";

    return await apiFetch(
      `/dynamic-destinations?country=${encodeURIComponent(country)}${stateParam}${cityParam}`
    );
  } catch (error) {
    console.error("Dynamic destination error:", error);
    return [];
  }
};
