"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTeam } from "@/app/context/TeamContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  team_id: string;
  gmail_message_id: string;
  type: string;
  urgency: string;
  summary: string;
  suggested_action?: string;
  extracted_data?: Record<string, string>;
  email_subject?: string;
  email_from?: string;
  email_snippet?: string;
  status: string;
  created_at: string;
}

interface GmailConnection {
  email: string;
  expiry?: string;
  created_at?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; filter: string }
> = {
  reschedule_request: {
    label: "Reschedule",
    bg: "rgba(239,68,68,0.12)",
    text: "#dc2626",
    filter: "reschedule",
  },
  new_game: {
    label: "New Game",
    bg: "rgba(34,197,94,0.12)",
    text: "#16a34a",
    filter: "new_game",
  },
  league_admin: {
    label: "League",
    bg: "rgba(59,130,246,0.12)",
    text: "#2563eb",
    filter: "league",
  },
  pickup_update: {
    label: "Pickup",
    bg: "rgba(234,179,8,0.12)",
    text: "#ca8a04",
    filter: "pickup",
  },
  other: {
    label: "Other",
    bg: "rgba(107,114,128,0.12)",
    text: "#6b7280",
    filter: "other",
  },
};

const URGENCY_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#9ca3af",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function gmailLink(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${messageId}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.other;
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.text,
        fontFamily: "var(--font-barlow-condensed)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 6,
        display: "inline-block",
      }}
    >
      {cfg.label}
    </span>
  );
}

function UrgencyDot({ urgency }: { urgency: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: URGENCY_COLOR[urgency] ?? URGENCY_COLOR.low,
        flexShrink: 0,
      }}
      title={`${urgency} urgency`}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-4 animate-pulse"
      style={{
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div style={{ width: 60, height: 18, background: "#e5e7eb", borderRadius: 6 }} />
        <div style={{ width: 8, height: 8, background: "#e5e7eb", borderRadius: "50%" }} />
      </div>
      <div style={{ width: "80%", height: 14, background: "#e5e7eb", borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: "60%", height: 12, background: "#e5e7eb", borderRadius: 4, marginBottom: 16 }} />
      <div className="flex gap-2">
        <div style={{ width: 90, height: 32, background: "#e5e7eb", borderRadius: 8 }} />
        <div style={{ width: 70, height: 32, background: "#e5e7eb", borderRadius: 8 }} />
      </div>
    </div>
  );
}

function ActionItemCard({
  item,
  onAction,
  onDismiss,
}: {
  item: ActionItem;
  onAction: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.other;
  const isDone = item.status !== "pending";

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-200"
      style={{
        background: isDone ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        opacity: isDone ? 0.6 : 1,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <TypeBadge type={item.type} />
        <UrgencyDot urgency={item.urgency} />
        {item.email_from && (
          <span
            className="text-gray-500 truncate"
            style={{ fontFamily: "var(--font-barlow)", fontSize: 12, maxWidth: 200 }}
          >
            {item.email_from}
          </span>
        )}
        <span
          className="ml-auto text-gray-400"
          style={{ fontFamily: "var(--font-barlow)", fontSize: 11 }}
        >
          {timeAgo(item.created_at)}
        </span>
      </div>

      {/* Subject */}
      {item.email_subject && (
        <p
          className="text-gray-400 mb-1 truncate"
          style={{ fontFamily: "var(--font-barlow)", fontSize: 12 }}
        >
          {item.email_subject}
        </p>
      )}

      {/* Summary */}
      <p
        className="text-[#0D1B2E] mb-1"
        style={{ fontFamily: "var(--font-barlow)", fontSize: 14, fontWeight: 600 }}
      >
        {item.summary}
      </p>

      {/* Suggested action */}
      {item.suggested_action && (
        <p
          className="text-gray-500 mb-3"
          style={{ fontFamily: "var(--font-barlow)", fontSize: 13 }}
        >
          {item.suggested_action}
        </p>
      )}

      {/* Action buttons */}
      {!isDone && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAction(item.id)}
            className="px-3 py-1.5 rounded-lg text-[#0D1B2E] text-xs font-bold uppercase tracking-wide transition-all hover:opacity-90 active:scale-95"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              background: "#C8F000",
              border: "none",
              cursor: "pointer",
            }}
          >
            Mark Actioned
          </button>
          <button
            onClick={() => onDismiss(item.id)}
            className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-bold uppercase tracking-wide transition-all hover:bg-gray-100 active:scale-95"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              background: "rgba(0,0,0,0.05)",
              border: "1px solid rgba(0,0,0,0.07)",
              cursor: "pointer",
            }}
          >
            Dismiss
          </button>
          <a
            href={gmailLink(item.gmail_message_id)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all hover:opacity-80"
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              color: cfg.text,
              background: cfg.bg,
              textDecoration: "none",
            }}
          >
            View Email
          </a>
        </div>
      )}

      {isDone && (
        <p
          className="text-gray-400 text-xs uppercase tracking-wide"
          style={{ fontFamily: "var(--font-barlow-condensed)", fontWeight: 700 }}
        >
          {item.status === "actioned" ? "Actioned" : "Dismissed"}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "reschedule", label: "Reschedule" },
  { id: "new_game", label: "New Game" },
  { id: "league", label: "League" },
  { id: "pickup", label: "Pickup" },
];

