import { getAuthToken, handleUnauthorized } from "../utils/api";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const token = getAuthToken();
    if (res.status === 401 && token) handleUnauthorized();
    const error = new Error(data.message || "Request failed");
    error.status = res.status;
    throw error;
  }
  return data;
};

export const getTasks = () => request("/tasks");
export const createTask = (body) =>
  request("/tasks", { method: "POST", body: JSON.stringify(body) });
export const updateTask = (id, body) =>
  request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });
