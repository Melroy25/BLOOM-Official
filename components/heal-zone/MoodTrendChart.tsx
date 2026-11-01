import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { TrendingUp, Info } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Shadows } from '../../constants/shadows';
import { SectionHeader } from '../common/SectionHeader';
import { MoodChartPoint } from '../../types';

interface MoodTrendChartProps {
  sevenDayData: MoodChartPoint[];
  thirtyDayData: MoodChartPoint[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({
  sevenDayData,
  thirtyDayData,
}) => {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const data = period === '7d' ? sevenDayData : thirtyDayData;

  const chartWidth = SCREEN_WIDTH - Spacing.xl * 2;
  const chartHeight = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 35;

  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const minScore = 1.0;
  const maxScore = 4.0;

  // Calculate points
  const points = data.map((d, index) => {
    const x =
      data.length > 1
        ? padLeft + (index / (data.length - 1)) * plotWidth
        : padLeft + plotWidth / 2;
    const clampedScore = Math.max(minScore, Math.min(maxScore, d.score));
    const y =
      padTop +
      plotHeight -
      ((clampedScore - minScore) / (maxScore - minScore)) * plotHeight;
    return { x, y, score: d.score, label: d.label, emoji: d.emoji, mood: d.mood };
  });

  // Construct smooth SVG path using Catmull-Rom or cubic Bezier
  let pathD = '';
  let fillD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const bottomY = padTop + plotHeight;
    fillD = `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }

  // Y-axis levels
  const yLevels = [
    { score: 4.0, label: 'Great' },
    { score: 3.0, label: 'Good' },
    { score: 2.0, label: 'Okay' },
    { score: 1.0, label: 'Low' },
  ];

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Mood Trends"
        subtitle="Understand how your emotions change over time."
      />

      <View style={[styles.card, Shadows.md]}>
        {/* Top Controls Row */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color={Colors.primary} strokeWidth={2.2} />
              <Text style={styles.trendBadgeText}>EMOTIONAL FLOW</Text>
            </View>
            <Text style={styles.avgText}>Mostly Calm & Positive</Text>
          </View>

          {/* Period Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                period === '7d' && styles.toggleBtnActive,
              ]}
              onPress={() => setPeriod('7d')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  period === '7d' && styles.toggleBtnTextActive,
                ]}
              >
                7 Days
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                period === '30d' && styles.toggleBtnActive,
              ]}
              onPress={() => setPeriod('30d')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  period === '30d' && styles.toggleBtnTextActive,
                ]}
              >
                30 Days
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SVG Chart */}
        <View style={styles.chartWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgGradient id="moodFillGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.32" />
                <Stop offset="80%" stopColor={Colors.primaryLight} stopOpacity="0.08" />
                <Stop offset="100%" stopColor={Colors.white} stopOpacity="0.0" />
              </SvgGradient>
            </Defs>

            {/* Horizontal Grid lines and labels */}
            {yLevels.map(lvl => {
              const y =
                padTop +
                plotHeight -
                ((lvl.score - minScore) / (maxScore - minScore)) * plotHeight;
              return (
                <React.Fragment key={lvl.label}>
                  <Line
                    x1={padLeft}
                    y1={y}
                    x2={chartWidth - padRight}
                    y2={y}
                    stroke={Colors.border}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill={Colors.mutedText}
                    fontSize={10}
                    fontWeight="500"
                  >
                    {lvl.label}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Gradient Fill under Curve */}
            {fillD ? <Path d={fillD} fill="url(#moodFillGradient)" /> : null}

            {/* Main Trend Line */}
            {pathD ? (
              <Path
                d={pathD}
                fill="none"
                stroke={Colors.primary}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Data Point Circles and X-axis Labels */}
            {points.map((p, i) => (
              <React.Fragment key={`point-${i}`}>
                {/* Node circle */}
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={5}
                  fill={Colors.white}
                  stroke={Colors.primary}
                  strokeWidth={2.5}
                />

                {/* X-axis day label */}
                <SvgText
                  x={p.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fill={Colors.darkText}
                  fontSize={11}
                  fontWeight="600"
                >
                  {p.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>

        {/* Disclaimer note */}
        <View style={styles.disclaimerRow}>
          <Info size={13} color={Colors.lightText} strokeWidth={1.8} />
          <Text style={styles.disclaimerText}>
            Self-reported mood trend for personal wellness tracking.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.huge,
  },
  card: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  trendBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.5,
  },
  avgText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.darkText,
    fontSize: 13,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: BorderRadius.round,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.round,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.mutedText,
  },
  toggleBtnTextActive: {
    color: Colors.white,
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.lightText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
