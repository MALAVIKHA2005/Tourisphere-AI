import { apiFetch } from "./apiClient";

export const fetchExpenses = async () => {
  try {
    const data = await apiFetch("/expenses");
    return { expenses: data.expenses, categories: data.categories };
  } catch (error) {
    console.error("Expenses Fetch Error:", error);
    return { expenses: [], categories: [] };
  }
};

export const addExpense = async (expense) => {
  return apiFetch("/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
};

export const deleteExpense = async (expenseId) => {
  try {
    await apiFetch(`/expenses/${expenseId}`, { method: "DELETE" });
    return true;
  } catch (error) {
    console.error("Expense Delete Error:", error);
    return false;
  }
};
