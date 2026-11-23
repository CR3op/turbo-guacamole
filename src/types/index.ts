export type PhysiqueGoalId =
  | 'lean_shredded'
  | 'athletic_agile'
  | 'muscular_hypertrophy'
  | 'power_strength'
  | 'toned_balanced';

export type EquipmentEnvironment = 'gym' | 'home' | 'bodyweight';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Legs'
  | 'Arms'
  | 'Core'
  | 'Conditioning';

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export type UnitSystem = 'imperial' | 'metric';

export interface PhysiqueGoalConfig {
  id: PhysiqueGoalId;
  name: string;
  tagline: string;
  description: string;
  accentColor: string;
  icon: string;
  repRange: string;
  setsMultiplier: number;
  restSeconds: number;
  cardioDaysNote: string;
  calorieAdjustment: number; // kcal delta from TDEE
  proteinPerKg: number;
  fatCalorieRatio: number;
  keyFocus: string[];
  recommendedSplitLabel: string;
}

export interface UserProfile {
  name: string;
  physiqueGoal: PhysiqueGoalId;
  equipment: EquipmentEnvironment;
  experience: ExperienceLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  unitSystem: UnitSystem;
  onboardingCompleted: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: EquipmentEnvironment[];
  equipmentLabel: string;
  difficulty: ExperienceLevel;
  movementType: 'compound' | 'isolation' | 'conditioning' | 'core';
  recommendedGoals: PhysiqueGoalId[];
  formCues: string[];
  commonMistakes: string[];
  defaultRestSeconds: number;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  note: string;
}

export interface WorkoutDayPlan {
  dayIndex: number; // 0 = Mon .. 6 = Sun
  dayShort: string;
  dayFull: string;
  isRestDay: boolean;
  title: string;
  focus: string;
  estimatedMinutes: number;
  exercises: PlannedExercise[];
  recoveryTip?: string;
}

export interface LoggedSet {
  setNumber: number;
  weight: number; // stored in user's unit at time of log or kg -> we'll store kg consistently
  reps: number;
  completed: boolean;
}

export interface LoggedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: LoggedSet[];
}

export interface WorkoutSession {
  id: string;
  dateISO: string; // YYYY-MM-DD
  completedAt: string; // full ISO timestamp
  dayTitle: string;
  physiqueGoal: PhysiqueGoalId;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSetsCompleted: number;
  exercises: LoggedExercise[];
}

export interface BodyMeasurementEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  bodyFatPct?: number;
}

export interface FoodLogItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface DailyNutritionLog {
  dateISO: string; // YYYY-MM-DD
  items: FoodLogItem[];
  waterMl: number;
}

export interface MacroTargets {
  bmr: number;
  tdee: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterMl: number;
  rationale: string;
}

export interface HealthMeterBreakdown {
  overallScore: number; // 0-100
  statusLabel: string;
  statusColor: string;
  weeklyConsistencyScore: number; // 0-100
  streakScore: number; // 0-100
  nutritionScore: number; // 0-100
  physiqueProgressScore: number; // 0-100
  currentStreakDays: number;
  workoutsThisWeek: number;
  weeklyTarget: number;
  nextMilestoneText: string;
}

export type ActiveTab = 'dashboard' | 'plan' | 'exercises' | 'nutrition' | 'profile';
