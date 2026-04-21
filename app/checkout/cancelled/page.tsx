"use client";

export default function CancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f5f5f0" }}>
      <div
        className="max-w-sm w-full rounded-3xl p-8 text-center flex flex-col items-center gap-4"
        style={{ background: "white", boxShadow: "0 8px 40px rgba(0,0,0,0.1)" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#9ca3af" strokeWidth={2}>
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-black text-[#0D1B2E]" style={{ fontFamily: "sans-serif" }}>
            Payment Cancelled
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            No charge was made. Your room hold is still active — go back to complete payment.
          </p>
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
