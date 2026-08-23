import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import styles from '../styles/app.module.css';

const navItems = [
  { to: '/video/demo-upload-001', label: '视频详情', icon: 'video' },
  { to: '/overview', label: '数据总览', icon: 'grid' },
  { to: '/rally', label: '击球与相持', icon: 'rally' },
  { to: '/serve', label: '发球分析', icon: 'serve' },
];

function NavIcon({ icon }: { icon: string }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {icon === 'video' ? (
        <>
          <rect {...common} x="3" y="5" width="14" height="14" rx="1" />
          <path {...common} d="m17 10 4-2v8l-4-2" />
        </>
      ) : icon === 'grid' ? (
        <>
          <rect {...common} x="4" y="4" width="6" height="6" />
          <rect {...common} x="14" y="4" width="6" height="6" />
          <rect {...common} x="4" y="14" width="6" height="6" />
          <rect {...common} x="14" y="14" width="6" height="6" />
        </>
      ) : icon === 'rally' ? (
        <>
          <path {...common} d="M5 17c4-8 10-8 14-10" />
          <path {...common} d="m15 4 4 3-3 4" />
          <circle {...common} cx="6" cy="17" r="2" />
        </>
      ) : (
        <>
          <path {...common} d="M6 19c5-3 6-8 6-14" />
          <path {...common} d="m12 5 4 4" />
          <path {...common} d="M15 3v5h-5" />
          <circle {...common} cx="7" cy="18" r="2" />
        </>
      )}
    </svg>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className={styles.appShell}>
      <aside className={styles.rail} aria-label="主要导航">
        <div className={styles.brand} aria-label="Tennis analysis">
          TA
        </div>
        <nav className={styles.railNav} aria-label="产品导航">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => `${styles.railLink} ${isActive ? styles.active : ''}`}
              key={item.to}
              to={item.to}
              aria-label={item.label}
            >
              <span className={styles.navIcon}>
                <NavIcon icon={item.icon} />
              </span>
              <small>{item.label}</small>
            </NavLink>
          ))}
        </nav>
        <div className={styles.mockMark}>
          Mock
          <br />
          fixture
        </div>
      </aside>
      <main className={styles.mainContent}>
        {title ? <h1 className={styles.srOnly}>{title}</h1> : null}
        {children}
      </main>
    </div>
  );
}
