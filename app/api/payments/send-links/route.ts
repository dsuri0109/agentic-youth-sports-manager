import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// WhatsApp sandbox number is always this for Twilio sandbox
const WHATSAPP_FROM = "whatsapp:+14155238886";

// Normalize any US phone format to E.164 (+1XXXXXXXXXX)
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

interface Parent {
  playerName: string;
  parentName: string;
  phone: string;
  email?: string;
  amountCents: number;
}

async function createPaymentLink(
  parent: Parent,
  hotelName: string,
  checkIn: string,
  checkOut: string,
  nights: number
): Promise<string> {
  if (!STRIPE_SECRET_KEY) {
    return `${APP_URL}/checkout/mock?for=${encodeURIComponent(parent.parentName)}&amount=${parent.amountCents}&hotel=${encodeURIComponent(hotelName)}`;
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "link"],
    customer_email: parent.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${hotelName} — Team Hotel Room`,
            description: `${parent.playerName}'s room · ${checkIn} → ${checkOut} (${nights} night${nights !== 1 ? "s" : ""}) · Nike Rate`,
          },
          unit_amount: parent.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      parentName: parent.parentName,
      playerName: parent.playerName,
      hotelName,
      checkIn,
      checkOut,
    },
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout/cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
  });

  return session.url!;
}

export async function POST(req: NextRequest) {
  const { parents, hotelName, checkIn, checkOut, nights } = await req.json() as {
    parents: Parent[];
    hotelName: string;
    checkIn: string;
    checkOut: string;
    nights: number;
  };

  if (!parents?.length || !hotelName || !checkIn || !checkOut || !nights) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const twilioReady = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN);
  const client = twilioReady ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;

  const results = await Promise.allSettled(
    parents.map(async (parent) => {
      const paymentUrl = await createPaymentLink(parent, hotelName, checkIn, checkOut, nights);
      const dollars = (parent.amountCents / 100).toFixed(0);
      const deadlineTime = new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });

      const body =
        `Hi ${parent.parentName.split(" ")[0]}! Your coach reserved a room at ${hotelName} for ${parent.playerName}'s game. ` +
        `Your share: $${dollars}. Room held until ${deadlineTime}. Pay here: ${paymentUrl}`;

      if (client) {
        const normalizedTo = toE164(parent.phone);
        const waTo = `whatsapp:${normalizedTo}`;
        console.log(`[WhatsApp] ${WHATSAPP_FROM} → ${waTo}`);
        const msg = await client.messages.create({ body, from: WHATSAPP_FROM, to: waTo });
        console.log(`[WhatsApp] SID: ${msg.sid} status: ${msg.status}`);
        return { parentName: parent.parentName, phone: normalizedTo, sent: true, paymentUrl, body };
      } else {
        return { parentName: parent.parentName, phone: parent.phone, sent: false, mock: true, paymentUrl, body };
      }
    })
  );

  const sent = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { parentName: parents[i].parentName, phone: parents[i].phone, sent: false, mock: false, error: (r.reason as Error)?.message }
  );

  return NextResponse.json({
    sent,
    successCount: sent.filter((s) => s.sent || s.mock).length,
    twilioEnabled: twilioReady,
    channel: "whatsapp",
    holdUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  });
}
