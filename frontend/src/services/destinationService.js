import { apiFetch } from "./apiClient";

export const fetchDestinations = async () => {
  try {
    return await apiFetch("/destinations");
  } catch (error) {
    console.error("Destination API Error:", error);
    return [];
  }
};
