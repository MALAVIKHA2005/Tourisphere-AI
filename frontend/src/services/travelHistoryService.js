import { apiFetch } from "./apiClient";

export const saveTravelHistory = async (destination) => {
  try {
    await apiFetch("/travel-history", {
      method: "POST",
      body: JSON.stringify(destination),
    });
  } catch (error) {
    console.error("Travel History Save Error:", error);
  }
};

export const fetchTravelHistory = async (limit = 10) => {
  try {
    const data = await apiFetch(`/travel-history?limit=${limit}`);

    return data.travel_history;
  } catch (error) {
    console.error("Travel History Fetch Error:", error);
    return [];
  }
};
