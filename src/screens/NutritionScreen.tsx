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
import { MacroRing } from '../components/MacroRing';
import { useApp } from '../context/AppContext';
import { MEAL_TEMPLATES } from '../data/mealTemplates';
import { PHYSIQUE_GOALS } from '../data/physiqueGoals';
import { COLORS, RADIUS } from '../theme/colors';
import { formatWater } from '../utils/units';

export const NutritionScreen: React.FC = () => {
  const {
    profile,
    macroTargets,
    todayNutrition,
    addFoodItem,
    removeFoodItem,
    addWater,
  } = useApp();

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [cals, setCals] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const goalConfig = PHYSIQUE_GOALS[profile.physiqueGoal];

  const totals = useMemo(() => {
    return todayNutrition.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayNutrition.items]);

  const sortedMeals = useMemo(() => {
    return [...MEAL_TEMPLATES].sort((a, b) => {
      const aMatch = a.bestFor.includes(profile.physiqueGoal) ? 1 : 0;
      const bMatch = b.bestFor.includes(profile.physiqueGoal) ? 1 : 0;
      return bMatch - aMatch;
    });
  }, [profile.physiqueGoal]);

  const waterPct = Math.min(
    100,
    Math.round((todayNutrition.waterMl / Math.max(1, macroTargets.waterMl)) * 100)
  );

  const remainingCals = macroTargets.calories - totals.calories;

  const handleAddCustom = () => {
    const name = foodName.trim();
    const calNum = parseInt(cals, 10) || 0;
    if (!name || calNum <= 0) return;

    addFoodItem({
      name,
      calories: calNum,
      protein: parseInt(protein, 10) || 0,
      carbs: parseInt(carbs, 10) || 0,
      fat: parseInt(fat, 10) || 0,
    });

    setFoodName('');
    setCals('');
    setProtein('');
    setCarbs('');
    setFat('');
    setShowCustomForm(false);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.heading}>Daily Macros & Fuel</Text>
        <Text style={styles.subheading}>
          Calibrated for {goalConfig.name} • TDEE {macroTargets.tdee} kcal
        </Text>
      </View>

      {/* Main Macro Rings Card */}
      <View style={styles.card}>
        <View style={styles.calSummaryRow}>
          <View>
            <Text style={styles.calBig}>{totals.calories}</Text>
            <Text style={styles.calSub}>
              of {macroTargets.calories} kcal goal
            </Text>
          </View>
          <View
            style={[
              styles.remainingBadge,
              {
                backgroundColor:
                  remainingCals >= 0 ? COLORS.primaryDim : COLORS.roseDim,
              },
            ]}
          >
            <Text
              style={[
                styles.remainingText,
                { color: remainingCals >= 0 ? COLORS.primaryLight : COLORS.rose },
              ]}
            >
              {remainingCals >= 0
                ? `${remainingCals} kcal left`
                : `${Math.abs(remainingCals)} kcal over`}
            </Text>
          </View>
        </View>

        <View style={styles.ringsRow}>
          <MacroRing
            label="Calories"
            current={totals.calories}
            target={macroTargets.calories}
            unit="kcal"
            color={COLORS.amber}
          />
          <MacroRing
            label="Protein"
            current={totals.protein}
            target={macroTargets.proteinGrams}
            color={COLORS.primary}
          />
          <MacroRing
            label="Carbs"
            current={totals.carbs}
            target={macroTargets.carbsGrams}
            color={COLORS.cyan}
          />
          <MacroRing
            label="Fat"
            current={totals.fat}
            target={macroTargets.fatGrams}
            color={COLORS.violet}
          />
        </View>

        <View style={styles.rationaleBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.cyan} />
          <Text style={styles.rationaleText}>{macroTargets.rationale}</Text>
        </View>
      </View>

      {/* Hydration Card */}
      <View style={styles.card}>
        <View style={styles.waterHeader}>
          <View style={styles.waterTitleRow}>
            <Ionicons name="water" size={20} color={COLORS.cyan} />
            <Text style={styles.cardTitle}>Hydration</Text>
          </View>
          <Text style={styles.waterAmount}>
            {formatWater(todayNutrition.waterMl, profile.unitSystem)} /{' '}
            {formatWater(macroTargets.waterMl, profile.unitSystem)}
          </Text>
        </View>

        <View style={styles.waterTrack}>
          <View style={[styles.waterFill, { width: `${waterPct}%` }]} />
        </View>

        <View style={styles.waterBtnRow}>
          <TouchableOpacity
            style={styles.waterChip}
            onPress={() => addWater(250)}
          >
            <Text style={styles.waterChipText}>+250 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.waterChip}
            onPress={() => addWater(500)}
          >
            <Text style={styles.waterChipText}>+500 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.waterChip, { backgroundColor: COLORS.surfaceElevated }]}
            onPress={() => addWater(-250)}
          >
            <Text style={[styles.waterChipText, { color: COLORS.textSecondary }]}>
              -250 ml
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick-Add Goal Meals */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Goal-Aligned Quick Meals</Text>
        <TouchableOpacity
          style={styles.customToggle}
          onPress={() => setShowCustomForm((v) => !v)}
        >
          <Ionicons
            name={showCustomForm ? 'close' : 'add'}
            size={16}
            color={COLORS.primaryLight}
          />
          <Text style={styles.customToggleText}>
            {showCustomForm ? 'Close' : 'Custom Food'}
          </Text>
        </TouchableOpacity>
      </View>

      {showCustomForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Custom Meal</Text>
          <TextInput
            style={styles.input}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Meal name (e.g. Turkey Bowl)"
            placeholderTextColor={COLORS.textMuted}
          />
          <View style={styles.macroInputs}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={cals}
              onChangeText={setCals}
              placeholder="kcal"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={protein}
              onChangeText={setProtein}
              placeholder="Pro (g)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={carbs}
              onChangeText={setCarbs}
              placeholder="Carb (g)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={fat}
              onChangeText={setFat}
              placeholder="Fat (g)"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.saveMealBtn} onPress={handleAddCustom}>
            <Text style={styles.saveMealBtnText}>Add to Today's Log</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.templateList}>
        {sortedMeals.map((meal) => {
          const isMatch = meal.bestFor.includes(profile.physiqueGoal);
          return (
            <View key={meal.id} style={styles.mealCard}>
              <View style={{ flex: 1 }}>
                <View style={styles.mealTopRow}>
                  <Text style={styles.mealTag}>{meal.tag}</Text>
                  {isMatch && (
                    <Text style={[styles.matchPill, { color: goalConfig.accentColor }]}>
                      ★ Goal Fit
                    </Text>
                  )}
                </View>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMacros}>
                  {meal.calories} kcal • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
                </Text>
              </View>
              <TouchableOpacity
                style={styles.quickAddBtn}
                onPress={() =>
                  addFoodItem({
                    name: meal.name,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                  })
                }
              >
                <Ionicons name="add" size={20} color={COLORS.black} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Today's Food Log */}
      <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
        Today's Logged Food ({todayNutrition.items.length})
      </Text>

      {todayNutrition.items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No meals logged yet today. Tap + on any meal above or add a custom meal.
          </Text>
        </View>
      ) : (
        <View style={styles.logList}>
          {todayNutrition.items.map((item) => (
            <View key={item.id} style={styles.logItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{item.name}</Text>
                <Text style={styles.logSub}>
                  {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g F
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFoodItem(item.id)}
              >
                <Ionicons name="trash-outline" size={17} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  calSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calBig: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  calSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  remainingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  remainingText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rationaleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  rationaleText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  waterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterAmount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.cyan,
  },
  waterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceElevated,
    overflow: 'hidden',
    marginBottom: 12,
  },
  waterFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COLORS.cyan,
  },
  waterBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waterChip: {
    flex: 1,
    backgroundColor: COLORS.cyanDim,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  waterChipText: {
    color: COLORS.cyan,
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  customToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  customToggleText: {
    color: COLORS.primaryLight,
    fontSize: 12.5,
    fontWeight: '800',
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginTop: 10,
  },
  macroInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  smallInput: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  saveMealBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 12,
  },
  saveMealBtnText: {
    color: COLORS.black,
    fontWeight: '800',
    fontSize: 14,
  },
  templateList: {
    gap: 9,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mealTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  matchPill: {
    fontSize: 11,
    fontWeight: '800',
  },
  mealName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  mealMacros: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  quickAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  logList: {
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
});
