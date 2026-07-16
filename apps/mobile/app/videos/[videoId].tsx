import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAuthSession } from '@/features/auth';
import { normalizeVideoId, useVideoDetail, VideoDetailContent } from '@/features/videos';

export default function VideoDetailScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId?: string | string[] }>();
  const { user } = useAuthSession();
  const normalizedVideoId = normalizeVideoId(videoId);
  const detail = useVideoDetail({ userId: user?.id, videoId: normalizedVideoId });

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/videos');
  };

  const viewFullResult = () => {
    if (!normalizedVideoId) return;
    router.push({
      pathname: '/videos/[videoId]/result',
      params: { videoId: normalizedVideoId },
    });
  };

  return <VideoDetailContent detail={detail} onBack={goBack} onViewFullResult={viewFullResult} />;
}
