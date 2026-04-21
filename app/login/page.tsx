"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/app/lib/supabase";
import NikeSwoosh from "@/app/components/NikeSwoosh";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "#F5F5F0" }}
    >
      <div
        className="w-full max-w-sm mx-auto px-8 py-10 rounded-3xl flex flex-col items-center gap-6"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 4px 32px rgba(0,0,0,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "#C8F000" }}
        >
          <NikeSwoosh className="w-8 h-8 text-[#0D1B2E]" />
        </div>

        <div className="text-center">
          <h1
            className="text-[22px] font-black uppercase tracking-widest text-[#0D1B2E]"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            Nike Youth Sports
          </h1>
          <p
            className="text-[12px] text-gray-400 mt-1 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-barlow-condensed)" }}
          >
            Power of agents in parent's hands
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            fontFamily: "var(--font-barlow)",
            background: "#0D1B2E",
            color: "#fff",
            border: "1px solid rgba(13,27,46,0.8)",
            boxShadow: "0 2px 12px rgba(13,27,46,0.15)",
          }}
        >
          {/* Google icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p
          className="text-[10px] text-gray-400 text-center"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          By signing in you agree to Nike's Terms of Service
        </p>
      </div>
    </div>
  );
}
