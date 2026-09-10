import { apiFetch } from "./api";

const SESSION_KEY = "webberick-analytics-session";

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = crypto.randomUUID();
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
