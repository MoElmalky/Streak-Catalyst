import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StreakTier, StreakTierInfo } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STREAK_TIERS: Record<StreakTier, StreakTierInfo> = {
  tier0: {
    tier: "tier0",
    name: "Dormant Core",
    subtitle: "0 Days",
    colorName: "Slate Ash",
    minDays: 0,
    maxDays: 0,
    description: "Cold embers waiting for ignition.",
    badgeBg: "bg-slate-900/80",
    badgeBorder: "border-slate-700/60",
    badgeText: "text-slate-400",
    accentColor: "#64748b",
    particleColors: ["#475569", "#64748b", "#334155"],
  },
  tier1: {
    tier: "tier1",
    name: "Ember Flame",
    subtitle: "1–4 Days",
    colorName: "Azure Flame",
    minDays: 1,
    maxDays: 4,
    description: "Subtle blue ambient flame with low particle count.",
    badgeBg: "bg-sky-950/70",
    badgeBorder: "border-sky-500/40",
    badgeText: "text-sky-300",
    accentColor: "#38bdf8",
    particleColors: ["#38bdf8", "#0284c7", "#7dd3fc", "#0369a1"],
  },
  tier2: {
    tier: "tier2",
    name: "Plasma Burst",
    subtitle: "5–14 Days",
    colorName: "Dual-Tone Cyan & Fire",
    minDays: 5,
    maxDays: 14,
    description: "Intense blue and orange dual-tone plasma with floating embers.",
    badgeBg: "bg-orange-950/60",
    badgeBorder: "border-orange-500/50",
    badgeText: "text-orange-300",
    accentColor: "#ff5e00",
    particleColors: ["#00f0ff", "#ff5e00", "#ffaa00", "#38bdf8", "#ff3300"],
  },
  tier3: {
    tier: "tier3",
    name: "Solar Flare",
    subtitle: "15–29 Days",
    colorName: "Golden Corona",
    minDays: 15,
    maxDays: 29,
    description: "Radiant white/gold energy core emitting radial light beams.",
    badgeBg: "bg-amber-950/70",
    badgeBorder: "border-amber-400/60",
    badgeText: "text-amber-200",
    accentColor: "#fbbf24",
    particleColors: ["#ffffff", "#fef08a", "#fbbf24", "#f59e0b", "#d97706"],
  },
  tier4: {
    tier: "tier4",
    name: "Cosmic Vortex",
    subtitle: "30–99 Days",
    colorName: "Hyper Violet & Cyan",
    minDays: 30,
    maxDays: 99,
    description: "Ultra-vibrant cosmic vortex with dense gravitational particle orbit.",
    badgeBg: "bg-purple-950/70",
    badgeBorder: "border-purple-500/60",
    badgeText: "text-purple-200",
    accentColor: "#c084fc",
    particleColors: ["#c084fc", "#a855f7", "#06b6d4", "#ec4899", "#8b5cf6"],
  },
  tier5: {
    tier: "tier5",
    name: "Supernova Singularity",
    subtitle: "100+ Days",
    colorName: "Prismatic Event Horizon",
    minDays: 100,
    maxDays: 999999,
    description: "Pulsing black hole accretion disk with hyper-speed light trails and chromatic refraction.",
    badgeBg: "bg-fuchsia-950/80",
    badgeBorder: "border-pink-500/80",
    badgeText: "text-pink-200",
    accentColor: "#ec4899",
    particleColors: ["#ffffff", "#ec4899", "#8b5cf6", "#06b6d4", "#f43f5e", "#fbbf24"],
  },
};

export function getStreakTier(streak: number): StreakTier {
  if (streak <= 0) return "tier0";
  if (streak >= 1 && streak <= 4) return "tier1";
  if (streak >= 5 && streak <= 14) return "tier2";
  if (streak >= 15 && streak <= 29) return "tier3";
  if (streak >= 30 && streak <= 99) return "tier4";
  return "tier5";
}

export function isCompletedOnDate(isoString: string | null, targetDate: Date = new Date()): boolean {
  if (!isoString) return false;
  const date = new Date(isoString);
  return (
    date.getFullYear() === targetDate.getFullYear() &&
    date.getMonth() === targetDate.getMonth() &&
    date.getDate() === targetDate.getDate()
  );
}

export function isCompletedToday(isoString: string | null): boolean {
  return isCompletedOnDate(isoString, new Date());
}

export function isCompletedYesterday(isoString: string | null): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isCompletedOnDate(isoString, yesterday);
}

export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

export function getFormattedTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m left`;
}
