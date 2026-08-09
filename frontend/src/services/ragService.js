import { apiFetch } from "./apiClient";

export const askAssistant = async (question, history = []) => {
  try {
    return await apiFetch("/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question, history }),
    });
  } catch (error) {
    console.error("Assistant Error:", error);
    return {
      answer: "Something went wrong reaching the assistant. Please try again.",
      sources: [],
    };
  }
};

export const fetchAssistantHistory = async () => {
  try {
    const data = await apiFetch("/assistant/history");
    return data.messages || [];
  } catch (error) {
    console.error("Assistant History Fetch Error:", error);
    return [];
  }
};

export const clearAssistantHistory = async () => {
  try {
    await apiFetch("/assistant/history", { method: "DELETE" });
    return true;
  } catch (error) {
    console.error("Assistant History Clear Error:", error);
    return false;
  }
};
