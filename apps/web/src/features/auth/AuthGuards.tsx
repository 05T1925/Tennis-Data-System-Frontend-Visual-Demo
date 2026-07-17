import { Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';

import { useWebAuth } from './WebAuthContext';

export function AuthRestoringView() {
  return (
    <main className="auth-restoring" aria-busy="true" aria-label="正在恢复登录状态">
      <Spin size="large" description="正在恢复登录状态">
        <div className="auth-restoring-space" />
      </Spin>
    </main>
  );
}

export function ProtectedRoute() {
  const { status } = useWebAuth();
  if (status === 'restoring') {
    return <AuthRestoringView />;
  }
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  const { status } = useWebAuth();
  if (status === 'restoring') {
    return <AuthRestoringView />;
  }
  return status === 'unauthenticated' ? <Outlet /> : <Navigate to="/overview" replace />;
}

export function RootRedirect() {
  const { status } = useWebAuth();
  if (status === 'restoring') {
    return <AuthRestoringView />;
  }
  return <Navigate to={status === 'authenticated' ? '/overview' : '/login'} replace />;
}
