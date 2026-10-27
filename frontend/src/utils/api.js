const API_BASE = "/api";

export function getAuthToken() {
  for (const storage of [localStorage, sessionStorage]) {
    let rawSession = "";
    try {
      rawSession = storage.getItem("panda_session") || "";
    } catch {
      continue;
    }

    if (rawSession) {
      try {
        const session = JSON.parse(rawSession);
        if (typeof session?.token === "string" && session.token.trim()) {
          return session.token.trim().replace(/^Bearer\s+/i, "");
        }
      } catch {
        continue;
      }
    }
  }

  for (const storage of [localStorage, sessionStorage]) {
    let rawToken = "";
    try {
      rawToken = storage.getItem("token") || "";
      if (!rawToken) continue;
    } catch {
      continue;
    }
    try {
      const parsedToken = JSON.parse(rawToken);
      const token = typeof parsedToken === "string" ? parsedToken : parsedToken?.token;
      if (typeof token === "string" && token.trim()) return token.trim().replace(/^Bearer\s+/i, "");
    } catch {
      if (rawToken?.trim()) return rawToken.trim().replace(/^Bearer\s+/i, "");
    }
  }
  return "";
}

export function handleUnauthorized() {
  const keys = ["panda_session", "token", "user", "userInfo", "role", "email"];
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (const key of keys) storage.removeItem(key);
    } catch {
      continue;
    }
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("panda-session-change"));
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
    if (response.status === 401 && token) handleUnauthorized();
    const error = new Error(result.message || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return result;
}