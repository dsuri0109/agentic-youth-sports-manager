import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/supabase";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/gmail/callback`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const teamId = req.nextUrl.searchParams.get("state");

  if (!code || !teamId) {
    return NextResponse.redirect(`${APP_URL}/action-items?error=missing_params`);
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();
  if (tokens.error) {
    console.error("Token exchange error:", tokens);
    return NextResponse.redirect(`${APP_URL}/action-items?error=token_exchange`);
  }

  // Get user email
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();

  const expiry = new Date(
    Date.now() + (tokens.expires_in ?? 3600) * 1000
  ).toISOString();

  const db = createServerSupabase();
  await db.from("gmail_connections").upsert(
    {
      team_id: teamId,
      email: userInfo.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expiry,
    },
    { onConflict: "team_id" }
  );

  return NextResponse.redirect(`${APP_URL}/action-items?connected=1`);
}
