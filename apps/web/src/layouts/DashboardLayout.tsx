import type { AppSurface } from '@tennis/shared-types';
import { NavLink, Outlet } from 'react-router-dom';

const surface: AppSurface = 'web-dashboard';
const navigation = [
  { to: '/', label: '概览', end: true },
  { to: '/videos', label: '视频' },
  { to: '/analysis-tasks', label: '分析任务' },
  { to: '/statistics', label: '统计' },
  { to: '/system', label: '系统' },
];

export function DashboardLayout() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand-mark">TV</div>
        <div>
          <strong>网球视频分析</strong>
          <span>{surface}</span>
        </div>
        <nav aria-label="主导航">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink className="login-link" to="/login">
          登录占位页
        </NavLink>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
