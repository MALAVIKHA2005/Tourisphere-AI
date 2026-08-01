import { apiFetch } from "./apiClient";

const EMPTY = { shopping: [], nightlife: [], entertainment: [], culture: [] };

export const fetchLifestyle = async (city, country) => {
  try {
    const data = await apiFetch(
      `/lifestyle?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
    return { ...EMPTY, ...data };
  } catch (error) {
    console.error("Lifestyle Fetch Error:", error);
    return EMPTY;
  }
};
