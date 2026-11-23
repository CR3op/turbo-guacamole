import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseDetailModal } from '../components/ExerciseDetailModal';
import { useApp } from '../context/AppContext';
import { EXERCISES, MUSCLE_GROUPS } from '../data/exercises';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { getGoalPrescription } from '../engine/workoutGenerator';
import { COLORS, RADIUS } from '../theme/colors';
import { EquipmentEnvironment, Exercise, MuscleGroup, WorkoutDayPlan } from '../types';

interface Props {
  onStartQuickExercise: (planDay: WorkoutDayPlan) => void;
}

export const ExercisesScreen: React.FC<Props> = ({ onStartQuickExercise }) => {
  const { profile } = useApp();
  const [query, setQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>('All');
  const [selectedEquip, setSelectedEquip] = useState<EquipmentEnvironment | 'all'>('all');
  const [goalOnly, setGoalOnly] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const goalConfig = PHYSIQUE_GOALS[profile.physiqueGoal];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((ex) => {
      if (selectedMuscle !== 'All' && ex.muscleGroup !== selectedMuscle) return false;
      if (selectedEquip !== 'all' && !ex.equipment.includes(selectedEquip)) return false;
      if (goalOnly && !ex.recommendedGoals.includes(profile.physiqueGoal)) return false;
      if (q) {
        const hay = `${ex.name} ${ex.muscleGroup} ${ex.secondaryMuscles.join(' ')} ${ex.equipmentLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, selectedMuscle, selectedEquip, goalOnly, profile.physiqueGoal]);

  const handleQuickLog = (exercise: Exercise) => {
    const presc = getGoalPrescription(exercise, profile.physiqueGoal, profile.experience);
    onStartQuickExercise({
      dayIndex: 0,
      dayShort: 'Quick',
      dayFull: 'Quick Session',
      isRestDay: false,
      title: `Quick Session: ${exercise.name}`,
      focus: exercise.muscleGroup,
      estimatedMinutes: 15,
      exercises: [{ exerciseId: exercise.id, ...presc }],
    });
  };

  return (
    <View style={styles.root}>
      {/* Search & Filters Header */}
      <View style={styles.topControls}>
        <Text style={styles.heading}>Exercise Suggestions</Text>
        <Text style={styles.subheading}>
          47 curated movements with sets, reps & form cues tailored for {goalConfig.name}.
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search chest, squats, dumbbells, abs..."
            placeholderTextColor={COLORS.textMuted}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Equipment + Goal Match Filter Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              goalOnly && {
                backgroundColor: `${goalConfig.accentColor}26`,
                borderColor: goalConfig.accentColor,
              },
            ]}
            onPress={() => setGoalOnly((v) => !v)}
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={goalOnly ? goalConfig.accentColor : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                goalOnly && { color: goalConfig.accentColor },
              ]}
            >
              Best for {goalConfig.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>

          {(
            [
              { id: 'all', label: 'All Gear' },
              { id: 'gym', label: 'Full Gym' },
              { id: 'home', label: 'Home' },
              { id: 'bodyweight', label: 'Bodyweight' },
            ] as const
          ).map((eq) => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.chip, selectedEquip === eq.id && styles.chipActive]}
              onPress={() => setSelectedEquip(eq.id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedEquip === eq.id && styles.chipTextActive,
                ]}
              >
                {eq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Muscle Group Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['All', ...MUSCLE_GROUPS] as const).map((mg) => (
            <TouchableOpacity
              key={mg}
              style={[styles.muscleChip, selectedMuscle === mg && styles.muscleChipActive]}
              onPress={() => setSelectedMuscle(mg)}
            >
              <Text
                style={[
                  styles.muscleChipText,
                  selectedMuscle === mg && styles.muscleChipTextActive,
                ]}
              >
                {mg}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Exercise List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultCount}>
          Showing {filtered.length} exercise{filtered.length === 1 ? '' : 's'}
        </Text>

        {filtered.map((ex) => {
          const isGoalMatch = ex.recommendedGoals.includes(profile.physiqueGoal);
          const presc = getGoalPrescription(ex, profile.physiqueGoal, profile.experience);

          return (
            <TouchableOpacity
              key={ex.id}
              style={styles.card}
              onPress={() => setSelectedExercise(ex)}
            >
              <View style={styles.cardTop}>
                <View style={styles.tagRow}>
                  <View style={styles.muscleTag}>
                    <Text style={styles.muscleTagText}>{ex.muscleGroup}</Text>
                  </View>
                  {isGoalMatch && (
                    <View
                      style={[
                        styles.goalMatchTag,
                        { backgroundColor: `${goalConfig.accentColor}22` },
                      ]}
                    >
                      <Ionicons
                        name="sparkles"
                        size={10}
                        color={goalConfig.accentColor}
                      />
                      <Text
                        style={[
                          styles.goalMatchText,
                          { color: goalConfig.accentColor },
                        ]}
                      >
                        Goal Match
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.diffText}>{ex.difficulty}</Text>
              </View>

              <Text style={styles.exName}>{ex.name}</Text>
              <Text style={styles.exSub}>
                {ex.equipmentLabel} • Targets: {ex.secondaryMuscles.slice(0, 2).join(', ')}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.prescText}>
                  Suggested: {presc.sets} × {presc.reps} ({presc.restSeconds}s rest)
                </Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              No exercises match those filters. Try clearing your search or switching gear.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <ExerciseDetailModal
        visible={Boolean(selectedExercise)}
        exercise={selectedExercise}
        physiqueGoal={profile.physiqueGoal}
        experience={profile.experience}
        equipment={profile.equipment}
        onClose={() => setSelectedExercise(null)}
        onQuickStartSingle={handleQuickLog}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topControls: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: -6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  filterRow: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primaryLight,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
  },
  muscleChipActive: {
    backgroundColor: COLORS.cyan,
  },
  muscleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  muscleChipTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  muscleTag: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  muscleTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.cyan,
  },
  goalMatchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  goalMatchText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  diffText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  exName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  exSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  prescText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 13.5,
  },
});
