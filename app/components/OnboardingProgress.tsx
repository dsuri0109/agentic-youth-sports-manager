const STEPS = [
  { n: 1, label: "Team" },
  { n: 2, label: "Roster" },
  { n: 3, label: "Schedule" },
  { n: 4, label: "Invites" },
];

export default function OnboardingProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map(({ n, label }, i) => {
        const done    = n < step;
        const active  = n === step;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  done
                    ? "bg-[#C8F000] text-[#0D1B2E]"
                    : active
                    ? "bg-[#0D1B2E] text-white ring-2 ring-[#C8F000] ring-offset-2"
                    : "bg-gray-100 text-gray-400"
                }`}
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
              >
                {done ? "✓" : n}
              </div>
              <span
                className={`text-[9px] uppercase tracking-widest ${active ? "text-[#0D1B2E] font-black" : "text-gray-400"}`}
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 h-px mb-4 mx-1 ${done ? "bg-[#C8F000]" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
