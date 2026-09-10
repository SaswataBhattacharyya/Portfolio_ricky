import { apiFetch } from "./api";

export type AdminSession = { authenticated: boolean; email?: string };

export function getAdminSession() {
  return apiFetch<AdminSession>("/auth/session/");
}

export function loginAdmin(email: string, password: string) {
  return apiFetch<AdminSession>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function endAdminSession() {
  return apiFetch<AdminSession>("/auth/logout/", { method: "POST" });
}
