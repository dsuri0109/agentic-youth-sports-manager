"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f5f5f0" }}>
      <div
        className="max-w-sm w-full rounded-3xl p-8 text-center flex flex-col items-center gap-4"
        style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(200,240,0,0.2)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#5a9400" strokeWidth={2}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-black text-[#0D1B2E]" style={{ fontFamily: "sans-serif" }}>
            Payment Confirmed
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            Your room has been reserved. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>
        {sessionId && (
          <p className="text-[10px] text-gray-300 font-mono break-all">
            {sessionId}
          </p>
        )}
        <div
          className="w-full rounded-xl p-3 text-[11px] text-center"
          style={{ background: "rgba(200,240,0,0.12)", color: "#5a9400" }}
        >
          This was a <strong>test payment</strong>. No real charge was made.
        </div>
        <button
          onClick={() => window.close()}
          className="w-full py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest"
          style={{ background: "#0D1B2E", color: "#C8F000" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
