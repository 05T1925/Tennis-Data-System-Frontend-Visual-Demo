import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Avatar, Breadcrumb, Button, Flex, Layout, Menu, Tag, Typography } from 'antd';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { getRouteMetadata, navigationItems } from '../app/navigation';
import { useWebAuth } from '../features/auth';

const { Header, Sider, Content } = Layout;

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, activeOperation, authError, signOut, clearAuthError } = useWebAuth();
  const routeMetadata = getRouteMetadata(location.pathname);
  const isSigningOut = activeOperation === 'logout';

  return (
    <Layout className="dashboard-shell">
      <Sider
        className="dashboard-sider"
        width={240}
        collapsedWidth={80}
        collapsed={collapsed}
        breakpoint="xl"
        onBreakpoint={setCollapsed}
        trigger={null}
      >
        <div className="dashboard-brand" aria-label="网球视频分析系统">
          <span className="brand-mark">TV</span>
          {!collapsed && (
            <span className="brand-copy">
              <strong>网球视频分析</strong>
              <small>内部数据看板</small>
            </span>
          )}
        </div>
        <Menu
          aria-label="主导航"
          theme="dark"
          mode="inline"
          selectedKeys={routeMetadata.selectedKey ? [routeMetadata.selectedKey] : []}
          items={navigationItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.title,
            title: item.title,
          }))}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout className="dashboard-main">
        <Header className="dashboard-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
          />
          <div className="header-route">
            <Typography.Title level={4}>{routeMetadata.title}</Typography.Title>
            <Breadcrumb items={routeMetadata.breadcrumbs.map((title) => ({ title }))} />
          </div>
          <Flex className="header-actions" align="center" gap={12}>
            <Tag color="green">本地 Mock</Tag>
            <Avatar icon={<UserOutlined />} />
            <span className="header-user">
              <strong>{user?.displayName ?? 'Demo 管理员'}</strong>
              <small>管理员</small>
            </span>
            <Button
              icon={<LogoutOutlined />}
              loading={isSigningOut}
              disabled={activeOperation !== null && !isSigningOut}
              onClick={() => void signOut()}
            >
              退出
            </Button>
          </Flex>
        </Header>
        <Content className="dashboard-content">
          <div className="content-inner">
            {authError !== null && (
              <Alert
                className="layout-alert"
                type="error"
                showIcon
                closable
                title={authError.userMessage}
                onClose={clearAuthError}
              />
            )}
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
