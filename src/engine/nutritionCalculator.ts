import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { ActivityLevel, MacroTargets, UserProfile } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.25,
  light: 1.38,
  moderate: 1.52,
  active: 1.68,
  athlete: 1.82,
};

/**
 * Calculates daily calorie, protein, carb, fat, and hydration targets
 * using Mifflin-St Jeor BMR + Physique Goal modifiers.
 */
export function calculateMacroTargets(profile: UserProfile): MacroTargets {
  const weightKg = Math.max(40, profile.currentWeightKg);
  const heightCm = Math.max(130, profile.heightCm);
  const age = Math.max(15, Math.min(85, profile.age));

  // Mifflin-St Jeor equation
  const genderOffset =
    profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -78;
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset);

  // Boost multiplier slightly if training 5-6 days/week
  const baseMultiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] ?? 1.52;
  const trainingBonus = profile.daysPerWeek >= 5 ? 0.06 : 0;
  const tdee = Math.round(bmr * (baseMultiplier + trainingBonus));

  const goal = PHYSIQUE_GOALS[profile.physiqueGoal];

  // Respect safe floor (never below 1400 kcal)
  const calories = Math.max(1400, Math.round((tdee + goal.calorieAdjustment) / 10) * 10);

  // Protein based on target or current weight (capped smartly for high BMI)
  const referenceWeightKg =
    profile.targetWeightKg > 0
      ? (weightKg + profile.targetWeightKg) / 2
      : weightKg;
  const proteinGrams = Math.round(referenceWeightKg * goal.proteinPerKg);

  // Fat as percentage of daily calories
  const fatCalories = calories * goal.fatCalorieRatio;
  const fatGrams = Math.round(fatCalories / 9);

  // Remaining calories go to performance carbs
  const remainingCalories = Math.max(200, calories - proteinGrams * 4 - fatGrams * 9);
  const carbsGrams = Math.round(remainingCalories / 4);

  // Hydration: ~35ml/kg + 500ml training bonus
  const waterMl = Math.round((weightKg * 35 + 500) / 100) * 100;

  let rationale = '';
  if (goal.calorieAdjustment < -200) {
    rationale = `${Math.abs(goal.calorieAdjustment)} kcal below maintenance with elevated protein (${goal.proteinPerKg}g/kg) to shed fat while preserving lean muscle.`;
  } else if (goal.calorieAdjustment > 150) {
    rationale = `+${goal.calorieAdjustment} kcal lean surplus with ample carbs to fuel progressive overload and muscle growth.`;
  } else {
    rationale = `Near-maintenance calories with high protein to support athletic performance and steady body recomposition.`;
  }

  return {
    bmr,
    tdee,
    calories,
    proteinGrams,
    carbsGrams,
    fatGrams,
    waterMl,
    rationale,
  };
}
