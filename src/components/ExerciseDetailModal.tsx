import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { getAlternativeExercises, getGoalPrescription } from '../engine/workoutGenerator';
import { COLORS, RADIUS } from '../theme/colors';
import { EquipmentEnvironment, Exercise, ExperienceLevel, PhysiqueGoalId } from '../types';

interface Props {
  visible: boolean;
  exercise: Exercise | null;
  physiqueGoal: PhysiqueGoalId;
  experience: ExperienceLevel;
  equipment: EquipmentEnvironment;
  onClose: () => void;
  onSwapSelect?: (newExerciseId: string) => void;
  onQuickStartSingle?: (exercise: Exercise) => void;
}

export const ExerciseDetailModal: React.FC<Props> = ({
  visible,
  exercise,
  physiqueGoal,
  experience,
  equipment,
  onClose,
  onSwapSelect,
  onQuickStartSingle,
}) => {
  const [showSwaps, setShowSwaps] = useState(false);

  if (!exercise) return null;

  const goalConfig = PHYSIQUE_GOALS[physiqueGoal];
  const prescription = getGoalPrescription(exercise, physiqueGoal, experience);
  const alternatives = onSwapSelect
    ? getAlternativeExercises(exercise.id, equipment)
    : [];

  const handleClose = () => {
    setShowSwaps(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: COLORS.primaryDim }]}>
                  <Text style={[styles.badgeText, { color: COLORS.primaryLight }]}>
                    {exercise.muscleGroup}
                  </Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{exercise.difficulty.toUpperCase()}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{exercise.equipmentLabel}</Text>
                </View>
              </View>
              <Text style={styles.title}>{exercise.name}</Text>
              <Text style={styles.subMuscles}>
                Secondary: {exercise.secondaryMuscles.join(' • ')}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Goal-adapted Prescription Banner */}
            <View style={[styles.prescriptionCard, { borderColor: `${goalConfig.accentColor}55` }]}>
              <View style={styles.prescriptionTop}>
                <Ionicons name="sparkles" size={16} color={goalConfig.accentColor} />
                <Text style={[styles.prescriptionHeading, { color: goalConfig.accentColor }]}>
                  Prescribed for {goalConfig.name}
                </Text>
              </View>
              <View style={styles.prescriptionStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{prescription.sets}</Text>
                  <Text style={styles.statLbl}>Sets</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{prescription.reps}</Text>
                  <Text style={styles.statLbl}>Target Reps</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{prescription.restSeconds}s</Text>
                  <Text style={styles.statLbl}>Rest</Text>
                </View>
              </View>
              <Text style={styles.prescriptionNote}>Coach note: {prescription.note}</Text>
            </View>

            {/* Form Cues */}
            <Text style={styles.sectionTitle}>Key Form Cues</Text>
            <View style={styles.listCard}>
              {exercise.formCues.map((cue, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <View style={styles.cueIndex}>
                    <Text style={styles.cueIndexText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.cueText}>{cue}</Text>
                </View>
              ))}
            </View>

            {/* Common Mistakes */}
            <Text style={styles.sectionTitle}>Common Mistakes to Avoid</Text>
            <View style={styles.listCard}>
              {exercise.commonMistakes.map((mistake, idx) => (
                <View key={idx} style={styles.cueRow}>
                  <Ionicons name="warning-outline" size={18} color={COLORS.amber} style={{ marginTop: 1 }} />
                  <Text style={styles.cueText}>{mistake}</Text>
                </View>
              ))}
            </View>

            {/* Swap Picker */}
            {onSwapSelect && alternatives.length > 0 && (
              <View style={styles.swapSection}>
                <TouchableOpacity
                  style={styles.swapToggleBtn}
                  onPress={() => setShowSwaps((s) => !s)}
                >
                  <Ionicons name="swap-horizontal" size={18} color={COLORS.cyan} />
                  <Text style={styles.swapToggleText}>
                    {showSwaps
                      ? 'Hide Alternatives'
                      : `Swap Exercise (${alternatives.length} ${exercise.muscleGroup} options)`}
                  </Text>
                </TouchableOpacity>

                {showSwaps && (
                  <View style={styles.swapList}>
                    {alternatives.map((alt) => (
                      <TouchableOpacity
                        key={alt.id}
                        style={styles.swapOption}
                        onPress={() => {
                          onSwapSelect(alt.id);
                          handleClose();
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.swapOptionName}>{alt.name}</Text>
                          <Text style={styles.swapOptionSub}>
                            {alt.equipmentLabel} • {alt.difficulty}
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward-circle" size={22} color={COLORS.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {onQuickStartSingle && (
              <TouchableOpacity
                style={styles.quickLogBtn}
                onPress={() => {
                  const target = exercise;
                  handleClose();
                  onQuickStartSingle(target);
                }}
              >
                <Ionicons name="play" size={18} color={COLORS.black} />
                <Text style={styles.quickLogBtnText}>Log This Exercise Now</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '86%',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subMuscles: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    marginTop: 4,
  },
  prescriptionCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  prescriptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  prescriptionHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  prescriptionStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  statLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  prescriptionNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cueIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cueIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  cueText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  swapSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  swapToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cyanDim,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.35)',
  },
  swapToggleText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 14,
  },
  swapList: {
    marginTop: 10,
    gap: 8,
  },
  swapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swapOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  swapOptionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  quickLogBtnText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 15,
  },
});
