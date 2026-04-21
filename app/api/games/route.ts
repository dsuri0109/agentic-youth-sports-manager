import { NextRequest, NextResponse } from "next/server";
import { replaceGames, getTeamByName, getGamesByTeam } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  const { teamId, teamName, games } = await req.json();

  let resolvedTeamId = teamId as string | null;
  if (!resolvedTeamId && teamName) {
    const team = await getTeamByName(teamName);
    resolvedTeamId = team?.id ?? null;
  }

  if (!resolvedTeamId) {
    return NextResponse.json({ error: "Team not found." }, { status: 400 });
  }

  const saved = await replaceGames(resolvedTeamId, games ?? []);
  return NextResponse.json({ saved: true, count: saved.length, games: saved });
}

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });
  const games = await getGamesByTeam(teamId);
  return NextResponse.json({ games });
}
