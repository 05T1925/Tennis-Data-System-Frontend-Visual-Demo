import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

import { AuthRestoringView, useWebAuth } from '../features/auth';

export function NotFoundPage() {
  const { status } = useWebAuth();

  if (status === 'restoring') {
    return <AuthRestoringView />;
  }

  const isAuthenticated = status === 'authenticated';
  const target = isAuthenticated ? '/overview' : '/login';

  return (
    <main className="not-found-page">
      <Result
        status="404"
        title="页面不存在"
        subTitle="当前地址没有对应的 Web 页面，请返回有效入口。"
        extra={
          <Link to={target}>
            <Button type="primary">{isAuthenticated ? '返回总览' : '返回登录'}</Button>
          </Link>
        }
      />
    </main>
  );
}