export default function ActionItemsPage() {
  const { teamId } = useTeam();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<ActionItem[]>([]);
  const [connection, setConnection] = useState<GmailConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch existing items (GET)
  const fetchItems = useCallback(async () => {
    if (!teamId) return;
    try {
      const res = await fetch(`/api/gmail/poll?teamId=${teamId}`);
      const data = await res.json();
      if (data.items) setItems(data.items);
      if (data.connection) setConnection(data.connection);
      else setConnection(null);
    } catch (e) {
      console.error("fetchItems error", e);
    }
  }, [teamId]);

  // Poll Gmail (POST)
  const pollGmail = useCallback(async () => {
    if (!teamId || !connection) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json();
      if (data.items) setItems(data.items);
      setLastSynced(new Date());
    } catch (e) {
      console.error("pollGmail error", e);
    } finally {
      setSyncing(false);
    }
  }, [teamId, connection]);

  // Initial load
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    fetchItems().finally(() => setLoading(false));
  }, [teamId, fetchItems]);

  // Handle ?connected=1 and ?error= from OAuth redirect
  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected === "1" && teamId) {
      fetchItems().then(() => pollGmail());
    }
    if (err) {
      setError(
        err === "token_exchange"
          ? "Failed to connect Gmail. Please try again."
          : err === "missing_params"
          ? "OAuth callback missing parameters."
          : `Error: ${err}`
      );
    }
  }, [searchParams, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-poll every 60 seconds when connected
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!connection || !teamId) return;
    intervalRef.current = setInterval(() => {
      pollGmail();
    }, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connection, teamId, pollGmail]);

  // Update item status
  const updateStatus = async (id: string, status: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    await fetch("/api/gmail/poll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  // Filtered items
  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    const cfg = TYPE_CONFIG[item.type];
    return cfg?.filter === filter;
  });

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const actionedCount = items.filter((i) => i.status === "actioned").length;

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.85)",
    border: "1px solid rgba(0,0,0,0.07)",
    boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
    borderRadius: 16,
  };

  return (
    <div
      className="flex h-full min-h-screen gap-0"
      style={{ background: "#F5F5F0", fontFamily: "var(--font-barlow)" }}
    >
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 p-6 flex flex-col gap-4 border-r border-[rgba(0,0,0,0.06)] overflow-y-auto">
        <h1
          className="text-3xl font-black uppercase tracking-tight text-[#0D1B2E]"
          style={{ fontFamily: "var(--font-barlow-condensed)" }}
        >
          Action Items
        </h1>

        {/* Error banner */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm text-red-700"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {/* Gmail connection card */}
        <div className="p-4" style={cardStyle}>
          <p
            className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            Gmail
          </p>

          {connection ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#22c55e",
                    flexShrink: 0,
                  }}
                />
                <span
                  className="text-[#0D1B2E] font-semibold text-sm truncate"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {connection.email}
                </span>
              </div>

              {lastSynced && (
                <p className="text-gray-400 text-xs mb-3">
                  Last synced {timeAgo(lastSynced.toISOString())}
                </p>
              )}

              <button
                onClick={pollGmail}
                disabled={syncing}
                className="w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  background: syncing ? "#e5e7eb" : "#C8F000",
                  color: "#0D1B2E",
                  border: "none",
                  cursor: syncing ? "not-allowed" : "pointer",
                }}
              >
                {syncing ? "Syncing..." : "Re-sync"}
              </button>
            </>
          ) : (
            <>
              <p
                className="text-gray-500 text-sm mb-4"
                style={{ fontFamily: "var(--font-barlow)" }}
              >
                Connect Gmail to automatically surface team emails as action items.
              </p>
              <a
                href={teamId ? `/api/gmail/connect?teamId=${teamId}` : "#"}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:opacity-90"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  background: "#C8F000",
                  color: "#0D1B2E",
                  textDecoration: "none",
                  pointerEvents: teamId ? "auto" : "none",
                  opacity: teamId ? 1 : 0.5,
                }}
              >
                Connect Gmail
              </a>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="p-3 rounded-2xl text-center"
            style={{
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.12)",
            }}
          >
            <p
              className="text-2xl font-black text-red-500"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              {pendingCount}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          </div>
          <div
            className="p-3 rounded-2xl text-center"
            style={{
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.12)",
            }}
          >
            <p
              className="text-2xl font-black text-green-500"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              {actionedCount}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Actioned</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-col gap-2">
          <p
            className="text-xs font-black uppercase tracking-widest text-gray-400"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            Filter
          </p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-all hover:opacity-90 active:scale-95"
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  background:
                    filter === opt.id ? "#0D1B2E" : "rgba(0,0,0,0.06)",
                  color: filter === opt.id ? "#C8F000" : "#6b7280",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-black uppercase tracking-tight text-[#0D1B2E]"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            {filter === "all" ? "All Items" : FILTER_OPTIONS.find((f) => f.id === filter)?.label}
            <span className="ml-2 text-base font-semibold text-gray-400">
              ({filtered.length})
            </span>
          </h2>

          {syncing && (
            <span
              className="text-xs text-gray-400 flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#C8F000" }}
              />
              Syncing...
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl"
            style={cardStyle}
          >
            <span style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📬</span>
            <p
              className="text-gray-400 text-lg font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-barlow-condensed)" }}
            >
              No pending action items
            </p>
            <p
              className="text-gray-400 text-sm mt-1"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              {connection
                ? "Your inbox is all caught up."
                : "Connect Gmail to get started."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onAction={(id) => updateStatus(id, "actioned")}
                onDismiss={(id) => updateStatus(id, "dismissed")}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
