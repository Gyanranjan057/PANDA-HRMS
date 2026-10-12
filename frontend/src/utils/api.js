const API_BASE = "/api";

export function getAuthToken() {
  const rawToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!rawToken) return "";
  try {
    return JSON.parse(rawToken);
  } catch {
    return rawToken;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }
  return result;
}