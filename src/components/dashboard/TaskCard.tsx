"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  CheckCircle2,
  Circle,
  Zap,
  Sun,
  Sparkles,
  Atom,
  Trash2,
  Clock,
  MoreVertical,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { TaskWithStreak, StreakTier } from "@/types";
import { ElementalCanvas } from "@/components/elemental/ElementalCanvas";
import { getFormattedTimeUntilMidnight, isStreakRestorable, STREAK_TIERS } from "@/lib/utils";
import { useCatalystStore } from "@/store/useCatalystStore";
import { useToggleTaskComplete, useDeleteTask, useProfileQuery, useRestoreStreak } from "@/hooks/useTasks";

interface TaskCardProps {
  task: TaskWithStreak;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const flaringTaskId = useCatalystStore((s) => s.flaringTaskId);
  const fizzlingTaskId = useCatalystStore((s) => s.fizzlingTaskId);

  const { data: profile } = useProfileQuery();
  const toggleMutation = useToggleTaskComplete();
  const deleteMutation = useDeleteTask();
  const restoreMutation = useRestoreStreak();

  const restorableStatus = isStreakRestorable(task.streak);
  const userEnergy = profile?.cosmic_energy ?? 0;
  const hasEnoughEnergy = userEnergy >= restorableStatus.cost;

  const isFlaring = flaringTaskId === task.id;
  const isFizzling = fizzlingTaskId === task.id;

  const getTierIcon = (tier: StreakTier) => {
    switch (tier) {
      case "tier1":
        return <Flame className="h-4 w-4 text-sky-400" />;
      case "tier2":
        return <Zap className="h-4 w-4 text-orange-400" />;
      case "tier3":
        return <Sun className="h-4 w-4 text-amber-300" />;
      case "tier4":
        return <Sparkles className="h-4 w-4 text-purple-300" />;
      case "tier5":
        return <Atom className="h-4 w-4 text-pink-400 animate-spin-slow" />;
      default:
        return <Flame className="h-4 w-4 text-slate-500" />;
    }
  };

  // Border & Glow styling by tier
  const getCardBorderClass = (tier: StreakTier, completed: boolean) => {
    if (isFizzling) return "border-slate-700 bg-slate-900/40 opacity-70";
    if (tier === "tier5") {
      return "border-transparent bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 shadow-glow-tier5 ring-1 ring-pink-500/40";
    }
    if (tier === "tier4") {
      return "border-purple-500/30 shadow-glow-tier4 bg-purple-950/20";
    }
    if (tier === "tier3") {
      return "border-amber-500/30 shadow-glow-tier3 bg-amber-950/20";
    }
    if (tier === "tier2") {
      return "border-orange-500/30 shadow-glow-tier2 bg-orange-950/20";
    }
    if (tier === "tier1") {
      return "border-sky-500/30 shadow-glow-tier1 bg-sky-950/20";
    }
    return "border-white/10 bg-catalyst-surface/80";
  };

  // Next milestone calculation
  const getNextTierThreshold = (current: number) => {
    if (current < 1) return { next: 1, label: "Ember Flame (1d)" };
    if (current < 5) return { next: 5, label: "Plasma Burst (5d)" };
    if (current < 15) return { next: 15, label: "Solar Flare (15d)" };
    if (current < 30) return { next: 30, label: "Cosmic Vortex (30d)" };
    if (current < 100) return { next: 100, label: "Supernova Singularity (100d)" };
    return { next: 365, label: "Cosmic Master (365d)" };
  };

