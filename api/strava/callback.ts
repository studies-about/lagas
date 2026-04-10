import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const jwt = authHeader.slice(7);
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { code } = req.body as { code: string };
  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return res.status(502).json({ error: "Strava token exchange failed" });
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };

  const { error: dbError } = await supabase
    .from("profiles")
    .update({
      strava_access_token: tokens.access_token,
      strava_refresh_token: tokens.refresh_token,
      strava_expires_at: tokens.expires_at,
    })
    .eq("id", user.id);

  if (dbError) {
    return res.status(500).json({ error: "Failed to save tokens" });
  }

  return res.status(200).json({
    access_token: tokens.access_token,
    expires_at: tokens.expires_at,
  });
}
