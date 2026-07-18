import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import { mobileApiMode } from '@/config/env';
import { theme } from '@/theme/tokens';

import {
  createAnalysisMetricGroups,
  createBallSpeedTrend,
  createLandingDistribution,
  createPlayerAbilityData,
  createRallyLengthData,
} from '../analysisResultPresentation';
import type { AnalysisResultPageState } from '../hooks/useAnalysisResult';
import { BallSpeedTrendChart } from './BallSpeedTrendChart';
import { LandingDistributionChart } from './LandingDistributionChart';
import { MetricCardGrid } from './MetricCardGrid';
import { PlayerAbilityProfile } from './PlayerAbilityProfile';
import { RallyLengthChart } from './RallyLengthChart';

type AnalysisResultContentProps = {
  state: AnalysisResultPageState;
  onBackToDetail: () => void;
  onBackToList: () => void;
};

function ResultActions({
  onBackToDetail,
  onBackToList,
}: Pick<AnalysisResultContentProps, 'onBackToDetail' | 'onBackToList'>) {
  return (
    <View style={styles.actions}>
      <AppButton label="返回视频详情" onPress={onBackToDetail} />
      <AppButton label="返回视频列表" onPress={onBackToList} variant="secondary" />
    </View>
  );
}

function ResultMessage({
  title,
  description,
  actionLabel,
  onAction,
  onBackToDetail,
  onBackToList,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
} & Pick<AnalysisResultContentProps, 'onBackToDetail' | 'onBackToList'>) {
  return (
    <PageShell
      title="完整分析结果"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<ResultActions onBackToDetail={onBackToDetail} onBackToList={onBackToList} />}
    >
      <AppCard>
        <EmptyState
          actionLabel={actionLabel}
          description={description}
          onAction={onAction}
          title={title}
        />
      </AppCard>
    </PageShell>
  );
}

function ResultSkeleton({
  label,
  onBackToDetail,
  onBackToList,
}: { label: string } & Pick<AnalysisResultContentProps, 'onBackToDetail' | 'onBackToList'>) {
  return (
    <PageShell
      title="完整分析结果"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<ResultActions onBackToDetail={onBackToDetail} onBackToList={onBackToList} />}
    >
      <View
        accessibilityLabel={label}
        accessibilityState={{ busy: true }}
        style={styles.skeletonList}
      >
        {[0, 1, 2, 3].map((key) => (
          <AppCard key={key}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </AppCard>
        ))}
      </View>
    </PageShell>
  );
}

