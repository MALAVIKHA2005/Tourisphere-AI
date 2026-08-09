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
