const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

let csrfReady: Promise<void> | null = null;

async function ensureCsrf() {
  if (!csrfReady) {
    csrfReady = fetch(`${API_BASE}/auth/csrf/`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to prepare secure request");
      })
      .catch((error) => {
        csrfReady = null;
        throw error;
      });
  }
  return csrfReady;
}

function csrfToken() {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("csrftoken="))
    ?.split("=")[1];
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) await ensureCsrf();
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = csrfToken();
  if (token) headers.set("X-CSRFToken", decodeURIComponent(token));
  const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body as T;
}

export { API_BASE };
