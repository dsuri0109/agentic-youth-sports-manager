"use client";

import { useEffect, useRef } from "react";
import { UIMessage } from "ai";
import { useAppChat } from "@/app/context/ChatContext";
import { useTeam } from "@/app/context/TeamContext";
import NikeSwoosh from "@/app/components/NikeSwoosh";

// ── Helpers ────────────────────────────────────────────────────────────────────
function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p) => p.type === "text")
    .map((p) => ("text" in p ? (p.text as string) : ""))
    .join("");
}

// Detect if a message has any successful tool output (for UI refresh)
function hasToolOutput(msg: UIMessage): boolean {
  return msg.parts.some(
    (p) => "state" in p && p.state === "output-available"
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function AiAvatar() {
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C8F000" }}>
      <NikeSwoosh className="w-3.5 h-3.5 text-[#0D1B2E]" />
    </div>
  );
}

function MessageBubble({ msg }: { msg: UIMessage }) {
  const isUser = msg.role === "user";
  const text = getMessageText(msg);
  if (!text.trim()) return null;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2 mb-3`}>
      {!isUser && <div className="mt-0.5 shrink-0"><AiAvatar /></div>}
      <div
        className={`max-w-[78%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
        style={isUser
          ? { fontFamily: "var(--font-barlow)", background: "rgba(200,240,0,0.55)", border: "1px solid rgba(200,240,0,0.7)", color: "#0D1B2E" }
          : { fontFamily: "var(--font-barlow)", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)", color: "#0D1B2E" }
        }
      >
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 mb-3">
      <div className="mt-0.5"><AiAvatar /></div>
      <div className="px-3 py-2 rounded-2xl rounded-tl-sm flex items-center gap-1"
        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
            style={{ animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex items-start gap-2 py-3">
      <div className="mt-0.5 shrink-0"><AiAvatar /></div>
      <div className="px-3 py-2.5 rounded-2xl rounded-tl-sm"
        style={{ fontFamily: "var(--font-barlow)", background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)", color: "#0D1B2E", maxWidth: "82%" }}>
        <p className="text-[13px] font-semibold">Welcome back, Coach.</p>
        <p className="text-[12px] text-gray-500">How can I help you today?</p>
      </div>
    </div>
  );
}

// ── Main ChatPanel ─────────────────────────────────────────────────────────────
export default function ChatPanel() {
  const { messages, input, setInput, send, isLoading, status } = useAppChat();
  const { triggerRefresh } = useTeam();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Trigger UI refresh when AI writes to DB
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && hasToolOutput(lastMsg)) {
      triggerRefresh();
    }
  }, [messages, triggerRefresh]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim()) return;
    send();
  }

  const visibleMessages = messages.filter(
    (m) => (m.role === "user" || m.role === "assistant") && getMessageText(m).trim()
  );
  const isStreaming = status === "streaming" || isLoading;
  const hasMessages = visibleMessages.length > 0 || isStreaming;

  return (
    <div
      className="h-[320px] shrink-0 flex flex-col"
      style={{
        background: "#ffffff",
        borderTop: "3px solid #C8F000",
        boxShadow: "0 -4px 24px rgba(200,240,0,0.12)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-2.5 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#C8F000" }}>
          <NikeSwoosh className="w-3 h-3 text-[#0D1B2E]" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#0D1B2E]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}>
          Nike Youth Sports Assistant
        </span>
        {isStreaming && (
          <span className="text-[10px] uppercase tracking-widest text-gray-400"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}>· Thinking…</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
        {!hasMessages && <WelcomeState />}
        {visibleMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-4 pt-2 shrink-0">
        <form onSubmit={submit} className="flex items-center gap-3 rounded-full px-4 py-2.5"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
          }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Add a player, update the schedule, message parents…"
            className="flex-1 bg-transparent text-[13px] text-[#0D1B2E] placeholder-gray-400 outline-none"
            style={{ fontFamily: "var(--font-barlow)" }}
          />
          <button type="submit" disabled={!input.trim()}
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${input.trim() ? "bg-[#C8F000] text-[#0D1B2E]" : "bg-gray-200 text-gray-400"}`}
            aria-label="Send">
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>

      <style jsx>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
