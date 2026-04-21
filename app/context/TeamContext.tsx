"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createBrowserSupabase } from "@/app/lib/supabase";

interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
}

interface TeamContextValue {
  teamId: string | null;
  setTeamId: (id: string) => void;
  refresh: number;
  triggerRefresh: () => void;
  user: User | null;
  signOut: () => Promise<void>;
}

const TeamContext = createContext<TeamContextValue>({
  teamId: null,
  setTeamId: () => {},
  refresh: 0,
  triggerRefresh: () => {},
  user: null,
  signOut: async () => {},
});

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamId, setTeamIdState] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  const setTeamId = useCallback((id: string) => {
    setTeamIdState(id);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefresh((r) => r + 1);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  // Load current user on mount
  useEffect(() => {
    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      setUser({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name ?? u.email,
        avatar: u.user_metadata?.avatar_url,
      });
    });
  }, []);

  // Auto-load user's most recent team on mount
  useEffect(() => {
    if (teamId) return; // already set (e.g. from AI chat)
    fetch("/api/teams/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.team?.id) setTeamIdState(data.team.id);
      })
      .catch(() => {});
  }, [teamId]);

  return (
    <TeamContext.Provider value={{ teamId, setTeamId, refresh, triggerRefresh, user, signOut }}>
      {children}
    </TeamContext.Provider>
  );
}

export const useTeam = () => useContext(TeamContext);
