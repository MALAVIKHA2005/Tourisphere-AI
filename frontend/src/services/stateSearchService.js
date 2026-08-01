import { apiFetch } from "./apiClient";

export const fetchStates = async (country) => {
  try {
    const data = await apiFetch(`/states?country=${encodeURIComponent(country || "")}`);
    return data.states || [];
  } catch (error) {
    console.error("States Fetch Error:", error);
    return [];
  }
};
