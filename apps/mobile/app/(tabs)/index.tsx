import { PageShell } from '@/components/PageShell';

export default function HomeScreen() {
  return (
    <PageShell
      title="首页"
      description="网球视频分析系统 v0.1 工程骨架。业务能力将在后续阶段实现。"
      links={[
        { href: '/upload', label: '前往上传占位页' },
        { href: '/(auth)/login', label: '查看登录占位页' },
      ]}
    />
  );
}
