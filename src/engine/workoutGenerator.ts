import { EXERCISES, EXERCISES_BY_ID } from '../data/exercises';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import {
  EquipmentEnvironment,
  Exercise,
  MuscleGroup,
  PhysiqueGoalId,
  PlannedExercise,
  UserProfile,
  WorkoutDayPlan,
} from '../types';

const DAY_NAMES: Array<{ short: string; full: string }> = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

interface DayTemplate {
  dayIndex: number;
  title: string;
  focus: string;
  slots: MuscleGroup[];
}

function getSplitTemplates(daysPerWeek: 3 | 4 | 5 | 6, goal: PhysiqueGoalId): DayTemplate[] {
  const wantsConditioning = goal === 'lean_shredded' || goal === 'athletic_agile';

  if (daysPerWeek === 3) {
    return [
      {
        dayIndex: 0,
        title: 'Full Body Power A',
        focus: 'Chest, Back, Legs & Core',
        slots: ['Legs', 'Chest', 'Back', 'Shoulders', 'Core'],
      },
      {
        dayIndex: 2,
        title: wantsConditioning ? 'Athletic Full Body & Burn' : 'Full Body Hypertrophy B',
        focus: wantsConditioning ? 'Lower, Pull, Conditioning & Core' : 'Legs, Back, Shoulders & Arms',
        slots: wantsConditioning
          ? ['Legs', 'Back', 'Chest', 'Conditioning', 'Core']
          : ['Legs', 'Back', 'Shoulders', 'Arms', 'Core'],
      },
      {
        dayIndex: 4,
        title: 'Full Body Sculpt C',
        focus: 'Posterior Chain, Push, Arms & Core',
        slots: wantsConditioning
          ? ['Legs', 'Shoulders', 'Arms', 'Conditioning', 'Core']
          : ['Chest', 'Back', 'Legs', 'Arms', 'Core'],
      },
    ];
  }

  if (daysPerWeek === 4) {
    return [
      {
        dayIndex: 0,
        title: 'Upper Body Strength',
        focus: 'Chest, Back, Shoulders & Arms',
        slots: ['Chest', 'Back', 'Shoulders', 'Chest', 'Arms'],
      },
      {
        dayIndex: 1,
        title: 'Lower Body & Core',
        focus: 'Quads, Posterior Chain & Core',
        slots: wantsConditioning
          ? ['Legs', 'Legs', 'Legs', 'Core', 'Conditioning']
          : ['Legs', 'Legs', 'Legs', 'Legs', 'Core'],
      },
      {
        dayIndex: 3,
        title: 'Upper Body Sculpt',
        focus: 'Back Width, Delts, Chest & Arms',
        slots: ['Back', 'Chest', 'Shoulders', 'Arms', 'Core'],
      },
      {
        dayIndex: 4,
        title: wantsConditioning ? 'Lower Power & Conditioning' : 'Lower Hypertrophy & Core',
        focus: wantsConditioning ? 'Glutes, Legs & Metabolic Finisher' : 'Glutes, Hamstrings, Calves & Abs',
        slots: wantsConditioning
          ? ['Legs', 'Legs', 'Core', 'Conditioning', 'Conditioning']
          : ['Legs', 'Legs', 'Legs', 'Core', 'Core'],
      },
    ];
  }

  if (daysPerWeek === 5) {
    return [
      {
        dayIndex: 0,
        title: 'Push (Chest & Shoulders)',
        focus: 'Pressing Strength, Delts & Triceps',
        slots: ['Chest', 'Chest', 'Shoulders', 'Shoulders', 'Arms'],
      },
      {
        dayIndex: 1,
        title: 'Pull (Back & Biceps)',
        focus: 'Lat Width, Mid-Back & Biceps',
        slots: ['Back', 'Back', 'Back', 'Arms', 'Core'],
      },
      {
        dayIndex: 2,
        title: 'Legs & Glutes',
        focus: 'Squat, Hinge, Unilateral & Calves',
        slots: ['Legs', 'Legs', 'Legs', 'Legs', 'Core'],
      },
      {
        dayIndex: 4,
        title: 'Upper Athletic Mix',
        focus: 'Balanced Upper Volume & Arms',
        slots: ['Chest', 'Back', 'Shoulders', 'Arms', 'Arms'],
      },
      {
        dayIndex: 5,
        title: wantsConditioning ? 'Metabolic Conditioning & Core' : 'Lower Focus & Core',
        focus: wantsConditioning ? 'Fat Burn, Agility & Core' : 'Posterior Chain, Legs & Abs',
        slots: wantsConditioning
          ? ['Legs', 'Conditioning', 'Conditioning', 'Core', 'Core']
          : ['Legs', 'Legs', 'Legs', 'Core', 'Core'],
      },
    ];
  }

  // 6 days: Push / Pull / Legs x2
  return [
    {
      dayIndex: 0,
      title: 'Push A (Heavy Chest & Delts)',
      focus: 'Compound Presses & Triceps',
      slots: ['Chest', 'Chest', 'Shoulders', 'Shoulders', 'Arms'],
    },
    {
      dayIndex: 1,
      title: 'Pull A (Vertical & Thickness)',
      focus: 'Lats, Upper Back & Biceps',
      slots: ['Back', 'Back', 'Back', 'Arms', 'Core'],
    },
    {
      dayIndex: 2,
      title: 'Legs A (Quad Dominant)',
      focus: 'Quads, Glutes & Core',
      slots: ['Legs', 'Legs', 'Legs', 'Legs', 'Core'],
    },
    {
      dayIndex: 3,
      title: 'Push B (Hypertrophy & Sculpt)',
      focus: 'Upper Chest, Lateral Delts & Arms',
      slots: ['Chest', 'Shoulders', 'Chest', 'Arms', wantsConditioning ? 'Conditioning' : 'Core'],
    },
    {
      dayIndex: 4,
      title: 'Pull B (Rear Delts & Arms)',
      focus: 'Posture, Rows & Arm Definition',
      slots: ['Back', 'Back', 'Shoulders', 'Arms', 'Core'],
    },
    {
      dayIndex: 5,
      title: wantsConditioning ? 'Legs B & Conditioning' : 'Legs B (Posterior Chain)',
      focus: wantsConditioning ? 'Glutes, Lunges & HIIT Finisher' : 'Hamstrings, Glutes & Calves',
      slots: wantsConditioning
        ? ['Legs', 'Legs', 'Conditioning', 'Conditioning', 'Core']
        : ['Legs', 'Legs', 'Legs', 'Core', 'Core'],
    },
  ];
}

