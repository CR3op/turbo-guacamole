import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { useApp } from '../context/AppContext';
import { EXERCISES_BY_ID } from '../data/exercises';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { COLORS, RADIUS } from '../theme/colors';
import { Exercise, WorkoutDayPlan } from '../types';
import { formatVolume, getTodayWeekdayIndex } from '../utils/units';

interface Props {
  onStartWorkout: (planDay: WorkoutDayPlan) => void;
}

export const PlanScreen: React.FC<Props> = ({ onStartWorkout }) => {
  const {
    profile,
    weeklyPlan,
    workouts,
    swapPlannedExercise,
    deleteWorkoutSession,
  } = useApp();

  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() =>
    getTodayWeekdayIndex()
  );
  const [inspecting, setInspecting] = useState<{
    exercise: Exercise;
    slotIndex: number;
  } | null>(null);

  const goalConfig = PHYSIQUE_GOALS[profile.physiqueGoal];
  const selectedDay = weeklyPlan[selectedDayIdx] ?? weeklyPlan[0];
  const todayIdx = getTodayWeekdayIndex();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Plan Banner */}
      <View style={[styles.banner, { borderColor: `${goalConfig.accentColor}55` }]}>
        <View style={styles.bannerTop}>
          <View style={[styles.badge, { backgroundColor: `${goalConfig.accentColor}22` }]}>
            <Ionicons name={goalConfig.icon as any} size={13} color={goalConfig.accentColor} />
            <Text style={[styles.badgeText, { color: goalConfig.accentColor }]}>
              {goalConfig.recommendedSplitLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bannerMeta}>
            {profile.daysPerWeek}d/wk • {profile.equipment.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.bannerTitle}>{goalConfig.name} Blueprint</Text>
        <Text style={styles.bannerDesc}>{goalConfig.cardioDaysNote}</Text>
      </View>

      {/* 7-Day Selector Strip */}
      <View style={styles.dayStrip}>
        {weeklyPlan.map((day) => {
          const active = day.dayIndex === selectedDayIdx;
          const isToday = day.dayIndex === todayIdx;
          return (
            <TouchableOpacity
              key={day.dayIndex}
              style={[
                styles.dayPill,
                active && styles.dayPillActive,
                isToday && !active && styles.dayPillToday,
              ]}
              onPress={() => setSelectedDayIdx(day.dayIndex)}
            >
              <Text
                style={[styles.dayPillLabel, active && styles.dayPillLabelActive]}
              >
                {day.dayShort}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  day.isRestDay
                    ? styles.dayDotRest
                    : active
                    ? { backgroundColor: COLORS.black }
                    : { backgroundColor: COLORS.primary },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Day Detail Card */}
      <View style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.daySub}>
              {selectedDay.dayFull} {selectedDay.dayIndex === todayIdx ? '• TODAY' : ''}
            </Text>
            <Text style={styles.dayTitle}>{selectedDay.title}</Text>
            <Text style={styles.dayFocus}>{selectedDay.focus}</Text>
          </View>
          <View style={styles.timePill}>
            <Ionicons name="time-outline" size={14} color={COLORS.cyan} />
            <Text style={styles.timeText}>{selectedDay.estimatedMinutes}m</Text>
          </View>
        </View>

        {selectedDay.isRestDay ? (
          <View style={styles.restBox}>
            <Ionicons name="sparkles-outline" size={26} color={COLORS.primaryLight} />
            <Text style={styles.restHeading}>Recovery builds the physique</Text>
            <Text style={styles.restBody}>{selectedDay.recoveryTip}</Text>
          </View>
        ) : (
          <>
            <View style={styles.exerciseList}>
              {selectedDay.exercises.map((planned, idx) => {
                const ex = EXERCISES_BY_ID[planned.exerciseId];
                if (!ex) return null;
                return (
                  <TouchableOpacity
                    key={`${planned.exerciseId}-${idx}`}
                    style={styles.exerciseRow}
                    onPress={() => setInspecting({ exercise: ex, slotIndex: idx })}
                  >
                    <View style={styles.indexCircle}>
                      <Text style={styles.indexNum}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exName}>{ex.name}</Text>
                      <Text style={styles.exMeta}>
                        {ex.muscleGroup} • {planned.sets} sets × {planned.reps} •{' '}
                        {planned.restSeconds}s rest
                      </Text>
                      <Text style={styles.exNote}>{planned.note}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Ionicons name="swap-horizontal" size={17} color={COLORS.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.hintText}>
              Tip: Tap any exercise for step-by-step form cues or to swap it out.
            </Text>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => onStartWorkout(selectedDay)}
            >
              <Ionicons name="play" size={18} color={COLORS.black} />
              <Text style={styles.startBtnText}>Start {selectedDay.dayShort} Workout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Recent Workout History */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Recent Logged Workouts</Text>
        <Text style={styles.historyCount}>{workouts.length} total</Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Ionicons name="barbell-outline" size={26} color={COLORS.textMuted} />
          <Text style={styles.emptyHistoryText}>
            No sessions logged yet. Start a workout above to track sets and build your streak!
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {workouts.slice(0, 8).map((session) => (
            <View key={session.id} style={styles.historyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyDate}>{session.dateISO}</Text>
                <Text style={styles.historyTitle}>{session.dayTitle}</Text>
                <Text style={styles.historyMeta}>
                  {session.totalSetsCompleted} sets • {session.durationMinutes} min •{' '}
                  {formatVolume(session.totalVolumeKg, profile.unitSystem)} volume
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteWorkoutSession(session.id)}
              >
                <Ionicons name="trash-outline" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />

      <ExerciseDetailModal
        visible={Boolean(inspecting)}
        exercise={inspecting?.exercise ?? null}
        physiqueGoal={profile.physiqueGoal}
        experience={profile.experience}
        equipment={profile.equipment}
        onClose={() => setInspecting(null)}
        onSwapSelect={(newExId) => {
          if (inspecting) {
            swapPlannedExercise(selectedDay.dayIndex, inspecting.slotIndex, newExId);
          }
        }}
      />
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
  banner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  bannerMeta: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  bannerDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  dayStrip: {
    flexDirection: 'row',
    gap: 6,
  },
  dayPill: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  dayPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayPillToday: {
    borderColor: COLORS.cyan,
  },
  dayPillLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayPillLabelActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayDotRest: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.4,
  },
  dayCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  daySub: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.8,
  },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  dayFocus: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.cyanDim,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  restBox: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 8,
  },
  restHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  restBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  exerciseList: {
    gap: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  indexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexNum: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  exName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  exMeta: {
    fontSize: 12,
    color: COLORS.cyan,
    fontWeight: '600',
    marginTop: 2,
  },
  exNote: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rowRight: {
    paddingLeft: 4,
  },
  hintText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  startBtnText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyCount: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  emptyHistory: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  historyMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  deleteBtn: {
    padding: 8,
  },
});
