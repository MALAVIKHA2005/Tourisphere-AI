import { apiFetch } from "./apiClient";
import { getDestinationKey } from "../utils/destinationKey";

export const fetchReviews = async (destination) => {
  try {
    const key = getDestinationKey(destination);
    return await apiFetch(`/reviews?destination_key=${encodeURIComponent(key)}`);
  } catch (error) {
    console.error("Reviews Fetch Error:", error);
    return { reviews: [], count: 0, averageRating: null };
  }
};

export const submitReview = async (destination, rating, text) => {
  await apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify({ destination, rating, text }),
  });
};

export const deleteReview = async (destination) => {
  const key = getDestinationKey(destination);
  await apiFetch(`/reviews/${encodeURIComponent(key)}`, { method: "DELETE" });
};
