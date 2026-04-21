"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTeam } from "@/app/context/TeamContext";
import GoogleDrivePicker, { DriveFile } from "@/app/components/GoogleDrivePicker";
import RosterPane, { Player } from "@/app/components/RosterPane";

interface PlayerRow {
  id: string;
  name: string;
  jersey_number: string | null;
  position: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

interface Game {
  id: string;
  opponent: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  type: "game" | "tournament" | "scrimmage";
}

// ── CSV parsers ────────────────────────────────────────────────────────────────
function parseRosterCSV(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const col = (row: string[], keys: string[]) => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.includes(k));
      if (i !== -1) return (row[i] ?? "").trim().replace(/^\"|\"$/g, "");
    }
    return "";
  };
  return lines.slice(1).map((line) => {
    const row = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const first = col(row, ["first"]);
    const last  = col(row, ["last"]);
    return {
      name:          col(row, ["name", "player", "fullname"]) || `${first} ${last}`.trim(),
      jersey_number: col(row, ["jersey", "number", "num", "#"]),
      position:      col(row, ["position", "pos", "role"]),
      parent_name:   col(row, ["parent", "guardian", "contact"]),
      parent_phone:  col(row, ["phone", "mobile", "cell", "tel"]),
    };
  }).filter((p) => p.name.length > 1);
}

function parseScheduleCSV(csv: string) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const col = (row: string[], keys: string[]) => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.includes(k));
      if (i !== -1) return (row[i] ?? "").trim().replace(/^\"|\"$/g, "");
    }
    return "";
  };
  return lines.slice(1).map((line) => {
    const row = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const typeRaw = col(row, ["type"]).toLowerCase();
    const type = (["tournament", "scrimmage"].includes(typeRaw) ? typeRaw : "game") as "game" | "tournament" | "scrimmage";
    return { opponent: col(row, ["opponent", "vs", "team"]), date: col(row, ["date"]), time: col(row, ["time"]), venue: col(row, ["venue", "gym", "arena", "location"]), city: col(row, ["city"]), type };
  }).filter((g) => g.opponent || g.date);
}

