export type StreakTier = "tier0" | "tier1" | "tier2" | "tier3" | "tier4" | "tier5";

export interface StreakTierInfo {
  tier: StreakTier;
  name: string;
  subtitle: string;
  colorName: string;
  minDays: number;
  maxDays: number;
  description: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  accentColor: string;
  particleColors: string[];
  restoreCost: number;
  energyReward: number;
}

export interface Profile {
  id: string;
  email: string;
  timezone: string;
  cosmic_energy: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  category?: "focus" | "body" | "mind" | "craft" | "cosmic";
}

export interface Streak {
  id: string;
  task_id: string;
  user_id: string;
  current_streak: number;
  max_streak: number;
  last_completed_at: string | null;
  updated_at: string;
  broken_streak?: number | null;
  broken_at?: string | null;
}

export interface TaskWithStreak extends Task {
  streak: Streak;
  isCompletedToday: boolean;
  tier: StreakTier;
  tierInfo: StreakTierInfo;
}

export type FilterOption = "all" | "active" | "completed" | "at-risk";
export type SortOption = "streak-desc" | "streak-asc" | "created-desc" | "alphabetical";

export interface CreateTaskInput {
  title: string;
  description?: string;
  category?: "focus" | "body" | "mind" | "craft" | "cosmic";
}
