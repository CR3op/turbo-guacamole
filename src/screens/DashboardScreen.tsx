import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HabitStreakHeatmap } from '../components/HabitStreakHeatmap';
import { HealthMeterGauge } from '../components/HealthMeterGauge';
import { WeightTrendChart } from '../components/WeightTrendChart';
import { useApp } from '../context/AppContext';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { COLORS, RADIUS } from '../theme/colors';
import { ActiveTab, WorkoutDayPlan } from '../types';
import {
  displayWeightToKg,
  formatWater,
  formatWeight,
  getTodayISO,
  getTodayWeekdayIndex,
  weightKgToDisplayNumber,
} from '../utils/units';

interface Props {
  onNavigateTab: (tab: ActiveTab) => void;
  onStartWorkout: (planDay: WorkoutDayPlan) => void;
}

export const DashboardScreen: React.FC<Props> = ({
  onNavigateTab,
  onStartWorkout,
}) => {
  const {
    profile,
    weeklyPlan,
    bodyHistory,
    todayNutrition,
    macroTargets,
    healthMeter,
    habitTracker,
    addBodyMeasurement,
    addWater,
  } = useApp();

  const [weighInOpen, setWeighInOpen] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');

  const goalConfig = PHYSIQUE_GOALS[profile.physiqueGoal];
  const todayIdx = getTodayWeekdayIndex();
  const todayPlan = weeklyPlan[todayIdx] ?? weeklyPlan[0];

  // If today is a rest day, also find the next training day so the user can always train if they want!
  const nextActiveDay = useMemo(() => {
    if (!todayPlan.isRestDay) return todayPlan;
    for (let offset = 1; offset <= 7; offset++) {
      const candidate = weeklyPlan[(todayIdx + offset) % 7];
      if (candidate && !candidate.isRestDay) return candidate;
    }
    return todayPlan;
  }, [todayPlan, weeklyPlan, todayIdx]);

  const consumedCals = todayNutrition.items.reduce((s, i) => s + i.calories, 0);
  const consumedProtein = todayNutrition.items.reduce((s, i) => s + i.protein, 0);
  const calPct = Math.min(100, Math.round((consumedCals / Math.max(1, macroTargets.calories)) * 100));
  const proPct = Math.min(
    100,
    Math.round((consumedProtein / Math.max(1, macroTargets.proteinGrams)) * 100)
  );

  const openWeighIn = () => {
    setWeightInput(
      String(weightKgToDisplayNumber(profile.currentWeightKg, profile.unitSystem))
    );
    setWaistInput('');
    setBodyFatInput('');
    setWeighInOpen(true);
  };

  const handleSaveWeighIn = () => {
    const parsedWeight = parseFloat(weightInput);
    if (!parsedWeight || parsedWeight <= 0) return;

    const weightKg = displayWeightToKg(parsedWeight, profile.unitSystem);
    const waistVal = parseFloat(waistInput);
    const waistCm =
      waistVal > 0
        ? profile.unitSystem === 'imperial'
          ? Math.round(waistVal * 2.54 * 10) / 10
          : waistVal
        : undefined;
    const bfVal = parseFloat(bodyFatInput);

    addBodyMeasurement({
      dateISO: getTodayISO(),
      weightKg,
      waistCm,
      bodyFatPct: bfVal > 0 && bfVal < 70 ? bfVal : undefined,
    });
    setWeighInOpen(false);
  };

  const weightDeltaKg = profile.targetWeightKg - profile.currentWeightKg;
  const weightDeltaText =
    Math.abs(weightDeltaKg) < 0.3
      ? 'At goal weight!'
      : `${weightDeltaKg > 0 ? '+' : ''}${formatWeight(weightDeltaKg, profile.unitSystem)} to target`;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Greeting */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetingSub}>PHYSIQUE HEALTH METER</Text>
          <Text style={styles.greetingTitle}>Hey, {profile.name}</Text>
        </View>
        <TouchableOpacity
          style={[styles.goalChip, { borderColor: `${goalConfig.accentColor}66` }]}
          onPress={() => onNavigateTab('profile')}
        >
          <Ionicons name={goalConfig.icon as any} size={14} color={goalConfig.accentColor} />
          <Text style={[styles.goalChipText, { color: goalConfig.accentColor }]}>
            {goalConfig.name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Health Meter Gauge */}
      <HealthMeterGauge data={healthMeter} goalColor={goalConfig.accentColor} />

      {/* Quick Stat Pills */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={18} color={COLORS.amber} />
          <Text style={styles.statNumber}>{healthMeter.currentStreakDays}</Text>
          <Text style={styles.statLabel}>Session Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.statNumber}>
            {healthMeter.workoutsThisWeek}/{healthMeter.weeklyTarget}
          </Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell-outline" size={18} color={COLORS.cyan} />
          <Text style={styles.statNumber}>
            {profile.equipment === 'gym'
              ? 'Gym'
              : profile.equipment === 'home'
              ? 'Home'
              : 'Bodywt'}
          </Text>
          <Text style={styles.statLabel}>Mode</Text>
        </View>
      </View>

      {/* GitHub-Style Session Habit Tracker */}
      <HabitStreakHeatmap
        summary={habitTracker}
        unitSystem={profile.unitSystem}
      />

      {/* Today's Recommended Workout Card */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {todayPlan.isRestDay ? "Today's Recovery" : "Today's Suggested Workout"}
        </Text>
        <TouchableOpacity onPress={() => onNavigateTab('plan')}>
          <Text style={styles.linkText}>Full Split →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.workoutCard}>
        <View style={styles.workoutCardTop}>
          <View style={styles.dayBadge}>
            <Text style={styles.dayBadgeText}>{todayPlan.dayFull.toUpperCase()}</Text>
          </View>
          <Text style={styles.durationText}>~{todayPlan.estimatedMinutes} min</Text>
        </View>

        <Text style={styles.workoutTitle}>{todayPlan.title}</Text>
        <Text style={styles.workoutFocus}>{todayPlan.focus}</Text>

        {todayPlan.isRestDay ? (
          <>
            <View style={styles.recoveryBox}>
              <Ionicons name="leaf-outline" size={18} color={COLORS.primaryLight} />
              <Text style={styles.recoveryText}>{todayPlan.recoveryTip}</Text>
            </View>
            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.primary }]}
              onPress={() => onStartWorkout(nextActiveDay)}
            >
              <Ionicons name="play" size={16} color={COLORS.primaryLight} />
              <Text style={[styles.primaryCtaText, { color: COLORS.primaryLight }]}>
                Train Early: {nextActiveDay.title}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.exPreviewRow}>
              <Ionicons name="list-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.exPreviewText}>
                {todayPlan.exercises.length} targeted exercises • {goalConfig.repRange} rep focus
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => onStartWorkout(todayPlan)}
            >
              <Ionicons name="play" size={16} color={COLORS.black} />
              <Text style={styles.primaryCtaText}>Start Today's Workout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Daily Fuel Snapshot */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Daily Fuel & Hydration</Text>
        <TouchableOpacity onPress={() => onNavigateTab('nutrition')}>
          <Text style={styles.linkText}>Log Meals →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.fuelRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.fuelLabelRow}>
              <Text style={styles.fuelLabel}>Calories</Text>
              <Text style={styles.fuelVal}>
                {consumedCals} / {macroTargets.calories} kcal
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${calPct}%`, backgroundColor: COLORS.amber }]}
              />
            </View>
          </View>
        </View>

        <View style={[styles.fuelRow, { marginTop: 12 }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.fuelLabelRow}>
              <Text style={styles.fuelLabel}>Protein Target</Text>
              <Text style={styles.fuelVal}>
                {consumedProtein}g / {macroTargets.proteinGrams}g
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${proPct}%`, backgroundColor: COLORS.primary }]}
              />
            </View>
          </View>
        </View>

        <View style={styles.waterRow}>
          <View style={styles.waterInfo}>
            <Ionicons name="water" size={18} color={COLORS.cyan} />
            <Text style={styles.waterText}>
              {formatWater(todayNutrition.waterMl, profile.unitSystem)} /{' '}
              {formatWater(macroTargets.waterMl, profile.unitSystem)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.waterBtn}
            onPress={() => addWater(250)}
          >
            <Ionicons name="add" size={15} color={COLORS.cyan} />
            <Text style={styles.waterBtnText}>+250 ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Progress & Measurements */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Physique Progress</Text>
        <TouchableOpacity onPress={openWeighIn}>
          <Text style={styles.linkText}>+ Log Weigh-In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.progressTopRow}>
          <View>
            <Text style={styles.progressBig}>
              {formatWeight(profile.currentWeightKg, profile.unitSystem)}
            </Text>
            <Text style={styles.progressSub}>{weightDeltaText}</Text>
          </View>
          <TouchableOpacity style={styles.weighBtn} onPress={openWeighIn}>
            <Ionicons name="scale-outline" size={16} color={COLORS.textPrimary} />
            <Text style={styles.weighBtnText}>Check-In</Text>
          </TouchableOpacity>
        </View>

        <WeightTrendChart
          entries={bodyHistory}
          targetWeightKg={profile.targetWeightKg}
          unitSystem={profile.unitSystem}
        />
      </View>

      <View style={{ height: 24 }} />

      {/* Weigh-In Modal */}
      <Modal
        visible={weighInOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setWeighInOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setWeighInOpen(false)}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Body Check-In</Text>
            <Text style={styles.modalSub}>
              Updates your physique trend and Health Meter automatically.
            </Text>

            <Text style={styles.inputLabel}>
              Weight ({profile.unitSystem === 'imperial' ? 'lbs' : 'kg'}) *
            </Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder="e.g. 172"
              placeholderTextColor={COLORS.textMuted}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>
                  Waist ({profile.unitSystem === 'imperial' ? 'in' : 'cm'})
                </Text>
                <TextInput
                  style={styles.input}
                  value={waistInput}
                  onChangeText={setWaistInput}
                  keyboardType="numeric"
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Body Fat %</Text>
                <TextInput
                  style={styles.input}
                  value={bodyFatInput}
                  onChangeText={setBodyFatInput}
                  keyboardType="numeric"
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setWeighInOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveWeighIn}>
                <Text style={styles.modalSaveText}>Save Check-In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  greetingSub: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: COLORS.primaryLight,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 5,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  workoutCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workoutCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  dayBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.8,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  workoutFocus: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  exPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  exPreviewText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  recoveryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 12,
    marginVertical: 12,
  },
  recoveryText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
  },
  primaryCtaText: {
    color: COLORS.black,
    fontSize: 14.5,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fuelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fuelLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fuelLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  fuelVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  waterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  waterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cyanDim,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  waterBtnText: {
    color: COLORS.cyan,
    fontSize: 12.5,
    fontWeight: '800',
  },
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBig: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  progressSub: {
    fontSize: 12.5,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  weighBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weighBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalSaveText: {
    color: COLORS.black,
    fontWeight: '800',
  },
});
