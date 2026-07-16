import { StyleSheet, Text, View } from 'react-native';

import { AppCard, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { LandingDistributionData } from '../analysisResultPresentation';

const dotSize = 12;

export function LandingDistributionChart({ data }: { data: LandingDistributionData }) {
  return (
    <AppCard>
      <SectionTitle
        title="相对落点分布"
        description="Demo相对位置示意，不代表精确球场坐标或米制落点。"
      />
      <Text accessible accessibilityLabel={data.accessibilitySummary} style={styles.summary}>
        {data.accessibilitySummary}
      </Text>
      {data.points.length === 0 ? (
        <EmptyState
          title="暂无可展示的相对落点数据"
          description="当前结果没有位于Demo显示窗口内的有效点位。"
        />
      ) : (
        <View accessibilityLabel={data.accessibilitySummary} style={styles.court}>
          <View style={styles.net} />
          <View style={styles.centerLine} />
          {data.points.map((point) => (
            <View
              key={point.key}
              style={[
                styles.dot,
                {
                  left: `${4 + point.xRatio * 92}%`,
                  top: `${4 + point.yRatio * 92}%`,
                  opacity: point.opacity,
                },
              ]}
            />
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  summary: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
  court: {
    width: '100%',
    aspectRatio: 0.66,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    borderRadius: theme.radii.sm,
  },
  net: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.surface,
  },
  centerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: theme.colors.surface,
  },
  dot: {
    position: 'absolute',
    width: dotSize,
    height: dotSize,
    marginLeft: -dotSize / 2,
    marginTop: -dotSize / 2,
    borderRadius: dotSize / 2,
    borderColor: theme.colors.surface,
    borderWidth: 2,
    backgroundColor: theme.colors.danger,
  },
});
