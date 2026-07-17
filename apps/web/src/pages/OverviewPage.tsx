import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';

const modules = [
  { title: '视频管理', description: '上传视频与详情入口', path: '/videos' },
  { title: '分析任务', description: '任务状态与失败排查入口', path: '/analysis-tasks' },
  { title: 'CV 数据', description: '原始输出与结构化结果入口', path: '/cv-data' },
  { title: '统计看板', description: '内部统计与趋势入口', path: '/statistics' },
];

export function OverviewPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro
        title="系统总览"
        description="面向内部团队的网球视频分析数据看板。当前已完成 Mock 身份、受保护路由与后台基础布局。"
        extra={<Tag color="green">阶段 11 基础框架</Tag>}
      />
      <Card>
        <Typography.Title level={4}>当前范围</Typography.Title>
        <Typography.Paragraph>
          页面和导航入口已经建立，视频、任务、CV 输出和统计业务数据尚未接入。后续模块会通过 Web
          Service 与 TanStack Query 增量实现。
        </Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        {modules.map((module) => (
          <Col xs={24} md={12} xl={6} key={module.path}>
            <Card className="module-card" title={module.title}>
              <Typography.Paragraph type="secondary">{module.description}</Typography.Paragraph>
              <Link to={module.path}>
                <Button type="link" icon={<ArrowRightOutlined />}>
                  打开模块
                </Button>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
