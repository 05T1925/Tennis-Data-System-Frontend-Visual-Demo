import {
  BarChartOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  SettingOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

export type NavigationItem = {
  key: string;
  path: string;
  title: string;
  breadcrumb: string;
  icon: ReactNode;
};

export type RouteMetadata = {
  title: string;
  breadcrumbs: string[];
  selectedKey: string;
};

export const navigationItems: NavigationItem[] = [
  {
    key: '/overview',
    path: '/overview',
    title: '总览',
    breadcrumb: '总览',
    icon: <DashboardOutlined />,
  },
  {
    key: '/videos',
    path: '/videos',
    title: '视频管理',
    breadcrumb: '视频管理',
    icon: <VideoCameraOutlined />,
  },
  {
    key: '/analysis-tasks',
    path: '/analysis-tasks',
    title: '分析任务',
    breadcrumb: '分析任务',
    icon: <FileSearchOutlined />,
  },
  {
    key: '/cv-data',
    path: '/cv-data',
    title: 'CV 数据',
    breadcrumb: 'CV 数据',
    icon: <DatabaseOutlined />,
  },
  {
    key: '/statistics',
    path: '/statistics',
    title: '统计看板',
    breadcrumb: '统计看板',
    icon: <BarChartOutlined />,
  },
  {
    key: '/system',
    path: '/system',
    title: '系统信息',
    breadcrumb: '系统信息',
    icon: <SettingOutlined />,
  },
];

export function getRouteMetadata(pathname: string): RouteMetadata {
  if (pathname.startsWith('/videos/')) {
    return {
      title: '视频详情',
      breadcrumbs: ['视频管理', '视频详情'],
      selectedKey: '/videos',
    };
  }

  const item = navigationItems.find((entry) => entry.path === pathname);
  if (item !== undefined) {
    return {
      title: item.title,
      breadcrumbs: [item.breadcrumb],
      selectedKey: item.key,
    };
  }

  return { title: '内部数据看板', breadcrumbs: [], selectedKey: '' };
}
