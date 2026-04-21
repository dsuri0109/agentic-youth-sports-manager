import { openai } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { createServerSupabase } from "@/app/lib/supabase";
import { createCookieSupabase } from "@/app/lib/supabase-server";
import { getPlayersByTeam, getGamesByTeam, getMostRecentTeamByUser, getMostRecentTeam, upsertTeam } from "@/app/lib/db";
import Twilio from "twilio";

const WHATSAPP_FROM = "whatsapp:+14155238886";

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

const SYSTEM_PROMPT = `You are a sharp, action-focused AI assistant for Nike Youth Sports — a platform that helps youth sports coaches manage their team.

You have two core capabilities:

1. WRITE TO DATABASE — Add, update, or remove players and games directly.
   Examples:
   - "Add Marcus Thompson, #7, midfielder, parent Jane at 203-555-0192"
   - "Remove Tyler from the roster"
   - "Update Sarah's jersey to #14"
   - "Add a game vs Cedar Park Coyotes on April 22nd at Cedar Park Activity Center"
   - "Move the Round Rock game to May 3rd"
   - "Cancel the Georgetown game"

2. SEND MESSAGES — Send a WhatsApp message to one or all parents on the roster.
   Examples:
   - "Tell all parents practice Tuesday is cancelled"
   - "Send a payment reminder to Sarah Johnson's parents"
   - "Let everyone know the hotel meetup is 2pm Saturday"

BEHAVIOR:
- If you need to update or remove an existing record, call getTeamContext first to get current IDs.
- For sendWhatsApp: confirm the message text and recipient count before sending.
- Be concise. One sentence to confirm the action taken.
- Never hallucinate data — only use what the coach tells you or what getTeamContext returns.
- If a request is unclear, ask one short clarifying question.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Resolve team from authenticated user session
  const supabase = await createCookieSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  let team = user?.id
    ? await getMostRecentTeamByUser(user.id)
    : await getMostRecentTeam();

  // Auto-create a team if none exists (e.g. after account reset)
  if (!team && user?.id) {
    const name = user.user_metadata?.full_name ?? user.email ?? "My Team";
    team = await upsertTeam({ name: `${name}'s Team`, user_id: user.id });
  }

  if (!team?.id) {
    return new Response(
      "data: No team found. Please set up your team first.\n\n",
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const teamId = team.id;
  const db = createServerSupabase();

  const result = streamText({
    model: openai("gpt-4o"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(8),
    tools: {

      // ── Read context ──────────────────────────────────────────────────────
      getTeamContext: tool({
        description: "Fetch the current roster and schedule. Call this before updating or removing existing records.",
        inputSchema: z.object({}),
        execute: async () => {
          const [players, games] = await Promise.all([
            getPlayersByTeam(teamId),
            getGamesByTeam(teamId),
          ]);
          return {
            players: players.map((p) => ({
              id: p.id,
              name: p.name,
              jersey: p.jersey_number,
              position: p.position,
              parentName: p.parent_name,
              parentPhone: p.parent_phone,
            })),
            games: games.map((g) => ({
              id: g.id,
              opponent: g.opponent,
              date: g.date,
              time: g.time,
              venue: g.venue,
              city: g.city,
              type: g.type,
            })),
          };
        },
      }),

      // ── Roster tools ──────────────────────────────────────────────────────
      addPlayer: tool({
        description: "Add a new player to the roster.",
        inputSchema: z.object({
          name: z.string().describe("Player full name"),
          jerseyNumber: z.string().optional(),
          position: z.string().optional(),
          parentName: z.string().optional(),
          parentPhone: z.string().optional(),
          parentEmail: z.string().optional(),
        }),
        execute: async (input) => {
          const { error } = await db.from("players").insert({
            team_id: teamId,
            name: input.name,
            jersey_number: input.jerseyNumber ?? null,
            position: input.position ?? null,
            parent_name: input.parentName ?? null,
            parent_phone: input.parentPhone ?? null,
            parent_email: input.parentEmail ?? null,
          });
          if (error) return { success: false, error: error.message };
          return { success: true, action: "added", player: input.name };
        },
      }),

      updatePlayer: tool({
        description: "Update an existing player's details. Get the player ID from getTeamContext first.",
        inputSchema: z.object({
          playerId: z.string(),
          name: z.string().optional(),
          jerseyNumber: z.string().optional(),
          position: z.string().optional(),
          parentName: z.string().optional(),
          parentPhone: z.string().optional(),
          parentEmail: z.string().optional(),
        }),
        execute: async (input) => {
          const updates: Record<string, string | null> = {};
          if (input.name !== undefined) updates.name = input.name;
          if (input.jerseyNumber !== undefined) updates.jersey_number = input.jerseyNumber;
          if (input.position !== undefined) updates.position = input.position;
          if (input.parentName !== undefined) updates.parent_name = input.parentName;
          if (input.parentPhone !== undefined) updates.parent_phone = input.parentPhone;
          if (input.parentEmail !== undefined) updates.parent_email = input.parentEmail;
          const { error } = await db.from("players").update(updates).eq("id", input.playerId);
          if (error) return { success: false, error: error.message };
          return { success: true, action: "updated", playerId: input.playerId };
        },
      }),

      removePlayer: tool({
        description: "Remove a player from the roster. Get the player ID from getTeamContext first.",
        inputSchema: z.object({
          playerId: z.string(),
          playerName: z.string().describe("For confirmation message"),
        }),
        execute: async (input) => {
          const { error } = await db.from("players").delete().eq("id", input.playerId);
          if (error) return { success: false, error: error.message };
          return { success: true, action: "removed", player: input.playerName };
        },
      }),

      // ── Schedule tools ────────────────────────────────────────────────────
      addGame: tool({
        description: "Add a new game or tournament to the schedule.",
        inputSchema: z.object({
          opponent: z.string(),
          date: z.string().optional().describe("YYYY-MM-DD format"),
          time: z.string().optional(),
          venue: z.string().optional(),
          city: z.string().optional(),
          type: z.enum(["game", "tournament", "scrimmage"]).optional().default("game"),
        }),
        execute: async (input) => {
          const { error } = await db.from("games").insert({
            team_id: teamId,
            opponent: input.opponent,
            date: input.date ?? null,
            time: input.time ?? null,
            venue: input.venue ?? null,
            city: input.city ?? null,
            type: input.type ?? "game",
          });
          if (error) return { success: false, error: error.message };
          return { success: true, action: "added", opponent: input.opponent };
        },
      }),

      updateGame: tool({
        description: "Update an existing game. Get the game ID from getTeamContext first.",
        inputSchema: z.object({
          gameId: z.string(),
          opponent: z.string().optional(),
          date: z.string().optional().describe("YYYY-MM-DD format"),
          time: z.string().optional(),
          venue: z.string().optional(),
          city: z.string().optional(),
          type: z.enum(["game", "tournament", "scrimmage"]).optional(),
        }),
        execute: async (input) => {
          const updates: Record<string, string> = {};
          if (input.opponent) updates.opponent = input.opponent;
          if (input.date) updates.date = input.date;
          if (input.time) updates.time = input.time;
          if (input.venue) updates.venue = input.venue;
          if (input.city) updates.city = input.city;
          if (input.type) updates.type = input.type;
          const { error } = await db.from("games").update(updates).eq("id", input.gameId);
          if (error) return { success: false, error: error.message };
          return { success: true, action: "updated", gameId: input.gameId };
        },
      }),

      removeGame: tool({
        description: "Remove a game from the schedule. Get the game ID from getTeamContext first.",
        inputSchema: z.object({
          gameId: z.string(),
          opponent: z.string().describe("For confirmation message"),
        }),
        execute: async (input) => {
          const { error } = await db.from("games").delete().eq("id", input.gameId);
          if (error) return { success: false, error: error.message };
          return { success: true, action: "removed", opponent: input.opponent };
        },
      }),

      // ── Messaging ─────────────────────────────────────────────────────────
      sendWhatsApp: tool({
        description: "Send a WhatsApp message to parents. Use recipients='all' or provide specific parent names.",
        inputSchema: z.object({
          message: z.string(),
          recipients: z.union([
            z.literal("all"),
            z.array(z.string()).describe("List of parent names to target"),
          ]),
        }),
        execute: async (input) => {
          const players = await getPlayersByTeam(teamId);
          const withPhones = players.filter((p) => p.parent_phone);

          const targets =
            input.recipients === "all"
              ? withPhones
              : withPhones.filter((p) =>
                  Array.isArray(input.recipients) &&
                  input.recipients.some((name) =>
                    (p.parent_name ?? "").toLowerCase().includes(name.toLowerCase())
                  )
                );

          if (targets.length === 0) {
            return { success: false, error: "No matching parents with phone numbers found." };
          }

          const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
          const token = process.env.TWILIO_AUTH_TOKEN ?? "";

          if (!sid || !token) {
            return { success: true, mock: true, sent: targets.length, message: input.message };
          }

          const client = Twilio(sid, token);
          const results = await Promise.allSettled(
            targets.map((p) =>
              client.messages.create({
                body: input.message,
                from: WHATSAPP_FROM,
                to: `whatsapp:${toE164(p.parent_phone!)}`,
              })
            )
          );

          const sent = results.filter((r) => r.status === "fulfilled").length;
          const failed = results.filter((r) => r.status === "rejected").length;
          return { success: true, sent, failed, total: targets.length };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
