import { useRouter } from 'expo-router';

import { PageShell } from '@/components';
import { useAuthSession } from '@/features/auth';
import { useVideoList, VideoListContent } from '@/features/videos';

export default function VideosScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const videos = useVideoList(user?.id);

  const openVideo = (videoId: string) => {
    if (!videoId.trim()) return;
    router.push({ pathname: '/videos/[videoId]', params: { videoId } });
  };

  return (
    <PageShell
      title="视频"
      description="查看你的训练视频及当前处理状态。"
      onRefresh={() => void videos.refresh()}
      refreshing={videos.manualRefreshing}
    >
      <VideoListContent
        filter={videos.filter}
        filteredItems={videos.filteredItems}
        hasListData={videos.hasListData}
        items={videos.items}
        listErrorMessage={videos.listErrorMessage}
        listPending={videos.listPending}
        onChangeFilter={videos.setFilter}
        onRefresh={() => void videos.refresh()}
        onRetryAnalysis={(videoId) => void videos.retryAnalysis(videoId)}
        onSelectVideo={openVideo}
        onUpload={() => router.push('/upload')}
        refreshing={videos.manualRefreshing}
        retryErrorsByVideoId={videos.retryErrorsByVideoId}
        retryingVideoIds={videos.retryingVideoIds}
      />
    </PageShell>
  );
}