export function AnalysisResultContent({
  state,
  onBackToDetail,
  onBackToList,
}: AnalysisResultContentProps) {
  const isMockMode = mobileApiMode.status === 'ready' && mobileApiMode.mode === 'mock';
  const actions = { onBackToDetail, onBackToList };

  if (!state.identityValid) {
    return (
      <ResultMessage
        {...actions}
        description="无法确认要查看的视频，请返回视频列表后重新选择。"
        title="视频参数无效"
      />
    );
  }
  if (state.videoQuery.isPending || state.videoQuery.isFetching) {
    return <ResultSkeleton {...actions} label="正在加载完整分析结果" />;
  }
  if (state.videoQuery.isError) {
    const notFound = state.videoQuery.error.code === 'VIDEO_NOT_FOUND';
    return (
      <ResultMessage
        {...actions}
        actionLabel={notFound ? undefined : '重新加载视频'}
        description={
          notFound
            ? '视频不存在或无权访问'
            : state.videoQuery.error.userMessage || '视频暂时加载失败，请稍后重试。'
        }
        onAction={notFound ? undefined : () => void state.videoQuery.refetch()}
        title={notFound ? '无法查看结果' : '视频加载失败'}
      />
    );
  }
  if (state.videoQuery.data.uploadStatus !== 'uploaded') {
    return (
      <ResultMessage
        {...actions}
        description="视频上传完成后才能查看分析结果。"
        title="当前不能查看结果"
      />
    );
  }
  if (state.taskQuery.isPending || state.taskQuery.isFetching) {
    return <ResultSkeleton {...actions} label="正在核验分析任务状态" />;
  }
  if (state.taskQuery.isError) {
    return (
      <ResultMessage
        {...actions}
        actionLabel="重新查询任务状态"
        description={state.taskQuery.error.userMessage || '分析状态暂时加载失败，请重试。'}
        onAction={() => void state.taskQuery.refetch()}
        title="无法核验分析状态"
      />
    );
  }
  const task = state.taskQuery.data;
  if (!task) {
    return (
      <ResultMessage
        {...actions}
        description="分析任务尚未创建，请返回详情查看当前状态。"
        title="没有分析任务"
      />
    );
  }
  if (task.status === 'queued' || task.status === 'processing') {
    return (
      <ResultMessage
        {...actions}
        description="分析尚未完成，请返回详情查看实时进度。结果页不会自动轮询。"
        title="分析仍在进行"
      />
    );
  }
  if (task.status === 'failed' || task.status === 'canceled') {
    return (
      <ResultMessage
        {...actions}
        description="当前任务没有可用完整结果，请返回详情查看失败原因或状态。"
        title="没有完整分析结果"
      />
    );
  }
  if (task.status !== 'succeeded') {
    return (
      <ResultMessage
        {...actions}
        description="当前分析状态待确认，请返回详情查看。"
        title="暂时无法展示结果"
      />
    );
  }
  if (state.resultQuery.isPending || state.resultQuery.isFetching) {
    return <ResultSkeleton {...actions} label="正在加载分析结果数据" />;
  }
  if (state.resultQuery.isError) {
    return (
      <ResultMessage
        {...actions}
        actionLabel="重新加载结果"
        description={state.resultQuery.error.userMessage || '分析结果暂时加载失败，请重试。'}
        onAction={() => void state.resultQuery.refetch()}
        title="分析结果加载失败"
      />
    );
  }
  const result = state.displayResult;
  if (!result) {
    return (
      <ResultMessage
        {...actions}
        actionLabel="重新加载结果"
        description="分析已完成，但结果数据暂时不可用。"
        onAction={() => void state.resultQuery.refetch()}
        title="分析结果暂未生成"
      />
    );
  }

  const metricGroups = createAnalysisMetricGroups(result.summary);
  const speedTrend = createBallSpeedTrend(result.shots);
  const rallyData = createRallyLengthData(result.rallies);
  const landingData = createLandingDistribution(result.heatmapPoints);
  const abilityData = createPlayerAbilityData(result.playerProfile);

  return (
    <PageShell
      title="完整分析结果"
      description="查看本次视频的核心指标与静态可视化。"
      eyebrow={isMockMode ? 'Demo分析数据' : 'Real API Draft'}
      edges={['top', 'bottom', 'left', 'right']}
      footer={<ResultActions {...actions} />}
    >
      <AppCard>
        <SectionTitle
          title={isMockMode ? '本地 Mock 结果' : 'API Draft 结果'}
          description={
            isMockMode
              ? '当前结果来自本地 Mock 数据，仅用于验证产品展示流程。'
              : '当前结果来自前端 Draft Contract，不代表正式后端或算法契约。'
          }
        />
        <Text style={styles.notice}>各项数据不构成算法精度、专业评级或正式比赛裁决承诺。</Text>
      </AppCard>
      <MetricCardGrid groups={metricGroups} />
      <BallSpeedTrendChart trend={speedTrend} />
      <RallyLengthChart data={rallyData} />
      <LandingDistributionChart data={landingData} />
      <PlayerAbilityProfile data={abilityData} />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  actions: { gap: theme.spacing.md },
  skeletonList: { gap: theme.spacing.xl },
  skeletonTitle: {
    width: '42%',
    height: 20,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  skeletonLine: {
    width: '100%',
    height: 14,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  skeletonLineShort: {
    width: '68%',
    height: 14,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  notice: { color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, lineHeight: 20 },
});
