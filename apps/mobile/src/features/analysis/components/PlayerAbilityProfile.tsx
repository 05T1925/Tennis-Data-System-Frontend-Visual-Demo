import { StyleSheet, Text, View } from 'react-native';

import { AppCard, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { PlayerAbilityData } from '../analysisResultPresentation';

export function PlayerAbilityProfile({ data }: { data: PlayerAbilityData | null }) {
  return (
    <AppCard>
      <SectionTitle
        title="能力画像"
        description="Demo展示分，仅用于比较本次四项相对高低，范围和算法尚未确认，不是百分制或专业评级。"
      />
      {!data ? (
        <EmptyState title="暂无能力画像" description="当前结果没有可展示的能力画像数据。" />
      ) : (
        <View accessibilityLabel={data.accessibilitySummary} style={styles.list}>
          <Text style={styles.summary}>{data.accessibilitySummary}</Text>
          {data.items.map((item) => (
            <View
              accessible
              accessibilityLabel={item.accessibilityLabel}
              key={item.key}
              style={styles.item}
            >
              <View style={styles.heading}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{item.valueText}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${item.relativeWidth * 100}%` }]} />
              </View>
              <Text style={styles.explanation}>{item.explanation}</Text>
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  list: { gap: theme.spacing.lg },
  summary: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
  item: { gap: theme.spacing.sm },
  heading: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md },
  label: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  value: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  track: {
    height: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  fill: { height: '100%', backgroundColor: theme.colors.primary },
  explanation: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
