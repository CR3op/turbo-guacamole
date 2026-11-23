import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { PHYSIQUE_GOAL_LIST, PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { COLORS, RADIUS } from '../theme/colors';
import { ActivityLevel, UnitSystem } from '../types';
import {
  displayWeightToKg,
  formatHeight,
  weightKgToDisplayNumber,
} from '../utils/units';

export const ProfileScreen: React.FC = () => {
  const { profile, macroTargets, updateProfile, resetAllData } = useApp();

  const [nameInput, setNameInput] = useState(profile.name);
  const [curWeightInput, setCurWeightInput] = useState(
    String(weightKgToDisplayNumber(profile.currentWeightKg, profile.unitSystem))
  );
  const [tgtWeightInput, setTgtWeightInput] = useState(
    String(weightKgToDisplayNumber(profile.targetWeightKg, profile.unitSystem))
  );
  const [ageInput, setAgeInput] = useState(String(profile.age));
  const [heightCmInput, setHeightCmInput] = useState(String(Math.round(profile.heightCm)));
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setNameInput(profile.name);
    setCurWeightInput(
      String(weightKgToDisplayNumber(profile.currentWeightKg, profile.unitSystem))
    );
    setTgtWeightInput(
      String(weightKgToDisplayNumber(profile.targetWeightKg, profile.unitSystem))
    );
    setAgeInput(String(profile.age));
    setHeightCmInput(String(Math.round(profile.heightCm)));
  }, [
    profile.name,
    profile.currentWeightKg,
    profile.targetWeightKg,
    profile.age,
    profile.heightCm,
    profile.unitSystem,
  ]);

  const activeGoal = PHYSIQUE_GOALS[profile.physiqueGoal];

  const handleSaveStats = () => {
    const curKg = displayWeightToKg(
      parseFloat(curWeightInput) || weightKgToDisplayNumber(profile.currentWeightKg, profile.unitSystem),
      profile.unitSystem
    );
    const tgtKg = displayWeightToKg(
      parseFloat(tgtWeightInput) || weightKgToDisplayNumber(profile.targetWeightKg, profile.unitSystem),
      profile.unitSystem
    );
    const parsedAge = Math.max(15, Math.min(85, parseInt(ageInput, 10) || profile.age));
    const parsedHeight = Math.max(130, Math.min(230, parseFloat(heightCmInput) || profile.heightCm));

    updateProfile({
      name: nameInput.trim() || 'Athlete',
      currentWeightKg: curKg,
      targetWeightKg: tgtKg,
      age: parsedAge,
      heightCm: parsedHeight,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const handleUnitChange = (unit: UnitSystem) => {
    updateProfile({ unitSystem: unit });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.heading}>Physique Goal Studio</Text>
        <Text style={styles.subheading}>
          Switch goals or equipment anytime—your weekly plan & macros recalibrate instantly.
        </Text>
      </View>

      {/* Physique Goal Selector */}
      <Text style={styles.sectionTitle}>Target Physique</Text>
      <View style={styles.goalStack}>
        {PHYSIQUE_GOAL_LIST.map((goal) => {
          const selected = profile.physiqueGoal === goal.id;
          return (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selected && {
                  borderColor: goal.accentColor,
                  backgroundColor: `${goal.accentColor}16`,
                },
              ]}
              onPress={() => updateProfile({ physiqueGoal: goal.id })}
            >
              <View style={styles.goalHeader}>
                <View
                  style={[
                    styles.goalIcon,
                    { backgroundColor: `${goal.accentColor}26` },
                  ]}
                >
                  <Ionicons name={goal.icon as any} size={20} color={goal.accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Text style={styles.goalTag}>{goal.tagline}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={selected ? goal.accentColor : COLORS.textMuted}
                />
              </View>

              {selected && (
                <View style={styles.goalDetailBox}>
                  <Text style={styles.goalDesc}>{goal.description}</Text>
                  <View style={styles.focusRow}>
                    {goal.keyFocus.map((tag) => (
                      <View
                        key={tag}
                        style={[
                          styles.focusChip,
                          { backgroundColor: `${goal.accentColor}24` },
                        ]}
                      >
                        <Text
                          style={[styles.focusChipText, { color: goal.accentColor }]}
                        >
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Training Environment & Schedule */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Training Preferences</Text>

        <Text style={styles.label}>Equipment Environment</Text>
        <View style={styles.pillRow}>
          {(
            [
              { id: 'gym', label: 'Full Gym' },
              { id: 'home', label: 'Home' },
              { id: 'bodyweight', label: 'Bodyweight' },
            ] as const
          ).map((eq) => (
            <TouchableOpacity
              key={eq.id}
              style={[styles.pill, profile.equipment === eq.id && styles.pillActive]}
              onPress={() => updateProfile({ equipment: eq.id })}
            >
              <Text
                style={[
                  styles.pillText,
                  profile.equipment === eq.id && styles.pillTextActive,
                ]}
              >
                {eq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.pillRow}>
          {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.pill, profile.experience === lvl && styles.pillActive]}
              onPress={() => updateProfile({ experience: lvl })}
            >
              <Text
                style={[
                  styles.pillText,
                  profile.experience === lvl && styles.pillTextActive,
                ]}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Training Days Per Week</Text>
        <View style={styles.pillRow}>
          {([3, 4, 5, 6] as const).map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.pill, profile.daysPerWeek === d && styles.pillActive]}
              onPress={() => updateProfile({ daysPerWeek: d })}
            >
              <Text
                style={[
                  styles.pillText,
                  profile.daysPerWeek === d && styles.pillTextActive,
                ]}
              >
                {d}d
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Daily Activity Level</Text>
        <View style={styles.pillWrap}>
          {(
            [
              { id: 'sedentary', label: 'Desk' },
              { id: 'light', label: 'Light' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'active', label: 'Active' },
              { id: 'athlete', label: 'Athlete' },
            ] as Array<{ id: ActivityLevel; label: string }>
          ).map((act) => (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.wrapPill,
                profile.activityLevel === act.id && styles.pillActive,
              ]}
              onPress={() => updateProfile({ activityLevel: act.id })}
            >
              <Text
                style={[
                  styles.pillText,
                  profile.activityLevel === act.id && styles.pillTextActive,
                ]}
              >
                {act.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body Stats & Units */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Body Stats & Targets</Text>
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                profile.unitSystem === 'imperial' && styles.unitBtnActive,
              ]}
              onPress={() => handleUnitChange('imperial')}
            >
              <Text
                style={[
                  styles.unitText,
                  profile.unitSystem === 'imperial' && styles.unitTextActive,
                ]}
              >
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitBtn,
                profile.unitSystem === 'metric' && styles.unitBtnActive,
              ]}
              onPress={() => handleUnitChange('metric')}
            >
              <Text
                style={[
                  styles.unitText,
                  profile.unitSystem === 'metric' && styles.unitTextActive,
                ]}
              >
                kg
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={nameInput}
          onChangeText={setNameInput}
          placeholder="Your name"
          placeholderTextColor={COLORS.textMuted}
        />

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>
              Current ({profile.unitSystem === 'imperial' ? 'lbs' : 'kg'})
            </Text>
            <TextInput
              style={styles.input}
              value={curWeightInput}
              onChangeText={setCurWeightInput}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>
              Goal ({profile.unitSystem === 'imperial' ? 'lbs' : 'kg'})
            </Text>
            <TextInput
              style={styles.input}
              value={tgtWeightInput}
              onChangeText={setTgtWeightInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={ageInput}
              onChangeText={setAgeInput}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>
              Height (cm • {formatHeight(profile.heightCm, 'imperial')})
            </Text>
            <TextInput
              style={styles.input}
              value={heightCmInput}
              onChangeText={setHeightCmInput}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Gender (for BMR calculation)</Text>
        <View style={styles.pillRow}>
          {(['male', 'female', 'other'] as const).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.pill, profile.gender === g && styles.pillActive]}
              onPress={() => updateProfile({ gender: g })}
            >
              <Text
                style={[styles.pillText, profile.gender === g && styles.pillTextActive]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStats}>
          <Ionicons
            name={savedToast ? 'checkmark-circle' : 'save-outline'}
            size={18}
            color={COLORS.black}
          />
          <Text style={styles.saveBtnText}>
            {savedToast
              ? `Saved! Target: ${macroTargets.calories} kcal / ${macroTargets.proteinGrams}g P`
              : 'Save Body Stats'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Local Storage Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local Data (On-Device)</Text>
        <Text style={styles.storageNote}>
          All workouts, body measurements, and nutrition logs are saved automatically on this device—no account required.
        </Text>
        <View style={styles.resetRow}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => resetAllData(true)}
          >
            <Text style={styles.secondaryBtnText}>Start Blank Slate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => resetAllData(false)}
          >
            <Text style={styles.secondaryBtnText}>Load Sample Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.footerCredit}>
        PhysiqueMeter • Active Blueprint: {activeGoal.name}
      </Text>
      <View style={{ height: 24 }} />
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
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  goalStack: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  goalTag: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  goalDetailBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  goalDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  focusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  focusChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  focusChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  unitTextActive: {
    color: COLORS.black,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  wrapPill: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  pillActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  pillTextActive: {
    color: COLORS.primaryLight,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    marginTop: 16,
  },
  saveBtnText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 14,
  },
  storageNote: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 12,
  },
  resetRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 12.5,
  },
  footerCredit: {
    textAlign: 'center',
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
