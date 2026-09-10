import { apiFetch } from "./api";

function decodeKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

export async function enableAdminPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Browser notifications are not supported here");
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted");
  const registration = await navigator.serviceWorker.register("/sw.js");
  const { publicKey } = await apiFetch<{ publicKey: string }>("/notifications/public-key/");
  if (!publicKey) throw new Error("Push notifications are not configured yet");
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
  await apiFetch("/notifications/subscribe/", { method: "POST", body: JSON.stringify({ subscription }) });
}
