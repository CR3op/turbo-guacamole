import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISES_BY_ID } from '../data/exercises';
import { COLORS, RADIUS } from '../theme/colors';
import {
  LoggedExercise,
  PhysiqueGoalId,
  PlannedExercise,
  UnitSystem,
  WorkoutSession,
} from '../types';
import {
  displayWeightToKg,
  formatVolume,
  getTodayISO,
  weightKgToDisplayNumber,
} from '../utils/units';

interface Props {
  visible: boolean;
  title: string;
  plannedExercises: PlannedExercise[];
  physiqueGoal: PhysiqueGoalId;
  unitSystem: UnitSystem;
  userWeightKg: number;
  onClose: () => void;
  onComplete: (session: Omit<WorkoutSession, 'id'>) => void;
}

interface EditableSet {
  setNumber: number;
  weightText: string;
  repsText: string;
  completed: boolean;
}

interface EditableExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: LoggedExercise['muscleGroup'];
  restSeconds: number;
  targetReps: string;
  formTip: string;
  sets: EditableSet[];
  showTip: boolean;
}

function parseDefaultReps(repStr: string): string {
  const match = repStr.match(/\d+/);
  return match ? match[0] : '10';
}

export const WorkoutLoggerModal: React.FC<Props> = ({
  visible,
  title,
  plannedExercises,
  physiqueGoal,
  unitSystem,
  userWeightKg,
  onClose,
  onComplete,
}) => {
  const [exercises, setExercises] = useState<EditableExercise[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restRemaining, setRestRemaining] = useState(0);

  // Initialize workout rows whenever opened
  useEffect(() => {
    if (!visible) return;
    setElapsedSeconds(0);
    setRestRemaining(0);

    const defaultBodyweightDisplay = Math.round(
      weightKgToDisplayNumber(userWeightKg, unitSystem)
    );

    const initialized: EditableExercise[] = plannedExercises
      .map((item) => {
        const meta = EXERCISES_BY_ID[item.exerciseId];
        if (!meta) return null;

        const isBodyweightOnly =
          meta.equipment.length === 1 && meta.equipment[0] === 'bodyweight';
        const defaultWeight = isBodyweightOnly
          ? String(defaultBodyweightDisplay)
          : meta.movementType === 'core' || meta.movementType === 'conditioning'
          ? '0'
          : unitSystem === 'imperial'
          ? meta.muscleGroup === 'Legs'
            ? '115'
            : meta.movementType === 'compound'
            ? '85'
            : '25'
          : meta.muscleGroup === 'Legs'
          ? '50'
          : meta.movementType === 'compound'
          ? '40'
          : '12';

        const defaultReps = parseDefaultReps(item.reps);

        return {
          exerciseId: meta.id,
          exerciseName: meta.name,
          muscleGroup: meta.muscleGroup,
          restSeconds: item.restSeconds,
          targetReps: item.reps,
          formTip: meta.formCues[0] ?? 'Maintain controlled form.',
          showTip: false,
          sets: Array.from({ length: item.sets }, (_, i) => ({
            setNumber: i + 1,
            weightText: defaultWeight,
            repsText: defaultReps,
            completed: false,
          })),
        };
      })
      .filter((x): x is EditableExercise => x !== null);

    setExercises(initialized);
  }, [visible, plannedExercises, unitSystem, userWeightKg]);

  // Workout stopwatch + Rest countdown timer
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setRestRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const stats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolumeKg = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        totalSets += 1;
        if (s.completed) {
          completedSets += 1;
          const w = parseFloat(s.weightText) || 0;
          const r = parseInt(s.repsText, 10) || 0;
          const weightKg = displayWeightToKg(w, unitSystem);
          totalVolumeKg += weightKg * r;
        }
      });
    });

    return { totalSets, completedSets, totalVolumeKg };
  }, [exercises, unitSystem]);

  const toggleSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) => {
            if (si !== setIdx) return s;
            const nextCompleted = !s.completed;
            if (nextCompleted) {
              setRestRemaining(ex.restSeconds);
            }
            return { ...s, completed: nextCompleted };
          }),
        };
      })
    );
  };

  const updateSetField = (
    exIdx: number,
    setIdx: number,
    field: 'weightText' | 'repsText',
    val: string
  ) => {
    setExercises((prev) =>
      prev.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, si) =>
            si === setIdx ? { ...s, [field]: val.replace(/[^0-9.]/g, '') } : s
          ),
        };
      })
    );
  };

  const addSet = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, ei) => {
        if (ei !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              setNumber: ex.sets.length + 1,
              weightText: last ? last.weightText : '0',
              repsText: last ? last.repsText : '10',
              completed: false,
            },
          ],
        };
      })
    );
  };

  const toggleTip = (exIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, ei) => (ei === exIdx ? { ...ex, showTip: !ex.showTip } : ex))
    );
  };

  const handleFinish = () => {
    const loggedExercises: LoggedExercise[] = exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets.map((s) => ({
        setNumber: s.setNumber,
        weight: displayWeightToKg(parseFloat(s.weightText) || 0, unitSystem),
        reps: parseInt(s.repsText, 10) || 0,
        completed: s.completed,
      })),
    }));

    const completedCount = stats.completedSets;
    // If user clicks finish before manually ticking boxes, count entered sets cleanly or save actual
    const finalSetsCompleted = Math.max(1, completedCount);

    onComplete({
      dateISO: getTodayISO(),
      completedAt: new Date().toISOString(),
      dayTitle: title,
      physiqueGoal,
      durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      totalVolumeKg: Math.round(stats.totalVolumeKg),
      totalSetsCompleted: finalSetsCompleted,
      exercises: loggedExercises,
    });
    onClose();
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const unitLabel = unitSystem === 'imperial' ? 'lbs' : 'kg';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Ionicons name="chevron-down" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.workoutMeta}>
              {formatClock(elapsedSeconds)} • {stats.completedSets}/{stats.totalSets} sets •{' '}
              {formatVolume(stats.totalVolumeKg, unitSystem)}
            </Text>
          </View>

          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Built-in Rest Timer Banner */}
        {restRemaining > 0 && (
          <View style={styles.restBanner}>
            <View style={styles.restLeft}>
              <Ionicons name="timer-outline" size={20} color={COLORS.cyan} />
              <Text style={styles.restText}>Rest Timer</Text>
              <Text style={styles.restCountdown}>{formatClock(restRemaining)}</Text>
            </View>
            <View style={styles.restActions}>
              <TouchableOpacity
                style={styles.restChip}
                onPress={() => setRestRemaining((r) => r + 15)}
              >
                <Text style={styles.restChipText}>+15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.restChip, { backgroundColor: COLORS.surfaceHighlight }]}
                onPress={() => setRestRemaining(0)}
              >
                <Text style={styles.restChipText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {exercises.map((ex, exIdx) => (
            <View key={`${ex.exerciseId}-${exIdx}`} style={styles.exCard}>
              <View style={styles.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exMuscle}>{ex.muscleGroup.toUpperCase()}</Text>
                  <Text style={styles.exName}>{ex.exerciseName}</Text>
                  <Text style={styles.exTarget}>
                    Target: {ex.targetReps} reps • {ex.restSeconds}s rest
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.tipBtn}
                  onPress={() => toggleTip(exIdx)}
                >
                  <Ionicons
                    name="bulb-outline"
                    size={16}
                    color={ex.showTip ? COLORS.amber : COLORS.textSecondary}
                  />
                  <Text style={styles.tipBtnText}>Cue</Text>
                </TouchableOpacity>
              </View>

              {ex.showTip && (
                <View style={styles.tipBox}>
                  <Text style={styles.tipText}>{ex.formTip}</Text>
                </View>
              )}

              {/* Column labels */}
              <View style={styles.tableHeader}>
                <Text style={[styles.colHeader, { width: 38 }]}>SET</Text>
                <Text style={[styles.colHeader, { flex: 1 }]}>
                  WEIGHT ({unitLabel.toUpperCase()})
                </Text>
                <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
                <Text style={[styles.colHeader, { width: 46, textAlign: 'center' }]}>
                  DONE
                </Text>
              </View>

              {ex.sets.map((set, setIdx) => (
                <View
                  key={set.setNumber}
                  style={[styles.setRow, set.completed && styles.setRowCompleted]}
                >
                  <View style={styles.setNumBadge}>
                    <Text style={styles.setNumText}>{set.setNumber}</Text>
                  </View>

                  <TextInput
                    style={styles.input}
                    value={set.weightText}
                    onChangeText={(v) => updateSetField(exIdx, setIdx, 'weightText', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                  />

                  <TextInput
                    style={styles.input}
                    value={set.repsText}
                    onChangeText={(v) => updateSetField(exIdx, setIdx, 'repsText', v)}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={COLORS.textMuted}
                  />

                  <TouchableOpacity
                    style={[
                      styles.checkBtn,
                      set.completed && styles.checkBtnCompleted,
                    ]}
                    onPress={() => toggleSet(exIdx, setIdx)}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={set.completed ? COLORS.black : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addSetBtn}
                onPress={() => addSet(exIdx)}
              >
                <Ionicons name="add" size={16} color={COLORS.primaryLight} />
                <Text style={styles.addSetText}>Add Set</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.completeFullBtn} onPress={handleFinish}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.black} />
            <Text style={styles.completeFullBtnText}>
              Complete Workout & Boost Health Meter
            </Text>
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  workoutMeta: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  finishBtnText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 13,
  },
  restBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cyanDim,
    borderBottomWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  restLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  restCountdown: {
    color: COLORS.cyan,
    fontSize: 17,
    fontWeight: '800',
  },
  restActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restChip: {
    backgroundColor: 'rgba(6, 182, 212, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  restChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  exCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exMuscle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.cyan,
  },
  exName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  exTarget: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  tipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tipBox: {
    backgroundColor: COLORS.amberDim,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  },
  setRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  setNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumText: {
    color: COLORS.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  checkBtn: {
    width: 40,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginTop: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
  },
  addSetText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  completeFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    marginTop: 4,
  },
  completeFullBtnText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
  },
});
