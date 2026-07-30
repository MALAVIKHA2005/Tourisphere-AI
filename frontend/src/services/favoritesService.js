import { apiFetch } from "./apiClient";
import { getDestinationKey } from "../utils/destinationKey";

export const fetchFavorites = async () => {
  try {
    const data = await apiFetch("/favorites");

    return data.favorites;
  } catch (error) {
    console.error("Favorites Fetch Error:", error);
    return [];
  }
};

export const addFavorite = async (destination) => {
  try {
    await apiFetch("/favorites", {
      method: "POST",
      body: JSON.stringify(destination),
    });

    return true;
  } catch (error) {
    console.error("Favorites Add Error:", error);
    return false;
  }
};

export const removeFavorite = async (destination) => {
  try {
    const key = getDestinationKey(destination);

    await apiFetch(`/favorites/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });

    return true;
  } catch (error) {
    console.error("Favorites Remove Error:", error);
    return false;
  }
};
