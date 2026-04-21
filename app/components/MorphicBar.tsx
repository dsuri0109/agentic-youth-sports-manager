"use client";

import VoiceButton from "./VoiceButton";
import { useAppChat } from "../context/ChatContext";

export default function MorphicBar() {
  const { input, setInput, send } = useAppChat();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    send();
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/30"
      style={{
        animation: "slideUp 0.35s ease-out both",
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Voice button — floats centered above bar */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-[62%] flex flex-col items-center gap-2">
        <VoiceButton compact />
        <span className="text-[9px] uppercase tracking-[0.15em] text-[#8db800]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}>
          Tap to speak
        </span>
      </div>

      <div className="px-6 pt-10 pb-4">
        <form
          onSubmit={submit}
          className="flex items-center gap-3 rounded-full px-5 py-3"
          style={{
            background: "rgba(245,245,240,0.6)",
            border: "1px solid rgba(0,0,0,0.08)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-[13px] text-[#0D1B2E] placeholder-gray-400 outline-none"
            style={{ fontFamily: "var(--font-barlow)" }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              input.trim() ? "bg-[#C8F000] text-[#0D1B2E]" : "bg-gray-200 text-gray-400"
            }`}
            aria-label="Send"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
