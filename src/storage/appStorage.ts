import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BodyMeasurementEntry,
  DailyNutritionLog,
  UserProfile,
  WorkoutSession,
} from '../types';
import {
  getOffsetDateISO,
  getTodayISO,
  getWeekdayIndexFromISO,
} from '../utils/units';

const STORAGE_KEY = '@physique_meter_state_v1';

export interface PersistedAppState {
  profile: UserProfile;
  workouts: WorkoutSession[];
  bodyHistory: BodyMeasurementEntry[];
  nutritionLogs: Record<string, DailyNutritionLog>;
  customSwaps: Record<string, string>; // key: "dayIndex-slotIndex" -> exerciseId
}

/**
 * Generates realistic sample sessions aligned to the default 4-day split (Mon/Tue/Thu/Fri)
 * so the GitHub-style habit heatmap immediately showcases active streaks, preserved rest days,
 * and intensity shading.
 */
function buildSampleWorkouts(): WorkoutSession[] {
  const defaultTrainingWeekdays = new Set([0, 1, 3, 4]); // Mon, Tue, Thu, Fri
  const recentTrainingOffsets: number[] = [];

  for (let offset = -1; offset >= -35 && recentTrainingOffsets.length < 10; offset--) {
    const iso = getOffsetDateISO(offset);
    if (defaultTrainingWeekdays.has(getWeekdayIndexFromISO(iso))) {
      recentTrainingOffsets.push(offset);
    }
  }

  // Keep the 3 most recent scheduled training days intact for an active 3-session streak,
  // skip the 4th to show a natural break, then populate earlier training days for history.
  const pickedOffsets = [
    recentTrainingOffsets[0],
    recentTrainingOffsets[1],
    recentTrainingOffsets[2],
    recentTrainingOffsets[4],
    recentTrainingOffsets[5],
    recentTrainingOffsets[7],
  ].filter((n): n is number => typeof n === 'number');

  const templates = [
    {
      dayTitle: 'Lower Body & Core',
      durationMinutes: 51,
      totalVolumeKg: 6890,
      totalSetsCompleted: 16,
      exercises: [
        {
          exerciseId: 'barbell-back-squat',
          exerciseName: 'Barbell Back Squat',
          muscleGroup: 'Legs' as const,
          sets: [
            { setNumber: 1, weight: 95, reps: 8, completed: true },
            { setNumber: 2, weight: 95, reps: 8, completed: true },
            { setNumber: 3, weight: 100, reps: 6, completed: true },
          ],
        },
      ],
    },
    {
      dayTitle: 'Upper Body Strength',
      durationMinutes: 46,
      totalVolumeKg: 5420,
      totalSetsCompleted: 20,
      exercises: [
        {
          exerciseId: 'barbell-bench-press',
          exerciseName: 'Barbell Bench Press',
          muscleGroup: 'Chest' as const,
          sets: [
            { setNumber: 1, weight: 70, reps: 8, completed: true },
            { setNumber: 2, weight: 70, reps: 8, completed: true },
            { setNumber: 3, weight: 72.5, reps: 7, completed: true },
          ],
        },
        {
          exerciseId: 'pull-ups',
          exerciseName: 'Pull-Ups',
          muscleGroup: 'Back' as const,
          sets: [
            { setNumber: 1, weight: 79, reps: 9, completed: true },
            { setNumber: 2, weight: 79, reps: 8, completed: true },
            { setNumber: 3, weight: 79, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      dayTitle: 'Upper Body Sculpt',
      durationMinutes: 42,
      totalVolumeKg: 4650,
      totalSetsCompleted: 12,
      exercises: [
        {
          exerciseId: 'pull-ups',
          exerciseName: 'Pull-Ups',
          muscleGroup: 'Back' as const,
          sets: [
            { setNumber: 1, weight: 79, reps: 10, completed: true },
            { setNumber: 2, weight: 79, reps: 9, completed: true },
            { setNumber: 3, weight: 79, reps: 8, completed: true },
          ],
        },
      ],
    },
    {
      dayTitle: 'Lower Power & Conditioning',
      durationMinutes: 34,
      totalVolumeKg: 3820,
      totalSetsCompleted: 9,
      exercises: [
        {
          exerciseId: 'barbell-back-squat',
          exerciseName: 'Barbell Back Squat',
          muscleGroup: 'Legs' as const,
          sets: [
            { setNumber: 1, weight: 90, reps: 8, completed: true },
            { setNumber: 2, weight: 90, reps: 8, completed: true },
            { setNumber: 3, weight: 92.5, reps: 8, completed: true },
          ],
        },
      ],
    },
  ];

  return pickedOffsets.map((offset, idx) => {
    const tpl = templates[idx % templates.length];
    return {
      id: `seed-w${idx + 1}`,
      dateISO: getOffsetDateISO(offset),
      completedAt: new Date(Date.now() + offset * 86400000).toISOString(),
      dayTitle: tpl.dayTitle,
      physiqueGoal: 'athletic_agile',
      durationMinutes: tpl.durationMinutes,
      totalVolumeKg: tpl.totalVolumeKg,
      totalSetsCompleted: tpl.totalSetsCompleted,
      exercises: tpl.exercises,
    };
  });
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
    workouts: buildSampleWorkouts(),
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
