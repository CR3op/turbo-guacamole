import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { calculateHealthMeter, computeGitHubHabitTracker } from '../engine/healthMeter';
import { calculateMacroTargets } from '../engine/nutritionCalculator';
import { generateWeeklyPlan } from '../engine/workoutGenerator';
import {
  clearAppState,
  createDefaultState,
  loadAppState,
  PersistedAppState,
  saveAppState,
} from '../storage/appStorage';
import {
  BodyMeasurementEntry,
  DailyNutritionLog,
  FoodLogItem,
  HabitTrackerSummary,
  HealthMeterBreakdown,
  MacroTargets,
  UserProfile,
  WorkoutDayPlan,
  WorkoutSession,
} from '../types';
import { getTodayISO } from '../utils/units';

interface AppContextValue {
  isHydrated: boolean;
  profile: UserProfile;
  workouts: WorkoutSession[];
  bodyHistory: BodyMeasurementEntry[];
  todayNutrition: DailyNutritionLog;
  weeklyPlan: WorkoutDayPlan[];
  macroTargets: MacroTargets;
  healthMeter: HealthMeterBreakdown;
  habitTracker: HabitTrackerSummary;
  updateProfile: (patch: Partial<UserProfile>) => void;
  swapPlannedExercise: (dayIndex: number, slotIndex: number, newExerciseId: string) => void;
  clearCustomSwaps: () => void;
  logWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void;
  deleteWorkoutSession: (id: string) => void;
  addBodyMeasurement: (entry: Omit<BodyMeasurementEntry, 'id'>) => void;
  addFoodItem: (item: Omit<FoodLogItem, 'id' | 'timestamp'>) => void;
  removeFoodItem: (id: string) => void;
  addWater: (amountMl: number) => void;
  resetAllData: (freshEmpty?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedAppState>(() => createDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadAppState().then((loaded) => {
      if (mounted) {
        setState(loaded);
        setIsHydrated(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist whenever state changes after hydration
  useEffect(() => {
    if (!isHydrated) return;
    saveAppState(state);
  }, [state, isHydrated]);

  const todayISO = getTodayISO();

  const todayNutrition: DailyNutritionLog = useMemo(() => {
    return (
      state.nutritionLogs[todayISO] ?? {
        dateISO: todayISO,
        items: [],
        waterMl: 0,
      }
    );
  }, [state.nutritionLogs, todayISO]);

  const weeklyPlan = useMemo(
    () => generateWeeklyPlan(state.profile, state.customSwaps),
    [state.profile, state.customSwaps]
  );

  const macroTargets = useMemo(
    () => calculateMacroTargets(state.profile),
    [state.profile]
  );

  const habitTracker = useMemo(
    () => computeGitHubHabitTracker(state.workouts, weeklyPlan),
    [state.workouts, weeklyPlan]
  );

  const healthMeter = useMemo(
    () =>
      calculateHealthMeter(
        state.profile,
        state.workouts,
        state.bodyHistory,
        todayNutrition,
        macroTargets,
        weeklyPlan
      ),
    [state.profile, state.workouts, state.bodyHistory, todayNutrition, macroTargets, weeklyPlan]
  );

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((prev) => {
      const equipmentOrGoalChanged =
        (patch.equipment && patch.equipment !== prev.profile.equipment) ||
        (patch.daysPerWeek && patch.daysPerWeek !== prev.profile.daysPerWeek);

      const nextProfile: UserProfile = { ...prev.profile, ...patch };

      // Keep latest body measurement synced if currentWeightKg is changed
      let nextBodyHistory = prev.bodyHistory;
      if (
        typeof patch.currentWeightKg === 'number' &&
        patch.currentWeightKg !== prev.profile.currentWeightKg
      ) {
        const today = getTodayISO();
        const existingIdx = prev.bodyHistory.findIndex((b) => b.dateISO === today);
        if (existingIdx >= 0) {
          nextBodyHistory = prev.bodyHistory.map((item, idx) =>
            idx === existingIdx ? { ...item, weightKg: patch.currentWeightKg! } : item
          );
        } else {
          nextBodyHistory = [
            ...prev.bodyHistory,
            {
              id: `body-${Date.now()}`,
              dateISO: today,
              weightKg: patch.currentWeightKg,
            },
          ];
        }
      }

      return {
        ...prev,
        profile: nextProfile,
        bodyHistory: nextBodyHistory,
        customSwaps: equipmentOrGoalChanged ? {} : prev.customSwaps,
      };
    });
  }, []);

  const swapPlannedExercise = useCallback(
    (dayIndex: number, slotIndex: number, newExerciseId: string) => {
      setState((prev) => ({
        ...prev,
        customSwaps: {
          ...prev.customSwaps,
          [`${dayIndex}-${slotIndex}`]: newExerciseId,
        },
      }));
    },
    []
  );

  const clearCustomSwaps = useCallback(() => {
    setState((prev) => ({ ...prev, customSwaps: {} }));
  }, []);

  const logWorkoutSession = useCallback((session: Omit<WorkoutSession, 'id'>) => {
    const newSession: WorkoutSession = {
      ...session,
      id: `workout-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      workouts: [newSession, ...prev.workouts],
    }));
  }, []);

  const deleteWorkoutSession = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.filter((w) => w.id !== id),
    }));
  }, []);

  const addBodyMeasurement = useCallback((entry: Omit<BodyMeasurementEntry, 'id'>) => {
    setState((prev) => {
      const existingIdx = prev.bodyHistory.findIndex((b) => b.dateISO === entry.dateISO);
      let nextHistory: BodyMeasurementEntry[];
      if (existingIdx >= 0) {
        nextHistory = prev.bodyHistory.map((item, idx) =>
          idx === existingIdx ? { ...item, ...entry } : item
        );
      } else {
        nextHistory = [
          ...prev.bodyHistory,
          { ...entry, id: `body-${Date.now()}` },
        ].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
      }

      return {
        ...prev,
        bodyHistory: nextHistory,
        profile: {
          ...prev.profile,
          currentWeightKg: entry.weightKg,
        },
      };
    });
  }, []);

  const addFoodItem = useCallback((item: Omit<FoodLogItem, 'id' | 'timestamp'>) => {
    const today = getTodayISO();
    const newItem: FoodLogItem = {
      ...item,
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => {
      const current = prev.nutritionLogs[today] ?? {
        dateISO: today,
        items: [],
        waterMl: 0,
      };
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [today]: {
            ...current,
            items: [newItem, ...current.items],
          },
        },
      };
    });
  }, []);

  const removeFoodItem = useCallback((id: string) => {
    const today = getTodayISO();
    setState((prev) => {
      const current = prev.nutritionLogs[today];
      if (!current) return prev;
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [today]: {
            ...current,
            items: current.items.filter((i) => i.id !== id),
          },
        },
      };
    });
  }, []);

  const addWater = useCallback((amountMl: number) => {
    const today = getTodayISO();
    setState((prev) => {
      const current = prev.nutritionLogs[today] ?? {
        dateISO: today,
        items: [],
        waterMl: 0,
      };
      return {
        ...prev,
        nutritionLogs: {
          ...prev.nutritionLogs,
          [today]: {
            ...current,
            waterMl: Math.max(0, current.waterMl + amountMl),
          },
        },
      };
    });
  }, []);

  const resetAllData = useCallback(async (freshEmpty = false) => {
    await clearAppState();
    const fresh = createDefaultState();
    if (freshEmpty) {
      fresh.workouts = [];
      fresh.nutritionLogs = {};
      fresh.bodyHistory = [
        {
          id: `body-${Date.now()}`,
          dateISO: getTodayISO(),
          weightKg: fresh.profile.currentWeightKg,
        },
      ];
      fresh.profile.onboardingCompleted = true;
    } else {
      fresh.profile.onboardingCompleted = true;
    }
    setState(fresh);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      isHydrated,
      profile: state.profile,
      workouts: state.workouts,
      bodyHistory: state.bodyHistory,
      todayNutrition,
      weeklyPlan,
      macroTargets,
      healthMeter,
      habitTracker,
      updateProfile,
      swapPlannedExercise,
      clearCustomSwaps,
      logWorkoutSession,
      deleteWorkoutSession,
      addBodyMeasurement,
      addFoodItem,
      removeFoodItem,
      addWater,
      resetAllData,
    }),
    [
      isHydrated,
      state.profile,
      state.workouts,
      state.bodyHistory,
      todayNutrition,
      weeklyPlan,
      macroTargets,
      healthMeter,
      habitTracker,
      updateProfile,
      swapPlannedExercise,
      clearCustomSwaps,
      logWorkoutSession,
      deleteWorkoutSession,
      addBodyMeasurement,
      addFoodItem,
      removeFoodItem,
      addWater,
      resetAllData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
