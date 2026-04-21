"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMorphicBar } from "@/app/context/MorphicBarContext";
import OnboardingProgress from "@/app/components/OnboardingProgress";
import BackButton from "@/app/components/BackButton";
import GoogleDrivePicker, { DriveFile } from "@/app/components/GoogleDrivePicker";

type Player = { id: string; name: string; jersey: string; position: string; parentName: string; parentPhone: string };

const EMPTY_PLAYER = (): Player => ({
  id: Math.random().toString(36).slice(2),
  name: "", jersey: "", position: "", parentName: "", parentPhone: "",
});

function parseCSV(csv: string): Player[] {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  const col = (row: string[], keys: string[]): string => {
    for (const k of keys) {
      const i = headers.findIndex((h) => h.includes(k));
      if (i !== -1) return (row[i] ?? "").trim().replace(/^"|"$/g, "");
    }
    return "";
  };
  return lines.slice(1).map((line) => {
    const row = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    return {
      id: Math.random().toString(36).slice(2),
      name: col(row, ["name", "player", "fullname"]) || (col(row, ["first"]) + " " + col(row, ["last"])).trim(),
      jersey: col(row, ["jersey", "number", "num", "#"]),
      position: col(row, ["position", "pos", "role"]),
      parentName: col(row, ["parent", "guardian", "contact"]),
      parentPhone: col(row, ["phone", "mobile", "cell", "tel"]),
    };
  }).filter((p) => p.name.length > 1);
}

