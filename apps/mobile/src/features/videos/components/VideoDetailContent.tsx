import type { AnalysisStatus } from '@tennis/shared-types';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, EmptyState, PageShell, SectionTitle } from '@/components';
import {
  createAnalysisSummaryItems,
  getAnalysisStageLabel,
  getAnalysisStatusLabel,
  getSafeAnalysisProgress,
} from '@/features/analysis';
import { theme } from '@/theme/tokens';

import type { VideoDetailState } from '../hooks/useVideoDetail';
import { getSafeDetailErrorMessage } from '../hooks/useVideoDetail';
import {
  createVideoDetailFields,
  formatVideoTitle,
  getUploadStatusPresentation,
} from '../videoDetailPresentation';

type VideoDetailContentProps = {
  detail: VideoDetailState;
  onBack: () => void;
};

function PageMessage({
  title,
  description,
  actionLabel,
  onAction,
  onBack,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onBack: () => void;
}) {
  return (
    <PageShell
      title="视频详情"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<AppButton label="返回视频列表" onPress={onBack} variant="secondary" />}
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

function VideoDetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <PageShell
      title="视频详情"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<AppButton label="返回视频列表" onPress={onBack} variant="secondary" />}
    >
      <View
        accessibilityLabel="正在加载视频详情"
        accessibilityState={{ busy: true }}
        style={styles.sectionList}
      >
        <View style={styles.previewSkeleton} />
        {[0, 1, 2].map((key) => (
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

function PreviewPlaceholder() {
  return (
    <View accessibilityLabel="视频预览占位" style={styles.preview}>
      <Text style={styles.previewTitle}>视频预览</Text>
      <Text style={styles.previewDescription}>当前 Demo 暂未接入播放器</Text>
    </View>
  );
}

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      accessibilityLabel={`当前状态：${label}`}
      style={[styles.statusBadge, { borderColor: color }]}
    >
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

function AnalysisProgress({ progress }: { progress: number }) {
  return (
    <View style={styles.progressSection}>
      <View
        accessibilityLabel={`分析进度 ${progress}%`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: progress }}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{progress}%</Text>
    </View>
  );
}

function analysisStatusColor(status: AnalysisStatus) {
  if (status === 'succeeded') return theme.colors.success;
  if (status === 'failed') return theme.colors.danger;
  if (status === 'processing') return theme.colors.info;
  if (status === 'queued') return theme.colors.warning;
  return theme.colors.textSecondary;
}

function AnalysisSection({ detail }: { detail: VideoDetailState }) {
  const { taskQuery } = detail;

  if (taskQuery.isPending) {
    return (
      <AppCard>
        <SectionTitle title="分析状态" />
        <Text accessibilityState={{ busy: true }} style={styles.secondaryText}>
          正在读取分析状态…
        </Text>
      </AppCard>
    );
  }

  if (taskQuery.isError) {
    return (
      <AppCard>
        <SectionTitle title="分析状态" />
        <Text accessibilityRole="alert" style={styles.errorText}>
          {getSafeDetailErrorMessage(taskQuery.error, '分析状态暂时加载失败，请重试。')}
        </Text>
        <AppButton label="重新查询分析状态" onPress={() => void taskQuery.refetch()} />
      </AppCard>
    );
  }

  const task = taskQuery.data;
  if (!task) {
    return (
      <AppCard>
        <SectionTitle title="分析状态" />
        <EmptyState
          actionLabel="刷新分析状态"
          description="分析任务尚未建立或正在准备。"
          onAction={() => void taskQuery.refetch()}
          title="等待创建分析任务"
        />
      </AppCard>
    );
  }

  const progress = getSafeAnalysisProgress(task);
  return (
    <AppCard>
      <SectionTitle title="分析状态" description="状态与当前处理阶段分别展示。" />
      <StatusBadge
        label={getAnalysisStatusLabel(task.status)}
        color={analysisStatusColor(task.status)}
      />
      <View style={styles.detailBlock}>
        <Text style={styles.fieldLabel}>当前阶段</Text>
        <Text style={styles.fieldValue}>{getAnalysisStageLabel(task.stage)}</Text>
      </View>
      {progress !== null ? <AnalysisProgress progress={progress} /> : null}

      {task.status === 'failed' ? (
        <View style={styles.failureSection}>
          <Text style={styles.failureTitle}>分析失败</Text>
          <Text style={styles.errorText}>
            {task.errorMessage?.trim() || '分析失败，请稍后重试'}
          </Text>
          <AppButton
            accessibilityLabel="重新分析当前视频"
            disabled={!detail.retryAllowed}
            label="重新分析"
            loading={detail.retrying}
            onPress={() => void detail.retryAnalysis()}
          />
          {detail.retryErrorMessage ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {detail.retryErrorMessage}
            </Text>
          ) : null}
        </View>
      ) : null}
    </AppCard>
  );
}

function ResultSection({ detail }: { detail: VideoDetailState }) {
  if (!detail.resultEnabled) return null;
  const { resultQuery } = detail;

  if (resultQuery.isPending) {
    return (
      <AppCard>
        <SectionTitle title="分析结果摘要" description="Demo 分析数据" />
        <Text accessibilityState={{ busy: true }} style={styles.secondaryText}>
          正在生成结果摘要…
        </Text>
      </AppCard>
    );
  }

  if (resultQuery.isError) {
    return (
      <AppCard>
        <SectionTitle title="分析结果摘要" description="Demo 分析数据" />
        <Text accessibilityRole="alert" style={styles.errorText}>
          {getSafeDetailErrorMessage(resultQuery.error, '分析结果暂时加载失败，请重试。')}
        </Text>
        <AppButton label="重新加载结果" onPress={() => void resultQuery.refetch()} />
      </AppCard>
    );
  }

  if (!resultQuery.data) {
    return (
      <AppCard>
        <SectionTitle title="分析结果摘要" description="Demo 分析数据" />
        <EmptyState title="结果暂未生成" description="分析已完成，但结果数据暂时不可用。" />
      </AppCard>
    );
  }

  const items = createAnalysisSummaryItems(resultQuery.data);
  return (
    <AppCard>
      <SectionTitle title="分析结果摘要" description="Demo 分析数据" />
      <View accessibilityLabel="Demo 分析结果摘要" style={styles.summaryGrid}>
        {items.map((item) => (
          <View key={item.key} style={styles.summaryItem}>
            <Text style={styles.fieldLabel}>{item.label}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

export function VideoDetailContent({ detail, onBack }: VideoDetailContentProps) {
  if (!detail.identityValid) {
    return (
      <PageMessage
        description="无法确认要查看的视频，请返回视频列表后重新选择。"
        onBack={onBack}
        title="视频参数无效"
      />
    );
  }

  if (detail.videoQuery.isPending) return <VideoDetailSkeleton onBack={onBack} />;

  if (detail.videoQuery.isError) {
    const notFound = detail.videoQuery.error.code === 'VIDEO_NOT_FOUND';
    return (
      <PageMessage
        actionLabel={notFound ? undefined : '重新加载'}
        description={
          notFound
            ? '视频不存在或无权访问。'
            : getSafeDetailErrorMessage(detail.videoQuery.error, '视频详情暂时加载失败，请重试。')
        }
        onAction={notFound ? undefined : () => void detail.videoQuery.refetch()}
        onBack={onBack}
        title={notFound ? '无法查看视频' : '视频详情加载失败'}
      />
    );
  }

  const video = detail.videoQuery.data;
  const uploadStatus = getUploadStatusPresentation(video);
  const fields = createVideoDetailFields(video);

  return (
    <PageShell
      description="查看视频信息、处理进度和简要分析结果。"
      edges={['top', 'bottom', 'left', 'right']}
      footer={<AppButton label="返回视频列表" onPress={onBack} variant="secondary" />}
      title={formatVideoTitle(video.title)}
    >
      <PreviewPlaceholder />

      <AppCard>
        <SectionTitle title="视频信息" />
        <View style={styles.fieldList}>
          {fields.map((field) => (
            <View key={field.key} style={styles.detailBlock}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.value}</Text>
            </View>
          ))}
        </View>
      </AppCard>

      <AppCard>
        <SectionTitle title="上传状态" />
        <StatusBadge label={uploadStatus.label} color={uploadStatus.textColor} />
        <Text style={styles.secondaryText}>
          {video.uploadStatus === 'uploading' && Number.isFinite(video.uploadProgress)
            ? `已上传 ${Math.min(100, Math.max(0, Math.round(video.uploadProgress)))}%`
            : uploadStatus.description}
        </Text>
      </AppCard>

      {video.uploadStatus === 'uploaded' ? (
        <>
          <AnalysisSection detail={detail} />
          <ResultSection detail={detail} />
        </>
      ) : (
        <AppCard>
          <SectionTitle title="分析状态" />
          <Text style={styles.secondaryText}>视频上传完成后才会读取分析任务。</Text>
        </AppCard>
      )}
    </PageShell>
  );
}

const styles = StyleSheet.create({
  sectionList: {
    gap: theme.spacing.xl,
  },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.sm,
  },
  previewTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.extraBold,
  },
  previewDescription: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
  },
  previewSkeleton: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
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
  fieldList: {
    gap: theme.spacing.md,
  },
  detailBlock: {
    gap: theme.spacing.xs,
  },
  fieldLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
  },
  fieldValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  secondaryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.md,
    lineHeight: 24,
  },
  progressSection: {
    gap: theme.spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressLabel: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    textAlign: 'right',
  },
  failureSection: {
    gap: theme.spacing.md,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.md,
  },
  failureTitle: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  summaryItem: {
    minWidth: 132,
    flexBasis: '45%',
    flexGrow: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.sm,
  },
  summaryValue: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
});
