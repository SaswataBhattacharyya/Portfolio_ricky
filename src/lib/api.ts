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

export async function apiUpload<T = unknown>(
  path: string,
  form: FormData,
  onProgress?: (progress: number) => void,
): Promise<T> {
  await ensureCsrf();
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`);
    request.withCredentials = true;
    const token = csrfToken();
    if (token) request.setRequestHeader("X-CSRFToken", decodeURIComponent(token));
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("error", () => reject(new Error("Upload failed. Check your connection and try again.")));
    request.addEventListener("abort", () => reject(new Error("Upload was cancelled.")));
    request.addEventListener("load", () => {
      let body: { error?: string } & T;
      try {
        body = JSON.parse(request.responseText || "{}");
      } catch {
        reject(new Error(`Request failed (${request.status})`));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(body.error || `Request failed (${request.status})`));
        return;
      }
      resolve(body);
    });
    request.send(form);
  });
}

export { API_BASE };
