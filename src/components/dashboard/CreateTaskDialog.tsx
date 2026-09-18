"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Sparkles, Brain, Dumbbell, Code2, Compass } from "lucide-react";
import { useCatalystStore } from "@/store/useCatalystStore";
import { useCreateTask } from "@/hooks/useTasks";

const CATEGORIES = [
  { id: "focus", label: "Focus", icon: Brain, color: "text-purple-400" },
  { id: "body", label: "Body", icon: Dumbbell, color: "text-emerald-400" },
  { id: "mind", label: "Mind", icon: Compass, color: "text-sky-400" },
  { id: "craft", label: "Craft", icon: Code2, color: "text-orange-400" },
  { id: "cosmic", label: "Cosmic", icon: Sparkles, color: "text-pink-400" },
] as const;

export const CreateTaskDialog: React.FC = () => {
  const isCreateModalOpen = useCatalystStore((s) => s.isCreateModalOpen);
  const setCreateModalOpen = useCatalystStore((s) => s.setCreateModalOpen);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"focus" | "body" | "mind" | "craft" | "cosmic">("focus");
  const [formError, setFormError] = useState<string>("");

  const createMutation = useCreateTask();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError("Please enter a habit title.");
      return;
    }

    setFormError("");

    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setCategory("focus");
          setFormError("");
          setCreateModalOpen(false);
        },
        onError: (err: any) => {
          setFormError(err?.message || "Failed to create task. Please try again.");
        },
      }
    );
  };

  if (!isCreateModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-catalyst-surface p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Top cosmic ambient light */}
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gradient-to-tr from-sky-500/20 via-orange-500/20 to-pink-500/20 blur-3xl" />

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30">
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
              <h3 className="text-base font-bold text-white">Create New Catalyst Habit</h3>
            </div>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="rounded-xl p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Every daily victory builds momentum, evolving your element from an Ember into a Supernova.
          </p>

          {formError && (
            <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Habit Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Morning Deep Work, 5km Run, Meditation"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Why this matters (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Define the minimum viable routine or intention..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-sky-400"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Elemental Category
              </label>
              <div className="mt-1.5 grid grid-cols-5 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                        isSelected
                          ? "border-sky-400 bg-sky-950/60 shadow-glow-sm"
                          : "border-white/10 bg-black/30 hover:border-white/20"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${cat.color}`} />
                      <span className="text-[10px] font-medium text-slate-300">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || createMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-white px-5 py-2 text-xs font-bold text-black transition hover:bg-slate-200 disabled:opacity-50 shadow-glow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-black" />
                {createMutation.isPending ? "Igniting..." : "Begin Catalyst"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
