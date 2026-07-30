import { apiFetch } from "./apiClient";

export const fetchWeather = async (city) => {
  try {
    return await apiFetch(`/weather?city=${encodeURIComponent(city)}`);
  } catch (error) {
    console.error("Weather Error:", error);

    return {
      temperature: "N/A",
      condition: "Unknown",
      humidity: "N/A",
    };
  }
};
