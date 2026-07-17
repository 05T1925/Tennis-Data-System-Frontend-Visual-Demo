import { Card, Descriptions, Space } from 'antd';

import { PageIntro } from '../components/PageIntro';

export function SystemPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro title="系统信息" description="仅展示当前 Web 前端可以公开确认的静态事实。" />
      <Card>
        <Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
          <Descriptions.Item label="应用">Web 内部数据看板</Descriptions.Item>
          <Descriptions.Item label="运行模式">本地 Mock</Descriptions.Item>
          <Descriptions.Item label="前端">React + Vite + TypeScript</Descriptions.Item>
          <Descriptions.Item label="UI">Ant Design</Descriptions.Item>
          <Descriptions.Item label="数据查询基础">TanStack Query</Descriptions.Item>
          <Descriptions.Item label="Backend">未接入</Descriptions.Item>
          <Descriptions.Item label="Real API">未接入</Descriptions.Item>
          <Descriptions.Item label="CV">未接入</Descriptions.Item>
          <Descriptions.Item label="正式权限">未接入</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
