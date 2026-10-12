const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

export const getTasks = () => request("/tasks");
export const createTask = (body) =>
  request("/tasks", { method: "POST", body: JSON.stringify(body) });
export const updateTask = (id, body) =>
  request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });
