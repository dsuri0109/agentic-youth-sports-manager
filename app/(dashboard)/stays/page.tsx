"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/app/context/TeamContext";
import GoogleMap, { HotelPin } from "@/app/components/GoogleMap";

// ── Types ───────────────────────────────────────────────────────────────────

interface Game {
  id: string;
  opponent: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  type: string;
}

interface Hotel {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  stars: number;
  otaRate: number;
  nikeRate: number;
  savings: number;
  distance: string;
  distanceMins: number | null;
  image: string | null;
  amenities: string[];
  rating: number;
  reviews: number;
  description: string;
}

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

// ── Fallback seed booking shown before DB loads ───────────────────────────────

const SEED_BOOKING: Booking = {
  id: "b1",
  hotel: "Grand Hyatt Chicago",
  city: "Chicago, IL",
  checkIn: "2026-04-18",
  checkOut: "2026-04-20",
  rooms: 4,
  pointsEarned: 3200,
  gameOpponent: "Westside Warriors",
};

const FILTERS = ["All", "Nike Rate", "Under $200", "< 15 Min"];

// ── Helpers ─────────────────────────────────────────────────────────────────

// Always use UTC accessors for date-only strings to avoid timezone shifts
function fmtUTC(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function getUTCDay(dateStr: string): number {
  return new Date(dateStr).getUTCDate();
}

function getUTCMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

// Keep fmt as alias for backwards compat
const fmt = fmtUTC;

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div
      className="px-4 py-3 border-b shrink-0 flex items-center justify-between"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
    >
      <span
        className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
        style={{ fontFamily: "var(--font-barlow-condensed)" }}
      >
        {label}
      </span>
      {sub && (
        <span
          className="text-[10px] text-gray-400 uppercase tracking-widest"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function HotelSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden animate-pulse shrink-0"
      style={{ height: 76, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.07)" }}
    >
      <div className="flex items-center h-full">
        <div className="w-[76px] h-full shrink-0" style={{ background: "#e0e0d8" }} />
        <div className="flex-1 px-3 flex flex-col gap-1.5">
          <div className="h-3 w-28 rounded" style={{ background: "#e0e0d8" }} />
          <div className="h-2 w-40 rounded" style={{ background: "#ebebeb" }} />
        </div>
        <div className="px-3 flex flex-col items-end gap-1">
          <div className="h-2 w-8 rounded" style={{ background: "#ebebeb" }} />
          <div className="h-4 w-12 rounded" style={{ background: "#e0e0d8" }} />
        </div>
      </div>
    </div>
  );
}

// ── VIEW 1: Bookings ─────────────────────────────────────────────────────────

function BookingsView({
  bookings,
  pendingGames,
  onBook,
}: {
  bookings: Booking[];
  pendingGames: Game[];
  onBook: (game: Game) => void;
}) {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">
      {/* Current Bookings */}
      <section
        className="flex flex-col rounded-2xl overflow-hidden min-h-0"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        }}
      >
        <SectionHeader
          label="Current Bookings"
          sub={bookings.length > 0 ? `${bookings.length} hotel${bookings.length !== 1 ? "s" : ""}` : undefined}
        />
        <div className="flex-1 overflow-y-auto min-h-0">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
              <span className="text-3xl">🏨</span>
              <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>
                No hotels booked yet
              </p>
              <p className="text-[11px] text-gray-400 text-center max-w-[160px]" style={{ fontFamily: "var(--font-barlow)" }}>
                Book hotels for your upcoming games
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
              {bookings.map((b) => (
                <div key={b.id} className="px-4 py-3 hover:bg-black/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12px] font-black uppercase tracking-wide text-[#0D1B2E] truncate"
                        style={{ fontFamily: "var(--font-barlow-condensed)" }}
                      >
                        {b.hotel}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                        {b.city} · vs {b.gameOpponent}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
                        {fmt(b.checkIn)} – {fmt(b.checkOut)} · {b.rooms} rooms
                      </p>
                      <span
                        className="inline-block mt-1.5 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(200,240,0,0.35)",
                          color: "#0D1B2E",
                          fontFamily: "var(--font-barlow-condensed)",
                        }}
                      >
                        ⭐ {b.pointsEarned.toLocaleString()} pts earned
                      </span>
                    </div>
                    <button
                      className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.03]"
                      style={{
                        fontFamily: "var(--font-barlow-condensed)",
                        background: "#0D1B2E",
                        color: "#C8F000",
                      }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Needs Hotel */}
      <section
        className="flex flex-col rounded-2xl overflow-hidden min-h-0"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        }}
      >
        <SectionHeader
          label="Needs Hotel"
          sub={pendingGames.length > 0 ? `${pendingGames.length} game${pendingGames.length !== 1 ? "s" : ""}` : undefined}
        />
        <div className="flex-1 overflow-y-auto min-h-0">
          {pendingGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
              <span className="text-3xl">✅</span>
              <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>
                All games covered
              </p>
              <p className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>
                Hotels booked for every game
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
              {pendingGames.map((g) => (
                <div
                  key={g.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-black/[0.02] transition-colors"
                >
                  {/* Date badge */}
                  <div
                    className="flex flex-col items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    style={{ background: "rgba(200,240,0,0.2)", fontFamily: "var(--font-barlow-condensed)" }}
                  >
                    {g.date ? (
                      <>
                        <span className="text-[8px] font-black uppercase text-[#0D1B2E] leading-none">
                          {getUTCMonth(g.date)}
                        </span>
                        <span className="text-[14px] font-black text-[#0D1B2E] leading-none">
                          {getUTCDay(g.date)}
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
                      {[g.city, g.venue].filter(Boolean).join(" · ") || "Location TBD"}
                    </p>
                  </div>
                  <button
                    onClick={() => onBook(g)}
                    className="shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      fontFamily: "var(--font-barlow-condensed)",
                      background: "#C8F000",
                      color: "#0D1B2E",
                      border: "1px solid rgba(200,240,0,0.8)",
                    }}
                  >
                    Book
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── VIEW 2: Hotel Search ─────────────────────────────────────────────────────

function SearchView({
  game,
  teamId,
  onSelect,
  onBack,
}: {
  game: Game;
  teamId: string;
  onSelect: (hotel: Hotel, checkIn: string, checkOut: string, rooms: number) => void;
  onBack: () => void;
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [venueCoords, setVenueCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [prefillRooms, setPrefillRooms] = useState(3);
  const [prefillCheckIn, setPrefillCheckIn] = useState("");
  const [prefillCheckOut, setPrefillCheckOut] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Derive dates client-side immediately — no need to wait for prefill
    function deriveDates() {
      if (!game.date) return { checkIn: "", checkOut: "" };
      const d = new Date(game.date);
      const ci = new Date(d); ci.setDate(ci.getDate() - 1);
      const co = new Date(d); co.setDate(co.getDate() + 1);
      return { checkIn: ci.toISOString().split("T")[0], checkOut: co.toISOString().split("T")[0] };
    }

    const { checkIn: derivedCheckIn, checkOut: derivedCheckOut } = deriveDates();
    if (!cancelled) {
      setPrefillCheckIn(derivedCheckIn);
      setPrefillCheckOut(derivedCheckOut);
    }

    // Fire hotel search immediately with derived dates — no prefill round trip on critical path
    // Fetch room count from prefill in parallel; update UI when it resolves
    async function load() {
      setLoading(true);

      const [searchRes] = await Promise.all([
        fetch("/api/hotels/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            city: game.city ?? "",
            checkIn: derivedCheckIn,
            checkOut: derivedCheckOut,
            venueName: game.venue ?? "",
            venueCity: game.city ?? "",
          }),
        }),
        // Prefill runs in parallel just to get accurate room count
        fetch("/api/hotels/prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: game.id, teamId }),
        }).then((r) => r.json()).then((p) => {
          if (!cancelled && p.roomCount) setPrefillRooms(p.roomCount);
          if (!cancelled && p.checkIn) setPrefillCheckIn(p.checkIn);
          if (!cancelled && p.checkOut) setPrefillCheckOut(p.checkOut);
        }).catch(() => {}),
      ]);

      try {
        const { hotels: results, venueCoords: vc } = await searchRes.json();
        if (!cancelled) {
          setHotels(results ?? []);
          setVenueCoords(vc ?? null);
        }
      } catch (err) {
        console.error("Hotel search error:", err);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [game.id, teamId, game.city, game.venue, game.date]);

  // Demo: Nike Rate shows hotels at positions 1, 3, 4, 6 (1-based)
  const NIKE_RATE_INDICES = new Set([1, 3, 4, 6]);

  const filtered = hotels.filter((h, idx) => {
    if (filter === "Nike Rate") return NIKE_RATE_INDICES.has(idx + 1);
    if (filter === "Under $200") return h.nikeRate < 200;
    if (filter === "< 15 Min") return (h.distanceMins ?? 999) < 15;
    return true;
  });

  const hotelPins: HotelPin[] = hotels.map((h, i) => ({
    id: h.id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    index: i + 1,
  }));

  const city = game.city ?? "Location";

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Sub-header */}
      <div className="shrink-0 flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" stroke="#0D1B2E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h2
              className="text-[18px] font-black uppercase tracking-widest text-[#0D1B2E]"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              Choose Hotel · {city}
            </h2>
            <span
              className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
              style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
            >
              Nike Rate
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
            {game.opponent ? `vs ${game.opponent}` : "Game"} · {game.date ? fmt(game.date) : "Date TBD"}
            {game.venue ? ` · ${game.venue}` : ""}
            {prefillCheckIn && ` · ${fmt(prefillCheckIn)} – ${fmt(prefillCheckOut)}`}
            {` · ${prefillRooms} rooms`}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[22px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            {loading ? "—" : filtered.length}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-gray-400" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            Results
          </p>
        </div>
      </div>

      {/* Two-column: map left, results right */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">

        {/* LEFT — Map (fills left half, square-ish) */}
        <GoogleMap
          venueCoords={venueCoords}
          venueName={game.venue ?? city}
          hotels={hotelPins}
          selectedId={hoveredId}
          onMarkerClick={(id) => {
            const h = hotels.find((x) => x.id === id);
            if (h) onSelect(h, prefillCheckIn, prefillCheckOut, prefillRooms);
          }}
          className="w-full h-full"
        />

        {/* RIGHT — Filters + scrollable hotel list */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Filters */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  background: filter === f ? "#0D1B2E" : "rgba(255,255,255,0.85)",
                  color: filter === f ? "#C8F000" : "#0D1B2E",
                  border: filter === f ? "1px solid #0D1B2E" : "1px solid rgba(0,0,0,0.1)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Hotel list */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
        {loading ? (
          <>
            <HotelSkeleton />
            <HotelSkeleton />
            <HotelSkeleton />
          </>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8">
            <span className="text-3xl">🔍</span>
            <p className="text-[12px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>
              No hotels match this filter
            </p>
          </div>
        ) : (
          filtered.map((hotel, i) => (
            <div
              key={hotel.id}
              className="rounded-xl overflow-hidden transition-all hover:scale-[1.008] cursor-pointer shrink-0"
              onClick={() => onSelect(hotel, prefillCheckIn, prefillCheckOut, prefillRooms)}
              onMouseEnter={() => setHoveredId(hotel.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "rgba(255,255,255,0.94)",
                border: i === 0 ? "2px solid #C8F000" : "1px solid rgba(0,0,0,0.08)",
                boxShadow: i === 0 ? "0 4px 16px rgba(200,240,0,0.18)" : "0 1px 6px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center h-[76px]">
                {/* Image — desaturated to match grey/volt palette */}
                <div className="w-[76px] h-full shrink-0 overflow-hidden relative">
                  {/* Number badge */}
                  <div
                    className="absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{
                      background: i === 0 ? "#C8F000" : "#0D1B2E",
                      color: i === 0 ? "#0D1B2E" : "#ffffff",
                      fontFamily: "var(--font-barlow-condensed)",
                    }}
                  >
                    {i + 1}
                  </div>
                  {hotel.image ? (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      style={{ filter: "grayscale(40%) saturate(0.65) brightness(0.9)" }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #d4e8b0 0%, #b8d090 100%)" }}
                    >
                      <span className="text-xl opacity-50">🏨</span>
                    </div>
                  )}
                  {/* Volt tint overlay on first (featured) card */}
                  {i === 0 && (
                    <div className="absolute inset-0" style={{ background: "rgba(200,240,0,0.12)", mixBlendMode: "multiply" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 px-3 py-2 min-w-0 flex flex-col justify-center">
                  <p
                    className="text-[12px] font-black uppercase tracking-wide text-[#0D1B2E] truncate leading-tight"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}
                  >
                    {hotel.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
                    {hotel.distance ? `${hotel.distance} to venue` : hotel.address}
                    {hotel.rating > 0 ? ` · ★${hotel.rating.toFixed(1)}` : ""}
                  </p>
                  {hotel.savings > 0 && (
                    <span
                      className="mt-1 text-[9px] font-black uppercase tracking-widest"
                      style={{ fontFamily: "var(--font-barlow-condensed)", color: "#5a9400" }}
                    >
                      Save ${hotel.savings}/night
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="flex flex-col items-end justify-center px-3 shrink-0 gap-0">
                  {hotel.otaRate > 0 && (
                    <p
                      className="text-[10px] text-gray-400 line-through leading-none"
                      style={{ fontFamily: "var(--font-barlow-condensed)" }}
                    >
                      ${hotel.otaRate}
                    </p>
                  )}
                  <p
                    className="text-[16px] font-black text-[#0D1B2E] leading-tight"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}
                  >
                    ${hotel.nikeRate}
                  </p>
                  <p
                    className="text-[9px] text-gray-400 uppercase tracking-widest leading-none"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}
                  >
                    /night
                  </p>
                </div>

                {/* Arrow */}
                <div className="px-3 shrink-0">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-gray-300">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
        </div>{/* end hotel list */}
        </div>{/* end right column */}
      </div>{/* end two-column grid */}
    </div>
  );
}

// ── VIEW 3: Hotel Detail / Book ──────────────────────────────────────────────

function DetailView({
  hotel,
  game,
  initialCheckIn,
  initialCheckOut,
  initialRooms,
  onBack,
  onConfirm,
}: {
  hotel: Hotel;
  game: Game;
  initialCheckIn: string;
  initialCheckOut: string;
  initialRooms: number;
  onBack: () => void;
  onConfirm: (checkIn: string, checkOut: string, rooms: number, nights: number) => void;
}) {
  const [rooms, setRooms] = useState(initialRooms);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  const nights = (() => {
    if (!checkIn || !checkOut) return 2;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.round(diff / 86400000));
  })();

  const total = hotel.nikeRate * rooms * nights;
  const pointsEarned = Math.round(total * 1.5);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" stroke="#0D1B2E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2
          className="text-[18px] font-black uppercase tracking-widest text-[#0D1B2E]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          Book · {hotel.name}
        </h2>
        <span
          className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
        >
          Nike Rate
        </span>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 items-start">
        {/* Hotel info */}
        <section
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          {/* Hotel image — volt border + grey overlay */}
          <div
            className="w-full h-36 shrink-0 relative overflow-hidden"
            style={{
              border: "2px solid #C8F000",
              boxShadow: "0 0 0 1px rgba(200,240,0,0.25)",
              background: "linear-gradient(135deg, #d4e8b0 0%, #b8d090 100%)",
            }}
          >
            {hotel.image ? (
              <img
                src={hotel.image}
                alt={hotel.name}
                className="w-full h-full object-cover"
                style={{ filter: "grayscale(30%) saturate(0.7) brightness(0.92)" }}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-5xl">🏨</span>
            )}
            {/* Grey tint overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "rgba(160,170,160,0.2)", mixBlendMode: "multiply" }}
            />
          </div>
          <div className="p-4 flex flex-col gap-2 overflow-y-auto">
            <div>
              <p
                className="text-[16px] font-black uppercase tracking-wide text-[#0D1B2E]"
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
              >
                {hotel.name}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
                {hotel.address}
                {hotel.distance ? ` · ${hotel.distance} to venue` : ""}
              </p>
              {hotel.rating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[11px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>
                    ★ {hotel.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>
                    ({hotel.reviews.toLocaleString()} reviews)
                  </span>
                </div>
              )}
              {/* OTA vs Nike Rate comparison */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[12px] text-gray-400 line-through" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  ${hotel.otaRate}/night OTA
                </span>
                <span className="text-[14px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  ${hotel.nikeRate}/night
                </span>
              </div>
              {hotel.savings > 0 && (
                <p className="text-[10px] font-black" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#5a9400" }}>
                  You save ${hotel.savings}/night with Nike Rate
                </p>
              )}
            </div>
            {hotel.description && (
              <p className="text-[11px] text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-barlow)" }}>
                {hotel.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-1">
              {hotel.amenities.filter(Boolean).map((a) => (
                <span
                  key={a}
                  className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                  style={{
                    fontFamily: "var(--font-barlow-condensed)",
                    background: "rgba(0,0,0,0.05)",
                    color: "#0D1B2E",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Booking form */}
        <section
          className="flex flex-col rounded-2xl overflow-hidden shrink-0"
          style={{
            background: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
          }}
        >
          {/* Header with game name */}
          <div className="px-4 py-3 border-b shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-[11px] font-black uppercase tracking-widest text-[#0D1B2E]"
                style={{ fontFamily: "var(--font-barlow-condensed)" }}
              >
                Booking Details
              </span>
              {game.opponent && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
                >
                  vs {game.opponent}
                </span>
              )}
            </div>
            {game.date && (
              <p className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
                {fmt(game.date)} · {game.city ?? "Location TBD"}
              </p>
            )}
          </div>

          {/* Body — no scroll */}
          <div className="p-4 flex flex-col gap-3">

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2">
              {([
                ["Check-in", checkIn, setCheckIn] as const,
                ["Check-out", checkOut, setCheckOut] as const,
              ]).map(([label, val, setter]) => (
                <div
                  key={label}
                  className="p-2.5 rounded-xl"
                  style={{ border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}
                >
                  <p
                    className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5"
                    style={{ fontFamily: "var(--font-barlow-condensed)" }}
                  >
                    {label}
                  </p>
                  <input
                    type="date"
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full bg-transparent text-[12px] font-semibold text-[#0D1B2E] outline-none cursor-pointer"
                    style={{ fontFamily: "var(--font-barlow)" }}
                  />
                </div>
              ))}
            </div>

            {/* Rooms stepper */}
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-widest text-gray-400"
                  style={{ fontFamily: "var(--font-barlow-condensed)" }}
                >
                  Rooms · {nights} nights · ${hotel.nikeRate}/night
                </p>
                {hotel.savings > 0 && (
                  <p className="text-[10px]" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#5a9400" }}>
                    Saving ${(hotel.savings * rooms * nights).toLocaleString()} vs OTA
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRooms(Math.max(1, rooms - 1))}
                  className="w-7 h-7 rounded-lg text-[15px] flex items-center justify-center font-bold transition-all hover:scale-105"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#0D1B2E" }}
                >
                  −
                </button>
                <span
                  className="text-[18px] font-black text-[#0D1B2E] w-7 text-center"
                  style={{ fontFamily: "var(--font-barlow-condensed)" }}
                >
                  {rooms}
                </span>
                <button
                  onClick={() => setRooms(Math.min(20, rooms + 1))}
                  className="w-7 h-7 rounded-lg text-[15px] flex items-center justify-center font-bold transition-all hover:scale-105"
                  style={{ background: "rgba(0,0,0,0.06)", color: "#0D1B2E" }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total */}
            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{ background: "rgba(13,27,46,0.04)", border: "1px solid rgba(13,27,46,0.08)" }}
            >
              <div>
                <p
                  className="text-[9px] font-black uppercase tracking-widest text-gray-400"
                  style={{ fontFamily: "var(--font-barlow-condensed)" }}
                >
                  Estimated Total
                </p>
                <p className="text-[20px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  ${total.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-[9px] font-black uppercase tracking-widest text-gray-400"
                  style={{ fontFamily: "var(--font-barlow-condensed)" }}
                >
                  Points Earned
                </p>
                <p className="text-[16px] font-black" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#8db800" }}>
                  +{pointsEarned.toLocaleString()} pts
                </p>
              </div>
            </div>

            {/* Book */}
            <button
              onClick={() => onConfirm(checkIn, checkOut, rooms, nights)}
              className="w-full py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                background: "#0D1B2E",
                color: "#C8F000",
                boxShadow: "0 4px 20px rgba(13,27,46,0.3)",
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M2 5h12M2 5a1 1 0 00-1 1v7a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1M2 5V4a1 1 0 011-1h10a1 1 0 011 1v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                <path d="M8 10v0" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
              </svg>
              Book · ${total.toLocaleString()} total
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── VIEW 4: Payment ──────────────────────────────────────────────────────────

interface ParentRow {
  playerName: string;
  parentName: string;
  phone: string;
  email?: string;
  amountCents: number;
}

interface SentResult {
  parentName: string;
  phone: string;
  sent?: boolean;
  mock?: boolean;
  error?: string;
  paymentUrl?: string;
  body?: string;
}

function useCountdown(endIso: string | null) {
  const [remaining, setRemaining] = useState<string>("");
  useEffect(() => {
    if (!endIso) return;
    function tick() {
      const ms = new Date(endIso!).getTime() - Date.now();
      if (ms <= 0) { setRemaining("Expired"); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endIso]);
  return remaining;
}

function PaymentView({
  hotel,
  game,
  checkIn,
  checkOut,
  rooms,
  nights,
  teamId,
  onBack,
  onDone,
}: {
  hotel: Hotel;
  game: Game;
  checkIn: string;
  checkOut: string;
  rooms: number;
  nights: number;
  teamId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const total = hotel.nikeRate * rooms * nights;

  // Direct payment
  const [directLoading, setDirectLoading] = useState(false);
  const [stripeOpened, setStripeOpened] = useState(false);

  // Parent split
  const [allParents, setAllParents] = useState<ParentRow[]>([]);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentResults, setSentResults] = useState<SentResult[]>([]);
  const [holdUntil, setHoldUntil] = useState<string | null>(null);
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const countdown = useCountdown(holdUntil);

  const selectedCount = selected.size;
  const perParentDollars = selectedCount > 0 ? Math.round(total / selectedCount) : Math.round(total / Math.max(1, rooms));
  const sent = sentResults.length > 0;

  // Load parents on mount
  useEffect(() => {
    fetch(`/api/players?teamId=${teamId}`)
      .then((r) => r.json())
      .then((d) => {
        const players = (d.players ?? []) as Array<{
          name: string;
          parent_name: string | null;
          parent_phone: string | null;
          parent_email: string | null;
        }>;
        const rows: ParentRow[] = players
          .filter((p) => p.parent_name && p.parent_phone)
          .map((p) => ({
            playerName: p.name,
            parentName: p.parent_name!,
            phone: p.parent_phone!,
            email: p.parent_email ?? undefined,
            amountCents: 0, // computed dynamically from selection
          }));
        setAllParents(rows);
        setSelected(new Set(rows.map((r) => r.phone)));
      })
      .catch(console.error)
      .finally(() => setParentsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleParent(phone: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === allParents.length ? new Set() : new Set(allParents.map((p) => p.phone))
    );
  }

  async function handleDirectPay() {
    setDirectLoading(true);
    try {
      const res = await fetch("/api/payments/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelName: hotel.name, checkIn, checkOut, rooms, nikeRate: hotel.nikeRate, nights }),
      });
      const data = await res.json();
      if (data.url) { window.open(data.url, "_blank"); setStripeOpened(true); }
    } catch (e) {
      console.error(e);
    } finally {
      setDirectLoading(false);
    }
  }

  async function handleSendLinks() {
    setSending(true);
    const amountCents = Math.round((total / selectedCount) * 100);
    const toSend = allParents
      .filter((p) => selected.has(p.phone))
      .map((p) => ({ ...p, amountCents }));
    try {
      const res = await fetch("/api/payments/send-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parents: toSend, hotelName: hotel.name, checkIn, checkOut, nights }),
      });
      const data = await res.json();
      setSentResults(data.sent ?? []);
      setHoldUntil(data.holdUntil ?? null);
      setTwilioEnabled(data.twilioEnabled ?? false);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M10 12L6 8l4-4" stroke="#0D1B2E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div>
          <p className="text-[14px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
            {hotel.name}
          </p>
          <p className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>
            {fmt(checkIn)} → {fmt(checkOut)} · {rooms} room{rooms !== 1 ? "s" : ""} · ${total.toLocaleString()} total
          </p>
        </div>
      </div>

      {/* Two-column layout — always visible */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3">

        {/* ── Left: Pay with Link ── */}
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl p-4 flex flex-col gap-3 flex-1"
            style={{ background: "#0D1B2E", boxShadow: "0 4px 24px rgba(13,27,46,0.2)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-barlow-condensed)", color: "rgba(255,255,255,0.4)" }}>
              Pay with Link
            </p>

            {/* Order rows */}
            <div className="flex flex-col gap-2">
              {[
                ["Hotel", hotel.name],
                ["Dates", `${fmt(checkIn)} → ${fmt(checkOut)}`],
                ["Rooms", `${rooms} × ${nights}n × $${hotel.nikeRate}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--font-barlow)", color: "rgba(255,255,255,0.4)" }}>{k}</span>
                  <span className="text-[11px] font-semibold text-white truncate text-right" style={{ fontFamily: "var(--font-barlow)" }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-3 flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-barlow-condensed)", color: "rgba(255,255,255,0.4)" }}>Total</span>
              <span className="text-[22px] font-black text-white" style={{ fontFamily: "var(--font-barlow-condensed)" }}>${total.toLocaleString()}</span>
            </div>

            {hotel.savings > 0 && (
              <p className="text-[10px] font-black" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#C8F000" }}>
                Saving ${(hotel.savings * rooms * nights).toLocaleString()} vs OTA
              </p>
            )}

            <div className="mt-auto pt-2 flex flex-col gap-2">
              <div className="rounded-lg px-3 py-2" style={{ background: "rgba(200,240,0,0.1)" }}>
                <p className="text-[9px] leading-relaxed" style={{ fontFamily: "var(--font-barlow)", color: "rgba(200,240,0,0.8)" }}>
                  Test mode · use card <span className="font-mono">4242 4242 4242 4242</span>
                </p>
              </div>
              {!stripeOpened ? (
                <button
                  onClick={handleDirectPay}
                  disabled={directLoading}
                  className="w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
                >
                  {directLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                      <rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth={1.5} />
                      <path d="M1 7h14" stroke="currentColor" strokeWidth={1.5} />
                    </svg>
                  )}
                  {directLoading ? "Opening…" : `Pay $${total.toLocaleString()}`}
                </button>
              ) : (
                <>
                  <p className="text-[9px] text-center" style={{ fontFamily: "var(--font-barlow)", color: "rgba(255,255,255,0.5)" }}>
                    Stripe opened in a new tab. Once paid, confirm below.
                  </p>
                  <button
                    onClick={onDone}
                    className="w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                    style={{ fontFamily: "var(--font-barlow-condensed)", background: "#C8F000", color: "#0D1B2E" }}
                  >
                    ✓ Confirm Booking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Collect from Parents ── */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Hold countdown when sent */}
          {sent && holdUntil && (
            <div className="rounded-xl px-3 py-2.5 flex items-center justify-between shrink-0" style={{ background: "#0D1B2E" }}>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-barlow-condensed)", color: "rgba(255,255,255,0.4)" }}>Room held for</p>
                <p className="text-[13px] font-black" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#C8F000" }}>{countdown}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-barlow-condensed)", color: "rgba(255,255,255,0.4)" }}>{twilioEnabled ? "WhatsApp sent" : "Demo"}</p>
                <p className="text-[12px] font-black text-white" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  {sentResults.filter((r) => r.sent || r.mock).length}/{sentResults.length}
                </p>
              </div>
            </div>
          )}

          {/* Parent list card */}
          <div
            className="flex-1 min-h-0 rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            {/* WhatsApp join notice */}
            <div className="px-3 py-2 flex items-start gap-2 shrink-0" style={{ background: "rgba(37,211,102,0.08)", borderBottom: "1px solid rgba(37,211,102,0.2)" }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <p className="text-[9px] leading-relaxed" style={{ fontFamily: "var(--font-barlow)", color: "#1a7a3c" }}>
                <strong>Before sending:</strong> parents must text <span className="font-mono font-bold">join &lt;your-keyword&gt;</span> to <span className="font-mono">+1 415 523 8886</span> on WhatsApp once to receive messages.
              </p>
            </div>

            {/* List header */}
            <div className="px-3 py-2.5 border-b flex items-center justify-between shrink-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                  Collect from Parents
                </span>
                {selectedCount > 0 && (
                  <span className="ml-2 text-[10px] font-black" style={{ fontFamily: "var(--font-barlow-condensed)", color: "#5a9400" }}>
                    ${perParentDollars}/each
                  </span>
                )}
              </div>
              {allParents.length > 0 && !sent && (
                <button
                  onClick={toggleAll}
                  className="text-[9px] font-black uppercase tracking-widest transition-colors hover:text-[#0D1B2E]"
                  style={{ fontFamily: "var(--font-barlow-condensed)", color: "#9ca3af" }}
                >
                  {selected.size === allParents.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {/* Parent rows */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {parentsLoading && (
                <div className="flex items-center justify-center h-full gap-2">
                  <span className="w-4 h-4 border-2 border-[#0D1B2E] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-barlow)" }}>Loading roster…</span>
                </div>
              )}
              {!parentsLoading && allParents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-1 py-6">
                  <p className="text-[11px] font-semibold text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow)" }}>No parent phones on roster</p>
                  <p className="text-[10px] text-gray-400 text-center max-w-[180px]" style={{ fontFamily: "var(--font-barlow)" }}>Add parent phones to enable split payment.</p>
                </div>
              )}
              {!parentsLoading && allParents.map((p, i) => {
                const isSelected = selected.has(p.phone);
                const result = sentResults.find((r) => r.phone === p.phone);
                return (
                  <div
                    key={i}
                    onClick={() => !sent && toggleParent(p.phone)}
                    className="px-3 py-2.5 flex items-center gap-2.5 border-b last:border-0 transition-colors"
                    style={{
                      borderColor: "rgba(0,0,0,0.05)",
                      background: isSelected && !sent ? "rgba(200,240,0,0.04)" : "transparent",
                      cursor: sent ? "default" : "pointer",
                    }}
                  >
                    {/* Checkbox */}
                    {!sent && (
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isSelected ? "#0D1B2E" : "transparent",
                          border: isSelected ? "1.5px solid #0D1B2E" : "1.5px solid #d1d5db",
                        }}
                      >
                        {isSelected && (
                          <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                            <path d="M2 5l2.5 2.5 4-4" stroke="#C8F000" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Avatar */}
                    <div
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black"
                      style={{ background: isSelected ? "#0D1B2E" : "#e5e7eb", color: isSelected ? "#C8F000" : "#6b7280" }}
                    >
                      {p.parentName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-[#0D1B2E] truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                        {p.parentName}
                      </p>
                      <p className="text-[9px] text-gray-400 truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                        {p.playerName} · {p.phone}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {result ? (
                        result.error ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>Failed</span>
                        ) : result.sent ? (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(200,240,0,0.25)", color: "#5a9400" }}>WhatsApp ✓</span>
                        ) : (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.07)", color: "#6b7280" }}>Demo ✓</span>
                        )
                      ) : isSelected ? (
                        <span className="text-[12px] font-black text-[#0D1B2E]" style={{ fontFamily: "var(--font-barlow-condensed)" }}>
                          ${perParentDollars}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-300" style={{ fontFamily: "var(--font-barlow-condensed)" }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Send button */}
            <div className="p-3 shrink-0 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              {!sent ? (
                <button
                  onClick={handleSendLinks}
                  disabled={sending || selectedCount === 0}
                  className="w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ fontFamily: "var(--font-barlow-condensed)", background: "#0D1B2E", color: "#C8F000", boxShadow: "0 4px 16px rgba(13,27,46,0.25)" }}
                >
                  {sending ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={1.8}>
                      <path d="M21 3L9 15" strokeLinecap="round" />
                      <path d="M21 3L15 21l-6-6-6-3 18-9z" strokeLinejoin="round" />
                    </svg>
                  )}
                  {sending ? "Sending…" : `Text ${selectedCount} Parent${selectedCount !== 1 ? "s" : ""} · $${perParentDollars} each`}
                </button>
              ) : (
                <button
                  onClick={onDone}
                  className="w-full py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]"
                  style={{ fontFamily: "var(--font-barlow-condensed)", background: "#0D1B2E", color: "#C8F000" }}
                >
                  Done · Back to Bookings
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StaysPage() {
  const { teamId, refresh } = useTeam();
  const [view, setView] = useState<"bookings" | "search" | "detail" | "payment">("bookings");
  const [games, setGames] = useState<Game[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([SEED_BOOKING]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [bookingCheckIn, setBookingCheckIn] = useState("");
  const [bookingCheckOut, setBookingCheckOut] = useState("");
  const [bookingRooms, setBookingRooms] = useState(3);
  const [bookingNights, setBookingNights] = useState(2);

  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/games?teamId=${teamId}`)
      .then((r) => r.json())
      .then((d) => setGames(d.games ?? []));
  }, [teamId, refresh]);

  // Load persisted bookings from DB
  useEffect(() => {
    if (!teamId) return;
    fetch(`/api/bookings?teamId=${teamId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.bookings && d.bookings.length > 0) {
          setBookings(
            d.bookings.map((b: {
              id: string;
              hotel: string;
              city: string;
              check_in: string;
              check_out: string;
              rooms: number;
              points_earned: number;
              game_opponent: string;
            }) => ({
              id: b.id,
              hotel: b.hotel,
              city: b.city,
              checkIn: b.check_in,
              checkOut: b.check_out,
              rooms: b.rooms,
              pointsEarned: b.points_earned,
              gameOpponent: b.game_opponent,
            }))
          );
        }
      })
      .catch(console.error);
  }, [teamId]);

  const bookedOpponents = new Set(bookings.map((b) => b.gameOpponent));
  const pendingGames = games.filter((g) => !bookedOpponents.has(g.opponent ?? ""));

  function handleBook(game: Game) {
    setSelectedGame(game);
    setView("search");
  }

  function handleSelect(hotel: Hotel, checkIn: string, checkOut: string, rooms: number) {
    setSelectedHotel(hotel);
    setBookingCheckIn(checkIn);
    setBookingCheckOut(checkOut);
    setBookingRooms(rooms);
    setView("detail");
  }

  function handleConfirm(checkIn: string, checkOut: string, rooms: number, nights: number) {
    setBookingCheckIn(checkIn);
    setBookingCheckOut(checkOut);
    setBookingRooms(rooms);
    setBookingNights(nights);
    setView("payment");
  }

  function handleDone() {
    if (selectedHotel && selectedGame) {
      const pointsEarned = Math.round(selectedHotel.nikeRate * bookingRooms * bookingNights * 1.5);
      const gameOpponent = selectedGame.opponent ?? "";
      const city = selectedGame.city ?? "";

      // Optimistically add to local state
      const tempBooking: Booking = {
        id: `b-${Date.now()}`,
        hotel: selectedHotel.name,
        city,
        checkIn: bookingCheckIn,
        checkOut: bookingCheckOut,
        rooms: bookingRooms,
        pointsEarned,
        gameOpponent,
      };
      setBookings((prev) => [tempBooking, ...prev]);

      // Persist to DB
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamId ?? "",
          hotel: selectedHotel.name,
          city,
          checkIn: bookingCheckIn,
          checkOut: bookingCheckOut,
          rooms: bookingRooms,
          pointsEarned,
          gameOpponent,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          // Replace temp booking with real DB id
          if (d.booking?.id) {
            setBookings((prev) =>
              prev.map((b) => (b.id === tempBooking.id ? { ...b, id: d.booking.id } : b))
            );
          }
        })
        .catch(console.error);

      // Send WhatsApp confirmation to all parents (fire and forget)
      fetch("/api/payments/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: teamId ?? "",
          hotelName: selectedHotel.name,
          checkIn: bookingCheckIn,
          checkOut: bookingCheckOut,
          rooms: bookingRooms,
          gameOpponent: selectedGame.opponent ?? "",
          gameCity: selectedGame.city ?? "",
        }),
      }).catch(console.error);
    }

    setView("bookings");
    setSelectedGame(null);
    setSelectedHotel(null);
  }

  return (
    <div className="h-full flex flex-col px-4 pt-4 pb-2 gap-3">
      {/* Header + breadcrumb */}
      <div className="shrink-0 flex items-baseline gap-3">
        <h1
          className="text-[16px] font-black uppercase tracking-widest text-[#0D1B2E]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          Stays
        </h1>
        {view !== "bookings" && (
          <div
            className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            <span className="cursor-pointer hover:text-[#0D1B2E] transition-colors" onClick={() => setView("bookings")}>
              Bookings
            </span>
            <span>›</span>
            <span
              className={view === "search" ? "text-[#0D1B2E]" : "cursor-pointer hover:text-[#0D1B2E] transition-colors"}
              onClick={() => (view === "detail" || view === "payment") && setView("search")}
            >
              Find Hotels
            </span>
            {(view === "detail" || view === "payment") && (
              <>
                <span>›</span>
                <span
                  className={view === "detail" ? "text-[#0D1B2E]" : "cursor-pointer hover:text-[#0D1B2E] transition-colors"}
                  onClick={() => view === "payment" && setView("detail")}
                >
                  Book
                </span>
              </>
            )}
            {view === "payment" && (
              <>
                <span>›</span>
                <span className="text-[#0D1B2E]">Payment</span>
              </>
            )}
          </div>
        )}
      </div>

      {view === "bookings" && (
        <BookingsView bookings={bookings} pendingGames={pendingGames} onBook={handleBook} />
      )}

      {view === "search" && selectedGame && (
        <SearchView
          game={selectedGame}
          teamId={teamId ?? ""}
          onSelect={handleSelect}
          onBack={() => setView("bookings")}
        />
      )}

      {view === "detail" && selectedGame && selectedHotel && (
        <DetailView
          hotel={selectedHotel}
          game={selectedGame}
          initialCheckIn={bookingCheckIn}
          initialCheckOut={bookingCheckOut}
          initialRooms={bookingRooms}
          onBack={() => setView("search")}
          onConfirm={handleConfirm}
        />
      )}

      {view === "payment" && selectedGame && selectedHotel && (
        <PaymentView
          hotel={selectedHotel}
          game={selectedGame}
          checkIn={bookingCheckIn}
          checkOut={bookingCheckOut}
          rooms={bookingRooms}
          nights={bookingNights}
          teamId={teamId ?? ""}
          onBack={() => setView("detail")}
          onDone={handleDone}
        />
      )}
    </div>
  );
}
