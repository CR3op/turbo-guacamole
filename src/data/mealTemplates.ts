import { PhysiqueGoalId } from '../types';

export interface MealTemplate {
  id: string;
  name: string;
  tag: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bestFor: PhysiqueGoalId[];
}

export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    id: 'greek-yogurt-berry-bowl',
    name: 'High-Protein Greek Yogurt & Berry Bowl',
    tag: 'Breakfast • Lean',
    calories: 340,
    protein: 32,
    carbs: 36,
    fat: 7,
    bestFor: ['lean_shredded', 'toned_balanced', 'athletic_agile'],
  },
  {
    id: 'chicken-rice-avocado-bowl',
    name: 'Grilled Chicken, Jasmine Rice & Avocado',
    tag: 'Lunch / Dinner • Classic',
    calories: 620,
    protein: 52,
    carbs: 64,
    fat: 16,
    bestFor: ['muscular_hypertrophy', 'athletic_agile', 'power_strength'],
  },
  {
    id: 'salmon-sweet-potato-greens',
    name: 'Seared Salmon, Sweet Potato & Broccoli',
    tag: 'Dinner • Omega-3',
    calories: 560,
    protein: 42,
    carbs: 44,
    fat: 22,
    bestFor: ['athletic_agile', 'toned_balanced', 'muscular_hypertrophy'],
  },
  {
    id: 'whey-banana-shake',
    name: 'Post-Workout Whey & Banana Shake',
    tag: 'Recovery Shake',
    calories: 280,
    protein: 30,
    carbs: 32,
    fat: 3,
    bestFor: ['lean_shredded', 'muscular_hypertrophy', 'athletic_agile', 'power_strength'],
  },
  {
    id: 'egg-white-avocado-toast',
    name: 'Eggs, Egg Whites & Sourdough Avocado Toast',
    tag: 'Breakfast • Balanced',
    calories: 430,
    protein: 34,
    carbs: 34,
    fat: 17,
    bestFor: ['toned_balanced', 'lean_shredded', 'athletic_agile'],
  },
  {
    id: 'lean-beef-quinoa-bowl',
    name: 'Lean Beef, Quinoa & Roasted Peppers',
    tag: 'Mass & Strength',
    calories: 690,
    protein: 50,
    carbs: 66,
    fat: 23,
    bestFor: ['power_strength', 'muscular_hypertrophy'],
  },
  {
    id: 'turkey-wrap-hummus',
    name: 'Turkey Breast Protein Wrap & Hummus',
    tag: 'Quick Lunch • Cut',
    calories: 390,
    protein: 38,
    carbs: 34,
    fat: 10,
    bestFor: ['lean_shredded', 'toned_balanced'],
  },
  {
    id: 'protein-oats-pb',
    name: 'Protein Oats with Peanut Butter & Chia',
    tag: 'Pre-Workout Fuel',
    calories: 520,
    protein: 36,
    carbs: 58,
    fat: 15,
    bestFor: ['muscular_hypertrophy', 'power_strength', 'athletic_agile'],
  },
];
