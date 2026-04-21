"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type MorphicState = "default" | "choose" | "attach" | "done" | "confirm";

export interface MorphicAction {
  id: string;
  label: string;
  variant: "volt" | "outline" | "ghost";
  icon?: string;
  onClick?: () => void;
}

export interface MorphicConfig {
  state: MorphicState;
  context: string;
  subtext: string;
  actions: MorphicAction[];
  // CHOOSE: two big option cards
  choiceA?: { label: string; description: string; icon: string };
  choiceB?: { label: string; description: string; icon: string };
  // ATTACH: three upload options
  attachOptions?: Array<{ id: string; label: string; icon: string }>;
}

const DEFAULT_CONFIG: MorphicConfig = {
  state: "default",
  context: "Grand Hyatt Dallas · $174/night · Nike Rate · 8 min to venue",
  subtext: "AI Travel Agent · Just now",
  actions: [
    { id: "book",   label: "Book Now",      variant: "volt",    icon: "✓" },
    { id: "change", label: "Change Hotel",  variant: "outline" },
    { id: "map",    label: "See Map",       variant: "ghost" },
    { id: "alts",   label: "Alternatives", variant: "ghost" },
  ],
};

interface MorphicBarContextType {
  config: MorphicConfig;
  setConfig: (config: MorphicConfig) => void;
  resetConfig: () => void;
}

const MorphicBarContext = createContext<MorphicBarContextType | null>(null);

export function MorphicBarProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MorphicConfig>(DEFAULT_CONFIG);
  return (
    <MorphicBarContext.Provider value={{ config, setConfig, resetConfig: () => setConfig(DEFAULT_CONFIG) }}>
      {children}
    </MorphicBarContext.Provider>
  );
}

export function useMorphicBar() {
  const ctx = useContext(MorphicBarContext);
  if (!ctx) throw new Error("useMorphicBar must be used within MorphicBarProvider");
  return ctx;
}
