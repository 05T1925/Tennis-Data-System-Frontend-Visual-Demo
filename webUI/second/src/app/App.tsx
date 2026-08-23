import { Navigate, Route, Routes } from 'react-router-dom';
import { EditorialShell } from '../components/EditorialShell';
import { OverviewPage } from '../pages/OverviewPage';
import { RallyPage } from '../pages/RallyPage';
import { ServePage } from '../pages/ServePage';
import { VideoPage } from '../pages/VideoPage';
const Page = ({ children }: { children: React.ReactNode }) => (
  <EditorialShell>{children}</EditorialShell>
);
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/video/demo-upload-001" replace />} />
      <Route
        path="/video/demo-upload-001"
        element={
          <Page>
            <VideoPage />
          </Page>
        }
      />
      <Route
        path="/overview"
        element={
          <Page>
            <OverviewPage />
          </Page>
        }
      />
      <Route
        path="/rally"
        element={
          <Page>
            <RallyPage />
          </Page>
        }
      />
      <Route
        path="/serve"
        element={
          <Page>
            <ServePage />
          </Page>
        }
      />
      <Route
        path="*"
        element={
          <Page>
            <div className="page">
              <h1>页面未找到</h1>
            </div>
          </Page>
        }
      />
    </Routes>
  );
}
