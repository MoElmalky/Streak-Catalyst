"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Sun, Sparkles, Atom, ChevronRight, Shield, X } from "lucide-react";
import { StreakTier } from "@/types";
import { STREAK_TIERS } from "@/lib/utils";
import { ElementalCanvas } from "@/components/elemental/ElementalCanvas";

export const ElementalCodex: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<StreakTier>("tier5");

  const tierKeys: StreakTier[] = ["tier1", "tier2", "tier3", "tier4", "tier5"];
  const currentTierInfo = STREAK_TIERS[activeTier];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        <Shield className="h-4 w-4 text-sky-400" />
        <span>Elemental Codex & Evolution Guide</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-catalyst-surface p-6 shadow-2xl backdrop-blur-2xl"
            >
              {/* Top ambient glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-pink-500/20 blur-3xl" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/10 border border-pink-500/30">
                    <Atom className="h-4 w-4 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">The Elemental Catalyst Codex</h3>
                    <p className="text-xs text-slate-400">
                      5 distinct physical energy tiers scaling with your consecutive daily streak
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tier Selection Pills */}
              <div className="mt-5 grid grid-cols-5 gap-2">
                {tierKeys.map((k) => {
                  const t = STREAK_TIERS[k];
                  const isSelected = activeTier === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setActiveTier(k)}
                      className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
                        isSelected
                          ? "border-white/40 bg-white/15 shadow-glow-sm"
                          : "border-white/5 bg-black/30 hover:border-white/15"
                      }`}
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {t.subtitle}
                      </span>
                      <span className="mt-0.5 text-xs font-bold text-white line-clamp-1">{t.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Live Canvas Preview */}
              <div className="relative mt-5 h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4">
                <ElementalCanvas tier={activeTier} isCompletedToday={true} />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${currentTierInfo.badgeBg} ${currentTierInfo.badgeBorder} ${currentTierInfo.badgeText}`}
                    >
                      {currentTierInfo.name} ({currentTierInfo.subtitle})
                    </span>
                    <h4 className="mt-2 text-lg font-bold text-white">{currentTierInfo.colorName}</h4>
                    <p className="mt-1 max-w-md text-xs text-slate-300 leading-relaxed">
                      {currentTierInfo.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-semibold">
                        Daily Yield: +{currentTierInfo.energyReward}⚡
                      </span>
                      <span className="text-pink-400 font-semibold">
                        Restore Cost: {currentTierInfo.restoreCost}⚡
                      </span>
                    </div>
                    <span className="text-slate-400">
                      Streak: {currentTierInfo.minDays}–{currentTierInfo.maxDays > 1000 ? "100+" : currentTierInfo.maxDays}d
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer summary */}
              <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-slate-400">
                <strong className="text-slate-200">Cosmic Energy & Restoration Rules:</strong> Completing habits awards Cosmic Energy daily (+1 for Ember, +3 for Plasma, up to +50 for Supernova). If a streak is missed past midnight, you have a strict <span className="text-pink-300 font-semibold">1-day (24h) grace window</span> to rekindle it using your profile&apos;s Cosmic Energy!
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
