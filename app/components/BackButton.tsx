"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ href }: { href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 mb-6"
      style={{
        fontFamily: "var(--font-barlow-condensed)",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(13,27,46,0.15)",
        backdropFilter: "blur(12px) saturate(160%)",
        WebkitBackdropFilter: "blur(12px) saturate(160%)",
        color: "#6b7280",
      }}
    >
      <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" aria-hidden="true">
        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}
