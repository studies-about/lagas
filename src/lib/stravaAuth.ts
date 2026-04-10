import { supabase } from "@/lib/supabase";

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string;
const REDIRECT_URI = `${window.location.origin}/strava/callback`;

export function redirectToStrava() {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read,activity:read");
  window.location.href = url.toString();
}

export async function exchangeCodeViaServer(code: string): Promise<{ access_token: string; expires_at: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch("/api/strava/callback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) throw new Error("Error al conectar Strava");
  return res.json();
}

export async function refreshTokenViaServer(): Promise<{ access_token: string; expires_at: number }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch("/api/strava/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error("Error al renovar token de Strava");
  return res.json();
}

export function storeTokens(accessToken: string, expiresAt: number) {
  localStorage.setItem("strava_access_token", accessToken);
  localStorage.setItem("strava_expires_at", String(expiresAt));
}

export function clearTokens() {
  localStorage.removeItem("strava_access_token");
  localStorage.removeItem("strava_expires_at");
  localStorage.removeItem("strava_refresh_token");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("strava_access_token");
}

export function isTokenValid(): boolean {
  const token = localStorage.getItem("strava_access_token");
  const expiresAt = Number(localStorage.getItem("strava_expires_at"));
  if (!token || !expiresAt) return false;
  return Date.now() / 1000 < expiresAt - 60;
}
