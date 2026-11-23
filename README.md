# PhysiqueMeter (`turbo-guacamole`)

A React Native (Expo + TypeScript) health & fitness app that suggests goal-aligned exercises, generates personalized weekly workout splits, tracks workouts & body measurements via an interactive **Health Meter**, and calculates daily calorie & macro targets to help you reach your target physique.

## Features

- **Health Meter Dashboard** — Dynamic 0–100 composite score combining weekly training consistency, workout streaks, daily macro & hydration adherence, and physique weight-trend progress, plus a weight-vs-target trend chart and body check-in logger.
- **Physique Goal Studio (5 Target Physiques)** — Switch anytime between **Lean & Shredded**, **Athletic & Agile**, **Muscular Hypertrophy**, **Power & Strength**, and **Toned & Balanced** to automatically recalibrate your weekly split, rep ranges, rest periods, and daily macros.
- **Personalized Weekly Workout Plan** — Supports **3, 4, 5, or 6 training days/week**, **Beginner / Intermediate / Advanced** levels, and all 3 equipment modes (**Full Gym**, **Home Setup**, **Bodyweight Only**), with one-tap exercise swapping and step-by-step form tips.
- **Live Workout Logger** — Interactive set-by-set weight & reps tracking, completion toggles, automatic rest countdown timer (`+15s` / `Skip`), live volume calculation, and workout history.
- **Smart Exercise Library** — 47 curated exercises across Chest, Back, Shoulders, Legs, Arms, Core, and Conditioning with muscle targeting, goal-adapted prescriptions, form cues, and common mistakes to avoid.
- **Daily Calorie, Macro & Hydration Tracker** — Mifflin-St Jeor BMR/TDEE calculation tailored to your physique goal, visual macro rings, hydration tracker, goal-matched quick-add meals, and custom meal logging.
- **On-Device Local Persistence** — Powered by `@react-native-async-storage/async-storage` so all progress works immediately with zero account setup.

## Getting Started

```bash
npm install
```

Run on mobile (Expo Go) or web:

```bash
# Start Expo dev server (scan QR code with Expo Go on iOS or Android)
npm start

# Launch in web browser
npm run web

# Type-check
npx tsc --noEmit
```
