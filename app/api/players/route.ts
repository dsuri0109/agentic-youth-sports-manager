import { NextRequest, NextResponse } from "next/server";
import { replacePlayers, getTeamByName, getPlayersByTeam, getMostRecentTeam, getMostRecentTeamByUser } from "@/app/lib/db";
import { createCookieSupabase } from "@/app/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { teamId, teamName, players } = await req.json();

  // Get authenticated user
  const supabase = await createCookieSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Resolve team ID
  let resolvedTeamId = teamId as string | null;
  if (!resolvedTeamId && teamName) {
    const team = await getTeamByName(teamName, userId ?? undefined);
    resolvedTeamId = team?.id ?? null;
  }
  if (!resolvedTeamId) {
    const recent = userId
      ? await getMostRecentTeamByUser(userId)
      : await getMostRecentTeam();
    resolvedTeamId = recent?.id ?? null;
  }

  if (!resolvedTeamId) {
    return NextResponse.json({ error: "Team not found. Save team details first." }, { status: 400 });
  }

  const saved = await replacePlayers(resolvedTeamId, players ?? []);
  return NextResponse.json({ saved: true, count: saved.length, players: saved });
}

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });
  const players = await getPlayersByTeam(teamId);
  return NextResponse.json({ players });
}
