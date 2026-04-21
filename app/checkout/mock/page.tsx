"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function MockCheckoutContent() {
  const params = useSearchParams();
  const hotel = params.get("hotel") ?? "Hotel";
  const total = params.get("total") ?? "0";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const rooms = params.get("rooms") ?? "1";
  const forName = params.get("for") ?? "";
  const dollars = (parseInt(total) / 100).toFixed(2);

  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  function handlePay() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPaid(true);
    }, 1500);
  }

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f5f5f0" }}>
        <div className="max-w-sm w-full rounded-3xl p-8 text-center flex flex-col items-center gap-4" style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(200,240,0,0.2)" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#5a9400" strokeWidth={2}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-[22px] font-black text-[#0D1B2E]">Payment Confirmed</h1>
            <p className="text-[13px] text-gray-500 mt-1">Room reserved at {hotel}. See you there!</p>
          </div>
          <div className="w-full rounded-xl p-3 text-[11px] text-center" style={{ background: "rgba(200,240,0,0.12)", color: "#5a9400" }}>
            This was a <strong>demo payment</strong>. No real charge was made.
          </div>
          <button onClick={() => window.close()} className="w-full py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest" style={{ background: "#0D1B2E", color: "#C8F000" }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f5f5f0" }}>
      <div className="max-w-sm w-full flex flex-col gap-4">
        {/* Demo banner */}
        <div className="rounded-xl px-4 py-2 text-center text-[10px] font-bold" style={{ background: "rgba(200,240,0,0.25)", color: "#5a9400" }}>
          SANDBOX · No real payment will be processed
        </div>

        {/* Summary */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Order Summary</p>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[14px] font-black text-[#0D1B2E]">{hotel}</p>
              {forName && <p className="text-[11px] text-gray-400">Room for {forName}</p>}
              {checkIn && checkOut && <p className="text-[11px] text-gray-400">{checkIn} → {checkOut} · {rooms} room{parseInt(rooms) !== 1 ? "s" : ""}</p>}
            </div>
            <p className="text-[20px] font-black text-[#0D1B2E] shrink-0">${dollars}</p>
          </div>
        </div>

        {/* Payment form */}
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Payment Details</p>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider">Card Number</label>
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border text-[13px] font-mono outline-none focus:border-[#C8F000]"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">Expiry</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-[13px] font-mono outline-none" style={{ borderColor: "rgba(0,0,0,0.12)" }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 uppercase tracking-wider">CVC</label>
              <input value={cvc} onChange={(e) => setCvc(e.target.value)} className="w-full px-3 py-2 rounded-xl border text-[13px] font-mono outline-none" style={{ borderColor: "rgba(0,0,0,0.12)" }} />
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:scale-[1.02]"
            style={{ background: "#0D1B2E", color: "#C8F000" }}
          >
            {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {loading ? "Processing…" : `Pay $${dollars}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense>
      <MockCheckoutContent />
    </Suspense>
  );
}
