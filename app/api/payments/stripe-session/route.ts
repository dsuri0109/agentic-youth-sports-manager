import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { hotelName, checkIn, checkOut, rooms, nikeRate, nights, payerName, payerEmail } =
    await req.json();

  if (!hotelName || !checkIn || !checkOut || !rooms || !nikeRate || !nights) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const totalAmount = Math.round(nikeRate * rooms * nights * 100); // cents

  // No Stripe key — return mock checkout URL
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({
      url: `${APP_URL}/checkout/mock?hotel=${encodeURIComponent(hotelName)}&total=${totalAmount}&checkIn=${checkIn}&checkOut=${checkOut}&rooms=${rooms}`,
      mock: true,
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "link"],
    customer_email: payerEmail ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${hotelName} — Team Hotel Block`,
            description: `${rooms} room${rooms !== 1 ? "s" : ""} · ${checkIn} → ${checkOut} (${nights} night${nights !== 1 ? "s" : ""}) · Nike Rate`,
          },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      hotelName,
      checkIn,
      checkOut,
      rooms: String(rooms),
      nights: String(nights),
      payerName: payerName ?? "",
    },
    success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/checkout/cancelled`,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
