import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { COLORS, RADIUS } from '../theme/colors';
import { BodyMeasurementEntry, UnitSystem } from '../types';
import { formatWeight, weightKgToDisplayNumber } from '../utils/units';

interface Props {
  entries: BodyMeasurementEntry[];
  targetWeightKg: number;
  unitSystem: UnitSystem;
}

export const WeightTrendChart: React.FC<Props> = ({
  entries,
  targetWeightKg,
  unitSystem,
}) => {
  const sorted = [...entries]
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(-10);

  if (sorted.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>Log your first weigh-in to see your physique trend.</Text>
      </View>
    );
  }

  const width = 300;
  const height = 112;
  const padX = 16;
  const padY = 16;

  const weights = sorted.map((e) => weightKgToDisplayNumber(e.weightKg, unitSystem));
  const targetDisplay = weightKgToDisplayNumber(targetWeightKg, unitSystem);

  const allVals = [...weights, targetDisplay];
  const minVal = Math.min(...allVals) - 2;
  const maxVal = Math.max(...allVals) + 2;
  const span = Math.max(1, maxVal - minVal);

  const getX = (idx: number) => {
    if (sorted.length === 1) return width / 2;
    return padX + (idx / (sorted.length - 1)) * (width - padX * 2);
  };

  const getY = (val: number) => {
    const norm = (val - minVal) / span;
    return height - padY - norm * (height - padY * 2);
  };

  const points = weights.map((w, idx) => ({ x: getX(idx), y: getY(w), value: w }));
  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`
      : '';

  const targetY = getY(targetDisplay);

  return (
    <View style={styles.container}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>
            Current: {formatWeight(sorted[sorted.length - 1].weightKg, unitSystem)}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dash, { backgroundColor: COLORS.cyan }]} />
          <Text style={styles.legendText}>
            Target: {formatWeight(targetWeightKg, unitSystem)}
          </Text>
        </View>
      </View>

      <View style={styles.chartBox}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.28" />
              <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Target weight dashed guide */}
          <Line
            x1={padX}
            y1={targetY}
            x2={width - padX}
            y2={targetY}
            stroke={COLORS.cyan}
            strokeWidth={1.5}
            strokeDasharray="5,5"
            opacity={0.75}
          />

          {/* Shaded area under weight trend */}
          {areaPath ? <Path d={areaPath} fill="url(#weightArea)" /> : null}

          {/* Trend polyline */}
          {points.length > 1 ? (
            <Path
              d={linePath}
              stroke={COLORS.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {/* Data nodes */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? 4.5 : 3}
              fill={idx === points.length - 1 ? COLORS.primaryLight : COLORS.surface}
              stroke={COLORS.primary}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>{sorted[0].dateISO.slice(5)}</Text>
        <Text style={styles.dateLabel}>
          {sorted[sorted.length - 1].dateISO.slice(5)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chartBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  dateLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
