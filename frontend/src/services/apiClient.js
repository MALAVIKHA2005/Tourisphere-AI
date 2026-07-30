import { API_BASE_URL } from "../config";
import { getGuestId } from "../utils/identity";

export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Guest-Id": getGuestId(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `API request failed: ${options.method || "GET"} ${path}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.detail) detail = errorBody.detail;
    } catch (_) {
      // response wasn't JSON, keep the generic message
    }

    throw new Error(detail);
  }

  return response.json();
};
