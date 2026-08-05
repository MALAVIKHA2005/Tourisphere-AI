import { apiFetch } from "./apiClient";

export const fetchInterestTrend = async (name, city) => {
  try {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : "";
    return await apiFetch(`/interest-trend?name=${encodeURIComponent(name || "")}${cityParam}`);
  } catch (error) {
    console.error("Interest Trend Fetch Error:", error);
    return { available: false };
  }
};
