import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';
import { HealthMeterBreakdown } from '../types';

interface Props {
  data: HealthMeterBreakdown;
  goalColor: string;
}

export const HealthMeterGauge: React.FC<Props> = ({ data, goalColor }) => {
  const size = 188;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 250-degree sweeping arc for an athletic speedometer / health meter feel
  const arcFraction = 250 / 360;
  const arcLength = circumference * arcFraction;
  const filledLength = arcLength * (Math.max(4, data.overallScore) / 100);

  const subMetrics = [
    { label: 'Training', value: data.weeklyConsistencyScore, color: COLORS.primary },
    { label: 'Nutrition', value: data.nutritionScore, color: COLORS.cyan },
    { label: 'Streak', value: data.streakScore, color: COLORS.amber },
    { label: 'Physique', value: data.physiqueProgressScore, color: goalColor },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.gaugeRow}>
        <View style={styles.svgWrapper}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="healthMeterGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={COLORS.cyan} />
                <Stop offset="55%" stopColor={COLORS.primary} />
                <Stop offset="100%" stopColor={goalColor} />
              </LinearGradient>
            </Defs>

            {/* Background track arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.surfaceHighlight}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
              rotation={145}
              origin={`${size / 2}, ${size / 2}`}
            />

            {/* Active progress arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#healthMeterGrad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${filledLength} ${circumference}`}
              strokeLinecap="round"
              rotation={145}
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>

          <View style={styles.centerOverlay}>
            <Text style={styles.scoreLabel}>HEALTH METER</Text>
            <Text style={styles.scoreValue}>{data.overallScore}</Text>
            <View style={[styles.statusPill, { backgroundColor: `${data.statusColor}22` }]}>
              <View style={[styles.statusDot, { backgroundColor: data.statusColor }]} />
              <Text style={[styles.statusText, { color: data.statusColor }]}>
                {data.statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.milestoneText}>{data.nextMilestoneText}</Text>

      <View style={styles.breakdownGrid}>
        {subMetrics.map((m) => (
          <View key={m.label} style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricPct}>{m.value}%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(4, m.value)}%`, backgroundColor: m.color },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gaugeRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  svgWrapper: {
    width: 188,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 42,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 54,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 4,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  milestoneText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricItem: {
    width: '48%',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricPct: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
