import { apiFetch } from "./apiClient";

const EMPTY = { healthcare: [], supermarket: [], banking: [], transport: [] };

export const fetchEssentialServices = async (city, country) => {
  try {
    const data = await apiFetch(
      `/essential-services?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
    return { ...EMPTY, ...data };
  } catch (error) {
    console.error("Essential Services Fetch Error:", error);
    return EMPTY;
  }
};
