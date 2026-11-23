import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BodyMeasurementEntry,
  DailyNutritionLog,
  UserProfile,
  WorkoutSession,
} from '../types';
import { getOffsetDateISO, getTodayISO } from '../utils/units';

const STORAGE_KEY = '@physique_meter_state_v1';

export interface PersistedAppState {
  profile: UserProfile;
  workouts: WorkoutSession[];
  bodyHistory: BodyMeasurementEntry[];
  nutritionLogs: Record<string, DailyNutritionLog>;
  customSwaps: Record<string, string>; // key: "dayIndex-slotIndex" -> exerciseId
}

export function createDefaultState(): PersistedAppState {
  const today = getTodayISO();
  return {
    profile: {
      name: 'Athlete',
      physiqueGoal: 'athletic_agile',
      equipment: 'gym',
      experience: 'intermediate',
      daysPerWeek: 4,
      gender: 'male',
      age: 26,
      heightCm: 178,
      currentWeightKg: 79.4, // ~175 lbs
      targetWeightKg: 75.0, // ~165 lbs
      activityLevel: 'moderate',
      unitSystem: 'imperial',
      onboardingCompleted: false,
    },
    workouts: [
      {
        id: 'seed-w1',
        dateISO: getOffsetDateISO(-3),
        completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        dayTitle: 'Upper Body Strength',
        physiqueGoal: 'athletic_agile',
        durationMinutes: 46,
        totalVolumeKg: 5420,
        totalSetsCompleted: 15,
        exercises: [
          {
            exerciseId: 'barbell-bench-press',
            exerciseName: 'Barbell Bench Press',
            muscleGroup: 'Chest',
            sets: [
              { setNumber: 1, weight: 70, reps: 8, completed: true },
              { setNumber: 2, weight: 70, reps: 8, completed: true },
              { setNumber: 3, weight: 72.5, reps: 7, completed: true },
            ],
          },
          {
            exerciseId: 'pull-ups',
            exerciseName: 'Pull-Ups',
            muscleGroup: 'Back',
            sets: [
              { setNumber: 1, weight: 79, reps: 9, completed: true },
              { setNumber: 2, weight: 79, reps: 8, completed: true },
              { setNumber: 3, weight: 79, reps: 8, completed: true },
            ],
          },
        ],
      },
      {
        id: 'seed-w2',
        dateISO: getOffsetDateISO(-1),
        completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        dayTitle: 'Lower Body & Core',
        physiqueGoal: 'athletic_agile',
        durationMinutes: 51,
        totalVolumeKg: 6890,
        totalSetsCompleted: 15,
        exercises: [
          {
            exerciseId: 'barbell-back-squat',
            exerciseName: 'Barbell Back Squat',
            muscleGroup: 'Legs',
            sets: [
              { setNumber: 1, weight: 95, reps: 8, completed: true },
              { setNumber: 2, weight: 95, reps: 8, completed: true },
              { setNumber: 3, weight: 100, reps: 6, completed: true },
            ],
          },
        ],
      },
    ],
    bodyHistory: [
      { id: 'b1', dateISO: getOffsetDateISO(-21), weightKg: 81.2, waistCm: 85.5 },
      { id: 'b2', dateISO: getOffsetDateISO(-14), weightKg: 80.5, waistCm: 84.8 },
      { id: 'b3', dateISO: getOffsetDateISO(-7), weightKg: 79.9, waistCm: 84.0 },
      { id: 'b4', dateISO: today, weightKg: 79.4, waistCm: 83.4 },
    ],
    nutritionLogs: {
      [today]: {
        dateISO: today,
        waterMl: 1500,
        items: [
          {
            id: 'seed-m1',
            name: 'High-Protein Greek Yogurt & Berry Bowl',
            calories: 340,
            protein: 32,
            carbs: 36,
            fat: 7,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'seed-m2',
            name: 'Grilled Chicken, Jasmine Rice & Avocado',
            calories: 620,
            protein: 52,
            carbs: 64,
            fat: 16,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    },
    customSwaps: {},
  };
}

export async function loadAppState(): Promise<PersistedAppState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    const defaults = createDefaultState();
    return {
      profile: { ...defaults.profile, ...(parsed.profile ?? {}) },
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : defaults.workouts,
      bodyHistory: Array.isArray(parsed.bodyHistory)
        ? parsed.bodyHistory
        : defaults.bodyHistory,
      nutritionLogs: parsed.nutritionLogs ?? defaults.nutritionLogs,
      customSwaps: parsed.customSwaps ?? {},
    };
  } catch {
    return createDefaultState();
  }
}

export async function saveAppState(state: PersistedAppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist PhysiqueMeter state:', err);
  }
}

export async function clearAppState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear PhysiqueMeter state:', err);
  }
}
