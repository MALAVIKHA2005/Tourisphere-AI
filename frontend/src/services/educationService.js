import { apiFetch } from "./apiClient";

const EMPTY = { university: [], college: [], school: [] };

export const fetchEducation = async (city, country) => {
  try {
    const data = await apiFetch(
      `/education?city=${encodeURIComponent(city || "")}&country=${encodeURIComponent(
        country || ""
      )}`
    );
    return { ...EMPTY, ...data };
  } catch (error) {
    console.error("Education Fetch Error:", error);
    return EMPTY;
  }
};
