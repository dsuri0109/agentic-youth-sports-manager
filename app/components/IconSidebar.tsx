"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NikeSwoosh from "./NikeSwoosh";
import { HomeIcon, TeamIcon, StaysIcon, PaymentsIcon, LogisticsIcon, InboxIcon } from "./NavIcons";
import { useTeam } from "@/app/context/TeamContext";

const NAV_ITEMS = [
  { id: "team",         label: "Team Management",     Icon: TeamIcon },
  { id: "home",         label: "Dashboard",           Icon: HomeIcon },
  { id: "stays",        label: "Stays",               Icon: StaysIcon },
  { id: "action-items", label: "Action Items",        Icon: InboxIcon },
  { id: "payments",     label: "Finances & Payments", Icon: PaymentsIcon },
  { id: "logistics",    label: "Day of Logistics",    Icon: LogisticsIcon },
];

const glassActive: React.CSSProperties = {
  background: "rgba(200, 240, 0, 0.55)",
  border: "1px solid rgba(200, 240, 0, 0.75)",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 8px rgba(200,240,0,0.22)",
  color: "#0D1B2E",
};

const glassIdle: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(0,0,0,0.07)",
  backdropFilter: "blur(12px) saturate(140%)",
  WebkitBackdropFilter: "blur(12px) saturate(140%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
  color: "#9ca3af",
};

const glassAvatar: React.CSSProperties = {
  background: "rgba(13,27,46,0.65)",
  border: "1px solid rgba(13,27,46,0.35)",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.14)",
  color: "#fff",
};

const glassLogo: React.CSSProperties = {
  background: "rgba(200, 240, 0, 0.55)",
  border: "1px solid rgba(200, 240, 0, 0.75)",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 2px 10px rgba(200,240,0,0.22)",
};

const ROUTES: Record<string, string> = {
  home:           "/",
  team:           "/team",
  stays:          "/stays",
  payments:       "/payments",
  logistics:      "/",
  "action-items": "/action-items",
};

function getActiveId(pathname: string): string {
  if (pathname.startsWith("/stays"))        return "stays";
  if (pathname.startsWith("/action-items")) return "action-items";
  if (pathname.startsWith("/payments"))     return "payments";
  if (pathname.startsWith("/logistics"))    return "logistics";
  if (pathname === "/")                     return "home";
  if (pathname.startsWith("/team"))         return "team";
  return "team";
}

export default function IconSidebar() {
  const pathname = usePathname();
  const active = getActiveId(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, teamId, signOut } = useTeam();
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleDeleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (!user?.id || !teamId) {
      await signOut();
      return;
    }
    setDeleting(true);
    try {
      await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, userId: user.id }),
      });
    } catch (e) {
      console.error("Delete account error:", e);
    }
    await signOut();
  }

  return (
    <aside className="w-16 shrink-0 flex flex-col items-center bg-white border-r border-gray-100 h-full py-4">

      {/* Nike swoosh logo — glass volt pill */}
      <div
        className="mb-6 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150"
        style={glassLogo}
      >
        <NikeSwoosh className="w-6 h-auto text-black" />
      </div>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <div key={id} className="relative group w-full flex justify-center">
            <button
              onClick={() => router.push(ROUTES[id] ?? "/")}
              aria-label={label}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95"
              style={active === id ? glassActive : glassIdle}
            >
              <Icon className="w-5 h-5" />
            </button>

            {/* Tooltip — glass dark */}
            <div
              className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                background: "rgba(13,27,46,0.75)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(16px) saturate(160%)",
                WebkitBackdropFilter: "blur(16px) saturate(160%)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              }}
            >
              {label}
              <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[rgba(13,27,46,0.75)]" />
            </div>
          </div>
        ))}
      </nav>

      {/* User avatar + popout menu */}
      <div className="relative flex flex-col items-center mb-10" ref={menuRef}>
        <button
          onClick={() => { setMenuOpen((o) => !o); setConfirmDelete(false); }}
          aria-label="User menu"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black uppercase tracking-wide transition-all duration-150 hover:scale-105 overflow-hidden"
          style={{ fontFamily: "var(--font-barlow-condensed)", ...glassAvatar }}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name ?? "User"} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </button>

        {/* Popout menu */}
        {menuOpen && (
          <div
            className="absolute bottom-full mb-3 left-full ml-3 w-52 rounded-2xl overflow-hidden z-50"
            style={{
              background: "rgba(13,27,46,0.92)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(20px) saturate(160%)",
              WebkitBackdropFilter: "blur(20px) saturate(160%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
            }}
          >
            {/* User info */}
            {user?.email && (
              <div className="px-4 py-3 border-b border-white/10">
                <p
                  className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: "var(--font-barlow-condensed)" }}
                >
                  Signed in as
                </p>
                <p
                  className="text-white text-xs truncate"
                  style={{ fontFamily: "var(--font-barlow)" }}
                >
                  {user.email}
                </p>
              </div>
            )}

            {/* Log out */}
            <button
              onClick={() => { setMenuOpen(false); signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              style={{ fontFamily: "var(--font-barlow)", fontSize: 13 }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Log Out
            </button>

            {/* Delete account */}
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-t border-white/10"
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: 13,
                color: confirmDelete ? "#fca5a5" : "rgba(239,68,68,0.7)",
                background: confirmDelete ? "rgba(239,68,68,0.15)" : "transparent",
                cursor: deleting ? "not-allowed" : "pointer",
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 shrink-0" aria-hidden="true">
                <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {deleting ? "Deleting…" : confirmDelete ? "Tap again to confirm" : "Delete Account"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
