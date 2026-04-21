import { NextRequest, NextResponse } from "next/server";
import { getGamesByTeam, getPlayersByTeam } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  const { gameId, teamId } = await req.json();

  if (!gameId || !teamId) {
    return NextResponse.json({ error: "gameId and teamId required" }, { status: 400 });
  }

  const [games, players] = await Promise.all([
    getGamesByTeam(teamId),
    getPlayersByTeam(teamId),
  ]);

  const game = games.find((g) => g.id === gameId);
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  let checkIn = "";
  let checkOut = "";

  if (game.date) {
    const gameDate = new Date(game.date);
    // Check-in night before game, check-out day after
    const cin = new Date(gameDate);
    cin.setDate(cin.getDate() - 1);
    const cout = new Date(gameDate);
    cout.setDate(cout.getDate() + 1);
    checkIn = cin.toISOString().split("T")[0];
    checkOut = cout.toISOString().split("T")[0];
  }

  // Default rooms = one per player on roster (user can adjust down)
  const teamSize = players.length;
  const roomCount = Math.max(1, teamSize);

  return NextResponse.json({
    checkIn,
    checkOut,
    city: game.city ?? "",
    venueName: game.venue ?? "",
    roomCount,
    teamSize,
    game,
  });
}
