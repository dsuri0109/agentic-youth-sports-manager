import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";

const WHATSAPP_FROM = "whatsapp:+14155238886";

export async function POST(req: NextRequest) {
  const { to } = await req.json();

  const sid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const token = process.env.TWILIO_AUTH_TOKEN ?? "";

  if (!sid || !token) {
    return NextResponse.json({ error: "Twilio env vars missing" }, { status: 400 });
  }

  const digits = to.replace(/\D/g, "");
  const normalized = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  const waTo = `whatsapp:${normalized}`;

  console.log(`[test-whatsapp] ${WHATSAPP_FROM} → ${waTo}`);

  try {
    const client = Twilio(sid, token);
    const msg = await client.messages.create({
      body: "Nike Youth Sports: test WhatsApp message. Payment links will be sent via WhatsApp!",
      from: WHATSAPP_FROM,
      to: waTo,
    });
    return NextResponse.json({ ok: true, sid: msg.sid, status: msg.status, from: WHATSAPP_FROM, to: waTo });
  } catch (err: unknown) {
    const e = err as { message?: string; code?: number; moreInfo?: string };
    console.error("[test-whatsapp] error:", e);
    return NextResponse.json({ ok: false, error: e.message, code: e.code, moreInfo: e.moreInfo }, { status: 500 });
  }
}
