import { apiFetch } from "./apiClient";

export const searchCountries = async (query) => {
  try {
    const data = await apiFetch(
      `/countries/search?query=${encodeURIComponent(query)}`
    );
    return data.countries;
  } catch (error) {
    console.error("Country Search Error:", error);
    return [];
  }
};
