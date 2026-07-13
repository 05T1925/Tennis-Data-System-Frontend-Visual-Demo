import { useLocalSearchParams } from 'expo-router';

import { PageShell } from '@/components/PageShell';

export default function VideoDetailScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();

  return (
    <PageShell
      title="视频详情"
      description={`当前路由参数 videoId：${videoId ?? '未提供'}`}
      links={[{ href: '/(tabs)/videos', label: '返回视频页' }]}
    />
  );
}
