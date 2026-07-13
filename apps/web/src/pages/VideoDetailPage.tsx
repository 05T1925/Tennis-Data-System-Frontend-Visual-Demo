import { useParams } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  return (
    <PageIntro title="视频详情" description={`当前路由参数 videoId：${videoId ?? '未提供'}`} />
  );
}
