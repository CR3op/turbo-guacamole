import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingModal } from './src/components/OnboardingModal';
import { WorkoutLoggerModal } from './src/components/WorkoutLoggerModal';
import { AppProvider, useApp } from './src/context/AppContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ExercisesScreen } from './src/screens/ExercisesScreen';
import { NutritionScreen } from './src/screens/NutritionScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { COLORS } from './src/theme/colors';
import { ActiveTab, WorkoutDayPlan } from './src/types';

const TABS: Array<{
  id: ActiveTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'dashboard', label: 'Meter', icon: 'speedometer-outline', activeIcon: 'speedometer' },
  { id: 'plan', label: 'Plan', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'exercises', label: 'Exercises', icon: 'barbell-outline', activeIcon: 'barbell' },
  { id: 'nutrition', label: 'Macros', icon: 'nutrition-outline', activeIcon: 'nutrition' },
  { id: 'profile', label: 'Physique', icon: 'person-outline', activeIcon: 'person' },
];

const MainShell: React.FC = () => {
  const { isHydrated, profile, updateProfile, logWorkoutSession } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeWorkout, setActiveWorkout] = useState<WorkoutDayPlan | null>(null);

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading PhysiqueMeter...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.outerBg} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.appFrame}>
        <View style={styles.screenContainer}>
          {activeTab === 'dashboard' && (
            <DashboardScreen
              onNavigateTab={setActiveTab}
              onStartWorkout={(planDay) => setActiveWorkout(planDay)}
            />
          )}
          {activeTab === 'plan' && (
            <PlanScreen onStartWorkout={(planDay) => setActiveWorkout(planDay)} />
          )}
          {activeTab === 'exercises' && (
            <ExercisesScreen
              onStartQuickExercise={(planDay) => setActiveWorkout(planDay)}
            />
          )}
          {activeTab === 'nutrition' && <NutritionScreen />}
          {activeTab === 'profile' && <ProfileScreen />}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                  <Ionicons
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={21}
                    color={isActive ? COLORS.primaryLight : COLORS.textMuted}
                  />
                </View>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Live Workout Logger */}
      <WorkoutLoggerModal
        visible={Boolean(activeWorkout)}
        title={activeWorkout?.title ?? 'Workout'}
        plannedExercises={activeWorkout?.exercises ?? []}
        physiqueGoal={profile.physiqueGoal}
        unitSystem={profile.unitSystem}
        userWeightKg={profile.currentWeightKg}
        onClose={() => setActiveWorkout(null)}
        onComplete={(session) => logWorkoutSession(session)}
      />

      {/* Initial Goal & Profile Setup Wizard */}
      <OnboardingModal
        visible={!profile.onboardingCompleted}
        profile={profile}
        onComplete={(patch) => updateProfile(patch)}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerBg: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 520 : undefined,
    backgroundColor: COLORS.bg,
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: COLORS.borderSubtle,
  },
  screenContainer: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 10,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tabIconWrapActive: {
    backgroundColor: COLORS.primaryDim,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
});
