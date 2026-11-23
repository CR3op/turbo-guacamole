import { COLORS } from '../theme/colors';
import {
  BodyMeasurementEntry,
  DailyNutritionLog,
  HealthMeterBreakdown,
  MacroTargets,
  UserProfile,
  WorkoutSession,
} from '../types';
import { getOffsetDateISO, getTodayISO } from '../utils/units';

/**
 * Calculates the user's consecutive active streak (days with a workout or nutrition log,
 * allowing 1 rest day gap between workouts so realistic 3-4 day/wk schedules build streaks!).
 */
export function computeTrainingStreak(workouts: WorkoutSession[]): number {
  if (workouts.length === 0) return 0;

  const uniqueDates = Array.from(new Set(workouts.map((w) => w.dateISO))).sort().reverse();
  const today = getTodayISO();
  const yesterday = getOffsetDateISO(-1);
  const twoDaysAgo = getOffsetDateISO(-2);

  // Streak is alive if trained within last 2 days
  if (
    uniqueDates[0] !== today &&
    uniqueDates[0] !== yesterday &&
    uniqueDates[0] !== twoDaysAgo
  ) {
    return 0;
  }

  let streakSessions = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const d1 = new Date(uniqueDates[i] + 'T12:00:00');
    const d2 = new Date(uniqueDates[i + 1] + 'T12:00:00');
    const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) {
      streakSessions += 1;
    } else {
      break;
    }
  }
  return streakSessions;
}

/**
 * Counts workouts completed in the last 7 days (rolling week).
 */
export function countWorkoutsLast7Days(workouts: WorkoutSession[]): number {
  const cutoff = getOffsetDateISO(-6);
  return workouts.filter((w) => w.dateISO >= cutoff).length;
}

export function calculateHealthMeter(
  profile: UserProfile,
  workouts: WorkoutSession[],
  bodyHistory: BodyMeasurementEntry[],
  todayNutrition: DailyNutritionLog,
  macroTargets: MacroTargets
): HealthMeterBreakdown {
  const workoutsThisWeek = countWorkoutsLast7Days(workouts);
  const weeklyTarget = profile.daysPerWeek;
  const currentStreakDays = computeTrainingStreak(workouts);

  // 1. Weekly Workout Consistency (40% weight)
  const weeklyConsistencyScore = Math.min(
    100,
    Math.round((workoutsThisWeek / Math.max(1, weeklyTarget)) * 100)
  );

  // 2. Momentum / Streak Score (20% weight)
  const streakScore = Math.min(100, Math.round((currentStreakDays / 6) * 100));

  // 3. Daily Nutrition & Hydration Adherence (25% weight)
  const consumedCals = todayNutrition.items.reduce((s, i) => s + i.calories, 0);
  const consumedProtein = todayNutrition.items.reduce((s, i) => s + i.protein, 0);

  let nutritionScore = 0;
  if (consumedCals === 0 && todayNutrition.waterMl === 0) {
    nutritionScore = 0;
  } else {
    const calRatio = Math.min(1.25, consumedCals / Math.max(1, macroTargets.calories));
    const calAccuracy =
      calRatio <= 1 ? calRatio * 100 : Math.max(50, 100 - (calRatio - 1) * 120);
    const proteinPct = Math.min(100, (consumedProtein / Math.max(1, macroTargets.proteinGrams)) * 100);
    const waterPct = Math.min(100, (todayNutrition.waterMl / Math.max(1, macroTargets.waterMl)) * 100);
    nutritionScore = Math.round(calAccuracy * 0.4 + proteinPct * 0.4 + waterPct * 0.2);
  }

  // 4. Physique Goal Progress Score (15% weight)
  let physiqueProgressScore = 65; // healthy baseline when starting out
  if (bodyHistory.length >= 2) {
    const sorted = [...bodyHistory].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    const startWeight = sorted[0].weightKg;
    const latestWeight = sorted[sorted.length - 1].weightKg;
    const targetWeight = profile.targetWeightKg;
    const totalDelta = targetWeight - startWeight;

    if (Math.abs(totalDelta) < 0.5) {
      // Maintaining weight -> reward staying close to target
      const drift = Math.abs(latestWeight - targetWeight);
      physiqueProgressScore = Math.max(50, Math.round(100 - drift * 12));
    } else {
      const achieved = latestWeight - startWeight;
      const ratio = achieved / totalDelta;
      physiqueProgressScore = Math.max(
        35,
        Math.min(100, Math.round(50 + ratio * 50))
      );
    }
  } else if (bodyHistory.length === 1) {
    physiqueProgressScore = 70;
  }

  const overallScore = Math.round(
    weeklyConsistencyScore * 0.4 +
      streakScore * 0.2 +
      nutritionScore * 0.25 +
      physiqueProgressScore * 0.15
  );

  let statusLabel = 'Warming Up';
  let statusColor = COLORS.amber;
  if (overallScore >= 85) {
    statusLabel = 'Peak Physique Flow';
    statusColor = COLORS.primary;
  } else if (overallScore >= 65) {
    statusLabel = 'Strong Momentum';
    statusColor = COLORS.cyan;
  } else if (overallScore >= 40) {
    statusLabel = 'Building Rhythm';
    statusColor = COLORS.amber;
  } else {
    statusLabel = 'Ready to Ignite';
    statusColor = COLORS.rose;
  }

  let nextMilestoneText = 'Complete your first workout today to jumpstart your Health Meter!';
  if (workoutsThisWeek < weeklyTarget) {
    const rem = weeklyTarget - workoutsThisWeek;
    nextMilestoneText = `${rem} more session${rem === 1 ? '' : 's'} this week to hit 100% training consistency.`;
  } else if (nutritionScore < 75) {
    nextMilestoneText = 'Log your meals & hit your protein goal today to push into Peak Flow.';
  } else {
    nextMilestoneText = 'Weekly target crushed! Keep hydration and recovery high.';
  }

  return {
    overallScore,
    statusLabel,
    statusColor,
    weeklyConsistencyScore,
    streakScore,
    nutritionScore,
    physiqueProgressScore,
    currentStreakDays,
    workoutsThisWeek,
    weeklyTarget,
    nextMilestoneText,
  };
}
