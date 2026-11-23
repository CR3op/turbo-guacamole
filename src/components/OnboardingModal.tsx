import React, { useState } from 'react';
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
import { PHYSIQUE_GOAL_LIST } from '../data/physiqueGoals';
import { COLORS, RADIUS } from '../theme/colors';
import {
  EquipmentEnvironment,
  ExperienceLevel,
  PhysiqueGoalId,
  UnitSystem,
  UserProfile,
} from '../types';
import { displayWeightToKg, weightKgToDisplayNumber } from '../utils/units';

interface Props {
  visible: boolean;
  profile: UserProfile;
  onComplete: (patch: Partial<UserProfile>) => void;
}

export const OnboardingModal: React.FC<Props> = ({ visible, profile, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState<PhysiqueGoalId>(profile.physiqueGoal);
  const [equipment, setEquipment] = useState<EquipmentEnvironment>(profile.equipment);
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience);
  const [daysPerWeek, setDaysPerWeek] = useState<3 | 4 | 5 | 6>(profile.daysPerWeek);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(profile.unitSystem);
  const [name, setName] = useState(profile.name === 'Athlete' ? '' : profile.name);
  const [currentWeight, setCurrentWeight] = useState(
    String(weightKgToDisplayNumber(profile.currentWeightKg, profile.unitSystem))
  );
  const [targetWeight, setTargetWeight] = useState(
    String(weightKgToDisplayNumber(profile.targetWeightKg, profile.unitSystem))
  );

  const handleToggleUnit = (next: UnitSystem) => {
    if (next === unitSystem) return;
    const curKg = displayWeightToKg(parseFloat(currentWeight) || 75, unitSystem);
    const tgtKg = displayWeightToKg(parseFloat(targetWeight) || 72, unitSystem);
    setUnitSystem(next);
    setCurrentWeight(String(weightKgToDisplayNumber(curKg, next)));
    setTargetWeight(String(weightKgToDisplayNumber(tgtKg, next)));
  };

  const handleFinish = () => {
    const curKg = displayWeightToKg(parseFloat(currentWeight) || 75, unitSystem);
    const tgtKg = displayWeightToKg(parseFloat(targetWeight) || 72, unitSystem);

    onComplete({
      name: name.trim() || 'Athlete',
      physiqueGoal: goal,
      equipment,
      experience,
      daysPerWeek,
      unitSystem,
      currentWeightKg: curKg,
      targetWeightKg: tgtKg,
      onboardingCompleted: true,
    });
  };

  return (
    <Modal visible={visible} animationType="fade">
      <SafeAreaView style={styles.root}>
        <View style={styles.topRow}>
          <View style={styles.progressPills}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[styles.progressBar, step >= s && styles.progressBarActive]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={() => onComplete({ onboardingCompleted: true })}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {step === 1 && (
            <>
              <Text style={styles.eyebrow}>STEP 1 OF 3 • YOUR VISION</Text>
              <Text style={styles.title}>Choose your target physique</Text>
              <Text style={styles.subtitle}>
                We tailor your weekly split, suggested exercises, rep ranges, and daily macros to match.
              </Text>

              <View style={styles.cardStack}>
                {PHYSIQUE_GOAL_LIST.map((g) => {
                  const selected = goal === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        styles.goalCard,
                        selected && { borderColor: g.accentColor, backgroundColor: `${g.accentColor}15` },
                      ]}
                      onPress={() => setGoal(g.id)}
                    >
                      <View
                        style={[
                          styles.goalIcon,
                          { backgroundColor: `${g.accentColor}24` },
                        ]}
                      >
                        <Ionicons name={g.icon as any} size={22} color={g.accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalName}>{g.name}</Text>
                        <Text style={styles.goalTag}>{g.tagline}</Text>
                      </View>
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={selected ? g.accentColor : COLORS.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.eyebrow}>STEP 2 OF 3 • TRAINING SETUP</Text>
              <Text style={styles.title}>Where & how often will you train?</Text>
              <Text style={styles.subtitle}>
                Every suggested exercise automatically adapts to the gear you actually have.
              </Text>

              <Text style={styles.fieldLabel}>Equipment Environment</Text>
              <View style={styles.optionColumn}>
                {(
                  [
                    {
                      id: 'gym',
                      title: 'Full Gym',
                      sub: 'Barbells, dumbbells, cables, racks & machines',
                      icon: 'barbell-outline',
                    },
                    {
                      id: 'home',
                      title: 'Home Setup',
                      sub: 'Dumbbells, resistance bands, bench or pull-up bar',
                      icon: 'home-outline',
                    },
                    {
                      id: 'bodyweight',
                      title: 'Bodyweight Only',
                      sub: 'Zero equipment calisthenics & conditioning anywhere',
                      icon: 'body-outline',
                    },
                  ] as const
                ).map((item) => {
                  const active = equipment === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.choiceRow, active && styles.choiceRowActive]}
                      onPress={() => setEquipment(item.id)}
                    >
                      <Ionicons
                        name={item.icon}
                        size={22}
                        color={active ? COLORS.primaryLight : COLORS.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.choiceTitle}>{item.title}</Text>
                        <Text style={styles.choiceSub}>{item.sub}</Text>
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Experience Level</Text>
              <View style={styles.pillRow}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    style={[styles.pillBtn, experience === lvl && styles.pillBtnActive]}
                    onPress={() => setExperience(lvl)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        experience === lvl && styles.pillTextActive,
                      ]}
                    >
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Training Days Per Week</Text>
              <View style={styles.pillRow}>
                {([3, 4, 5, 6] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.pillBtn, daysPerWeek === d && styles.pillBtnActive]}
                    onPress={() => setDaysPerWeek(d)}
                  >
                    <Text
                      style={[styles.pillText, daysPerWeek === d && styles.pillTextActive]}
                    >
                      {d} Days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.eyebrow}>STEP 3 OF 3 • CALIBRATE HEALTH METER</Text>
              <Text style={styles.title}>Personalize your targets</Text>
              <Text style={styles.subtitle}>
                Used strictly on your device to calculate calorie/macro targets and track body progress.
              </Text>

              <Text style={styles.fieldLabel}>Your First Name (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Jordan"
                placeholderTextColor={COLORS.textMuted}
              />

              <Text style={styles.fieldLabel}>Units</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pillBtn, unitSystem === 'imperial' && styles.pillBtnActive]}
                  onPress={() => handleToggleUnit('imperial')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      unitSystem === 'imperial' && styles.pillTextActive,
                    ]}
                  >
                    Imperial (lbs / in)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pillBtn, unitSystem === 'metric' && styles.pillBtnActive]}
                  onPress={() => handleToggleUnit('metric')}
                >
                  <Text
                    style={[
                      styles.pillText,
                      unitSystem === 'metric' && styles.pillTextActive,
                    ]}
                  >
                    Metric (kg / cm)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    Current Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    Goal Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'})
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setStep((s) => (s === 3 ? 2 : 1))}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => {
              if (step < 3) {
                setStep((s) => (s === 1 ? 2 : 3));
              } else {
                handleFinish();
              }
            }}
          >
            <Text style={styles.nextBtnText}>
              {step === 3 ? 'Build My Physique Plan' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  progressPills: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceHighlight,
  },
  progressBarActive: {
    backgroundColor: COLORS.primary,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.primaryLight,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  cardStack: {
    gap: 10,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  goalTag: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 8,
  },
  optionColumn: {
    gap: 10,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  choiceRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
  },
  choiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  choiceSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  pillBtnActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  pillTextActive: {
    color: COLORS.primaryLight,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flex: 1,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '800',
  },
});
