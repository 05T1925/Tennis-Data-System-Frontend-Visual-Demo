import { createBrowserRouter } from 'react-router-dom';

import { DashboardLayout } from '../layouts/DashboardLayout';
import { AnalysisTasksPage } from '../pages/AnalysisTasksPage';
import { LoginPage } from '../pages/LoginPage';
import { OverviewPage } from '../pages/OverviewPage';
import { StatisticsPage } from '../pages/StatisticsPage';
import { SystemPage } from '../pages/SystemPage';
import { VideoDetailPage } from '../pages/VideoDetailPage';
import { VideosPage } from '../pages/VideosPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'videos', element: <VideosPage /> },
      { path: 'videos/:videoId', element: <VideoDetailPage /> },
      { path: 'analysis-tasks', element: <AnalysisTasksPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'system', element: <SystemPage /> },
    ],
  },
]);
