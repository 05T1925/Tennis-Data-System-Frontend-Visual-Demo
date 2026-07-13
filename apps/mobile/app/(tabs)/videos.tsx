import { PageShell } from '@/components/PageShell';

export default function VideosScreen() {
  return (
    <PageShell
      title="视频"
      description="视频列表与分析状态尚未实现；当前只验证页面入口。"
      links={[{ href: '/videos/demo-video', label: '查看参数路由示例' }]}
    />
  );
}