export default function RosterPage() {
  const router = useRouter();
  const { setConfig } = useMorphicBar();
  const [dragOver, setDragOver] = useState(false);
  const [players, setPlayers] = useState<Player[]>([EMPTY_PLAYER(), EMPTY_PLAYER(), EMPTY_PLAYER()]);
  const [imported, setImported] = useState<string | null>(null);
  const [importErr, setImportErr] = useState<string | null>(null);

  useEffect(() => {
    setConfig({
      state: "attach",
      context: "Add your players",
      subtext: "Drop a file anywhere · or fill in the table",
      actions: [],
      attachOptions: [
        { id: "drive", label: "Google Drive", icon: "📂" },
        { id: "csv",   label: "Upload CSV",   icon: "📊" },
        { id: "pdf",   label: "Upload PDF",   icon: "📄" },
      ],
    });
  }, [setConfig]);

  const ingestFile = useCallback((file: DriveFile) => {
    setImportErr(null);
    try {
      if (file.mimeType === "application/pdf") {
        setImportErr("PDF parsing coming soon — please use CSV for now.");
        return;
      }
      const parsed = parseCSV(file.content);
      if (parsed.length === 0) {
        setImportErr("Couldn't find player rows. Make sure the CSV has a header row.");
        return;
      }
      setPlayers(parsed);
      setImported(`${file.name} · ${parsed.length} players imported`);
    } catch {
      setImportErr("Failed to parse file. Try a CSV export.");
    }
  }, []);

  const handleLocalFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => ingestFile({ name: f.name, mimeType: f.type || "text/csv", content: ev.target?.result as string });
    reader.readAsText(f);
  }, [ingestFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => ingestFile({ name: f.name, mimeType: f.type || "text/csv", content: ev.target?.result as string });
    reader.readAsText(f);
  }, [ingestFile]);

  const update = (id: string, field: keyof Player, value: string) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  return (
    <div className="flex flex-col px-8 py-10 min-h-full"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {dragOver && (
        <div className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: "rgba(200,240,0,0.12)", backdropFilter: "blur(4px)", border: "3px dashed rgba(200,240,0,0.7)" }}>
          <p className="text-5xl font-black uppercase text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>Drop to Import Roster</p>
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto">
        <BackButton href="/team/create" />
        <OnboardingProgress step={2} />

        <h1 className="text-5xl font-black uppercase tracking-tight text-[#0D1B2E] mt-8 mb-2" style={{ fontFamily: "var(--font-barlow-condensed)" }}>Add Roster</h1>
        <p className="text-[14px] text-gray-500 mb-6" style={{ fontFamily: "var(--font-barlow)" }}>Import from Google Drive, drag a CSV, or fill in the table below.</p>

        <div className="flex items-center gap-3 mb-5">
          <GoogleDrivePicker onFile={ingestFile}>
            {(open, loading) => (
              <button onClick={open} disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{ fontFamily: "var(--font-barlow-condensed)", background: "rgba(200,240,0,0.55)", border: "1px solid rgba(200,240,0,0.75)", backdropFilter: "blur(14px) saturate(180%)", WebkitBackdropFilter: "blur(14px) saturate(180%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 8px rgba(200,240,0,0.22)", color: "#0D1B2E" }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <path d="M6.28 10.5L1.5 19h7l4.78-8.5H6.28z" fill="#0066DA" />
                  <path d="M17.72 10.5H9.22L4.5 19h8.5l4.72-8.5z" fill="#00AC47" />
                  <path d="M12 2L7.28 10.5h9.44L12 2z" fill="#EA4335" />
                </svg>
                {loading ? "Connecting…" : "Import from Google Drive"}
              </button>
            )}
          </GoogleDrivePicker>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02]"
            style={{ fontFamily: "var(--font-barlow-condensed)", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(13,27,46,0.22)", backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)", color: "#0D1B2E" }}>
            <span>📊</span> Upload CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleLocalFile} />
          </label>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest cursor-pointer transition-all hover:scale-[1.02]"
            style={{ fontFamily: "var(--font-barlow-condensed)", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(12px) saturate(140%)", WebkitBackdropFilter: "blur(12px) saturate(140%)", color: "#9ca3af" }}>
            <span>📄</span> Upload PDF
            <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleLocalFile} />
          </label>
        </div>

        {imported && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C8F000]/15 border border-[#C8F000]/30 mb-4">
            <span className="text-[#8db800] text-sm">✓</span>
            <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>{imported}</p>
          </div>
        )}
        {importErr && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 mb-4">
            <span className="text-red-400 text-sm">⚠</span>
            <p className="text-[12px] text-red-600" style={{ fontFamily: "var(--font-barlow)" }}>{importErr}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_2fr] px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            {["Player Name", "#", "Position", "Parent Name", "Parent Phone"].map((h) => (
              <span key={h} className="text-[10px] font-black uppercase tracking-widest text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>{h}</span>
            ))}
          </div>
          {players.map((p) => (
            <div key={p.id} className="grid grid-cols-[2fr_1fr_1.5fr_2fr_2fr] px-4 py-2 border-b border-gray-50 hover:bg-gray-50/50">
              {([ ["name","Alex Johnson","text"], ["jersey","23","text"], ["position","Guard","text"], ["parentName","Sarah Johnson","text"], ["parentPhone","+1 (555) 000-0000","tel"] ] as [keyof Player, string, string][]).map(([field, ph, type]) => (
                <input key={field} type={type} placeholder={ph} value={p[field]}
                  onChange={(e) => update(p.id, field, e.target.value)}
                  className="w-full bg-transparent text-[13px] text-[#0D1B2E] placeholder-gray-300 outline-none py-1 pr-2"
                  style={{ fontFamily: "var(--font-barlow)" }} />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setPlayers((ps) => [...ps, EMPTY_PLAYER()])}
            className="px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-[#0D1B2E] hover:bg-white border border-gray-200 transition-all"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            + Add Row
          </button>
          <button onClick={() => router.push("/team/schedule")}
            className="ml-auto px-8 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
            style={{ fontFamily: "var(--font-barlow-condensed)", background: "rgba(200,240,0,0.55)", border: "1px solid rgba(200,240,0,0.75)", backdropFilter: "blur(14px) saturate(180%)", WebkitBackdropFilter: "blur(14px) saturate(180%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 16px rgba(200,240,0,0.28)", color: "#0D1B2E" }}>
            Continue → Upload Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
