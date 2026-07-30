import { apiFetch } from "./apiClient";

export const logSearch = async (filters, resultCount) => {
  try {
    await apiFetch("/search-history", {
      method: "POST",
      body: JSON.stringify({
        country: filters.country || null,
        state: filters.state || null,
        budget: filters.budget || null,
        climate: filters.climate || null,
        interest: filters.interest || null,
        travel_type: filters.travelType || null,
        month: filters.month || null,
        query: filters.query || null,
        result_count: resultCount,
      }),
    });
  } catch (error) {
    console.error("Search History Log Error:", error);
  }
};

export const fetchSearchHistory = async (limit = 10) => {
  try {
    const data = await apiFetch(`/search-history?limit=${limit}`);

    return data.search_history;
  } catch (error) {
    console.error("Search History Fetch Error:", error);
    return [];
  }
};
