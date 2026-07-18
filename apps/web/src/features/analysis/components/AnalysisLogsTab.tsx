import { Alert, Card, Collapse, Empty, Space, Tag, Typography } from 'antd';

import { formatDateTime } from '../../videos';
import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';
import { formatLogTime, sortAnalysisLogs } from '../presentation';
import { AnalysisStateNotice } from './AnalysisStateNotice';

const levelPresentation = {
  info: { label: '信息', color: 'blue' },
  warning: { label: '警告', color: 'orange' },
  error: { label: '错误', color: 'red' },
} as const;

export function AnalysisLogsTab({ analysis }: { analysis: WebAnalysisDetailState }) {
  if (!analysis.logsEnabled) {
    return (
      <AnalysisStateNotice
        state={analysis}
        dataLabel="任务日志"
        onReload={() => void analysis.logsQuery.refetch()}
      />
    );
  }
  if (analysis.logsQuery.isPending)
    return <Typography.Text type="secondary">正在加载任务日志…</Typography.Text>;
  if (analysis.logsQuery.isError) return <Alert type="error" showIcon title="任务日志加载失败" />;
  const logs = sortAnalysisLogs(analysis.logsQuery.data ?? []);
  const task = analysis.taskQuery.data;
  return (
    <Card title="分析任务日志" extra={task ? <Tag>{task.id}</Tag> : undefined}>
      {logs.length === 0 ? (
        <Empty description="当前任务没有日志" />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {logs.map((log) => {
            const level = levelPresentation[log.level];
            const safeTimestamp = formatLogTime(log.timestamp);
            const time =
              safeTimestamp === '时间待确认' ? safeTimestamp : formatDateTime(safeTimestamp);
            return (
              <li key={log.id} style={{ borderBottom: '1px solid #f0f0f0', padding: '12px 0' }}>
                <Space orientation="vertical" size="small" className="page-stack">
                  <Space wrap>
                    <Tag color={level.color}>{level.label}</Tag>
                    <Tag>{log.stage ?? '阶段待确认'}</Tag>
                    <Typography.Text type="secondary">{time}</Typography.Text>
                  </Space>
                  {log.audience === 'user' ? (
                    <Typography.Text>{log.userMessage}</Typography.Text>
                  ) : (
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: log.id,
                          label: (
                            <Space>
                              <Tag>开发信息</Tag>查看详情
                            </Space>
                          ),
                          children: <Typography.Text code>{log.developerMessage}</Typography.Text>,
                        },
                      ]}
                    />
                  )}
                </Space>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
