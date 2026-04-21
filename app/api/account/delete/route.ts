import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * DELETE /api/account/delete
 * Wipes all data for a team + the auth user, in dependency order.
 * Used for demo resets.
 */
export async function DELETE(req: NextRequest) {
  const { teamId, userId } = await req.json();

  if (!teamId || !userId) {
    return NextResponse.json({ error: "teamId and userId required" }, { status: 400 });
  }

  // Use service role key to bypass RLS for full cleanup
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey)
    : createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  // Delete in dependency order (children before parents)
  const steps = [
    () => db.from("bookings").delete().eq("team_id", teamId),
    () => db.from("action_items").delete().eq("team_id", teamId),
    () => db.from("gmail_connections").delete().eq("team_id", teamId),
    () => db.from("invites").delete().eq("team_id", teamId),
    () => db.from("players").delete().eq("team_id", teamId),
    () => db.from("games").delete().eq("team_id", teamId),
    () => db.from("teams").delete().eq("id", teamId),
  ];

  for (const step of steps) {
    const { error } = await step();
    if (error) {
      console.error("Delete step error:", error.message);
      // Continue — best-effort cleanup
    }
  }

  // Delete the auth user via the admin API
  if (serviceKey) {
    const url = supabaseUrl;
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });
  }

  return NextResponse.json({ success: true });
}
