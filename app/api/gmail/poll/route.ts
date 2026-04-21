import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/supabase";

async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expiry: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  return {
    access_token: data.access_token,
    expiry: new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString(),
  };
}

function extractEmailParts(payload: Record<string, unknown>): {
  subject: string;
  from: string;
  body: string;
} {
  let subject = "";
  let from = "";
  let body = "";

  const headers = payload.headers as Array<{ name: string; value: string }> | undefined;
  if (headers) {
    for (const h of headers) {
      if (h.name.toLowerCase() === "subject") subject = h.value;
      if (h.name.toLowerCase() === "from") from = h.value;
    }
  }

  function extractText(part: Record<string, unknown>): string {
    const mimeType = part.mimeType as string | undefined;
    const bodyData = part.body as { data?: string } | undefined;
    const parts = part.parts as Array<Record<string, unknown>> | undefined;

    if (mimeType === "text/plain" && bodyData?.data) {
      try {
        return Buffer.from(bodyData.data, "base64").toString("utf-8");
      } catch {
        return "";
      }
    }
    if (parts) {
      for (const p of parts) {
        const text = extractText(p);
        if (text) return text;
      }
    }
    return "";
  }

  body = extractText(payload);
  return { subject, from, body };
}

async function classifyWithOpenAI(
  from: string,
  subject: string,
  bodySnippet: string
): Promise<{
  type: string;
  urgency: string;
  summary: string;
  suggested_action: string;
  relevant: boolean;
  extracted_data: Record<string, string>;
} | null> {
  const prompt = `You are a youth sports team assistant. Classify this email and extract key information.
Respond with ONLY valid JSON, no markdown.

Email from: ${from}
Subject: ${subject}
Body: ${bodySnippet}

Respond with this exact JSON structure:
{
  "type": "reschedule_request" | "new_game" | "league_admin" | "pickup_update" | "other",
  "urgency": "high" | "medium" | "low",
  "summary": "one sentence summary of what this email is about",
  "suggested_action": "what the coach should do in response",
  "relevant": true | false,
  "extracted_data": {
    "oldDate": "if reschedule - the old date mentioned",
    "newDate": "if reschedule - the new proposed date",
    "opponent": "team name if mentioned",
    "venue": "location/venue if mentioned",
    "playerName": "player name if mentioned"
  }
}

Only return relevant: true if this email is clearly related to youth sports team management (games, schedules, players, league). If it's spam, newsletter, or unrelated, return relevant: false.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  try {
    return JSON.parse(text);
  } catch {
    console.error("Failed to parse OpenAI response:", text);
    return null;
  }
}

// GET — return existing action items for team (no Gmail fetch)
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const db = createServerSupabase();
  const { data: items, error } = await db
    .from("action_items")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get gmail connection info
  const { data: connection } = await db
    .from("gmail_connections")
    .select("email, expiry, created_at")
    .eq("team_id", teamId)
    .maybeSingle();

  return NextResponse.json({ items: items ?? [], connection });
}

// POST — fetch new Gmail messages, classify, store
export async function POST(req: NextRequest) {
  const body = await req.json();
  const teamId = body.teamId as string | undefined;
  if (!teamId) {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const db = createServerSupabase();

  // Get gmail connection
  const { data: connection, error: connError } = await db
    .from("gmail_connections")
    .select("*")
    .eq("team_id", teamId)
    .maybeSingle();

  if (connError || !connection) {
    return NextResponse.json({ error: "Gmail not connected" }, { status: 400 });
  }

  let accessToken = connection.access_token as string;

  // Refresh if expired
  const expiry = connection.expiry ? new Date(connection.expiry as string) : null;
  if (expiry && expiry <= new Date()) {
    if (!connection.refresh_token) {
      return NextResponse.json({ error: "Token expired and no refresh token" }, { status: 401 });
    }
    try {
      const refreshed = await refreshAccessToken(connection.refresh_token as string);
      accessToken = refreshed.access_token;
      await db
        .from("gmail_connections")
        .update({ access_token: refreshed.access_token, expiry: refreshed.expiry })
        .eq("team_id", teamId);
    } catch (e) {
      console.error("Token refresh failed:", e);
      return NextResponse.json({ error: "Token refresh failed" }, { status: 401 });
    }
  }

  // Check if this is a first sync (no existing items) or incremental
  const { data: existingItems } = await db
    .from("action_items")
    .select("gmail_message_id")
    .eq("team_id", teamId);

  const isFirstSync = !existingItems || existingItems.length === 0;
  const gmailWindow = isFirstSync ? "14d" : "2d";
  const gmailMax   = isFirstSync ? 50 : 10;
  const openaiCap  = isFirstSync ? 15 : 5;

  // Fetch from Gmail — newest first
  const listRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=in:inbox+newer_than:${gmailWindow}&maxResults=${gmailMax}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const messages = (listData.messages as Array<{ id: string }> | undefined) ?? [];

  if (messages.length === 0) {
    const { data: items } = await db
      .from("action_items")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    return NextResponse.json({ items: items ?? [] });
  }

  const existingIds = new Set(
    (existingItems ?? []).map((i: { gmail_message_id: string }) => i.gmail_message_id)
  );

  const newMessages = messages.filter((m) => !existingIds.has(m.id));
  let openaiCallCount = 0;

  for (const msg of newMessages) {
    if (openaiCallCount >= openaiCap) break;
    try {
      // Fetch full message
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgRes.json();

      const { subject, from, body } = extractEmailParts(
        (msgData.payload as Record<string, unknown>) ?? {}
      );
      const snippet = (msgData.snippet as string | undefined) ?? "";

      // Classify with OpenAI
      openaiCallCount++;
      const classification = await classifyWithOpenAI(
        from,
        subject,
        body.slice(0, 600) || snippet
      );

      if (!classification || !classification.relevant) continue;

      // Store in action_items
      await db.from("action_items").upsert(
        {
          team_id: teamId,
          gmail_message_id: msg.id,
          type: classification.type,
          urgency: classification.urgency,
          summary: classification.summary,
          suggested_action: classification.suggested_action,
          extracted_data: classification.extracted_data ?? {},
          email_subject: subject,
          email_from: from,
          email_snippet: snippet,
          status: "pending",
        },
        { onConflict: "team_id,gmail_message_id" }
      );
    } catch (e) {
      console.error("Error processing message", msg.id, e);
    }
  }

  // Return all pending items
  const { data: items } = await db
    .from("action_items")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return NextResponse.json({ items: items ?? [] });
}

// PATCH — update status (action/dismiss)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const db = createServerSupabase();
  const { error } = await db
    .from("action_items")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
