import { EyeOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Progress, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import {
  formatOverviewDateTime,
  formatSafeProgress,
  getFailureTypeLabel,
  getOverviewAnalysisLabel,
  getOverviewStageLabel,
  getOverviewUploadLabel,
} from '../presentation';
import type {
  WebActiveTaskItem,
  WebOverviewStatistics,
  WebRecentFailureItem,
  WebRecentUploadItem,
} from '../types';

function viewButton(videoId: string, onView: (videoId: string) => void) {
  return (
    <Tooltip title="查看详情">
      <Button
        type="text"
        icon={<EyeOutlined />}
        aria-label={`查看 ${videoId}`}
        onClick={() => onView(videoId)}
      />
    </Tooltip>
  );
}

export function OverviewRecentLists({
  data,
  onView,
}: {
  data: WebOverviewStatistics;
  onView(videoId: string): void;
}) {
  const uploadColumns: ColumnsType<WebRecentUploadItem> = [
    { title: '视频', dataIndex: 'title', ellipsis: true, width: 180 },
    { title: '用户', dataIndex: 'userId', ellipsis: true, width: 120 },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, render: formatOverviewDateTime },
    { title: '上传', dataIndex: 'uploadStatus', width: 100, render: getOverviewUploadLabel },
    { title: '分析', dataIndex: 'analysisStatus', width: 110, render: getOverviewAnalysisLabel },
    { title: '', key: 'action', width: 48, render: (_, item) => viewButton(item.videoId, onView) },
  ];
  const failureColumns: ColumnsType<WebRecentFailureItem> = [
    { title: '视频', dataIndex: 'title', ellipsis: true, width: 170 },
    {
      title: '类型',
      dataIndex: 'failureType',
      width: 90,
      render: (value) => <Tag color="red">{getFailureTypeLabel(value)}</Tag>,
    },
    {
      title: '安全原因',
      dataIndex: 'safeReason',
      ellipsis: { showTitle: false },
      width: 210,
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
    },
    { title: '失败时间', dataIndex: 'failedAt', width: 170, render: formatOverviewDateTime },
    { title: '重试', dataIndex: 'retryCount', width: 64 },
    { title: '', key: 'action', width: 48, render: (_, item) => viewButton(item.videoId, onView) },
  ];
  const activeColumns: ColumnsType<WebActiveTaskItem> = [
    { title: '视频', dataIndex: 'title', ellipsis: true, width: 170 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value) => (
        <Tag color={value === 'processing' ? 'blue' : 'orange'}>
          {getOverviewAnalysisLabel(value)}
        </Tag>
      ),
    },
    { title: '阶段', dataIndex: 'stage', width: 120, render: getOverviewStageLabel },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 130,
      render: (value: number) =>
        Number.isFinite(value) && value >= 0 ? (
          <Progress percent={Math.min(100, Math.round(value))} size="small" />
        ) : (
          formatSafeProgress(value)
        ),
    },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170, render: formatOverviewDateTime },
    { title: '', key: 'action', width: 48, render: (_, item) => viewButton(item.videoId, onView) },
  ];
  return (
    <section aria-label="最近数据" className="overview-list-grid">
      <Card title="最近新增" className="overview-list-card">
        {data.recentUploads.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无视频" />
        ) : (
          <Table
            rowKey="videoId"
            size="small"
            columns={uploadColumns}
            dataSource={data.recentUploads}
            pagination={false}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
      <Card title="最近失败" className="overview-list-card">
        {data.recentFailures.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无失败记录" />
        ) : (
          <Table
            rowKey={(item) => `${item.failureType}-${item.videoId}`}
            size="small"
            columns={failureColumns}
            dataSource={data.recentFailures}
            pagination={false}
            scroll={{ x: 820 }}
          />
        )}
      </Card>
      <Card title="当前处理中" className="overview-list-card">
        {data.activeTasks.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前没有 queued 或 processing Task"
          />
        ) : (
          <Table
            rowKey="taskId"
            size="small"
            columns={activeColumns}
            dataSource={data.activeTasks}
            pagination={false}
            scroll={{ x: 760 }}
          />
        )}
      </Card>
    </section>
  );
}
