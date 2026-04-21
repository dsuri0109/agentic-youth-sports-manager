import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/supabase";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const db = createServerSupabase();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { teamId, hotel, city, checkIn, checkOut, rooms, pointsEarned, gameOpponent } = body;

  if (!teamId || !hotel || !checkIn || !checkOut) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = createServerSupabase();
  const { data, error } = await db
    .from("bookings")
    .insert({
      team_id: teamId,
      hotel,
      city: city ?? "",
      check_in: checkIn,
      check_out: checkOut,
      rooms: rooms ?? 1,
      points_earned: pointsEarned ?? 0,
      game_opponent: gameOpponent ?? "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ booking: data });
}
