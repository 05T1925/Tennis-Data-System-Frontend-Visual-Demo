import type { AppError, Video } from '@tennis/shared-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton, AppCard, EmptyState, SectionTitle } from '@/components';
import { theme } from '@/theme/tokens';

import {
  formatDateTime,
  formatUploadStatus,
  formatVideoDuration,
  formatVideoTitle,
  getErrorMessage,
} from '../homeContent';
import { HomeSectionSkeleton } from './HomeSectionSkeleton';

type RecentVideosSectionProps = {
  videos: Video[] | undefined;
  error: AppError | null;
  pending: boolean;
  fetching: boolean;
  onRetry: () => void;
  onSelectVideo: (videoId: string) => void;
};

export function RecentVideosSection({
  videos,
  error,
  pending,
  fetching,
  onRetry,
  onSelectVideo,
}: RecentVideosSectionProps) {
  if (pending && !videos) {
    return (
      <View style={styles.section}>
        <SectionTitle title="最近视频" description="正在读取最近上传的视频。" />
        <HomeSectionSkeleton cards={2} />
      </View>
    );
  }

  if (error && !videos) {
    return (
      <View style={styles.section}>
        <SectionTitle title="最近视频" description="最多展示最近上传的 3 条视频。" />
        <AppCard>
          <EmptyState
            title="最近视频加载失败"
            description={getErrorMessage(error, '最近视频暂时不可用，请稍后重试。')}
          />
          <AppButton label="重试最近视频" loading={fetching} onPress={onRetry} />
        </AppCard>
      </View>
    );
  }

  const displayedVideos = videos?.slice(0, 3) ?? [];

  return (
    <View style={styles.section}>
      <SectionTitle title="最近视频" description="最多展示最近上传的 3 条视频。" />
      {displayedVideos.length === 0 ? (
        <AppCard>
          <EmptyState
            title="还没有视频"
            description="上传第一段训练视频后，可以从这里快速打开详情。"
          />
        </AppCard>
      ) : (
        displayedVideos.map((video, index) => {
          const videoId = video.id.trim();
          const canOpen = videoId.length > 0;

          return (
            <Pressable
              accessibilityLabel={`查看视频：${formatVideoTitle(video.title)}`}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canOpen }}
              disabled={!canOpen}
              key={videoId || `${video.createdAt}-${index}`}
              onPress={() => onSelectVideo(videoId)}
              style={({ pressed }) => [pressed && canOpen ? styles.pressed : null]}
            >
              <AppCard>
                <View style={styles.videoHeader}>
                  <Text numberOfLines={2} style={styles.videoTitle}>
                    {formatVideoTitle(video.title)}
                  </Text>
                  <Text style={styles.status}>{formatUploadStatus(video.uploadStatus)}</Text>
                </View>
                <Text style={styles.metadata}>
                  {formatVideoDuration(video.durationSeconds)} · {formatDateTime(video.createdAt)}
                </Text>
                <Text style={styles.openHint}>{canOpen ? '查看视频详情 ›' : '视频 ID 待确认'}</Text>
              </AppCard>
            </Pressable>
          );
        })
      )}

      {error && videos ? (
        <AppCard>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {getErrorMessage(error, '刷新最近视频失败，当前仍显示上次结果。')}
          </Text>
          <AppButton
            label="重新刷新最近视频"
            loading={fetching}
            onPress={onRetry}
            variant="secondary"
          />
        </AppCard>
      ) : fetching ? (
        <Text style={styles.refreshing}>正在刷新最近视频…</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
  videoHeader: {
    gap: theme.spacing.sm,
  },
  videoTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  status: {
    alignSelf: 'flex-start',
    color: theme.colors.info,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  metadata: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  openHint: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
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
