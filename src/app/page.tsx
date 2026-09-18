"use client";

import React, { useEffect } from "react";
import { Header } from "@/components/dashboard/Header";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { TaskList } from "@/components/dashboard/TaskList";
import { CreateTaskDialog } from "@/components/dashboard/CreateTaskDialog";
import { AuthModal } from "@/components/auth/AuthModal";
import { ElementalCodex } from "@/components/dashboard/ElementalCodex";
import { useTasksQuery } from "@/hooks/useTasks";
import { Sparkles, Plus } from "lucide-react";
import { profileService } from "@/lib/services/profileService";
import { useCatalystStore } from "@/store/useCatalystStore";

export default function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const setCreateModalOpen = useCatalystStore((s) => s.setCreateModalOpen);

  useEffect(() => {
    // Automatically sync detected user timezone to profile on app load
    profileService.syncUserTimezone();
  }, []);

  const currentDateFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-pink-500 selection:text-white">
      {/* Background Deep Cosmic Gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-sky-600/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-20 h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 h-[500px] w-[500px] rounded-full bg-orange-600/10 blur-[150px]" />
      </div>

      {/* Main Navigation Header */}
      <Header />

      <main className="relative z-10 mx-auto max-w-[1700px] px-4 py-8 sm:px-8 lg:px-12">
        {/* Hero Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>{currentDateFormatted}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-400">
                <Sparkles className="h-3 w-3" />
                Elemental Engine Active
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Ignite Your Momentum
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Each daily completion stokes your catalyst. Advance from subtle Blue Embers to a full
              Supernova Singularity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ElementalCodex />
            <button
              onClick={() => setCreateModalOpen(true)}
              className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-orange-500 to-pink-500 p-[1px] font-semibold text-white shadow-glow-tier2 transition duration-200 hover:scale-[1.02] hover:shadow-glow-tier5 active:scale-95"
            >
              <span className="flex items-center gap-2 rounded-[15px] bg-catalyst-surface/90 px-4 py-2.5 text-xs sm:text-sm font-bold backdrop-blur-md transition group-hover:bg-catalyst-surface/70">
                <Plus className="h-4 w-4 text-orange-400 transition-transform duration-200 group-hover:rotate-90" />
                Add Catalyst
              </span>
            </button>
          </div>
        </div>

        {/* Stats & Tier Breakdown Bar */}
        <div className="mb-8">
          <StatsOverview tasks={tasks} />
        </div>

        {/* Filterable, Sortable Task Grid */}
        <TaskList tasks={tasks} isLoading={isLoading} />
      </main>

      {/* Dialog Modals */}
      <CreateTaskDialog />
      <AuthModal />
    </div>
  );
}
