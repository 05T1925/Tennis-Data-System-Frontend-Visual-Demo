import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { OverviewPage } from '../pages/OverviewPage';
import { RallyPage } from '../pages/RallyPage';
import { ServePage } from '../pages/ServePage';
import { VideoDetailPage } from '../pages/VideoDetailPage';
import styles from '../styles/app.module.css';

function PlaceholderPage({ title, note }: { title: string; note: string }) {
  return (
    <AppShell>
      <section className={styles.placeholderPage}>
        <p className={styles.kicker}>FIRST / 保留路由</p>
        <h2>{title}</h2>
        <p>{note}</p>
      </section>
    </AppShell>
  );
}

function NotFound() {
  return <PlaceholderPage title="页面未找到" note="该路由不在 First 原型范围内。" />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/video/demo-upload-001" replace />} />
      <Route
        path="/video/demo-upload-001"
        element={
          <AppShell title="视频详情">
            <VideoDetailPage />
          </AppShell>
        }
      />
      <Route
        path="/overview"
        element={
          <AppShell title="数据总览">
            <OverviewPage />
          </AppShell>
        }
      />
      <Route
        path="/rally"
        element={
          <AppShell title="击球与相持">
            <RallyPage />
          </AppShell>
        }
      />
      <Route
        path="/serve"
        element={
          <AppShell title="发球分析">
            <ServePage />
          </AppShell>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
