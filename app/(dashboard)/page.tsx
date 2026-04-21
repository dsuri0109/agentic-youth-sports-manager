"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTeam } from "@/app/context/TeamContext";

interface Booking {
  id: string;
  hotel: string;
  city: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  pointsEarned: number;
  gameOpponent: string;
}

interface Game {
  id: string;
  opponent: string | null;
  date: string | null;
  city: string | null;
  venue: string | null;
  type: string;
}

interface ActionItem {
  id: string;
  type: string;
  summary: string;
  email_from?: string;
  status: string;
}

function fmtUTC(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  reschedule_request: { label: "Reschedule", bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
  new_game:           { label: "New Game",   bg: "rgba(34,197,94,0.12)",   text: "#16a34a" },
  league_admin:       { label: "League",     bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
  pickup_update:      { label: "Pickup",     bg: "rgba(234,179,8,0.12)",   text: "#ca8a04" },
  other:              { label: "Other",      bg: "rgba(107,114,128,0.12)", text: "#6b7280" },
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  border: "1px solid rgba(0,0,0,0.07)",
  borderRadius: 14,
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#9ca3af",
};

export default function DashboardPage() {
  const { teamId, refresh } = useTeam();
  const router = useRouter();

  const [totalPoints, setTotalPoints]   = useState<number>(0);
  const [actionItems, setActionItems]   = useState<ActionItem[]>([]);
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [games, setGames]               = useState<Game[]>([]);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/bookings?teamId=${teamId}`)
      .then(r => r.json())
      .then((d: { bookings?: Array<{ points_earned?: number; id: string; hotel: string; city: string; check_in: string; check_out: string; rooms: number; game_opponent: string }> }) => {
        const rows = d.bookings ?? [];
        setTotalPoints(rows.reduce((acc, b) => acc + (b.points_earned ?? 0), 0));
        setBookings(rows.map(b => ({
          id: b.id, hotel: b.hotel, city: b.city,
          checkIn: b.check_in, checkOut: b.check_out,
          rooms: b.rooms, pointsEarned: b.points_earned ?? 0,
          gameOpponent: b.game_opponent,
        })));
      })
      .catch(() => {});
  }, [teamId, refresh]);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/gmail/poll?teamId=${teamId}`)
      .then(r => r.json())
      .then((d: { items?: ActionItem[] }) => setActionItems(d.items ?? []))
      .catch(() => {});
  }, [teamId, refresh]);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/games?teamId=${teamId}`)
      .then(r => r.json())
      .then((d: { games?: Game[] }) => setGames(d.games ?? []))
      .catch(() => {});
  }, [teamId, refresh]);

  const pendingItems = actionItems.filter(i => i.status === "pending").slice(0, 3);
  const bookedOpponents = new Set(bookings.map(b => b.gameOpponent));
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const unbookedGames = games
    .filter(g => g.opponent && g.date && new Date(g.date) >= today && !bookedOpponents.has(g.opponent))
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 2);

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-hidden" style={{ background: "#F5F5F0", fontFamily: "var(--font-barlow)" }}>

      {/* ── Row 1: Rewards (compact horizontal) ───────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 gap-6" style={cardStyle}>
        <div className="flex items-center gap-4">
          <div>
            <p style={labelStyle}>Nike Rewards</p>
            <p className="text-[22px] font-black leading-none tracking-tight text-[#0D1B2E]"
               style={{ fontFamily: "var(--font-barlow-condensed)", marginTop: 2 }}>
              {(totalPoints || 2450).toLocaleString()} <span className="text-[14px]">PTS</span>
            </p>
          </div>
          <p className="text-[11px] text-gray-400 hidden sm:block">Earned from team hotel bookings</p>
        </div>
        <a
          href="https://www.nike.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
          style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E", textDecoration: "none" }}
        >
          Redeem on Nike.com
        </a>
      </div>

      {/* ── Row 2: Two columns ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-3 gap-3">

        {/* ── LEFT: Action Items ───────────────────────────────────────────── */}
        <div className="col-span-1 flex flex-col min-h-0 overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={labelStyle}>Action Items</p>
            <button
              onClick={() => router.push("/action-items")}
              className="text-[9px] uppercase tracking-widest font-black text-[#0D1B2E] hover:opacity-50 transition-opacity"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              View All →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2">
            {pendingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-1 text-center py-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center mb-1" style={{ background: "rgba(200,240,0,0.2)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0D1B2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-[#0D1B2E]">All caught up</p>
                <p className="text-[10px] text-gray-400">No pending items</p>
              </div>
            ) : pendingItems.map(item => {
              const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
              return (
                <div key={item.id} className="rounded-lg p-2.5" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <span className="inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full mb-1.5"
                        style={{ background: cfg.bg, color: cfg.text }}>
                    {cfg.label}
                  </span>
                  <p className="text-[11px] font-semibold text-[#0D1B2E] leading-snug line-clamp-2">
                    {item.summary}
                  </p>
                  {item.email_from && (
                    <p className="text-[9px] text-gray-400 mt-1 truncate">{item.email_from}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Stays Overview ────────────────────────────────────────── */}
        <div className="col-span-2 flex flex-col min-h-0 overflow-hidden" style={cardStyle}>
          <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={labelStyle}>Stays Overview</p>
            <button
              onClick={() => router.push("/stays")}
              className="text-[9px] uppercase tracking-widest font-black text-[#0D1B2E] hover:opacity-50 transition-opacity"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              Manage Stays →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Upcoming Bookings */}
            <div className="px-4 pt-3 pb-2">
              <p style={{ ...labelStyle, marginBottom: 8 }}>Upcoming Bookings</p>
              {bookings.length === 0 ? (
                <div className="rounded-lg px-4 py-3 text-center" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <p className="text-[11px] font-semibold text-[#0D1B2E]">No bookings yet</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Book hotels for upcoming games to earn Nike Rewards.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {bookings.map(b => (
                    <div key={b.id} className="rounded-lg px-3 py-2.5 flex items-center gap-3"
                         style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-wide text-[#0D1B2E] truncate"
                           style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                          {b.hotel}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {b.city}{b.gameOpponent ? ` · vs ${b.gameOpponent}` : ""} · {fmtUTC(b.checkIn)}–{fmtUTC(b.checkOut)} · {b.rooms}rm
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.pointsEarned > 0 && (
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(200,240,0,0.4)", color: "#0D1B2E" }}>
                            +{b.pointsEarned.toLocaleString()} PTS
                          </span>
                        )}
                        <button className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md"
                                style={{ fontFamily: "var(--font-barlow-condensed)", background: "#0D1B2E", color: "#fff" }}>
                          Manage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-4 my-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />

            {/* Needs Hotel */}
            <div className="px-4 pb-3">
              <p style={{ ...labelStyle, marginBottom: 8 }}>
                Needs Hotel <span style={{ color: "#d1d5db" }}>· Next 2 Games</span>
              </p>
              {unbookedGames.length === 0 ? (
                <div className="rounded-lg px-4 py-3 text-center" style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.05)" }}>
                  <p className="text-[11px] font-semibold text-[#0D1B2E]">All upcoming games have hotels</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {unbookedGames.map(g => (
                    <div key={g.id} className="rounded-lg px-3 py-2.5 flex items-center gap-3"
                         style={{ background: "rgba(200,240,0,0.06)", border: "1px solid rgba(200,240,0,0.25)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-wide text-[#0D1B2E] truncate"
                           style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                          vs {g.opponent ?? "TBD"}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {g.date ? fmtUTC(g.date) : "Date TBD"}{g.city ? ` · ${g.city}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/stays")}
                        className="shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
