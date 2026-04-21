"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMorphicBar } from "@/app/context/MorphicBarContext";
import BackButton from "@/app/components/BackButton";
import OnboardingProgress from "@/app/components/OnboardingProgress";

const MOCK_PARENTS = [
  { id: "1", name: "Sarah Johnson",   phone: "+1 (214) 555-0101", player: "Alex Johnson",   sent: false },
  { id: "2", name: "Mike Williams",   phone: "+1 (214) 555-0102", player: "Jordan Williams", sent: false },
  { id: "3", name: "Lisa Chen",       phone: "+1 (214) 555-0103", player: "Tyler Chen",      sent: false },
  { id: "4", name: "David Martinez",  phone: "+1 (214) 555-0104", player: "Sam Martinez",    sent: false },
  { id: "5", name: "Emma Davis",      phone: "+1 (214) 555-0105", player: "Chris Davis",     sent: false },
  { id: "6", name: "James Wilson",    phone: "+1 (214) 555-0106", player: "Pat Wilson",      sent: false },
  { id: "7", name: "Amy Brown",       phone: "+1 (214) 555-0107", player: "Morgan Brown",    sent: false },
  { id: "8", name: "Robert Taylor",   phone: "+1 (214) 555-0108", player: "Casey Taylor",    sent: false },
  { id: "9", name: "Jennifer Anderson", phone: "+1 (214) 555-0109", player: "Riley Anderson", sent: false },
  { id: "10", name: "Chris Thomas",   phone: "+1 (214) 555-0110", player: "Jamie Thomas",    sent: false },
  { id: "11", name: "Patricia Jackson", phone: "+1 (214) 555-0111", player: "Drew Jackson",  sent: false },
  { id: "12", name: "Michael White",  phone: "+1 (214) 555-0112", player: "Avery White",     sent: false },
];

const SMS_PREVIEW = `Hey {parent}! Coach just set up your team portal for the Dallas Renegades U14s. You'll get hotel blocks, schedules & payment links here. Join now → nike.ys/join`;

export default function InvitePage() {
  const router = useRouter();
  const { setConfig } = useMorphicBar();
  const [parents, setParents] = useState(MOCK_PARENTS);
  const [sending, setSending] = useState(false);
  const [allSent, setAllSent] = useState(false);

  const sentCount = parents.filter((p) => p.sent).length;

  useEffect(() => {
    setConfig({
      state: "confirm",
      context: allSent
        ? `All ${parents.length} invites sent!`
        : `Ready to send ${parents.length} invites via SMS`,
      subtext: allSent ? "AI Travel Agent · Done" : "AI Travel Agent · Twilio SMS",
      actions: allSent
        ? [{ id: "done", label: "Go to Dashboard", variant: "volt", icon: "✓", onClick: () => router.push("/team") }]
        : [
            { id: "send",    label: `Send All ${parents.length}`, variant: "volt",    icon: "✉",  onClick: handleSendAll },
            { id: "preview", label: "Preview First",              variant: "outline", onClick: () => {} },
            { id: "edit",    label: "Edit List",                  variant: "ghost",   onClick: () => {} },
          ],
    });
  }, [allSent, parents.length, setConfig, router]);

  function handleSendAll() {
    setSending(true);
    let i = 0;
    const interval = setInterval(() => {
      setParents((ps) => ps.map((p, idx) => (idx === i ? { ...p, sent: true } : p)));
      i++;
      if (i >= MOCK_PARENTS.length) {
        clearInterval(interval);
        setSending(false);
        setAllSent(true);
      }
    }, 120);
  }

  return (
    <div className="flex flex-col px-8 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <BackButton href="/team/schedule" />
        <OnboardingProgress step={4} />

        <h1 className="text-5xl font-black uppercase tracking-tight text-[#0D1B2E] mt-8 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
          Invite Parents
        </h1>
        <p className="text-[14px] text-gray-500 mb-6" style={{ fontFamily: "var(--font-barlow)" }}>
          One click sends personalized SMS invites to all {parents.length} parents via Twilio.
        </p>

        {/* SMS preview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            Message Preview
          </p>
          <div className="bg-[#F5F5F0] rounded-xl px-4 py-3 max-w-xs">
            <p className="text-[12px] text-[#0D1B2E] leading-relaxed" style={{ fontFamily: "var(--font-barlow)" }}>
              {SMS_PREVIEW.replace("{parent}", "Sarah")}
            </p>
          </div>
        </div>

        {/* Parent list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_auto] px-5 py-2.5 border-b border-gray-100 bg-gray-50">
            {["Parent", "Player", "Phone", ""].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>{h}</span>
            ))}
          </div>
          {parents.map((p) => (
            <div key={p.id} className="grid grid-cols-[2fr_2fr_1.5fr_auto] px-5 py-3 border-b border-gray-50 items-center">
              <span className="text-[13px] font-medium text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>{p.name}</span>
              <span className="text-[12px] text-gray-500" style={{ fontFamily: "var(--font-barlow)" }}>{p.player}</span>
              <span className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>{p.phone}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${p.sent ? "text-[#8db800]" : "text-gray-300"}`} style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                {p.sent ? "✓ Sent" : "Pending"}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        {!allSent ? (
          <button
            onClick={handleSendAll}
            disabled={sending}
            className="w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] disabled:opacity-60"
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
            {sending ? `Sending… ${sentCount}/${parents.length}` : `✉ Send All ${parents.length} Invites`}
          </button>
        ) : (
          <button
            onClick={() => router.push("/team")}
            className="w-full py-4 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]"
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
            ✓ All Done → Go to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
