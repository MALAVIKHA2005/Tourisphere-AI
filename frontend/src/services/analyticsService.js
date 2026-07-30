import { apiFetch } from "./apiClient";

export const fetchDashboard = async () => {
  try {
    return await apiFetch("/analytics/dashboard");
  } catch (error) {
    console.error("Analytics Dashboard Fetch Error:", error);
    return null;
  }
};

export const fetchDataset = async (limit = 200) => {
  try {
    const data = await apiFetch(`/analytics/dataset?limit=${limit}`);

    return data.dataset;
  } catch (error) {
    console.error("Analytics Dataset Fetch Error:", error);
    return [];
  }
};
