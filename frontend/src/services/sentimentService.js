import { apiFetch } from "./apiClient";
import { getDestinationKey } from "../utils/destinationKey";

export const fetchSentiment = async (destination) => {
  try {
    const key = getDestinationKey(destination);
    return await apiFetch(`/sentiment?destination_key=${encodeURIComponent(key)}`);
  } catch (error) {
    console.error("Sentiment Fetch Error:", error);
    return { count: 0, overallLabel: null, breakdown: null, averageCompound: null };
  }
};
