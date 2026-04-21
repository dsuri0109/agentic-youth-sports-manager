import { NextResponse } from "next/server";
import { getMostRecentTeamByUser, upsertTeam } from "@/app/lib/db";
import { createCookieSupabase } from "@/app/lib/supabase-server";

export async function GET() {
  const supabase = await createCookieSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ team: null });

  let team = await getMostRecentTeamByUser(session.user.id);

  // Auto-create a default team for new/reset users so the app is always ready
  if (!team) {
    const name = session.user.user_metadata?.full_name ?? session.user.email ?? "My Team";
    team = await upsertTeam({ name: `${name}'s Team`, user_id: session.user.id });
  }

  return NextResponse.json({ team });
}
