import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/lib/services/taskService";
import { profileService } from "@/lib/services/profileService";
import { TaskWithStreak, CreateTaskInput, Profile } from "@/types";
import { useCatalystStore } from "@/store/useCatalystStore";
import { soundFX } from "@/lib/audio";
import confetti from "canvas-confetti";

export const TASKS_QUERY_KEY = ["catalyst-tasks"];
export const PROFILE_QUERY_KEY = ["catalyst-profile"];

export function useTasksQuery() {
  return useQuery<TaskWithStreak[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: () => taskService.getTasks(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProfileQuery() {
  return useQuery<Profile>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: () => profileService.getProfile(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  const setFlaringTaskId = useCatalystStore((s) => s.setFlaringTaskId);

  return useMutation({
    mutationFn: (taskId: string) => taskService.toggleTaskCompletion(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previousTasks = queryClient.getQueryData<TaskWithStreak[]>(TASKS_QUERY_KEY);

      // Optimistic update
      if (previousTasks) {
        queryClient.setQueryData<TaskWithStreak[]>(
          TASKS_QUERY_KEY,
          previousTasks.map((item) => {
            if (item.id === taskId) {
              const willComplete = !item.isCompletedToday;
              const newStreak = willComplete ? item.streak.current_streak + 1 : Math.max(0, item.streak.current_streak - 1);
              return {
                ...item,
                isCompletedToday: willComplete,
                streak: {
                  ...item.streak,
                  current_streak: newStreak,
                },
              };
            }
            return item;
          })
        );
      }

      return { previousTasks };
    },
    onSuccess: (data, taskId) => {
      if (data.isNowCompleted) {
        // Trigger completion animation & sound
        setFlaringTaskId(taskId);

        // Derive tier index (1 to 5)
        const tierNum = parseInt(data.task.tier.replace("tier", "")) || 1;
        soundFX.playIgnition(tierNum);

        // Extra celebratory confetti for higher tiers
        if (tierNum >= 3) {
          const colors = data.task.tierInfo.particleColors;
          confetti({
            particleCount: tierNum >= 5 ? 70 : 35,
            spread: 60,
            origin: { y: 0.7 },
            colors: colors.length ? colors : ["#00f0ff", "#ff5e00", "#ec4899"],
          });
        }

        setTimeout(() => {
          setFlaringTaskId(null);
        }, 1200);
      } else {
        soundFX.playClick();
      }
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
    onError: (_err, _taskId, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const res = await taskService.createTask(input);
      return res;
    },
    onSuccess: (newTask) => {
      soundFX.playClick();
      // Optimistically push the new task into React Query cache immediately
      queryClient.setQueryData<TaskWithStreak[]>(TASKS_QUERY_KEY, (old = []) => [
        newTask,
        ...old.filter((t) => t.id !== newTask.id),
      ]);
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      const previous = queryClient.getQueryData<TaskWithStreak[]>(TASKS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<TaskWithStreak[]>(
          TASKS_QUERY_KEY,
          previous.filter((t) => t.id !== taskId)
        );
      }
      return { previous };
    },
    onSuccess: () => {
      soundFX.playClick();
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

export function useRestoreStreak() {
  const queryClient = useQueryClient();
  const setFlaringTaskId = useCatalystStore((s) => s.setFlaringTaskId);

  return useMutation({
    mutationFn: (taskId: string) => taskService.restoreStreak(taskId),
    onSuccess: (result, taskId) => {
      soundFX.playRestoreStreak();
      setFlaringTaskId(taskId);

      // Cosmic revival particle shower
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#c084fc", "#ec4899", "#38bdf8", "#fbbf24"],
      });

      setTimeout(() => {
        setFlaringTaskId(null);
      }, 1500);

      // Update cached profile energy immediately
      queryClient.setQueryData<Profile>(PROFILE_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return { ...prev, cosmic_energy: result.remainingEnergy };
      });

      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (err: any) => {
      soundFX.playFizzle();
      console.error("Streak restore error:", err?.message || err);
    },
  });
}

export function useMidnightEnforcement() {
  const queryClient = useQueryClient();
  const setFizzlingTaskId = useCatalystStore((s) => s.setFizzlingTaskId);

  return useMutation({
    mutationFn: () => taskService.triggerMidnightEnforcement(),
    onSuccess: (result) => {
      if (result.resetTasks.length > 0) {
        soundFX.playFizzle();
        setFizzlingTaskId(result.resetTasks[0]);
        setTimeout(() => setFizzlingTaskId(null), 1500);
      } else {
        soundFX.playClick();
      }
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
}
