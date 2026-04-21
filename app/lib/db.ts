import { createServerSupabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  sport: string | null;
  age_group: string | null;
  home_city: string | null;
  logo_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  jersey_number: string | null;
  position: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  team_id: string;
  opponent: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  type: "game" | "tournament" | "scrimmage";
  created_at: string;
}

export interface Invite {
  id: string;
  player_id: string;
  team_id: string;
  status: "pending" | "sent" | "accepted" | "declined";
  sent_at: string | null;
  accepted_at: string | null;
}

// ── Team operations ────────────────────────────────────────────────────────────

export async function upsertTeam(data: {
  name?: string;
  sport?: string;
  age_group?: string;
  home_city?: string;
  user_id?: string;
}): Promise<Team | null> {
  if (!data.name) return null;
  const db = createServerSupabase();
  const updated_at = new Date().toISOString();

  // If user is logged in, update their existing team rather than creating a new one
  if (data.user_id) {
    const existing = await getMostRecentTeamByUser(data.user_id);
    if (existing) {
      const { data: team, error } = await db
        .from("teams")
        .update({ ...data, updated_at })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) { console.error("upsertTeam update:", error.message); return null; }
      return team as Team;
    }
    // No existing team — insert fresh
    const { data: team, error } = await db
      .from("teams")
      .insert({ ...data, updated_at })
      .select()
      .single();
    if (error) { console.error("upsertTeam insert:", error.message); return null; }
    return team as Team;
  }

  // No user_id — fall back to upsert by name
  const { data: team, error } = await db
    .from("teams")
    .upsert({ ...data, updated_at }, { onConflict: "name" })
    .select()
    .single();
  if (error) { console.error("upsertTeam:", error.message); return null; }
  return team as Team;
}

export async function getTeamByName(name: string, userId?: string): Promise<Team | null> {
  const db = createServerSupabase();
  let query = db.from("teams").select("*").eq("name", name);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query.single();
  return (data as Team) ?? null;
}

export async function getTeamsByUser(userId: string): Promise<Team[]> {
  const db = createServerSupabase();
  const { data } = await db
    .from("teams")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data as Team[]) ?? [];
}

export async function getMostRecentTeamByUser(userId: string): Promise<Team | null> {
  const db = createServerSupabase();
  const { data } = await db
    .from("teams")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  return (data as Team) ?? null;
}

export async function getMostRecentTeam(): Promise<Team | null> {
  const db = createServerSupabase();
  const { data } = await db
    .from("teams")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  return (data as Team) ?? null;
}

// ── Player operations ──────────────────────────────────────────────────────────

export async function replacePlayers(
  teamId: string,
  players: Array<{
    name: string;
    jersey_number?: string;
    position?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
  }>
): Promise<Player[]> {
  const db = createServerSupabase();
  await db.from("players").delete().eq("team_id", teamId);
  if (players.length === 0) return [];
  const rows = players.map((p) => ({ ...p, team_id: teamId }));
  const { data, error } = await db.from("players").insert(rows).select();
  if (error) { console.error("replacePlayers:", error.message); return []; }
  return (data as Player[]) ?? [];
}

export async function getPlayersByTeam(teamId: string): Promise<Player[]> {
  const db = createServerSupabase();
  const { data } = await db.from("players").select("*").eq("team_id", teamId).order("created_at");
  return (data as Player[]) ?? [];
}

// ── Game operations ────────────────────────────────────────────────────────────

export async function replaceGames(
  teamId: string,
  games: Array<{
    opponent?: string;
    date?: string;
    time?: string;
    venue?: string;
    city?: string;
    type?: "game" | "tournament" | "scrimmage";
  }>
): Promise<Game[]> {
  const db = createServerSupabase();
  await db.from("games").delete().eq("team_id", teamId);
  if (games.length === 0) return [];
  const rows = games.map((g) => ({ ...g, team_id: teamId }));
  const { data, error } = await db.from("games").insert(rows).select();
  if (error) { console.error("replaceGames:", error.message); return []; }
  return (data as Game[]) ?? [];
}

export async function getGamesByTeam(teamId: string): Promise<Game[]> {
  const db = createServerSupabase();
  const { data } = await db.from("games").select("*").eq("team_id", teamId).order("date");
  return (data as Game[]) ?? [];
}

// ── Invite operations ──────────────────────────────────────────────────────────

export async function createInvites(teamId: string, playerIds: string[]): Promise<Invite[]> {
  const db = createServerSupabase();
  const rows = playerIds.map((pid) => ({
    player_id: pid,
    team_id: teamId,
    status: "pending" as const,
  }));
  const { data, error } = await db.from("invites").insert(rows).select();
  if (error) { console.error("createInvites:", error.message); return []; }
  return (data as Invite[]) ?? [];
}
