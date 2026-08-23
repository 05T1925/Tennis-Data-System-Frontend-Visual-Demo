import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnalysisResultContent, useAnalysisResult } from '@/features/analysis';
import { useAuthSession } from '@/features/auth';
import { normalizeVideoId } from '@/features/videos';

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId?: string | string[] }>();
  const { user } = useAuthSession();
  const normalizedVideoId = normalizeVideoId(videoId);
  const state = useAnalysisResult({ userId: user?.id, videoId: normalizedVideoId });

  const goBackToDetail = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (normalizedVideoId) {
      router.replace({ pathname: '/videos/[videoId]', params: { videoId: normalizedVideoId } });
      return;
    }
    router.replace('/(tabs)/videos');
  };

  return (
    <AnalysisResultContent
      onBackToDetail={goBackToDetail}
      onBackToList={() => router.replace('/(tabs)/videos')}
      state={state}
    />
  );
}
