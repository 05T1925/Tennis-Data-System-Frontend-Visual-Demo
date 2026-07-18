import { ReloadOutlined } from '@ant-design/icons';
import { Button, Flex, Result, Space, Spin, Tag, Typography } from 'antd';
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';
import { webApiMode } from '../config/env';
import { useWebAuth } from '../features/auth';
import {
  OverviewMetricCards,
  OverviewRecentLists,
  useWebOverviewStatistics,
} from '../features/statistics';
import { formatOverviewDateTime } from '../features/statistics/presentation';
import { getSafeAppErrorMessage } from '../features/videos';

const OverviewCharts = lazy(() => import('../features/statistics/components/OverviewCharts'));
const isMockMode = webApiMode.status === 'ready' && webApiMode.mode === 'mock';
const WebDemoControlPanel =
  import.meta.env.DEV && isMockMode
    ? lazy(() => import('../features/demo-control/components/WebDemoControlPanel'))
    : null;

export function OverviewPage() {
  const { status, user } = useWebAuth();
  const actorUserId = user?.id ?? '';
  const navigate = useNavigate();
  const overviewQuery = useWebOverviewStatistics({
    actorUserId,
    enabled: status === 'authenticated',
  });

  if (overviewQuery.isPending) {
    return (
      <div className="overview-page-loading" aria-busy="true">
        <Spin
          size="large"
          description={isMockMode ? '正在加载 Web Demo 总览' : '正在加载 API 总览'}
        />
      </div>
    );
  }

  if (overviewQuery.isError || overviewQuery.data === undefined) {
    return (
      <Result
        status="error"
        title="系统总览加载失败"
        subTitle={getSafeAppErrorMessage(overviewQuery.error, '总览统计暂时加载失败，请重试。')}
        extra={<Button onClick={() => void overviewQuery.refetch()}>重新加载</Button>}
      />
    );
  }

  const data = overviewQuery.data;
  return (
    <Space orientation="vertical" size="large" className="page-stack overview-page">
      <PageIntro
        title="系统总览"
        description={
          isMockMode
            ? '统计来自当前浏览器的 Web Demo Snapshot，不代表真实后台数据。'
            : 'Real API Draft 模式；Overview Statistics 正式契约尚未配置。'
        }
        extra={
          <Flex gap={8} wrap align="center" justify="flex-end">
            <Tag color={isMockMode ? 'green' : 'blue'}>
              {isMockMode ? '本地 Web Demo' : 'Real API Draft'}
            </Tag>
            <Tag>统计日期 {data.referenceDate}</Tag>
            <Button
              icon={<ReloadOutlined />}
              loading={overviewQuery.isFetching}
              onClick={() => void overviewQuery.refetch()}
            >
              刷新总览
            </Button>
          </Flex>
        }
      />
      <Flex gap={8} wrap>
        <Typography.Text type="secondary">
          生成时间：{formatOverviewDateTime(data.generatedAt)}
        </Typography.Text>
        {data.runtimeActiveCount > 0 && (
          <Tag color="blue">{data.runtimeActiveCount} 个 Runtime 正在受控刷新</Tag>
        )}
      </Flex>
      <OverviewMetricCards metrics={data.metrics} />
      <Suspense
        fallback={
          <div className="overview-chart-loading" aria-busy="true">
            <Spin description="正在加载图表" />
          </div>
        }
      >
        <OverviewCharts data={data} />
      </Suspense>
      <OverviewRecentLists
        data={data}
        onView={(videoId) => navigate(`/videos/${encodeURIComponent(videoId)}`)}
      />
      {WebDemoControlPanel !== null && (
        <Suspense
          fallback={
            <div className="overview-control-loading" aria-busy="true">
              <Spin description="正在加载开发控制" />
            </div>
          }
        >
          <WebDemoControlPanel
            actorUserId={actorUserId}
            controllableTasks={data.controllableTasks}
          />
        </Suspense>
      )}
    </Space>
  );
}
