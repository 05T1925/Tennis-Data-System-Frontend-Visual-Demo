import type { AppError } from '@tennis/shared-types';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton, AppCard, EmptyState, SectionTitle } from '@/components';
import type { HomeOverview } from '@/features/statistics';
import { theme } from '@/theme/tokens';

import {
  formatAnalysisStatus,
  formatCount,
  formatDateTime,
  formatTrainingDuration,
  getErrorMessage,
} from '../homeContent';
import { HomeSectionSkeleton } from './HomeSectionSkeleton';

type HomeOverviewSectionProps = {
  overview: HomeOverview | undefined;
  error: AppError | null;
  pending: boolean;
  fetching: boolean;
  onRetry: () => void;
};

export function HomeOverviewSection({
  overview,
  error,
  pending,
  fetching,
  onRetry,
}: HomeOverviewSectionProps) {
  const { fontScale, width } = useWindowDimensions();
  const useSingleColumn = width < 360 || fontScale > 1.2;

  if (pending && !overview) {
    return (
      <View style={styles.section}>
        <SectionTitle title="累计训练" description="正在汇总你的训练数据。" />
        <HomeSectionSkeleton cards={3} />
      </View>
    );
  }

  if (error && !overview) {
    return (
      <View style={styles.section}>
        <SectionTitle title="累计训练" description="统计和最近分析暂时不可用。" />
        <AppCard>
          <EmptyState
            title="训练数据加载失败"
            description={getErrorMessage(error, '训练数据暂时不可用，请稍后重试。')}
          />
          <AppButton label="重试训练数据" loading={fetching} onPress={onRetry} />
        </AppCard>
      </View>
    );
  }

  if (!overview) return null;

  const metrics = [
    { label: '累计视频', value: formatCount(overview.totalVideos), hint: '条训练记录' },
    { label: '累计击球', value: formatCount(overview.totalShots), hint: '次有效击球' },
    { label: '累计回合', value: formatCount(overview.totalRallies), hint: '个连续回合' },
    {
      label: '训练时长',
      value: formatTrainingDuration(overview.totalTrainingDurationMs),
      hint: '累计视频时长',
    },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title="累计训练" description="累计数据由统计服务提供，不从最近视频推算。" />
      <View style={styles.metricGrid}>
        {metrics.map((metric) => (
          <View
            key={metric.label}
            style={[styles.metricItem, useSingleColumn ? styles.metricItemFull : null]}
          >
            <AppCard>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricHint}>{metric.hint}</Text>
            </AppCard>
          </View>
        ))}
      </View>

      <SectionTitle title="最近分析" description="快速回顾最近一次处理完成的训练。" />
      <AppCard>
        {overview.latestAnalysis ? (
          <View style={styles.analysisContent}>
            <View style={styles.analysisHeader}>
              <Text numberOfLines={2} style={styles.analysisTitle}>
                {overview.latestAnalysis.videoTitle}
              </Text>
              <Text style={styles.status}>
                {formatAnalysisStatus(overview.latestAnalysis.analysisStatus)}
              </Text>
            </View>
            <Text style={styles.secondaryText}>
              {formatDateTime(overview.latestAnalysis.analyzedAt)}
            </Text>
            <View style={styles.analysisMetrics}>
              <Text style={styles.analysisMetric}>
                {formatCount(overview.latestAnalysis.totalShots)} 次击球
              </Text>
              <Text style={styles.analysisMetric}>
                {formatCount(overview.latestAnalysis.totalRallies)} 个回合
              </Text>
            </View>
          </View>
        ) : (
          <EmptyState
            title="暂无最近分析"
            description="上传第一段训练视频后，分析摘要会显示在这里。"
          />
        )}
      </AppCard>

      {error ? (
        <AppCard>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {getErrorMessage(error, '刷新训练数据失败，当前仍显示上次结果。')}
          </Text>
          <AppButton
            label="重新刷新训练数据"
            loading={fetching}
            onPress={onRetry}
            variant="secondary"
          />
        </AppCard>
      ) : fetching ? (
        <Text style={styles.refreshing}>正在刷新训练数据…</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  metricItem: {
    width: '48%',
  },
  metricItemFull: {
    width: '100%',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
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
  analysisContent: {
    gap: theme.spacing.sm,
  },
  analysisHeader: {
    gap: theme.spacing.sm,
  },
  analysisTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  status: {
    alignSelf: 'flex-start',
    color: theme.colors.success,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  secondaryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
  analysisMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  analysisMetric: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.bold,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  refreshing: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
});
