import { PageShell } from '@/components/PageShell';

export default function LoginScreen() {
  return (
    <PageShell
      title="登录"
      description="身份功能尚未实现；当前页面只验证认证路由骨架。"
      links={[{ href: '/(tabs)', label: '进入首页占位页' }]}
    />
  );
}
