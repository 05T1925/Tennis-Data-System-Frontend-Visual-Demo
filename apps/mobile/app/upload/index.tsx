import { PageShell } from '@/components/PageShell';

export default function UploadScreen() {
  return (
    <PageShell
      title="上传视频"
      description="视频选择、上传和进度功能尚未实现；当前只验证独立路由。"
      links={[{ href: '/(tabs)', label: '返回首页' }]}
    />
  );
}
