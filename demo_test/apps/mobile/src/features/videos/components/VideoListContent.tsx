import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton, AppCard, EmptyState } from '@/components';
import { theme } from '@/theme/tokens';

import {
  type VideoFilter,
  videoFilterOptions,
  type VideoListItemViewModel,
} from '../videoPresentation';

type VideoListContentProps = {
  items: readonly VideoListItemViewModel[];
  filteredItems: readonly VideoListItemViewModel[];
  filter: VideoFilter;
  listPending: boolean;
  hasListData: boolean;
  listErrorMessage: string | null;
  refreshing: boolean;
  retryingVideoIds: ReadonlySet<string>;
  retryErrorsByVideoId: ReadonlyMap<string, string>;
  onChangeFilter: (filter: VideoFilter) => void;
  onUpload: () => void;
  onRefresh: () => void;
  onSelectVideo: (videoId: string) => void;
  onRetryAnalysis: (videoId: string) => void;
};

function VideoListSkeleton() {
  return (
    <View
      accessibilityLabel="正在加载视频列表"
      accessibilityState={{ busy: true }}
      style={styles.list}
    >
      {[0, 1, 2].map((item) => (
        <AppCard key={item}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonThumbnail} />
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonLine, styles.skeletonTitle]} />
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, styles.skeletonStatus]} />
            </View>
          </View>
        </AppCard>
      ))}
    </View>
  );
}

function VideoFilterBar({
  filter,
  onChange,
}: {
  filter: VideoFilter;
  onChange: (filter: VideoFilter) => void;
}) {
  return (
    <View accessibilityLabel="视频状态筛选" style={styles.filters}>
      {videoFilterOptions.map((option) => {
        const selected = filter === option.value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.filter,
              selected ? styles.filterSelected : null,
              pressed ? styles.filterPressed : null,
            ]}
          >
            <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function VideoCard({
  item,
  retrying,
  retryError,
  onSelect,
  onRetry,
}: {
  item: VideoListItemViewModel;
  retrying: boolean;
  retryError: string | undefined;
  onSelect: () => void;
  onRetry: () => void;
}) {
  const { fontScale, width } = useWindowDimensions();
  const stacked = width < 390 || fontScale > 1.2;

  return (
    <AppCard>
      <Pressable
        accessibilityLabel={
          item.canNavigate ? `查看视频：${item.title}` : `${item.title}，视频 ID 待确认`
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: !item.canNavigate }}
        disabled={!item.canNavigate}
        onPress={onSelect}
        style={({ pressed }) => [pressed && item.canNavigate ? styles.cardPressed : null]}
      >
        <View style={[styles.cardBody, stacked ? styles.cardBodyStacked : null]}>
          <View style={[styles.thumbnail, stacked ? styles.thumbnailStacked : null]}>
            <Text style={styles.thumbnailText}>网球视频</Text>
          </View>
          <View style={styles.cardContent}>
            <Text numberOfLines={2} style={styles.title}>
              {item.title}
            </Text>
            <Text style={styles.metadata}>{item.createdAtLabel}</Text>
            <Text style={styles.metadata}>{item.durationLabel}</Text>
            <View
              accessibilityLabel={`当前状态：${item.status.label}`}
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.status.backgroundColor,
                  borderColor: item.status.borderColor,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: item.status.textColor }]}>
                {item.status.label}
              </Text>
            </View>
            <Text style={styles.statusDescription}>
              {item.uploadProgressLabel ?? item.status.description}
            </Text>
            <Text style={styles.openHint}>{item.canNavigate ? '查看详情' : '视频 ID 待确认'}</Text>
          </View>
        </View>
      </Pressable>

      {item.canRetry ? (
        <View style={styles.actionArea}>
          <AppButton
            accessibilityLabel={`重新分析：${item.title}`}
            label="重新分析"
            loading={retrying}
            onPress={onRetry}
            variant="secondary"
          />
        </View>
      ) : null}

      {retryError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {retryError}
        </Text>
      ) : null}
    </AppCard>
  );
}

export function VideoListContent({
  items,
  filteredItems,
  filter,
  listPending,
  hasListData,
  listErrorMessage,
  refreshing,
  retryingVideoIds,
  retryErrorsByVideoId,
  onChangeFilter,
  onUpload,
  onRefresh,
  onSelectVideo,
  onRetryAnalysis,
}: VideoListContentProps) {
  if (listPending) return <VideoListSkeleton />;

  if (listErrorMessage && !hasListData) {
    return (
      <AppCard>
        <EmptyState title="视频列表加载失败" description={listErrorMessage} />
        <AppButton label="重新加载" loading={refreshing} onPress={onRefresh} />
      </AppCard>
    );
  }

  if (hasListData && items.length === 0) {
    return (
      <AppCard>
        <EmptyState
          title="还没有视频"
          description="上传第一段训练或比赛视频后，它会显示在这里。"
          actionLabel="上传第一个视频"
          onAction={onUpload}
        />
      </AppCard>
    );
  }

  return (
    <View style={styles.list}>
      <VideoFilterBar filter={filter} onChange={onChangeFilter} />

      {listErrorMessage ? (
        <AppCard>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {listErrorMessage} 当前仍显示上次结果。
          </Text>
          <AppButton
            label="再次刷新"
            loading={refreshing}
            onPress={onRefresh}
            variant="secondary"
          />
        </AppCard>
      ) : null}

      {filteredItems.length === 0 ? (
        <AppCard>
          <EmptyState
            title="当前筛选暂无视频"
            description="可以查看全部视频，或选择其他状态。"
            actionLabel="查看全部"
            onAction={() => onChangeFilter('all')}
          />
        </AppCard>
      ) : (
        filteredItems.map((item) => (
          <VideoCard
            item={item}
            key={item.key}
            onRetry={() => onRetryAnalysis(item.videoId)}
            onSelect={() => onSelectVideo(item.videoId)}
            retryError={retryErrorsByVideoId.get(item.videoId)}
            retrying={retryingVideoIds.has(item.videoId)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: theme.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filter: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
  filterSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPressed: {
    opacity: 0.76,
  },
  filterText: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  filterTextSelected: {
    color: theme.colors.onPrimary,
  },
  cardPressed: {
    opacity: 0.78,
  },
  cardBody: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cardBodyStacked: {
    flexDirection: 'column',
  },
  thumbnail: {
    width: 112,
    aspectRatio: 16 / 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radii.sm,
  },
  thumbnailStacked: {
    width: '100%',
    aspectRatio: 16 / 7,
  },
  thumbnailText: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
  },
  cardContent: {
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.bold,
  },
  metadata: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
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
  statusDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  openHint: {
    color: theme.colors.primary,
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.bold,
    marginTop: theme.spacing.xs,
  },
  actionArea: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSizes.sm,
    lineHeight: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  skeletonThumbnail: {
    width: 112,
    aspectRatio: 16 / 10,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  skeletonContent: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  skeletonLine: {
    width: '82%',
    height: 12,
    backgroundColor: theme.colors.disabled,
    borderRadius: theme.radii.sm,
  },
  skeletonTitle: {
    width: '100%',
    height: 20,
  },
  skeletonStatus: {
    width: '48%',
  },
});
