import { Navigate, Route, Routes } from 'react-router-dom';
import { LabShell } from '../components/LabShell';
import { OverviewPage } from '../pages/OverviewPage';
import { RallyPage } from '../pages/RallyPage';
import { ServePage } from '../pages/ServePage';
import { VideoPage } from '../pages/VideoPage';

export function App() {
  return (
    <LabShell>
      <Routes>
        <Route path="/" element={<Navigate replace to="/video/demo-upload-001" />} />
        <Route path="/video/demo-upload-001" element={<VideoPage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/rally" element={<RallyPage />} />
        <Route path="/serve" element={<ServePage />} />
        <Route
          path="*"
          element={
            <section className="lab-page">
              <h1>页面未找到</h1>
              <p>请求的实验模块不存在。</p>
            </section>
          }
        />
      </Routes>
    </LabShell>
  );
}
