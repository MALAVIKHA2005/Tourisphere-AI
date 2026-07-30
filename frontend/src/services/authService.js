import { apiFetch } from "./apiClient";

export const register = async (name, email, password) => {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
};

export const login = async (email, password) => {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const logout = async () => {
  return apiFetch("/auth/logout", { method: "POST" });
};

export const fetchMe = async () => {
  try {
    return await apiFetch("/auth/me");
  } catch (error) {
    return null;
  }
};

export const exportMyData = async () => {
  return apiFetch("/auth/me/export");
};

export const deleteAccount = async () => {
  return apiFetch("/auth/me", { method: "DELETE" });
};
