import { create } from "zustand";
import { FilterOption, SortOption, StreakTier } from "@/types";
import { soundFX } from "@/lib/audio";

interface CatalystStore {
  // Filters & Search
  filter: FilterOption;
  setFilter: (filter: FilterOption) => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Dialogs & Modals
  isCreateModalOpen: boolean;
  setCreateModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;

  // Audio State
  isAudioMuted: boolean;
  toggleAudioMute: () => void;

  // Animation Triggers
  flaringTaskId: string | null;
  setFlaringTaskId: (id: string | null) => void;
  fizzlingTaskId: string | null;
  setFizzlingTaskId: (id: string | null) => void;

  // Active Tier Showcase
  showcaseTier: StreakTier | null;
  setShowcaseTier: (tier: StreakTier | null) => void;
}

export const useCatalystStore = create<CatalystStore>((set) => ({
  filter: "all",
  setFilter: (filter) => set({ filter }),
  sort: "streak-desc",
  setSort: (sort) => set({ sort }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  isCreateModalOpen: false,
  setCreateModalOpen: (isCreateModalOpen) => set({ isCreateModalOpen }),
  isAuthModalOpen: false,
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),

  isAudioMuted: soundFX.getIsMuted(),
  toggleAudioMute: () => {
    const nextMuted = soundFX.toggleMute();
    set({ isAudioMuted: nextMuted });
  },

  flaringTaskId: null,
  setFlaringTaskId: (flaringTaskId) => set({ flaringTaskId }),
  fizzlingTaskId: null,
  setFizzlingTaskId: (fizzlingTaskId) => set({ fizzlingTaskId }),

  showcaseTier: null,
  setShowcaseTier: (showcaseTier) => set({ showcaseTier }),
}));
