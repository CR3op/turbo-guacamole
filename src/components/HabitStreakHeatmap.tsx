import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../theme/colors';
import {
  ContributionLevel,
  HabitDayCell,
  HabitTrackerSummary,
  UnitSystem,
} from '../types';
import { formatVolume, parseISODateLocal } from '../utils/units';

interface Props {
  summary: HabitTrackerSummary;
  unitSystem: UnitSystem;
}

const CELL_SIZE = 14;
const CELL_GAP = 3.5;

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// GitHub-inspired emerald contribution palette tuned for dark athletic UI
const LEVEL_COLORS: Record<ContributionLevel, string> = {
  0: '#162033',
  1: '#064E3B',
  2: '#059669',
  3: '#10B981',
  4: '#34D399',
};

const LEVEL_BORDERS: Record<ContributionLevel, string> = {
  0: '#202E47',
  1: '#065F46',
  2: '#10B981',
  3: '#34D399',
  4: '#6EE7B7',
};

function formatReadableDate(dateISO: string): string {
  const dt = parseISODateLocal(dateISO);
  const jsDay = dt.getDay();
  const weekdayIdx = jsDay === 0 ? 6 : jsDay - 1;
  return `${WEEKDAY_SHORT[weekdayIdx]}, ${MONTH_SHORT[dt.getMonth()]} ${dt.getDate()}`;
}

