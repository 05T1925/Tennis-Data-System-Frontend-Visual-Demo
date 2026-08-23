import { StyleSheet, Text, View } from 'react-native';

import { AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

const metrics = ['击球次数', '回合数', '平均球速', '跑动距离'];

export default function StatisticsScreen() {
  return (
    <PageShell title="统计" description="训练指标会在分析完成后汇总展示，当前仅提供页面结构。">
      <AppCard>
        <EmptyState title="暂无分析结果" description="完成至少一次视频分析后再查看训练统计。" />
      </AppCard>

      <View style={styles.section}>
        <SectionTitle title="指标区域" description="以下指标没有填入虚构数值。" />
        {metrics.map((metric) => (
          <AppCard key={metric}>
            <Text style={styles.metricLabel}>{metric}</Text>
            <Text style={styles.metricValue}>—</Text>
            <Text style={styles.metricHint}>暂无数据</Text>
          </AppCard>
        ))}
      </View>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  metricHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
});
