import { apiFetch } from "./apiClient";

export const fetchGovernmentAnalytics = async () => {
  try {
    return await apiFetch("/analytics/government");
  } catch (error) {
    console.error("Government Analytics Fetch Error:", error);
    return null;
  }
};
