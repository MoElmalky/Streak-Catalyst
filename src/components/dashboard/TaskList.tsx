"use client";

import React from "react";
import { Search, Filter, ArrowUpDown, Plus, Sparkles } from "lucide-react";
import { TaskWithStreak, FilterOption, SortOption } from "@/types";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { useCatalystStore } from "@/store/useCatalystStore";

interface TaskListProps {
  tasks: TaskWithStreak[];
  isLoading: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading }) => {
  const filter = useCatalystStore((s) => s.filter);
  const setFilter = useCatalystStore((s) => s.setFilter);
  const sort = useCatalystStore((s) => s.sort);
  const setSort = useCatalystStore((s) => s.setSort);
  const searchQuery = useCatalystStore((s) => s.searchQuery);
  const setSearchQuery = useCatalystStore((s) => s.setSearchQuery);
  const setCreateModalOpen = useCatalystStore((s) => s.setCreateModalOpen);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTier = task.tierInfo.name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchTier) return false;
    }

    // Status filter
    if (filter === "completed") return task.isCompletedToday;
    if (filter === "active") return !task.isCompletedToday;
    if (filter === "at-risk") return task.streak.current_streak === 0;

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sort === "streak-desc") return b.streak.current_streak - a.streak.current_streak;
    if (sort === "streak-asc") return a.streak.current_streak - b.streak.current_streak;
    if (sort === "created-desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === "alphabetical") return a.title.localeCompare(b.title);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Control Bar: Search + Filter Tabs + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-md">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-white/15 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "active"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Today ({tasks.filter((t) => !t.isCompletedToday).length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "completed"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ignited ({tasks.filter((t) => t.isCompletedToday).length})
          </button>
          <button
            onClick={() => setFilter("at-risk")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "at-risk"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Dormant / 0d ({tasks.filter((t) => t.streak.current_streak === 0).length})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search habits & tiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 outline-none backdrop-blur-md transition focus:border-sky-400"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 pr-7 text-xs font-medium text-slate-300 outline-none backdrop-blur-md transition hover:border-white/20 focus:border-sky-400"
            >
              <option value="streak-desc">Highest Streak</option>
              <option value="streak-asc">Lowest Streak</option>
              <option value="created-desc">Newest First</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : sortedTasks.length > 0 ? (
        /* Task Cards Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {sortedTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-catalyst-surface/30 p-12 text-center backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 via-orange-500/20 to-pink-500/20 p-2">
            <Sparkles className="h-7 w-7 text-slate-400" />
          </div>
          <h4 className="mt-4 text-base font-bold text-white">No Catalyst Habits Found</h4>
          <p className="mt-1 max-w-sm text-xs text-slate-400">
            {searchQuery
              ? `No habits matched "${searchQuery}". Clear your search or filter.`
              : "Start igniting your first elemental streak by adding a habit."}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-5 flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-slate-200 shadow-glow-sm"
          >
            <Plus className="h-4 w-4" />
            Create First Catalyst
          </button>
        </div>
      )}
    </div>
  );
};
