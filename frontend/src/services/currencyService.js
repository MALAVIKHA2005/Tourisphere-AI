import { apiFetch } from "./apiClient";

export const fetchExchangeRates = async () => {
  try {
    return await apiFetch("/currency-rates");
  } catch (error) {
    console.error("Currency API Error:", error);

    return {
      INR: 1,
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0095,
      JPY: 1.8,
    };
  }
};
