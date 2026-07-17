import { CopyOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Popconfirm, Progress, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { WebVideoTableItem } from '../presentation';
import type { WebVideoPageSize } from '../types';

type VideoTableProps = {
  items: WebVideoTableItem[];
  total: number;
  page: number;
  pageSize: WebVideoPageSize;
  loading: boolean;
  deletingVideoIds: ReadonlySet<string>;
  onPageChange(page: number, pageSize: number): void;
  onView(videoId: string): void;
  onCopy(videoId: string): void;
  onDelete(videoId: string): Promise<void>;
};

export function VideoTable({
  items,
  total,
  page,
  pageSize,
  loading,
  deletingVideoIds,
  onPageChange,
  onView,
  onCopy,
  onDelete,
}: VideoTableProps) {
  const columns: ColumnsType<WebVideoTableItem> = [
    {
      title: '视频 ID',
      dataIndex: 'videoId',
      width: 190,
      render: (value: string) => (
        <Tooltip title={value}>
          <span className="video-table-ellipsis">{value}</span>
        </Tooltip>
      ),
    },
    {
      title: '用户',
      dataIndex: 'userId',
      width: 130,
      ellipsis: { showTitle: false },
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
    },
    {
      title: '名称',
      dataIndex: 'title',
      width: 210,
      ellipsis: { showTitle: false },
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
    },
    { title: '上传记录时间', dataIndex: 'createdAt', width: 170 },
    { title: '文件大小', dataIndex: 'fileSize', width: 100 },
    { title: '时长', dataIndex: 'duration', width: 100 },
    {
      title: '上传状态',
      dataIndex: 'uploadStatus',
      width: 110,
      render: (status: WebVideoTableItem['uploadStatus']) => (
        <Tag color={status.color}>{status.label}</Tag>
      ),
    },
    {
      title: '分析状态',
      dataIndex: 'analysisStatus',
      width: 110,
      render: (status: WebVideoTableItem['analysisStatus']) => (
        <Tag color={status.color}>{status.label}</Tag>
      ),
    },
    {
      title: '分析进度',
      dataIndex: 'analysisProgress',
      width: 150,
      render: (progress: WebVideoTableItem['analysisProgress']) =>
        progress.value === null ? (
          progress.label
        ) : (
          <Progress
            percent={progress.value}
            size="small"
            aria-label={`分析进度 ${progress.label}`}
          />
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, item) => {
        const deleting = deletingVideoIds.has(item.videoId);
        return (
          <Flex gap={2}>
            <Tooltip title="查看详情">
              <Button
                type="text"
                icon={<EyeOutlined />}
                aria-label={`查看 ${item.videoId}`}
                onClick={() => onView(item.videoId)}
              />
            </Tooltip>
            <Tooltip title="复制视频 ID">
              <Button
                type="text"
                icon={<CopyOutlined />}
                aria-label={`复制 ${item.videoId}`}
                onClick={() => onCopy(item.videoId)}
              />
            </Tooltip>
            <Popconfirm
              title="删除当前 Web Demo 视频？"
              description="将同时删除关联分析任务，不影响 Mobile，也不会调用真实 Backend；当前 UI 内不可撤销。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deleting }}
              disabled={deleting}
              onConfirm={() => onDelete(item.videoId)}
            >
              <Tooltip title="删除 Demo 视频">
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  loading={deleting}
                  aria-label={`删除 ${item.videoId}`}
                />
              </Tooltip>
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={items}
      loading={loading}
      scroll={{ x: 1520 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        showTotal: (value) => `共 ${value} 条`,
        onChange: onPageChange,
      }}
    />
  );
}
