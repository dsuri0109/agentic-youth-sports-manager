import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";
import { getPlayersByTeam } from "@/app/lib/db";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const WHATSAPP_FROM = "whatsapp:+14155238886";

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function POST(req: NextRequest) {
  const { teamId, hotelName, checkIn, checkOut, rooms, gameOpponent, gameCity } = await req.json();

  if (!teamId || !hotelName || !checkIn || !checkOut) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const twilioReady = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
  if (!twilioReady) {
    return NextResponse.json({ sent: 0, mock: true });
  }

  const players = await getPlayersByTeam(teamId);
  const parents = players.filter((p) => p.parent_phone);

  const checkInFmt = new Date(checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const checkOutFmt = new Date(checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const results = await Promise.allSettled(
    parents.map(async (p) => {
      const firstName = (p.parent_name ?? "").split(" ")[0];
      const body =
        `✅ Booking confirmed! Hi ${firstName} — the team hotel at ${hotelName} is locked in` +
        (gameOpponent ? ` for the game vs ${gameOpponent}` : "") +
        `${gameCity ? ` in ${gameCity}` : ""}. ` +
        `Check-in: ${checkInFmt} · Check-out: ${checkOutFmt} · ${rooms} room${rooms !== 1 ? "s" : ""}. See you there! 🏨`;

      const waTo = `whatsapp:${toE164(p.parent_phone!)}`;
      const msg = await client.messages.create({ body, from: WHATSAPP_FROM, to: waTo });
      console.log(`[confirm] ${waTo} → ${msg.sid} ${msg.status}`);
      return { phone: waTo, sid: msg.sid };
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ sent, failed, total: parents.length });
}
