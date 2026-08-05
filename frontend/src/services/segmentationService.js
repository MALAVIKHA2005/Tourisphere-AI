import { apiFetch } from "./apiClient";

export const fetchUserSegment = async () => {
  try {
    return await apiFetch("/user-segment");
  } catch (error) {
    console.error("User Segment Fetch Error:", error);
    return { available: false };
  }
};
