import { apiFetch } from "./api";

const SESSION_KEY = "webberick-analytics-session";

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = createSessionId();
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export function trackEvent(event: string, route = window.location.pathname) {
  void apiFetch("/analytics/events/", {
    method: "POST",
    body: JSON.stringify({ event, route, sessionId: sessionId() }),
  }).catch(() => undefined);
}
