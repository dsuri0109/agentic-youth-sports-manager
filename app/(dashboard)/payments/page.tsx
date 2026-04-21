export default function PaymentsPage() {
  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-2 gap-3">
      <div className="shrink-0 flex items-baseline gap-3">
        <h1 className="text-[16px] font-black uppercase tracking-widest text-[#0D1B2E]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}>Finances & Payments</h1>
      </div>
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
        {/* Outstanding */}
        <section className="flex flex-col rounded-2xl overflow-hidden min-h-0"
          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}>Outstanding</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <span className="text-3xl">💳</span>
            <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>No outstanding payments</p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>Track dues, fees, and trip costs per player</p>
          </div>
        </section>

        {/* Summary */}
        <section className="flex flex-col rounded-2xl overflow-hidden min-h-0"
          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}>Budget Summary</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <span className="text-3xl">📊</span>
            <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>No budget set</p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>Set a trip budget and track spending</p>
          </div>
        </section>
      </div>
    </div>
  );
}
