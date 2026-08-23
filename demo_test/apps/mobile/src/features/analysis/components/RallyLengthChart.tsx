import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppCard, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import type { RallyLengthData } from '../analysisResultPresentation';

const barAreaHeight = 144;

export function RallyLengthChart({ data }: { data: RallyLengthData }) {
  return (
    <AppCard>
      <SectionTitle title="回合拍数" description="每根柱表示一个有效回合的击球次数，单位为拍。" />
      <Text accessible accessibilityLabel={data.accessibilitySummary} style={styles.summary}>
        {data.accessibilitySummary}
      </Text>
      {data.items.length === 0 ? (
        <EmptyState title="暂无可展示的回合统计" description="当前结果没有有效回合记录。" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.bars}>
            {data.items.map((item) => (
              <View
                accessible
                accessibilityLabel={`${item.label}，${item.shotCount}拍`}
                key={item.key}
                style={styles.barColumn}
              >
                <Text style={styles.barValue}>{item.shotCount}拍</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: item.shotCount === 0 ? 2 : item.heightRatio * barAreaHeight },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
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
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing.md, minWidth: '100%' },
  barColumn: { width: 68, alignItems: 'center', gap: theme.spacing.xs },
  barValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  barTrack: { height: barAreaHeight, justifyContent: 'flex-end' },
  bar: {
    width: 36,
    minHeight: 2,
    backgroundColor: theme.colors.info,
    borderRadius: theme.radii.sm,
  },
  barLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    textAlign: 'center',
  },
});
