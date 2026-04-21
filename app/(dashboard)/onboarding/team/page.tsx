"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMorphicBar } from "@/app/context/MorphicBarContext";
import OnboardingProgress from "@/app/components/OnboardingProgress";

const SPORTS = ["Basketball", "Soccer", "Baseball", "Softball", "Volleyball", "Lacrosse", "Hockey", "Football", "Swimming", "Track"];
const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18", "U19+", "Adult"];

export default function CreateTeamPage() {
  const router = useRouter();
  const { setConfig } = useMorphicBar();

  const [form, setForm] = useState({ name: "", sport: "", ageGroup: "", location: "" });

  // Set morphic zone to CHOOSE state
  useEffect(() => {
    setConfig({
      state: "choose",
      context: "How do you want to add your schedule?",
      subtext: "AI Travel Agent · Ready",
      actions: [
        { id: "league", label: "Connect League", variant: "volt", onClick: () => router.push("/onboarding/roster") },
        { id: "upload", label: "Upload My Own",  variant: "outline", onClick: () => router.push("/onboarding/roster") },
      ],
      choiceA: {
        label: "Connect League",
        description: "Sync from ArbiterSports, PlayMetrics",
        icon: "🔗",
      },
      choiceB: {
        label: "Upload My Own",
        description: "CSV, PDF or paste a schedule",
        icon: "📄",
      },
    });
  }, [setConfig, router]);

  const valid = form.name.trim() && form.sport && form.ageGroup;

  return (
    <div className="flex flex-col items-center px-8 py-10">
      <div className="w-full max-w-xl">
        <OnboardingProgress step={1} />

        <h1
          className="text-5xl font-black uppercase tracking-tight text-[#0D1B2E] mt-8 mb-2"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          Create Team
        </h1>
        <p className="text-[14px] text-gray-500 mb-8" style={{ fontFamily: "var(--font-barlow)" }}>
          Name your team, pick your sport and age group — takes 30 seconds.
        </p>

        <div className="flex flex-col gap-4">
          {/* Team Name */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
              Team Name
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas Renegades"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-[#0D1B2E] placeholder-gray-400 outline-none focus:border-[#C8F000] focus:ring-2 focus:ring-[#C8F000]/20 transition-all"
              style={{ fontFamily: "var(--font-barlow)" }}
            />
          </div>

          {/* Sport + Age Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                Sport
              </label>
              <select
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-[#0D1B2E] outline-none focus:border-[#C8F000] focus:ring-2 focus:ring-[#C8F000]/20 transition-all appearance-none"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                <option value="">Select sport…</option>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                Age Group
              </label>
              <select
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-[#0D1B2E] outline-none focus:border-[#C8F000] focus:ring-2 focus:ring-[#C8F000]/20 transition-all appearance-none"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                <option value="">Select age…</option>
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
              Home City
            </label>
            <input
              type="text"
              placeholder="e.g. Dallas, TX"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-[14px] text-[#0D1B2E] placeholder-gray-400 outline-none focus:border-[#C8F000] focus:ring-2 focus:ring-[#C8F000]/20 transition-all"
              style={{ fontFamily: "var(--font-barlow)" }}
            />
          </div>

          {/* CTA */}
          <button
            disabled={!valid}
            onClick={() => router.push("/onboarding/roster")}
            className="mt-2 w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              background: valid ? "rgba(200,240,0,0.55)" : "rgba(200,240,0,0.2)",
              border: "1px solid rgba(200,240,0,0.75)",
              backdropFilter: "blur(14px) saturate(180%)",
              WebkitBackdropFilter: "blur(14px) saturate(180%)",
              boxShadow: valid ? "inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 16px rgba(200,240,0,0.28)" : "none",
              color: "#0D1B2E",
            }}
          >
            Continue → Add Roster
          </button>
        </div>
      </div>
    </div>
  );
}
