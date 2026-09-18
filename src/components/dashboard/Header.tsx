"use client";

import React, { useState, useEffect } from "react";
import {
  Flame,
  Volume2,
  VolumeX,
  User,
  UserCheck,
  Moon,
} from "lucide-react";
import { useCatalystStore } from "@/store/useCatalystStore";
import { getFormattedTimeUntilMidnight } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { profileService } from "@/lib/services/profileService";

export const Header: React.FC = () => {
  const isAudioMuted = useCatalystStore((s) => s.isAudioMuted);
  const toggleAudioMute = useCatalystStore((s) => s.toggleAudioMute);
  const setAuthModalOpen = useCatalystStore((s) => s.setAuthModalOpen);

  const [timeLeft, setTimeLeft] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [timezoneLabel, setTimezoneLabel] = useState<string>("");

  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    setTimeLeft(getFormattedTimeUntilMidnight());
    setTimezoneLabel(profileService.getTimezoneLabel());

    const timer = setInterval(() => {
      setTimeLeft(getFormattedTimeUntilMidnight());
    }, 60000);

    // Track active user session
    if (isConfigured) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          setUserEmail(data?.user?.email ?? null);
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setUserEmail(session?.user?.email ?? null);
          }
        );

        return () => {
          clearInterval(timer);
          authListener?.subscription.unsubscribe();
        };
      } catch {
        // Fallback
      }
    }

    return () => clearInterval(timer);
  }, [isConfigured]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between px-4 py-3 sm:px-8 lg:px-12">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-orange-500 to-pink-500 p-0.5 shadow-glow-tier2">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-background">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">
                CATALYST
              </span>
              <span className="rounded-full border border-sky-500/30 bg-sky-950/60 px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                Elemental
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Daily habit momentum evolving through 5 cosmic tiers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Midnight Countdown pill with detected local timezone */}
          <div
            className="hidden md:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur-md"
            title={`Your local timezone: ${timezoneLabel}`}
          >
            <Moon className="h-3.5 w-3.5 text-amber-400" />
            <span>Midnight Reset:</span>
            <span className="font-semibold text-white">{timeLeft || "Calculating..."}</span>
            <span className="text-[10px] text-slate-400">({timezoneLabel})</span>
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleAudioMute}
            className={`rounded-xl border p-2.5 transition duration-200 ${
              isAudioMuted
                ? "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                : "border-sky-500/40 bg-sky-950/40 text-sky-400 shadow-glow-sm hover:bg-sky-900/40"
            }`}
            title={isAudioMuted ? "Unmute sound FX" : "Mute sound FX"}
          >
            {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          {/* Sign Up / Account Button */}
          <button
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition duration-200 hover:bg-white/10 hover:text-white"
          >
            {userEmail ? (
              <>
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline max-w-[120px] truncate text-emerald-300">
                  {userEmail}
                </span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-sky-400" />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
