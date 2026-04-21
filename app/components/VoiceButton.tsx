"use client";

import { useState } from "react";
import NikeSwoosh from "./NikeSwoosh";

// Each entry: [maxHeightPx, animDurationSec, animDelaySec]
// Bars are ordered closest-to-button → outermost
const LEFT_BARS:  [number, number, number][] = [
  [48, 0.52, 0.00],
  [34, 0.68, 0.09],
  [56, 0.47, 0.17],
  [28, 0.73, 0.05],
  [42, 0.55, 0.13],
  [20, 0.61, 0.21],
  [32, 0.58, 0.03],
];

const RIGHT_BARS: [number, number, number][] = [
  [52, 0.50, 0.06],
  [30, 0.66, 0.14],
  [46, 0.49, 0.02],
  [38, 0.71, 0.19],
  [24, 0.57, 0.10],
  [44, 0.53, 0.07],
  [18, 0.63, 0.23],
];

function WaveBar({
  maxHeight,
  duration,
  delay,
  speaking,
}: {
  maxHeight: number;
  duration: number;
  delay: number;
  speaking: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 3,
        height: maxHeight,
        borderRadius: 99,
        backgroundColor: "#C8F000",
        transformOrigin: "center",
        transform: speaking ? "scaleY(1)" : "scaleY(0.12)",
        opacity: speaking ? 1 : 0.22,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        animation: speaking
          ? `waveOscillate ${duration}s ease-in-out ${delay}s infinite alternate`
          : "none",
      }}
    />
  );
}

interface VoiceButtonProps {
  compact?: boolean;
}

export default function VoiceButton({ compact = false }: VoiceButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  // Compact: horizontal waveform anchored to the logo
  if (compact) {
    return (
      <div className="flex items-center gap-[4px]">
        {/* Left waveform — rendered in reverse so bar[0] is closest to button */}
        {[...LEFT_BARS].reverse().map(([h, dur, del], i) => (
          <WaveBar key={`l${i}`} maxHeight={h} duration={dur} delay={del} speaking={speaking} />
        ))}

        {/* Central volt circle */}
        <button
          onClick={() => setSpeaking((s) => !s)}
          aria-label={speaking ? "Stop speaking" : "Start speaking"}
          className="relative z-10 flex items-center justify-center rounded-full transition-all duration-200 mx-2 flex-shrink-0 hover:scale-105 active:scale-95"
          style={{
            width: 72,
            height: 72,
            background: speaking
              ? "rgba(200, 240, 0, 0.55)"
              : "rgba(200, 240, 0, 0.32)",
            border: "1px solid rgba(200, 240, 0, 0.65)",
            backdropFilter: "blur(16px) saturate(200%)",
            WebkitBackdropFilter: "blur(16px) saturate(200%)",
            boxShadow: speaking
              ? "inset 0 1px 0 rgba(255,255,255,0.45), 0 0 0 6px rgba(200,240,0,0.14), 0 0 0 12px rgba(200,240,0,0.07), 0 4px 16px rgba(200,240,0,0.25)"
              : "inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 14px rgba(200,240,0,0.2)",
            animation: speaking ? "breathe 1.4s ease-in-out infinite" : "none",
          }}
        >
          <NikeSwoosh className="w-16 h-auto text-black" />
        </button>

        {/* Right waveform — bar[0] is closest to button */}
        {RIGHT_BARS.map(([h, dur, del], i) => (
          <WaveBar key={`r${i}`} maxHeight={h} duration={dur} delay={del} speaking={speaking} />
        ))}
      </div>
    );
  }

  // Default (full) mode — vertical bars above button
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`flex items-end justify-center gap-[3px] h-6 transition-opacity duration-300 ${speaking ? "opacity-100" : "opacity-0"}`}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-[#C8F000]"
            style={{
              height: "100%",
              transformOrigin: "bottom",
              animation: speaking ? "voiceBar 0.7s ease-in-out infinite alternate" : "none",
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-center">
        {speaking && (
          <>
            <span className="absolute rounded-full" style={{ width: 72, height: 72, background: "rgba(200,240,0,0.22)", border: "1px solid rgba(200,240,0,0.35)", backdropFilter: "blur(8px)", animation: "ringPulse 1.4s ease-out infinite" }} />
            <span className="absolute rounded-full" style={{ width: 72, height: 72, background: "rgba(200,240,0,0.12)", border: "1px solid rgba(200,240,0,0.2)", backdropFilter: "blur(8px)", animation: "ringPulse 1.4s ease-out infinite 0.5s" }} />
          </>
        )}
        <button
          onClick={() => setSpeaking((s) => !s)}
          aria-label={speaking ? "Stop speaking" : "Start speaking"}
          className="relative z-10 flex items-center justify-center rounded-full bg-[#C8F000] shadow-lg"
          style={{ width: 72, height: 72, animation: speaking ? "breathe 1.4s ease-in-out infinite" : "none" }}
        >
          <NikeSwoosh className="w-16 h-auto text-black" />
        </button>
      </div>

      <p
        className={`text-[11px] uppercase tracking-widest transition-colors duration-300 ${speaking ? "text-[#C8F000]" : "text-white/40"}`}
        style={{ fontFamily: "var(--font-barlow-condensed)" }}
      >
        {speaking ? "Listening…" : "Tap to speak"}
      </p>
    </div>
  );
}
