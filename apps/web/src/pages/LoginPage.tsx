import { Link } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';

export function LoginPage() {
  return (
    <main className="standalone-page">
      <PageIntro title="登录" description="身份与权限尚未实现；当前页面只验证独立路由。" />
      <Link className="primary-link" to="/">
        进入 Dashboard 骨架
      </Link>
    </main>
  );
}
