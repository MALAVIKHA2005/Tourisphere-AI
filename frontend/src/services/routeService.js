import { apiFetch } from "./apiClient";

export const fetchRoute = async (fromPlace, toPlace, mode = "drive") => {
  try {
    return await apiFetch(
      `/route?from_place=${encodeURIComponent(fromPlace || "")}&to_place=${encodeURIComponent(
        toPlace || ""
      )}&mode=${encodeURIComponent(mode)}`
    );
  } catch (error) {
    console.error("Route Fetch Error:", error);
    return { available: false };
  }
};
