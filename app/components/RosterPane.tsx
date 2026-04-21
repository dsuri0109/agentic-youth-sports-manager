"use client";

import { useState, useEffect } from "react";

export type Player = {
  id: string;
  name: string;
  jersey: string;
  position: string;
  parentName: string;
  parentPhone: string;
};

const EMPTY_PLAYER = (): Player => ({
  id: Math.random().toString(36).slice(2),
  name: "", jersey: "", position: "", parentName: "", parentPhone: "",
});

interface Props {
  isOpen: boolean;
  mode: "add" | "edit";
  initialPlayers?: Player[];
  onSave: (players: Player[]) => void;
  onClose: () => void;
}

const COLS: { key: keyof Player; label: string; placeholder: string; flex: string }[] = [
  { key: "name",        label: "Player Name",   placeholder: "Alex Johnson",        flex: "flex-[2]" },
  { key: "jersey",      label: "#",             placeholder: "23",                  flex: "flex-[0.6]" },
  { key: "position",    label: "Position",      placeholder: "Guard",               flex: "flex-[1.2]" },
  { key: "parentName",  label: "Parent Name",   placeholder: "Sarah Johnson",       flex: "flex-[2]" },
  { key: "parentPhone", label: "Parent Phone",  placeholder: "+1 (555) 000-0000",  flex: "flex-[1.8]" },
];

export default function RosterPane({ isOpen, mode, initialPlayers = [], onSave, onClose }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);

  // Reset when pane opens
  useEffect(() => {
    if (isOpen) {
      setPlayers(
        mode === "edit" && initialPlayers.length > 0
          ? initialPlayers
          : [EMPTY_PLAYER(), EMPTY_PLAYER(), EMPTY_PLAYER()]
      );
    }
  }, [isOpen, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (id: string, field: keyof Player, value: string) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const filledCount = players.filter((p) => p.name.trim().length > 0).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{
          background: "rgba(13,27,46,0.35)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-screen z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: "min(600px, 90vw)",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "-12px 0 48px rgba(0,0,0,0.12)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b border-black/6 flex-shrink-0"
          style={{ background: "#0D1B2E" }}
        >
          <div>
            <h2
              className="text-[18px] font-black uppercase tracking-tight text-white"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              {mode === "edit" ? "Edit Roster" : "Add Roster"}
            </h2>
            <p
              className="text-[11px] uppercase tracking-widest mt-0.5"
              style={{ fontFamily: "var(--font-barlow-condensed)", color: "#C8F000" }}
            >
              {filledCount > 0 ? `${filledCount} player${filledCount !== 1 ? "s" : ""} entered` : "Fill in player details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-black/6 flex-shrink-0 bg-gray-50">
          {COLS.map((col) => (
            <div key={col.key} className={`${col.flex} min-w-0`}>
              <span
                className="text-[10px] font-black uppercase tracking-widest text-gray-400"
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
              >
                {col.label}
              </span>
            </div>
          ))}
          <div className="w-5 flex-shrink-0" /> {/* delete column */}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {players.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-5 py-2 border-b border-gray-50 hover:bg-gray-50/60 group"
            >
              {COLS.map((col) => (
                <input
                  key={col.key}
                  type={col.key === "parentPhone" ? "tel" : "text"}
                  placeholder={col.placeholder}
                  value={p[col.key]}
                  onChange={(e) => update(p.id, col.key, e.target.value)}
                  className={`${col.flex} min-w-0 bg-transparent text-[13px] text-[#0D1B2E] placeholder-gray-300 outline-none py-1.5 rounded focus:bg-white focus:px-2 transition-all`}
                  style={{ fontFamily: "var(--font-barlow)" }}
                  aria-label={`${col.label} row ${i + 1}`}
                />
              ))}
              <button
                onClick={() => setPlayers((ps) => ps.filter((x) => x.id !== p.id))}
                className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Remove row"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-black/6 flex-shrink-0 bg-gray-50/80">
          <button
            onClick={() => setPlayers((ps) => [...ps, EMPTY_PLAYER()])}
            className="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-[#0D1B2E] hover:bg-white border border-gray-200 transition-all"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            + Add Row
          </button>
          <button
            disabled={filledCount === 0}
            onClick={() => {
              const filled = players.filter((p) => p.name.trim().length > 0);
              onSave(filled);
            }}
            className="ml-auto px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              background: filledCount > 0 ? "rgba(200,240,0,0.55)" : "rgba(200,240,0,0.2)",
              border: "1px solid rgba(200,240,0,0.75)",
              backdropFilter: "blur(14px) saturate(180%)",
              WebkitBackdropFilter: "blur(14px) saturate(180%)",
              boxShadow: filledCount > 0 ? "inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 16px rgba(200,240,0,0.28)" : "none",
              color: "#0D1B2E",
            }}
          >
            Save {filledCount > 0 ? `${filledCount} Player${filledCount !== 1 ? "s" : ""}` : "Roster"}
          </button>
        </div>
      </div>
    </>
  );
}
