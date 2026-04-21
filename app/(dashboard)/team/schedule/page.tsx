"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMorphicBar } from "@/app/context/MorphicBarContext";
import BackButton from "@/app/components/BackButton";
import OnboardingProgress from "@/app/components/OnboardingProgress";

const MOCK_GAMES = [
  { id: "1", date: "Mar 28",  day: "Sat", opponent: "Houston Heat",       venue: "NRG Arena, Houston TX",       time: "9:00 AM" },
  { id: "2", date: "Mar 28",  day: "Sat", opponent: "Austin Aces",        venue: "NRG Arena, Houston TX",       time: "1:30 PM" },
  { id: "3", date: "Mar 29",  day: "Sun", opponent: "San Antonio Stars",   venue: "NRG Arena, Houston TX",       time: "10:00 AM" },
  { id: "4", date: "Apr 11",  day: "Sat", opponent: "Memphis Grizzlies",   venue: "FedExForum, Memphis TN",      time: "11:00 AM" },
  { id: "5", date: "Apr 12",  day: "Sun", opponent: "Nashville Elite",     venue: "Bridgestone Arena, Nashville TN", time: "2:00 PM" },
];

export default function SchedulePage() {
  const router = useRouter();
  const { setConfig } = useMorphicBar();
  const [parsed, setParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setConfig(
      parsed
        ? {
            state: "done",
            context: `${MOCK_GAMES.length} games found · Hotels being queued`,
            subtext: "AI Travel Agent · Schedule parsed",
            actions: [
              { id: "hotels", label: "Find Hotels", variant: "volt",    onClick: () => router.push("/team/invite") },
              { id: "skip",   label: "Skip for Now", variant: "ghost", onClick: () => router.push("/team/invite") },
            ],
          }
        : {
            state: "attach",
            context: "Attach your tournament schedule",
            subtext: "AI Travel Agent · Ready to parse",
            actions: [],
            attachOptions: [
              { id: "pdf",  label: "Upload PDF",  icon: "📄" },
              { id: "csv",  label: "Upload CSV",  icon: "📊" },
              { id: "link", label: "Paste Link",  icon: "🔗" },
            ],
          }
    );
  }, [parsed, setConfig, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setParsed(true); // simulate parse
  }, []);

  return (
    <div
      className="flex flex-col px-8 py-10 min-h-full"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(200,240,0,0.12)", backdropFilter: "blur(4px)", border: "3px dashed rgba(200,240,0,0.7)" }}>
          <p className="text-5xl font-black uppercase text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            Drop Schedule PDF
          </p>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto">
        <BackButton href="/team/roster" />
        <OnboardingProgress step={3} />

        <h1 className="text-5xl font-black uppercase tracking-tight text-[#0D1B2E] mt-8 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
          Upload Schedule
        </h1>
        <p className="text-[14px] text-gray-500 mb-6" style={{ fontFamily: "var(--font-barlow)" }}>
          Drop your tournament schedule PDF anywhere on this page. We'll extract game dates, venues, and times automatically.
        </p>

        {!parsed ? (
          <div
            className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#C8F000] transition-colors group"
            onClick={() => setParsed(true)}
          >
            <div className="text-5xl">📅</div>
            <p className="text-[14px] font-black uppercase tracking-widest text-gray-500 group-hover:text-[#0D1B2E] transition-colors" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
              Drop Schedule PDF or Click to Upload
            </p>
            <p className="text-[12px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>
              Supports ArbiterSports, Tournament Manager, and standard PDF exports
            </p>
            {/* Demo shortcut */}
            <button
              onClick={(e) => { e.stopPropagation(); setParsed(true); }}
              className="mt-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 hover:border-[#C8F000] hover:text-[#0D1B2E] transition-all"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              Demo: simulate parse →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#C8F000] flex items-center justify-center text-[11px] font-black text-[#0D1B2E]">✓</span>
              <p className="text-[13px] font-black uppercase tracking-widest text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                {MOCK_GAMES.length} Games Parsed
              </p>
            </div>
            {MOCK_GAMES.map((g) => (
              <div key={g.id} className="bg-white rounded-xl border border-gray-100 px-5 py-3.5 flex items-center gap-4">
                <div className="text-center w-12 flex-shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>{g.day}</p>
                  <p className="text-[18px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>{g.date}</p>
                </div>
                <div className="w-px h-10 bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-black text-[#0D1B2E] uppercase tracking-tight" style={{ fontFamily: "var(--font-barlow-condensed)" }}>vs {g.opponent}</p>
                  <p className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>{g.venue} · {g.time}</p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#C8F000]/15 text-[#8db800]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  Hotel TBD
                </span>
              </div>
            ))}
            <button
              onClick={() => router.push("/team/invite")}
              className="mt-2 w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]"
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                background: "rgba(200,240,0,0.55)",
                border: "1px solid rgba(200,240,0,0.75)",
                backdropFilter: "blur(14px) saturate(180%)",
                WebkitBackdropFilter: "blur(14px) saturate(180%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 16px rgba(200,240,0,0.28)",
                color: "#0D1B2E",
              }}
            >
              Continue → Invite Parents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
