import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppCard, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { BallSpeedTrend } from '../analysisResultPresentation';

const chartHeight = 176;
const chartPadding = 20;
const pointSpacing = 72;
const pointSize = 10;

export function BallSpeedTrendChart({ trend }: { trend: BallSpeedTrend }) {
  const chartWidth = Math.max(280, chartPadding * 2 + (trend.points.length - 1) * pointSpacing);
  const coordinates = trend.points.map((point, index) => ({
    ...point,
    x: chartPadding + index * pointSpacing,
    y: chartPadding + (1 - point.yRatio) * (chartHeight - chartPadding * 2),
  }));

  return (
    <AppCard>
      <SectionTitle title="球速趋势" description="按击球顺序展示有效球速，单位 km/h。" />
      <Text accessible accessibilityLabel={trend.accessibilitySummary} style={styles.summary}>
        {trend.accessibilitySummary}
      </Text>
      {coordinates.length === 0 ? (
        <EmptyState title="暂无可展示的球速数据" description="当前结果没有有效球速记录。" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.chart, { width: chartWidth }]}>
            {coordinates.slice(1).map((point, index) => {
              const previous = coordinates[index];
              const dx = point.x - previous.x;
              const dy = point.y - previous.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View
                  key={`line-${point.key}`}
                  style={[
                    styles.line,
                    {
                      width: length,
                      left: (point.x + previous.x) / 2 - length / 2,
                      top: (point.y + previous.y) / 2,
                      transform: [{ rotate: `${angle}deg` }],
                    },
                  ]}
                />
              );
            })}
            {coordinates.map((point) => (
              <View key={point.key}>
                <View
                  accessibilityLabel={`${point.label}，${point.speedKmh} km/h`}
                  style={[
                    styles.point,
                    { left: point.x - pointSize / 2, top: point.y - pointSize / 2 },
                  ]}
                />
                <Text style={[styles.pointValue, { left: point.x - 28, top: point.y - 25 }]}>
                  {point.speedKmh}
                </Text>
                <Text style={[styles.axisLabel, { left: point.x - 32 }]}>{point.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  summary: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
  chart: {
    height: chartHeight + 34,
    position: 'relative',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  line: { position: 'absolute', height: 2, backgroundColor: theme.colors.info },
  point: {
    position: 'absolute',
    width: pointSize,
    height: pointSize,
    borderRadius: pointSize / 2,
    backgroundColor: theme.colors.primary,
  },
  pointValue: {
    position: 'absolute',
    width: 56,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
  axisLabel: {
    position: 'absolute',
    top: chartHeight + 6,
    width: 64,
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
});