function scoreExerciseForProfile(
  ex: Exercise,
  profile: UserProfile,
  slotIndex: number
): number {
  let score = 0;

  // Prefer primary equipment match strongly
  if (ex.equipment[0] === profile.equipment) {
    score += 30;
  } else if (ex.equipment.includes(profile.equipment)) {
    score += 18;
  } else {
    return -999; // Not available in user's equipment
  }

  // Physique goal match
  if (ex.recommendedGoals.includes(profile.physiqueGoal)) {
    score += 20;
  }

  // Put compound movements first in the session
  if (slotIndex <= 1 && ex.movementType === 'compound') {
    score += 22;
  } else if (slotIndex >= 3 && ex.movementType === 'isolation') {
    score += 10;
  }

  // Experience level fit
  if (profile.experience === 'beginner') {
    if (ex.difficulty === 'beginner') score += 16;
    if (ex.difficulty === 'advanced') score -= 25;
  } else if (profile.experience === 'intermediate') {
    if (ex.difficulty === 'intermediate') score += 12;
    if (ex.difficulty === 'beginner') score += 6;
  } else {
    if (ex.difficulty === 'advanced') score += 14;
    if (ex.difficulty === 'intermediate') score += 10;
  }

  return score;
}

export function getGoalPrescription(
  ex: Exercise,
  goalId: PhysiqueGoalId,
  experience: UserProfile['experience']
): { sets: number; reps: string; restSeconds: number; note: string } {
  const goal = PHYSIQUE_GOALS[goalId];
  const baseSets =
    experience === 'beginner' ? 3 : experience === 'intermediate' ? 3 : 4;

  if (ex.movementType === 'conditioning') {
    return {
      sets: experience === 'beginner' ? 3 : 4,
      reps: goalId === 'lean_shredded' ? '45s work' : '30-40s',
      restSeconds: 45,
      note: 'High energy, crisp form',
    };
  }

  if (ex.movementType === 'core') {
    return {
      sets: 3,
      reps: ex.id.includes('plank') ? '45-60s' : '12-16',
      restSeconds: 45,
      note: 'Controlled tempo, full brace',
    };
  }

  let sets = Math.max(3, Math.round(baseSets * goal.setsMultiplier));
  if (ex.movementType === 'isolation') {
    sets = Math.min(sets, experience === 'advanced' ? 4 : 3);
  }

  let reps = goal.repRange;
  let note = 'Controlled 2s eccentric';

  if (goalId === 'power_strength') {
    reps = ex.movementType === 'compound' ? '4-6' : '8-10';
    note = ex.movementType === 'compound' ? 'Heavy load, RPE 8-9' : 'Accessory strength';
  } else if (goalId === 'muscular_hypertrophy') {
    reps = ex.movementType === 'compound' ? '8-10' : '10-15';
    note = 'Push 1-2 reps shy of failure';
  } else if (goalId === 'lean_shredded') {
    reps = ex.movementType === 'compound' ? '10-12' : '12-15';
    note = 'Short rest, keep heart rate up';
  } else if (goalId === 'athletic_agile') {
    reps = ex.movementType === 'compound' ? '6-10' : '10-12';
    note = 'Explosive concentric drive';
  } else {
    reps = '10-14';
    note = 'Mind-muscle squeeze each rep';
  }

  const restSeconds =
    ex.movementType === 'compound'
      ? Math.max(goal.restSeconds, Math.min(ex.defaultRestSeconds, goal.restSeconds + 30))
      : Math.min(goal.restSeconds, 60);

  return { sets, reps, restSeconds, note };
}