// ── Upload button ──────────────────────────────────────────────────────────────
function UploadBtn({ icon, label, onClick, volt }: { icon: React.ReactNode; label: string; onClick: () => void; volt?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all hover:scale-[1.04] active:scale-[0.97]"
      style={{
        background: volt ? "rgba(200,240,0,0.25)" : "rgba(255,255,255,0.9)",
        border: volt ? "1px solid rgba(200,240,0,0.6)" : "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        minWidth: 80,
      }}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-[#0D1B2E]"
        style={{ fontFamily: "var(--font-barlow-condensed)" }}>{label}</span>
    </button>
  );
}

// ── Google Drive icon ──────────────────────────────────────────────────────────
function DriveIcon() {
  return (
    <svg viewBox="0 0 87.3 78" className="w-5 h-5" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0a15.6 15.6 0 003.3 8.55z" fill="#0066DA"/>
      <path d="M43.65 25L29.9 1.2a15.6 15.6 0 00-3.3 3.3L.95 53.5A15.6 15.6 0 000 59.15h27.5z" fill="#00AC47"/>
      <path d="M73.55 76.8a15.6 15.6 0 003.3-3.3l1.6-2.75 7.65-13.25a15.6 15.6 0 001.2-6.35H59.8l5.85 11.75z" fill="#EA4335"/>
      <path d="M43.65 25L57.4 1.2A15.6 15.6 0 0053.45 0H33.85a15.6 15.6 0 00-3.95 1.2z" fill="#00832D"/>
      <path d="M59.8 59.15H27.5l-13.75 23.8a15.6 15.6 0 005.1.85h49.6a15.6 15.6 0 005.1-.85z" fill="#2684FC"/>
      <path d="M73.4 26.45l-13-22.55a15.6 15.6 0 00-3.3-3.3L43.65 25l16.15 34.15h27.45a15.6 15.6 0 00-1.2-6.35z" fill="#FFBA00"/>
    </svg>
  );
}

// ── Empty state with upload actions ───────────────────────────────────────────
function RosterEmptyState({ onDrive, onFile, onManual, driveLoading }: {
  onDrive: () => void; onFile: () => void; onManual: () => void; driveLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
      <span className="text-3xl">👥</span>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>No players yet</p>
        <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>Add your roster</p>
      </div>
      <div className="flex gap-2">
        <UploadBtn icon={<DriveIcon />} label={driveLoading ? "Loading…" : "Drive"} onClick={onDrive} />
        <UploadBtn icon="📄" label="CSV / PDF" onClick={onFile} />
        <UploadBtn icon="✏️" label="Manual" onClick={onManual} volt />
      </div>
    </div>
  );
}

function ScheduleEmptyState({ onDrive, onFile, driveLoading }: {
  onDrive: () => void; onFile: () => void; driveLoading: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
      <span className="text-3xl">📅</span>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>No games scheduled</p>
        <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>Add your schedule</p>
      </div>
      <div className="flex gap-2">
        <UploadBtn icon={<DriveIcon />} label={driveLoading ? "Loading…" : "Drive"} onClick={onDrive} />
        <UploadBtn icon="📄" label="CSV" onClick={onFile} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { teamId, refresh, triggerRefresh } = useTeam();
  const [players, setPlayers]     = useState<PlayerRow[]>([]);
  const [games, setGames]         = useState<Game[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingGames, setLoadingGames]     = useState(false);
  const [paneOpen, setPaneOpen]   = useState(false);

  // File input refs
  const rosterFileRef   = useRef<HTMLInputElement>(null);
  const scheduleFileRef = useRef<HTMLInputElement>(null);
  const rosterDriveRef  = useRef<(() => void) | null>(null);
  const scheduleDriveRef = useRef<(() => void) | null>(null);

  const fetchPlayers = useCallback(async (id: string) => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(`/api/players?teamId=${id}`);
      const data = await res.json();
      setPlayers(data.players ?? []);
    } finally { setLoadingPlayers(false); }
  }, []);

  const fetchGames = useCallback(async (id: string) => {
    setLoadingGames(true);
    try {
      const res = await fetch(`/api/games?teamId=${id}`);
      const data = await res.json();
      setGames(data.games ?? []);
    } finally { setLoadingGames(false); }
  }, []);

  useEffect(() => {
    if (!teamId) return;
    fetchPlayers(teamId);
    fetchGames(teamId);
  }, [teamId, refresh, fetchPlayers, fetchGames]);

  // ── Roster upload handlers ─────────────────────────────────────────────────
  const saveRosterCSV = useCallback(async (content: string) => {
    const players = parseRosterCSV(content);
    await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, players }),
    });
    triggerRefresh();
  }, [teamId, triggerRefresh]);

  const handleRosterDrive = useCallback((file: DriveFile) => {
    if (file.mimeType !== "application/pdf") saveRosterCSV(file.content);
  }, [saveRosterCSV]);

  const handleRosterFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    if (f.type === "application/pdf") return;
    const reader = new FileReader();
    reader.onload = (ev) => saveRosterCSV(ev.target?.result as string);
    reader.readAsText(f);
  }, [saveRosterCSV]);

  const handlePaneSave = useCallback(async (players: Player[]) => {
    setPaneOpen(false);
    const rows = players.map((p) => ({ name: p.name, jersey_number: p.jersey || null, position: p.position || null, parent_name: p.parentName || null, parent_phone: p.parentPhone || null }));
    await fetch("/api/players", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId, players: rows }) });
    triggerRefresh();
  }, [teamId, triggerRefresh]);

  // ── Schedule upload handlers ───────────────────────────────────────────────
  const saveScheduleCSV = useCallback(async (content: string) => {
    const games = parseScheduleCSV(content);
    await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, games }),
    });
    triggerRefresh();
  }, [teamId, triggerRefresh]);

  const handleScheduleDrive = useCallback((file: DriveFile) => {
    if (file.mimeType !== "application/pdf") saveScheduleCSV(file.content);
  }, [saveScheduleCSV]);

  const handleScheduleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => saveScheduleCSV(ev.target?.result as string);
    reader.readAsText(f);
  }, [saveScheduleCSV]);

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={rosterFileRef}   type="file" accept=".csv,text/csv" className="hidden" onChange={handleRosterFile} />
      <input ref={scheduleFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleScheduleFile} />

      {/* Drive pickers */}
      <GoogleDrivePicker onFile={handleRosterDrive}>
        {(open, loading) => { rosterDriveRef.current = open; return loading ? null : null; }}
      </GoogleDrivePicker>
      <GoogleDrivePicker onFile={handleScheduleDrive}>
        {(open, loading) => { scheduleDriveRef.current = open; return loading ? null : null; }}
      </GoogleDrivePicker>

      {/* Roster pane */}
      <RosterPane isOpen={paneOpen} mode="add" initialPlayers={[]} onSave={handlePaneSave} onClose={() => setPaneOpen(false)} />

      <div className="h-full flex flex-col px-4 pt-4 pb-2 gap-3">
        {/* Header */}
        <div className="shrink-0 flex items-baseline gap-3">
          <h1 className="text-[16px] font-black uppercase tracking-widest text-[#0D1B2E]"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}>Team Management</h1>
          {players.length > 0 && (
            <span className="text-[10px] text-gray-400 uppercase tracking-widest"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}>{players.length} players</span>
          )}
        </div>

        {/* Side-by-side panels */}
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">

          {/* Roster */}
          <section className="flex flex-col rounded-2xl overflow-hidden min-h-0"
            style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
                style={{ fontFamily: "var(--font-barlow-condensed)" }}>Roster</span>
              {loadingPlayers
                ? <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>Loading…</span>
                : players.length > 0 && (
                  <button onClick={() => rosterFileRef.current?.click()}
                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#0D1B2E] transition-colors"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}>Replace</button>
                )
              }
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {players.length === 0 && !loadingPlayers ? (
                <RosterEmptyState
                  onDrive={() => rosterDriveRef.current?.()}
                  onFile={() => rosterFileRef.current?.click()}
                  onManual={() => setPaneOpen(true)}
                  driveLoading={false}
                />
              ) : (
                <table className="w-full text-[12px]" style={{ fontFamily: "var(--font-barlow)" }}>
                  <thead className="sticky top-0" style={{ background: "rgba(255,255,255,0.95)" }}>
                    <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      {["#", "Name", "Position", "Parent", "Phone"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400"
                          style={{ fontFamily: "var(--font-barlow-condensed)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-black/[0.02] transition-colors"
                        style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black"
                            style={{ background: "rgba(200,240,0,0.35)", color: "#0D1B2E", fontFamily: "var(--font-barlow-condensed)" }}>
                            {p.jersey_number || i + 1}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-[#0D1B2E]">{p.name}</td>
                        <td className="px-3 py-2 text-gray-500">{p.position || "—"}</td>
                        <td className="px-3 py-2 text-gray-500">{p.parent_name || "—"}</td>
                        <td className="px-3 py-2 text-gray-500">{p.parent_phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Schedule */}
          <section className="flex flex-col rounded-2xl overflow-hidden min-h-0"
            style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
                style={{ fontFamily: "var(--font-barlow-condensed)" }}>Schedule</span>
              {loadingGames
                ? <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>Loading…</span>
                : games.length > 0 && (
                  <button onClick={() => scheduleFileRef.current?.click()}
                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-[#0D1B2E] transition-colors"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}>Replace</button>
                )
              }
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {games.length === 0 && !loadingGames ? (
                <ScheduleEmptyState
                  onDrive={() => scheduleDriveRef.current?.()}
                  onFile={() => scheduleFileRef.current?.click()}
                  driveLoading={false}
                />
              ) : (
                <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                  {games.map((g) => (
                    <div key={g.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-black/[0.02] transition-colors">
                      <div className="flex flex-col items-center justify-center w-9 h-9 rounded-xl shrink-0"
                        style={{ background: "rgba(200,240,0,0.25)", fontFamily: "var(--font-barlow-condensed)" }}>
                        {g.date ? (
                          <>
                            <span className="text-[9px] font-black uppercase text-[#0D1B2E] leading-none">
                              {new Date(g.date).toLocaleString("en-US", { month: "short" })}
                            </span>
                            <span className="text-[14px] font-black text-[#0D1B2E] leading-none">
                              {new Date(g.date).getDate()}
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] font-black text-gray-400">TBD</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-[#0D1B2E] truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                          {g.opponent ? `vs ${g.opponent}` : "Game"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                          {[g.venue, g.city, g.time].filter(Boolean).join(" · ") || "Details TBD"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