  const nextMilestone = getNextTierThreshold(task.streak.current_streak);
  const prevMin = task.tierInfo.minDays;
  const progressPercent =
    task.tier === "tier5"
      ? Math.min(100, (task.streak.current_streak / 100) * 100)
      : Math.min(
          100,
          Math.max(
            15,
            ((task.streak.current_streak - prevMin) / (nextMilestone.next - prevMin)) * 100
          )
        );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isFlaring ? [1, 1.04, 0.98, 1] : 1,
      }}
      transition={{
        duration: 0.4,
        scale: { duration: 0.6, times: [0, 0.3, 0.6, 1] },
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/20 ${getCardBorderClass(
        task.tier,
        task.isCompletedToday
      )}`}
    >
      {/* Dynamic Animated Border Beam for Tier 5 Singularity */}
      {task.tier === "tier5" && (
        <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-30 blur-[2px] transition duration-500 group-hover:opacity-60" />
      )}

      {/* Elemental Catalyst Canvas Engine */}
      <ElementalCanvas
        tier={task.tier}
        isCompletedToday={task.isCompletedToday}
        isFlaring={isFlaring}
        isFizzling={isFizzling}
      />

      {/* Card Content (z-index above canvas) */}
      <div className="relative z-10">
        {/* Top bar: Category + Tier Badge + Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${task.tierInfo.badgeBg} ${task.tierInfo.badgeBorder} ${task.tierInfo.badgeText}`}
            >
              {getTierIcon(task.tier)}
              {task.tierInfo.name}
            </span>

            {task.category && (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {task.category}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1 text-slate-400 opacity-60 transition hover:bg-white/10 hover:text-slate-200 hover:opacity-100"
              title="Card options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Quick Actions Dropdown */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-8 z-50 w-40 rounded-xl border border-white/10 bg-catalyst-surface/95 p-1.5 shadow-2xl backdrop-blur-xl"
                >
                  <button
                    onClick={() => {
                      deleteMutation.mutate(task.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Habit
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Task Title & Description */}
        <div className="mt-4">
          <h3
            className={`text-lg font-bold tracking-tight text-white transition-colors duration-200 ${
              task.isCompletedToday ? "line-through text-slate-400" : ""
            }`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-1 text-sm text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Streak Stats & Countdown */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-white/5 bg-black/30 p-3 backdrop-blur-sm">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Current Streak</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white">
                {task.streak.current_streak}
              </span>
              <span className="text-xs font-medium text-slate-400">days</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Personal Best</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-xl font-bold tracking-tight text-slate-300">
                {task.streak.max_streak}
              </span>
              <span className="text-xs font-medium text-slate-500">days</span>
            </div>
          </div>
        </div>

        {/* Broken Streak Restorable Alert Banner (< 24h grace window) */}
        {restorableStatus.canRestore && (
          <div className="mt-3.5 rounded-xl border border-pink-500/30 bg-pink-950/40 p-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-1 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-pink-300">
                <AlertTriangle className="h-3.5 w-3.5 text-pink-400 shrink-0" />
                <span>Broken Streak: {restorableStatus.targetStreak}d ({STREAK_TIERS[restorableStatus.targetTier].name})</span>
              </span>
              <span className="text-[10px] font-semibold text-pink-200 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
                {restorableStatus.hoursLeft}h {restorableStatus.minutesLeft}m left
              </span>
            </div>
            <p className="mt-1 text-[11px] text-pink-300/80">
              Restore this streak using {restorableStatus.cost} Cosmic Energy (Available: {userEnergy}).
            </p>
          </div>
        )}

        {/* Expired Broken Streak Banner (> 24h) */}
        {!restorableStatus.canRestore && task.streak.current_streak === 0 && (task.streak.broken_streak ?? 0) > 0 && (
          <div className="mt-3.5 rounded-xl border border-slate-700/60 bg-slate-900/50 p-2.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <AlertTriangle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Previous {task.streak.broken_streak}d streak expired (&gt;1 day). Ignite to restart!</span>
            </div>
          </div>
        )}

        {/* Evolution Progress Bar */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              Target: {nextMilestone.label}
            </span>
            <span className="font-semibold text-slate-300">{Math.round(progressPercent)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${task.tierInfo.accentColor}, #ffffff)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Action Row: Local Midnight Timer & Complete / Restore Buttons */}
      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <span>{getFormattedTimeUntilMidnight()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Restore Streak Button when restorable within 1 day */}
          {restorableStatus.canRestore && (
            <motion.button
              whileHover={hasEnoughEnergy ? { scale: 1.04 } : {}}
              whileTap={hasEnoughEnergy ? { scale: 0.94 } : {}}
              onClick={() => restoreMutation.mutate(task.id)}
              disabled={!hasEnoughEnergy || restoreMutation.isPending}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold tracking-wide transition-all duration-300 ${
                hasEnoughEnergy
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-glow-tier4 hover:from-pink-400 hover:to-purple-500 border border-pink-400/40"
                  : "bg-slate-800/80 text-slate-400 border border-slate-700/50 cursor-not-allowed"
              }`}
              title={
                hasEnoughEnergy
                  ? `Restore ${restorableStatus.targetStreak}-day streak for ${restorableStatus.cost} Cosmic Energy`
                  : `Requires ${restorableStatus.cost} Cosmic Energy (You have ${userEnergy})`
              }
            >
              <RotateCcw className={`h-3.5 w-3.5 ${restoreMutation.isPending ? "animate-spin" : ""}`} />
              <span>Restore ({restorableStatus.cost}⚡)</span>
            </motion.button>
          )}

          {/* Ignite Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => toggleMutation.mutate(task.id)}
            disabled={toggleMutation.isPending}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-300 ${
              task.isCompletedToday
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-white text-black hover:bg-slate-200 shadow-glow-sm"
            }`}
          >
            {task.isCompletedToday ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Ignited Today!
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 text-black" />
                Ignite Catalyst
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
