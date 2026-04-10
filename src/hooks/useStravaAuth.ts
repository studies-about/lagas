import { useState, useEffect } from "react";
import {
  isTokenValid,
  getAccessToken,
  clearTokens,
  redirectToStrava,
  refreshTokenViaServer,
  storeTokens,
} from "@/lib/stravaAuth";

export function useStravaAuth() {
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (isTokenValid()) {
        setIsConnected(true);
        setToken(getAccessToken());
        setLoading(false);
        return;
      }

      // Token expired — try refreshing via server (server reads refresh token from Supabase DB)
      try {
        const data = await refreshTokenViaServer();
        storeTokens(data.access_token, data.expires_at);
        setIsConnected(true);
        setToken(data.access_token);
      } catch {
        clearTokens();
      }

      setLoading(false);
    }

    init();
  }, []);

  function disconnect() {
    clearTokens();
    setIsConnected(false);
    setToken(null);
  }

  return { isConnected, token, loading, connect: redirectToStrava, disconnect };
}
