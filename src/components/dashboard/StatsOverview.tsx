"use client";

import React from "react";
import { Flame, Zap, Sun, Sparkles, Atom, CheckCircle2, Trophy, Activity } from "lucide-react";
import { TaskWithStreak, StreakTier } from "@/types";
import { STREAK_TIERS } from "@/lib/utils";

interface StatsOverviewProps {
  tasks: TaskWithStreak[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ tasks }) => {
  const completedTodayCount = tasks.filter((t) => t.isCompletedToday).length;
  const maxStreakRecord = tasks.reduce(
    (max, t) => Math.max(max, t.streak.max_streak),
    0
  );

  // Kinetic energy score
  const totalCosmicEnergy = tasks.reduce((acc, t) => {
    const s = t.streak.current_streak;
    let weight = 1;
    if (s >= 100) weight = 50;
    else if (s >= 30) weight = 20;
    else if (s >= 15) weight = 8;
    else if (s >= 5) weight = 3;
    return acc + s * weight;
  }, 0);

  // Group counts by tier
  const tierCounts: Record<StreakTier, number> = {
    tier0: 0,
    tier1: 0,
    tier2: 0,
    tier3: 0,
    tier4: 0,
    tier5: 0,
  };

  tasks.forEach((t) => {
    tierCounts[t.tier] = (tierCounts[t.tier] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      {/* Top Stat Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Completion */}
        <div className="rounded-2xl border border-white/10 bg-catalyst-surface/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Completed Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{completedTodayCount}</span>
            <span className="text-xs text-slate-400">/ {tasks.length} tasks</span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-emerald-400 transition-all duration-500"
              style={{
                width: `${tasks.length ? (completedTodayCount / tasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Highest Streak */}
        <div className="rounded-2xl border border-white/10 bg-catalyst-surface/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Peak Streak</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{maxStreakRecord}</span>
            <span className="text-xs text-slate-400">days record</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-300/80">Highest habit momentum</p>
        </div>

        {/* Cosmic Energy */}
        <div className="rounded-2xl border border-white/10 bg-catalyst-surface/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cosmic Kinetic Energy</span>
            <Activity className="h-4 w-4 text-pink-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{totalCosmicEnergy.toLocaleString()}</span>
            <span className="text-xs text-slate-400">watts</span>
          </div>
          <p className="mt-1 text-[11px] text-pink-300/80">Weighted multiplier score</p>
        </div>

        {/* Supernova Tasks */}
        <div className="rounded-2xl border border-white/10 bg-catalyst-surface/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Singularities</span>
            <Atom className="h-4 w-4 text-fuchsia-400 animate-spin-slow" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white">{tierCounts.tier5}</span>
            <span className="text-xs text-slate-400">100+ day habits</span>
          </div>
          <p className="mt-1 text-[11px] text-fuchsia-300/80">Permanent life routines</p>
        </div>
      </div>

      {/* Tier Breakdown Badges */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md">
        <span className="text-xs font-semibold text-slate-400 mr-1">Active Elements:</span>

        <div className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-950/40 px-2.5 py-1 text-xs text-sky-300">
          <Flame className="h-3.5 w-3.5 text-sky-400" />
          <span>Ember (1-4d):</span>
          <strong className="text-white font-bold">{tierCounts.tier1}</strong>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-950/40 px-2.5 py-1 text-xs text-orange-300">
          <Zap className="h-3.5 w-3.5 text-orange-400" />
          <span>Plasma (5-14d):</span>
          <strong className="text-white font-bold">{tierCounts.tier2}</strong>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-300">
          <Sun className="h-3.5 w-3.5 text-amber-400" />
          <span>Solar (15-29d):</span>
          <strong className="text-white font-bold">{tierCounts.tier3}</strong>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-xs text-purple-300">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Cosmic (30-99d):</span>
          <strong className="text-white font-bold">{tierCounts.tier4}</strong>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-pink-500/30 bg-pink-950/40 px-2.5 py-1 text-xs text-pink-300">
          <Atom className="h-3.5 w-3.5 text-pink-400" />
          <span>Supernova (100d+):</span>
          <strong className="text-white font-bold">{tierCounts.tier5}</strong>
        </div>
      </div>
    </div>
  );
};
