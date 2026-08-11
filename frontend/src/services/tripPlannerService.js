import { apiFetch } from "./apiClient";

export const generateItinerary = async (destination, days, interests) => {
  try {
    return await apiFetch("/trip-planner/generate", {
      method: "POST",
      body: JSON.stringify({
        destination: destination.name,
        city: destination.city || destination.name,
        country: destination.country,
        days,
        interests,
      }),
    });
  } catch (error) {
    console.error("Trip Planner Error:", error);
    return {
      itinerary: "Something went wrong generating your itinerary. Please try again.",
      sources: {},
    };
  }
};
