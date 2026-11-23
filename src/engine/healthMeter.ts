import { COLORS } from '../theme/colors';
import {
  BodyMeasurementEntry,
  ContributionLevel,
  DailyNutritionLog,
  HabitDayCell,
  HabitTrackerSummary,
  HealthMeterBreakdown,
  MacroTargets,
  UserProfile,
  WorkoutDayPlan,
  WorkoutSession,
} from '../types';
import {
  addDaysToISO,
  getOffsetDateISO,
  getTodayISO,
  getWeekdayIndexFromISO,
} from '../utils/units';

function buildRestDaySet(weeklyPlan?: WorkoutDayPlan[]): Set<number> {
  const restDays = new Set<number>();
  if (!weeklyPlan) return restDays;
  weeklyPlan.forEach((day) => {
    if (day.isRestDay) {
      restDays.add(day.dayIndex);
    }
  });
  return restDays;
}

function getContributionLevel(sessions: WorkoutSession[]): ContributionLevel {
  if (sessions.length === 0) return 0;
  const totalSets = sessions.reduce((sum, s) => sum + s.totalSetsCompleted, 0);
  if (sessions.length >= 2 || totalSets >= 20) return 4;
  if (totalSets >= 15) return 3;
  if (totalSets >= 10) return 2;
  return 1;
}

function groupWorkoutsByDate(workouts: WorkoutSession[]): Map<string, WorkoutSession[]> {
  const map = new Map<string, WorkoutSession[]>();
  workouts.forEach((session) => {
    const existing = map.get(session.dateISO);
    if (existing) {
      existing.push(session);
    } else {
      map.set(session.dateISO, [session]);
    }
  });
  return map;
}

/**
 * GitHub-style habit tracker & streak engine:
 * - Each calendar day with 1+ logged workouts counts as +1 streak session and lights up
 *   a contribution square (levels 1–4 based on daily sessions & sets completed).
 * - Scheduled rest days (from the user's weekly split) preserve the streak without resetting it.
 * - Missing a scheduled training day resets the streak to 0.
 * - Today has an active grace window so your streak stays alive until you finish today's session.
 */
export function computeGitHubHabitTracker(
  workouts: WorkoutSession[],
  weeklyPlan?: WorkoutDayPlan[],
  totalWeeks = 16
): HabitTrackerSummary {
  const todayISO = getTodayISO();
  const restDaySet = buildRestDaySet(weeklyPlan);
  const byDate = groupWorkoutsByDate(workouts);

  const todayWeekday = getWeekdayIndexFromISO(todayISO);
  const isTodayRestDay = restDaySet.has(todayWeekday);
  const completedToday = (byDate.get(todayISO)?.length ?? 0) > 0;

  // Determine earliest valid workout date (<= today) to bound streak scans
  const validDates = Array.from(byDate.keys())
    .filter((d) => d <= todayISO)
    .sort();
  const earliestDateISO = validDates[0];

  // 1. Current streak: walk backward from today
  let currentStreak = 0;
  if (earliestDateISO) {
    let cursor = todayISO;
    while (cursor >= earliestDateISO) {
      const hasWorkout = (byDate.get(cursor)?.length ?? 0) > 0;
      const isRest = restDaySet.has(getWeekdayIndexFromISO(cursor));

      if (hasWorkout) {
        currentStreak += 1;
      } else if (cursor === todayISO || isRest) {
        // Today (in-progress) and scheduled rest days preserve the streak
      } else {
        break;
      }

      cursor = addDaysToISO(cursor, -1);
    }
  }

  // 2. Longest streak: scan chronologically from earliest logged workout to today
  let longestStreak = 0;
  if (earliestDateISO) {
    let running = 0;
    let cursor = earliestDateISO;
    while (cursor <= todayISO) {
      const hasWorkout = (byDate.get(cursor)?.length ?? 0) > 0;
      const isRest = restDaySet.has(getWeekdayIndexFromISO(cursor));

      if (hasWorkout) {
        running += 1;
        if (running > longestStreak) {
          longestStreak = running;
        }
      } else if (isRest || cursor === todayISO) {
        // Scheduled rest day or in-progress today does not reset running streak
      } else {
        running = 0;
      }

      cursor = addDaysToISO(cursor, 1);
    }
  }

  // 3. Build GitHub-style weekly grid (columns = weeks, rows = Mon..Sun)
  const currentWeekMonday = addDaysToISO(todayISO, -todayWeekday);
  const startMonday = addDaysToISO(currentWeekMonday, -(totalWeeks - 1) * 7);

  const weeks: HabitDayCell[][] = [];
  let activeDaysInWindow = 0;
  let sessionsInWindow = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const weekCells: HabitDayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateISO = addDaysToISO(startMonday, w * 7 + d);
      const isFuture = dateISO > todayISO;
      const isToday = dateISO === todayISO;
      const sessions = isFuture ? [] : byDate.get(dateISO) ?? [];
      const totalSets = sessions.reduce((sum, s) => sum + s.totalSetsCompleted, 0);
      const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const totalVolumeKg = sessions.reduce((sum, s) => sum + s.totalVolumeKg, 0);
      const level = getContributionLevel(sessions);

      if (sessions.length > 0) {
        activeDaysInWindow += 1;
        sessionsInWindow += sessions.length;
      }

      weekCells.push({
        dateISO,
        weekdayIndex: d,
        isRestDay: restDaySet.has(d),
        isToday,
        isFuture,
        level,
        sessions,
        totalSets,
        totalMinutes,
        totalVolumeKg,
      });
    }
    weeks.push(weekCells);
  }

  return {
    currentStreak,
    longestStreak,
    totalSessions: workouts.length,
    activeDaysInWindow,
    sessionsInWindow,
    completedToday,
    isTodayRestDay,
    weeks,
  };
}

/**
 * Calculates the user's consecutive active session streak using GitHub habit tracker rules:
 * workouts count as active days, and scheduled rest days preserve the streak without resetting it.
 */
export function computeTrainingStreak(
  workouts: WorkoutSession[],
  weeklyPlan?: WorkoutDayPlan[]
): number {
  return computeGitHubHabitTracker(workouts, weeklyPlan, 1).currentStreak;
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
  macroTargets: MacroTargets,
  weeklyPlan?: WorkoutDayPlan[]
): HealthMeterBreakdown {
  const workoutsThisWeek = countWorkoutsLast7Days(workouts);
  const weeklyTarget = profile.daysPerWeek;
  const habitSummary = computeGitHubHabitTracker(workouts, weeklyPlan, 1);
  const currentStreakDays = habitSummary.currentStreak;
  const longestStreakDays = habitSummary.longestStreak;

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
    longestStreakDays,
    workoutsThisWeek,
    weeklyTarget,
    nextMilestoneText,
  };
}