export const HabitStreakHeatmap: React.FC<Props> = ({ summary, unitSystem }) => {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const flatCells = useMemo(() => {
    const map = new Map<string, HabitDayCell>();
    let todayISO = '';
    summary.weeks.forEach((week) => {
      week.forEach((cell) => {
        map.set(cell.dateISO, cell);
        if (cell.isToday) {
          todayISO = cell.dateISO;
        }
      });
    });
    return { map, todayISO };
  }, [summary.weeks]);

  const [selectedDateISO, setSelectedDateISO] = useState<string>(flatCells.todayISO);

  // Keep selected date valid if summary window shifts
  useEffect(() => {
    if (!flatCells.map.has(selectedDateISO) && flatCells.todayISO) {
      setSelectedDateISO(flatCells.todayISO);
    }
  }, [flatCells, selectedDateISO]);

  const selectedCell =
    flatCells.map.get(selectedDateISO) ?? flatCells.map.get(flatCells.todayISO) ?? null;

  // Compute month header label for each week column
  const monthLabels = useMemo(() => {
    let lastMonth = -1;
    return summary.weeks.map((week, idx) => {
      // Pick the first day of the week (or day 1 of a new month inside that week)
      const firstOfMonth = week.find((c) => c.dateISO.endsWith('-01'));
      const refCell = firstOfMonth ?? week[0];
      const monthIdx = parseInt(refCell.dateISO.slice(5, 7), 10) - 1;

      if (idx === 0 || monthIdx !== lastMonth) {
        // Avoid colliding labels in the first two columns
        if (idx === 1 && lastMonth !== -1) {
          lastMonth = monthIdx;
          return '';
        }
        lastMonth = monthIdx;
        return MONTH_SHORT[monthIdx] ?? '';
      }
      return '';
    });
  }, [summary.weeks]);

  const statusPill = useMemo(() => {
    if (summary.completedToday) {
      return {
        label: 'Logged today',
        color: COLORS.primaryLight,
        bg: COLORS.primaryDim,
        icon: 'checkmark-circle' as const,
      };
    }
    if (summary.isTodayRestDay) {
      return {
        label: summary.currentStreak > 0 ? 'Rest day • Safe' : 'Scheduled rest',
        color: COLORS.cyan,
        bg: COLORS.cyanDim,
        icon: 'leaf-outline' as const,
      };
    }
    if (summary.currentStreak > 0) {
      return {
        label: 'Train today',
        color: COLORS.amber,
        bg: COLORS.amberDim,
        icon: 'flame' as const,
      };
    }
    return {
      label: 'Start streak',
      color: COLORS.textSecondary,
      bg: COLORS.surfaceElevated,
      icon: 'sparkles-outline' as const,
    };
  }, [summary.completedToday, summary.isTodayRestDay, summary.currentStreak]);

  const renderInspectorContent = () => {
    if (!selectedCell) return null;

    const dateLabel = formatReadableDate(selectedCell.dateISO);
    const hasWorkouts = selectedCell.sessions.length > 0;

    let badgeLabel = 'Missed';
    let badgeColor = COLORS.textMuted;
    let badgeBg = COLORS.surfaceHighlight;

    if (hasWorkouts) {
      badgeLabel =
        selectedCell.sessions.length === 1
          ? '1 Session'
          : `${selectedCell.sessions.length} Sessions`;
      badgeColor = COLORS.primaryLight;
      badgeBg = COLORS.primaryDim;
    } else if (selectedCell.isRestDay) {
      badgeLabel = 'Rest Day • Safe';
      badgeColor = COLORS.cyan;
      badgeBg = COLORS.cyanDim;
    } else if (selectedCell.isToday) {
      badgeLabel = 'Today • Open';
      badgeColor = COLORS.amber;
      badgeBg = COLORS.amberDim;
    }

    return (
      <View style={styles.inspectorBox}>
        <View style={styles.inspectorTop}>
          <Text style={styles.inspectorDate}>
            {dateLabel}
            {selectedCell.isToday ? ' (Today)' : ''}
          </Text>
          <View style={[styles.inspectorBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.inspectorBadgeText, { color: badgeColor }]}>
              {badgeLabel}
            </Text>
          </View>
        </View>

        {hasWorkouts ? (
          <View style={styles.inspectorDetailWrap}>
            <Text style={styles.inspectorTitle} numberOfLines={1}>
              {selectedCell.sessions.map((s) => s.dayTitle).join(' + ')}
            </Text>
            <Text style={styles.inspectorMeta}>
              {selectedCell.totalSets} sets • {selectedCell.totalMinutes} min •{' '}
              {formatVolume(selectedCell.totalVolumeKg, unitSystem)} volume
            </Text>
          </View>
        ) : selectedCell.isRestDay ? (
          <Text style={styles.inspectorSub}>
            Scheduled recovery day — streak preserved automatically. Train early to light it up!
          </Text>
        ) : selectedCell.isToday ? (
          <Text style={styles.inspectorSub}>
            Scheduled training day — complete a workout today to extend your streak.
          </Text>
        ) : (
          <Text style={styles.inspectorSub}>
            Scheduled training day with no logged workout — broke the streak on this day.
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="grid-outline" size={15} color={COLORS.primaryLight} />
          </View>
          <View>
            <Text style={styles.title}>Session Habit Tracker</Text>
            <Text style={styles.subtitle}>
              {summary.sessionsInWindow} session{summary.sessionsInWindow === 1 ? '' : 's'} in the last{' '}
              {summary.weeks.length} weeks
            </Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusPill.bg }]}>
          <Ionicons name={statusPill.icon} size={12} color={statusPill.color} />
          <Text style={[styles.statusPillText, { color: statusPill.color }]}>
            {statusPill.label}
          </Text>
        </View>
      </View>

      {/* GitHub Streak Stats Trio */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <View style={styles.metricValueRow}>
            <Ionicons name="flame" size={14} color={COLORS.amber} />
            <Text style={styles.metricValue}>{summary.currentStreak}</Text>
          </View>
          <Text style={styles.metricLabel}>Current Streak</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBox}>
          <View style={styles.metricValueRow}>
            <Ionicons name="trophy-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.metricValue}>{summary.longestStreak}</Text>
          </View>
          <Text style={styles.metricLabel}>Longest Streak</Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricBox}>
          <View style={styles.metricValueRow}>
            <Ionicons name="checkmark-done-outline" size={14} color={COLORS.cyan} />
            <Text style={styles.metricValue}>{summary.activeDaysInWindow}</Text>
          </View>
          <Text style={styles.metricLabel}>Active Days</Text>
        </View>
      </View>

      {/* Contribution Grid */}
      <View style={styles.gridOuter}>
        {/* Sticky weekday axis (Mon / Wed / Fri) */}
        <View style={styles.weekdayAxis}>
          <View style={styles.monthSpacer} />
          {WEEKDAY_SHORT.map((label, idx) => (
            <View key={label} style={styles.weekdayRow}>
              <Text style={styles.weekdayText}>
                {idx === 0 || idx === 2 || idx === 4 ? label : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Scrollable week columns */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gridScrollContent}
          onContentSizeChange={() => {
            scrollRef.current?.scrollToEnd({ animated: false });
          }}
        >
          <View style={styles.weeksRow}>
            {summary.weeks.map((week, wIdx) => (
              <View key={week[0].dateISO} style={styles.weekColumn}>
                <View style={styles.monthCell}>
                  <Text style={styles.monthText} numberOfLines={1}>
                    {monthLabels[wIdx]}
                  </Text>
                </View>

                {week.map((cell) => {
                  const isSelected = cell.dateISO === selectedDateISO && !cell.isFuture;
                  const isRestEmpty = !cell.isFuture && cell.isRestDay && cell.level === 0;
                  const bgColor = cell.isFuture
                    ? 'transparent'
                    : isRestEmpty
                    ? '#111A2C'
                    : LEVEL_COLORS[cell.level];
                  const borderColor = cell.isFuture
                    ? 'rgba(36, 49, 71, 0.35)'
                    : isSelected
                    ? COLORS.white
                    : cell.isToday
                    ? COLORS.cyan
                    : isRestEmpty
                    ? '#23324D'
                    : LEVEL_BORDERS[cell.level];

                  return (
                    <TouchableOpacity
                      key={cell.dateISO}
                      disabled={cell.isFuture}
                      activeOpacity={0.75}
                      onPress={() => setSelectedDateISO(cell.dateISO)}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: bgColor,
                          borderColor,
                          borderWidth: isSelected || cell.isToday ? 1.5 : 1,
                          opacity: cell.isFuture ? 0.3 : 1,
                        },
                      ]}
                    >
                      {isRestEmpty && <View style={styles.restDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.restLegend}>
          <View style={styles.restLegendSwatch}>
            <View style={styles.restDot} />
          </View>
          <Text style={styles.legendText}>Rest (streak safe)</Text>
        </View>

        <View style={styles.scaleLegend}>
          <Text style={styles.legendText}>Less</Text>
          {([0, 1, 2, 3, 4] as ContributionLevel[]).map((lvl) => (
            <View
              key={lvl}
              style={[
                styles.legendSwatch,
                {
                  backgroundColor: LEVEL_COLORS[lvl],
                  borderColor: LEVEL_BORDERS[lvl],
                },
              ]}
            />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>

      {/* Tap-a-Day Inspector */}
      {renderInspectorContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingVertical: 10,
    marginTop: 12,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.border,
  },
  gridOuter: {
    flexDirection: 'row',
    marginTop: 14,
  },
  weekdayAxis: {
    width: 28,
    marginRight: 4,
    gap: CELL_GAP,
  },
  monthSpacer: {
    height: 15,
  },
  weekdayRow: {
    height: CELL_SIZE,
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  gridScrollContent: {
    paddingRight: 4,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekColumn: {
    gap: CELL_GAP,
  },
  monthCell: {
    height: 15,
    width: CELL_SIZE,
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  monthText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 28,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#475569',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  restLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  restLegendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    backgroundColor: '#111A2C',
    borderWidth: 1,
    borderColor: '#23324D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 2.5,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  inspectorBox: {
    marginTop: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    padding: 11,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  inspectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  inspectorDate: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  inspectorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  inspectorBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  inspectorDetailWrap: {
    marginTop: 5,
  },
  inspectorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  inspectorMeta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inspectorSub: {
    fontSize: 11.5,
    lineHeight: 16,
    color: COLORS.textSecondary,
    marginTop: 5,
  },
});
