import { apiFetch } from "./apiClient";

export const fetchPlatformStats = async () => {
  try {
    return await apiFetch("/analytics/platform");
  } catch (error) {
    console.error("Platform Analytics Fetch Error:", error);
    return null;
  }
};