export function generateWeeklyPlan(
  profile: UserProfile,
  customSwaps: Record<string, string> = {}
): WorkoutDayPlan[] {
  const templates = getSplitTemplates(profile.daysPerWeek, profile.physiqueGoal);
  const templateByDay = new Map<number, DayTemplate>(
    templates.map((t) => [t.dayIndex, t])
  );

  // Track usage across the week to keep variety high
  const weeklyUsageCount: Record<string, number> = {};

  return DAY_NAMES.map((dayMeta, dayIndex) => {
    const template = templateByDay.get(dayIndex);
    if (!template) {
      const recoveryTips = [
        'Aim for 8,000+ steps and 10 minutes of hip & thoracic mobility.',
        'Prioritize 7.5–8.5 hours of sleep and hit your full daily protein target.',
        'Light walk, foam rolling, and extra hydration to supercharge muscle repair.',
      ];
      return {
        dayIndex,
        dayShort: dayMeta.short,
        dayFull: dayMeta.full,
        isRestDay: true,
        title: 'Active Recovery & Mobility',
        focus: 'CNS Repair, Steps & Stretching',
        estimatedMinutes: 20,
        exercises: [],
        recoveryTip: recoveryTips[dayIndex % recoveryTips.length],
      };
    }

    const usedInDay = new Set<string>();
    const plannedExercises: PlannedExercise[] = [];

    template.slots.forEach((muscleGroup, slotIdx) => {
      const swapKey = `${dayIndex}-${slotIdx}`;
      const swappedId = customSwaps[swapKey];

      let chosen: Exercise | undefined;
      if (swappedId && EXERCISES_BY_ID[swappedId]) {
        chosen = EXERCISES_BY_ID[swappedId];
      } else {
        const candidates = EXERCISES.filter(
          (ex) =>
            ex.muscleGroup === muscleGroup &&
            ex.equipment.includes(profile.equipment) &&
            !usedInDay.has(ex.id)
        );

        // Fallback if all exercises for that muscle/equipment were already picked today
        const pool =
          candidates.length > 0
            ? candidates
            : EXERCISES.filter(
                (ex) => ex.muscleGroup === muscleGroup && !usedInDay.has(ex.id)
              );

        pool.sort((a, b) => {
          const scoreA =
            scoreExerciseForProfile(a, profile, slotIdx) -
            (weeklyUsageCount[a.id] ?? 0) * 14;
          const scoreB =
            scoreExerciseForProfile(b, profile, slotIdx) -
            (weeklyUsageCount[b.id] ?? 0) * 14;
          return scoreB - scoreA;
        });

        chosen = pool[0];
      }

      if (chosen) {
        usedInDay.add(chosen.id);
        weeklyUsageCount[chosen.id] = (weeklyUsageCount[chosen.id] ?? 0) + 1;

        const prescription = getGoalPrescription(
          chosen,
          profile.physiqueGoal,
          profile.experience
        );
        plannedExercises.push({
          exerciseId: chosen.id,
          ...prescription,
        });
      }
    });

    const estimatedMinutes = Math.round(
      plannedExercises.reduce(
        (acc, item) => acc + item.sets * (0.75 + item.restSeconds / 60),
        8 // warm-up
      )
    );

    return {
      dayIndex,
      dayShort: dayMeta.short,
      dayFull: dayMeta.full,
      isRestDay: false,
      title: template.title,
      focus: template.focus,
      estimatedMinutes,
      exercises: plannedExercises,
    };
  });
}

export function getAlternativeExercises(
  currentExerciseId: string,
  equipment: EquipmentEnvironment
): Exercise[] {
  const current = EXERCISES_BY_ID[currentExerciseId];
  if (!current) return [];

  const exactMatch = EXERCISES.filter(
    (ex) =>
      ex.id !== currentExerciseId &&
      ex.muscleGroup === current.muscleGroup &&
      ex.equipment.includes(equipment)
  );

  if (exactMatch.length >= 2) return exactMatch;

  return EXERCISES.filter(
    (ex) => ex.id !== currentExerciseId && ex.muscleGroup === current.muscleGroup
  );
}
