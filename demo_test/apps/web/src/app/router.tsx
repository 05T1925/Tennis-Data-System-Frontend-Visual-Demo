import { createBrowserRouter } from 'react-router-dom';

import { ProtectedRoute, PublicOnlyRoute, RootRedirect } from '../features/auth';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AnalysisTasksPage } from '../pages/AnalysisTasksPage';
import { CvDataPage } from '../pages/CvDataPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OverviewPage } from '../pages/OverviewPage';
import { StatisticsPage } from '../pages/StatisticsPage';
import { SystemPage } from '../pages/SystemPage';
import { VideoDetailPage } from '../pages/VideoDetailPage';
import { VideosPage } from '../pages/VideosPage';

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: <PublicOnlyRoute />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/overview', element: <OverviewPage /> },
          { path: '/videos', element: <VideosPage /> },
          { path: '/videos/:videoId', element: <VideoDetailPage /> },
          { path: '/analysis-tasks', element: <AnalysisTasksPage /> },
          { path: '/cv-data', element: <CvDataPage /> },
          { path: '/statistics', element: <StatisticsPage /> },
          { path: '/system', element: <SystemPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
