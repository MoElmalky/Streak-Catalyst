import { TaskWithStreak, CreateTaskInput, Task, Streak } from "@/types";
import {
  getStreakTier,
  STREAK_TIERS,
  isCompletedToday,
  isCompletedYesterday,
  isStreakRestorable,
  getStreakRestoreCost,
} from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { profileService } from "@/lib/services/profileService";

const LOCAL_STORAGE_KEY = "catalyst_tasks_data_v2";

const INITIAL_MOCK_DATA: TaskWithStreak[] = [
  {
    id: "task-supernova-1",
    user_id: "demo-user",
    title: "Deep Focus Flow State",
    description: "Uninterrupted 90-minute morning deep work session on core architecture.",
    category: "focus",
    created_at: new Date(Date.now() - 116 * 86400000).toISOString(),
    streak: {
      id: "streak-1",
      task_id: "task-supernova-1",
      user_id: "demo-user",
      current_streak: 115,
      max_streak: 115,
      last_completed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    isCompletedToday: false,
    tier: "tier5",
    tierInfo: STREAK_TIERS.tier5,
  },
  {
    id: "task-cosmic-2",
    user_id: "demo-user",
    title: "Cosmic Breathwork & Ice Plunge",
    description: "15-min Wim Hof breathing cycle followed by cold shock recovery.",
    category: "body",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
    streak: {
      id: "streak-2",
      task_id: "task-cosmic-2",
      user_id: "demo-user",
      current_streak: 42,
      max_streak: 42,
      last_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    isCompletedToday: true,
    tier: "tier4",
    tierInfo: STREAK_TIERS.tier4,
  },
  {
    id: "task-solar-3",
    user_id: "demo-user",
    title: "Calisthenics & Strength",
    description: "Full body progressive overload training and mobility session.",
    category: "body",
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    streak: {
      id: "streak-3",
      task_id: "task-solar-3",
      user_id: "demo-user",
      current_streak: 21,
      max_streak: 21,
      last_completed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    isCompletedToday: false,
    tier: "tier3",
    tierInfo: STREAK_TIERS.tier3,
  },
  {
    id: "task-plasma-4",
    user_id: "demo-user",
    title: "Read 25 Pages of Non-Fiction",
    description: "Absorb deep principles across astrophysics, system design, or history.",
    category: "mind",
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    streak: {
      id: "streak-4",
      task_id: "task-plasma-4",
      user_id: "demo-user",
      current_streak: 8,
      max_streak: 10,
      last_completed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    isCompletedToday: false,
    tier: "tier2",
    tierInfo: STREAK_TIERS.tier2,
  },
  {
    id: "task-ember-5",
    user_id: "demo-user",
    title: "Evening Reflection & Journaling",
    description: "Document daily wins, mental blockages, and tomorrow's #1 objective.",
    category: "craft",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    streak: {
      id: "streak-5",
      task_id: "task-ember-5",
      user_id: "demo-user",
      current_streak: 3,
      max_streak: 3,
      last_completed_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    isCompletedToday: false,
    tier: "tier1",
    tierInfo: STREAK_TIERS.tier1,
  },
  {
    id: "task-dormant-6",
    user_id: "demo-user",
    title: "Hydration Mastery (3L Water)",
    description: "Electrolytes in the morning and minimum 3 liters of filtered water.",
    category: "body",
    created_at: new Date().toISOString(),
    streak: {
      id: "streak-6",
      task_id: "task-dormant-6",
      user_id: "demo-user",
      current_streak: 0,
      max_streak: 8,
      last_completed_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      broken_streak: 8, // Tier 2 Plasma Burst broken streak!
      broken_at: new Date(Date.now() - 8 * 3600000).toISOString(), // Broken 8 hours ago (restorable within 24h grace window)
    },
    isCompletedToday: false,
    tier: "tier0",
    tierInfo: STREAK_TIERS.tier0,
  },
  {
    id: "task-expired-7",
    user_id: "demo-user",
    title: "Speed Typing & Coding Kata",
    description: "Daily 30-minute touch typing drills and algorithms practice.",
    category: "craft",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    streak: {
      id: "streak-7",
      task_id: "task-expired-7",
      user_id: "demo-user",
      current_streak: 0,
      max_streak: 18,
      last_completed_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      broken_streak: 18, // Tier 3 Solar Flare broken streak
      broken_at: new Date(Date.now() - 36 * 3600000).toISOString(), // Broken 36 hours ago (window expired > 1 day)
    },
    isCompletedToday: false,
    tier: "tier0",
    tierInfo: STREAK_TIERS.tier0,
  },
];

function enrichTaskWithStreak(task: Task, streak?: Streak | null): TaskWithStreak {
  const safeStreak: Streak = streak || {
    id: `streak-${task.id}`,
    task_id: task.id,
    user_id: task.user_id,
    current_streak: 0,
    max_streak: 0,
    last_completed_at: null,
    updated_at: new Date().toISOString(),
  };

  const completed = isCompletedToday(safeStreak.last_completed_at);
  const tier = getStreakTier(safeStreak.current_streak);

  return {
    ...task,
    streak: safeStreak,
    isCompletedToday: completed,
    tier,
    tierInfo: STREAK_TIERS[tier],
  };
}

function getLocalStore(): TaskWithStreak[] {
  if (typeof window === "undefined") return INITIAL_MOCK_DATA;
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
    return INITIAL_MOCK_DATA;
  }
  try {
    const parsed: TaskWithStreak[] = JSON.parse(saved);
    return parsed.map((item) => enrichTaskWithStreak(item, item.streak));
  } catch {
    return INITIAL_MOCK_DATA;
  }
}

function saveLocalStore(data: TaskWithStreak[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

export const taskService = {
  async getTasks(): Promise<TaskWithStreak[]> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Sync timezone in background
          profileService.syncUserTimezone().catch(() => {});

          const { data: tasks, error: tasksError } = await supabase
            .from("tasks")
            .select("*, streaks(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!tasksError && tasks) {
            return tasks.map((t: any) => {
              // Safely extract streak from array or object
              const streakData =
                Array.isArray(t.streaks) && t.streaks.length > 0
                  ? t.streaks[0]
                  : t.streaks && !Array.isArray(t.streaks)
                  ? t.streaks
                  : null;

              return enrichTaskWithStreak(t, streakData);
            });
          }
        }
      } catch (e) {
        console.warn("Supabase fetch failed, falling back to local store:", e);
      }
    }

    // Guest fallback
    return getLocalStore();
  },

  async toggleTaskCompletion(taskId: string): Promise<{ task: TaskWithStreak; isNowCompleted: boolean }> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 1. Fetch or ensure streak row
          let currentStreakData: Streak | null = null;
          const { data: existingStreak } = await supabase
            .from("streaks")
            .select("*")
            .eq("task_id", taskId)
            .maybeSingle();

          if (existingStreak) {
            currentStreakData = existingStreak;
          } else {
            const { data: upserted } = await supabase
              .from("streaks")
              .upsert(
                {
                  task_id: taskId,
                  user_id: user.id,
                  current_streak: 0,
                  max_streak: 0,
                  last_completed_at: null,
                },
                { onConflict: "task_id" }
              )
              .select()
              .single();
            currentStreakData = upserted;
          }

          if (currentStreakData) {
            const wasCompleted = isCompletedToday(currentStreakData.last_completed_at);
            const newStreak = !wasCompleted
              ? currentStreakData.current_streak + 1
              : Math.max(0, currentStreakData.current_streak - 1);
            const lastCompleted = !wasCompleted
              ? new Date().toISOString()
              : newStreak > 0
              ? new Date(Date.now() - 86400000).toISOString()
              : null;

            const { data: updatedStreak } = await supabase
              .from("streaks")
              .update({
                current_streak: newStreak,
                last_completed_at: lastCompleted,
                updated_at: new Date().toISOString(),
              })
              .eq("id", currentStreakData.id)
              .select()
              .single();

            const { data: taskData } = await supabase
              .from("tasks")
              .select("*")
              .eq("id", taskId)
              .single();

            if (taskData && updatedStreak) {
              return {
                task: enrichTaskWithStreak(taskData, updatedStreak),
                isNowCompleted: !wasCompleted,
              };
            }
          }
        }
      } catch (err) {
        console.error("Failed to toggle task completion in Supabase:", err);
      }
    }

    // Guest local store update
    const list = getLocalStore();
    const targetIndex = list.findIndex((t) => t.id === taskId);
    if (targetIndex === -1) throw new Error("Task not found");

    const item = list[targetIndex];
    const wasCompleted = isCompletedToday(item.streak.last_completed_at);

    let updatedStreak: Streak;
    if (!wasCompleted) {
      const newStreak = item.streak.current_streak + 1;
      updatedStreak = {
        ...item.streak,
        current_streak: newStreak,
        last_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      const newStreak = Math.max(0, item.streak.current_streak - 1);
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      updatedStreak = {
        ...item.streak,
        current_streak: newStreak,
        last_completed_at: newStreak > 0 ? yesterday : null,
        updated_at: new Date().toISOString(),
      };
    }

    const updatedTask = enrichTaskWithStreak(item, updatedStreak);
    list[targetIndex] = updatedTask;
    saveLocalStore(list);

    return { task: updatedTask, isNowCompleted: !wasCompleted };
  },

  async createTask(input: CreateTaskInput): Promise<TaskWithStreak> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // 1. Ensure user profile exists with accurate local timezone
          const userTz = profileService.getLocalTimezone();
          await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email || "",
                timezone: userTz,
              },
              { onConflict: "id" }
            );

          // 2. Insert the task (resilient to missing category column in database)
          const taskPayload: any = {
            user_id: user.id,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            category: input.category || "focus",
          };

          let { data: createdTask, error: taskError } = await supabase
            .from("tasks")
            .insert(taskPayload)
            .select()
            .single();

          // If the database table does not have the 'category' column yet, retry without it:
          if (taskError && taskError.message?.toLowerCase().includes("category")) {
            delete taskPayload.category;
            const retry = await supabase
              .from("tasks")
              .insert(taskPayload)
              .select()
              .single();

            createdTask = retry.data;
            taskError = retry.error;
          }

          if (taskError || !createdTask) {
            throw taskError || new Error("Failed to insert task");
          }

          // Ensure category is preserved in UI
          createdTask.category = input.category || "focus";

          // 3. Upsert streak row (handles trigger gracefully without duplicate key errors)
          const { data: streakData } = await supabase
            .from("streaks")
            .upsert(
              {
                task_id: createdTask.id,
                user_id: user.id,
                current_streak: 0,
                max_streak: 0,
                last_completed_at: null,
              },
              { onConflict: "task_id" }
            )
            .select()
            .single();

          return enrichTaskWithStreak(createdTask, streakData);
        }
      } catch (e) {
        console.error("Supabase insert task error:", e);
      }
    }

    // Guest fallback (when not signed in)
    const newId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const newTask: Task = {
      id: newId,
      user_id: "guest-user",
      title: input.title,
      description: input.description || null,
      category: input.category || "focus",
      created_at: now,
    };

    const newStreak: Streak = {
      id: `streak-${newId}`,
      task_id: newId,
      user_id: "guest-user",
      current_streak: 0,
      max_streak: 0,
      last_completed_at: null,
      updated_at: now,
    };

    const enriched = enrichTaskWithStreak(newTask, newStreak);
    const list = getLocalStore();
    saveLocalStore([enriched, ...list]);
    return enriched;
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);
        }
      } catch (e) {
        console.error("Supabase delete task error:", e);
      }
    }

    const list = getLocalStore();
    const filtered = list.filter((t) => t.id !== taskId);
    saveLocalStore(filtered);
  },

  async restoreStreak(taskId: string): Promise<{ task: TaskWithStreak; remainingEnergy: number }> {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Attempt using the database function restore_task_streak
          const { data: rpcResult, error: rpcError } = await supabase.rpc("restore_task_streak", {
            p_task_id: taskId,
          });

          if (!rpcError && rpcResult) {
            const { data: updatedTask } = await supabase
              .from("tasks")
              .select("*, streaks(*)")
              .eq("id", taskId)
              .single();

            if (updatedTask) {
              const streakData = Array.isArray(updatedTask.streaks) ? updatedTask.streaks[0] : updatedTask.streaks;
              return {
                task: enrichTaskWithStreak(updatedTask, streakData),
                remainingEnergy: Number(rpcResult.remaining_energy ?? 0),
              };
            }
          }
        }
      } catch (err) {
        console.warn("Supabase restoreStreak RPC error, falling back to local handler:", err);
      }
    }

    // Guest / Local store handler
    const list = getLocalStore();
    const index = list.findIndex((t) => t.id === taskId);
    if (index === -1) throw new Error("Task not found");

    const item = list[index];
    const status = isStreakRestorable(item.streak);
    if (!status.canRestore) {
      throw new Error(status.reason || "Streak cannot be restored");
    }

    // Deduct Cosmic Energy from profile
    const remainingEnergy = await profileService.spendCosmicEnergy(status.cost);

    // Restore streak
    const restoredStreak: Streak = {
      ...item.streak,
      current_streak: status.targetStreak,
      broken_streak: null,
      broken_at: null,
      last_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedTask = enrichTaskWithStreak(item, restoredStreak);
    list[index] = updatedTask;
    saveLocalStore(list);

    return { task: updatedTask, remainingEnergy };
  },

  async triggerMidnightEnforcement(): Promise<{ resetTasks: string[]; count: number; energyAwarded: number }> {
    // Note: In Supabase mode, process_end_of_day_catalyst runs exclusively on the database via hourly cron.
    // This method is only used for local guest fallback simulation.
    const list = getLocalStore();
    const resetTasks: string[] = [];
    let totalEarnedEnergy = 0;

    const updatedList = list.map((item) => {
      const lastCompleted = item.streak.last_completed_at;
      const isCompleted = isCompletedToday(lastCompleted);

      // 1. If completed today: award Cosmic Energy based on tier & update max streak
      if (isCompleted && item.streak.current_streak > 0) {
        const tier = getStreakTier(item.streak.current_streak);
        const reward = STREAK_TIERS[tier].energyReward;
        totalEarnedEnergy += reward;

        const newMax = Math.max(item.streak.max_streak, item.streak.current_streak);
        return enrichTaskWithStreak(item, {
          ...item.streak,
          max_streak: newMax,
          updated_at: new Date().toISOString(),
        });
      }

      // 2. If NOT completed today or yesterday: break the streak and record broken_at
      if (item.streak.current_streak > 0) {
        const completedYesterday = isCompletedYesterday(lastCompleted);

        if (!isCompleted && !completedYesterday) {
          resetTasks.push(item.id);
          const brokenStreak: Streak = {
            ...item.streak,
            broken_streak: item.streak.current_streak,
            broken_at: new Date().toISOString(),
            current_streak: 0,
            updated_at: new Date().toISOString(),
          };
          return enrichTaskWithStreak(item, brokenStreak);
        }
      }

      // 3. Clear expired broken streaks (> 24 hours)
      if (item.streak.broken_streak && item.streak.broken_at) {
        const elapsed = Date.now() - new Date(item.streak.broken_at).getTime();
        if (elapsed > 24 * 3600 * 1000) {
          return enrichTaskWithStreak(item, {
            ...item.streak,
            broken_streak: null,
            broken_at: null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      return item;
    });

    // Credit Cosmic Energy to profile
    if (totalEarnedEnergy > 0) {
      await profileService.addCosmicEnergy(totalEarnedEnergy);
    }

    saveLocalStore(updatedList);
    return { resetTasks, count: resetTasks.length, energyAwarded: totalEarnedEnergy };
  },
};
