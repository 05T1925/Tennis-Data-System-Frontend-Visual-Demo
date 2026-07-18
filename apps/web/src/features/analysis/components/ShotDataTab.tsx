import type { PointRecord, RallyRecord, ShotRecord } from '@tennis/shared-types';
import { Alert, Button, Card, Descriptions, Empty, Spin, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';
import {
  formatConfidence,
  formatCoordinate,
  formatMilliseconds,
  formatOptionalNumber,
  sortPoints,
  sortRallies,
  sortShots,
} from '../presentation';
import { AnalysisStateNotice } from './AnalysisStateNotice';

const pagination = { defaultPageSize: 20, pageSizeOptions: [20, 50, 100], showSizeChanger: true };

function idCell(value: string) {
  return (
    <Tooltip title={value}>
      <span className="analysis-id-cell">{value}</span>
    </Tooltip>
  );
}

const shotColumns: ColumnsType<ShotRecord> = [
  { title: '#', dataIndex: 'shotIndex', width: 64 },
  { title: 'Shot ID', dataIndex: 'id', width: 190, render: idCell },
  {
    title: '球员',
    dataIndex: 'playerId',
    width: 150,
    render: (value?: string) => (value ? idCell(value) : '未提供'),
  },
  { title: '开始', dataIndex: 'startedAtMs', width: 100, render: formatMilliseconds },
  { title: '结束', dataIndex: 'endedAtMs', width: 100, render: formatMilliseconds },
  {
    title: '球速',
    dataIndex: 'speedKmh',
    width: 110,
    render: (value?: number) => formatOptionalNumber(value, { suffix: ' km/h', digits: 1 }),
  },
  {
    title: '击球类型',
    dataIndex: 'shotType',
    width: 110,
    render: (value?: string) => value ?? '未提供',
  },
  {
    title: '战术',
    dataIndex: 'tacticalType',
    width: 100,
    render: (value?: string) => value ?? '未提供',
  },
  { title: '置信度', dataIndex: 'confidence', width: 100, render: formatConfidence },
];
const rallyColumns: ColumnsType<RallyRecord> = [
  { title: '#', dataIndex: 'rallyIndex', width: 64 },
  { title: 'Rally ID', dataIndex: 'id', width: 190, render: idCell },
  { title: '开始', dataIndex: 'startedAtMs', width: 100, render: formatMilliseconds },
  { title: '结束', dataIndex: 'endedAtMs', width: 100, render: formatMilliseconds },
  { title: '拍数', dataIndex: 'shotCount', width: 80 },
  {
    title: '胜者',
    dataIndex: 'winnerPlayerId',
    width: 150,
    render: (value?: string) => (value ? idCell(value) : '未提供'),
  },
  { title: '结果', dataIndex: 'result', width: 120, render: (value?: string) => value ?? '未提供' },
  { title: '置信度', dataIndex: 'confidence', width: 100, render: formatConfidence },
];
const pointColumns: ColumnsType<PointRecord> = [
  { title: '#', dataIndex: 'pointIndex', width: 64 },
  { title: 'Point ID', dataIndex: 'id', width: 190, render: idCell },
  { title: '开始', dataIndex: 'startedAtMs', width: 100, render: formatMilliseconds },
  { title: '结束', dataIndex: 'endedAtMs', width: 100, render: formatMilliseconds },
  {
    title: '胜者',
    dataIndex: 'winnerPlayerId',
    width: 150,
    render: (value?: string) => (value ? idCell(value) : '未提供'),
  },
  {
    title: '比分/结果',
    dataIndex: 'scoringResult',
    width: 120,
    render: (value?: string) => value ?? '未提供',
  },
  { title: '置信度', dataIndex: 'confidence', width: 100, render: formatConfidence },
];

export function ShotDataTab({ analysis }: { analysis: WebAnalysisDetailState }) {
  if (!analysis.resultEnabled || !analysis.canDisplayResult) {
    if (analysis.resultEnabled && analysis.resultQuery.isPending) {
      return <Spin description="正在加载每一拍数据" />;
    }
    if (analysis.resultEnabled && analysis.resultQuery.isError) {
      return (
        <Alert
          type="error"
          showIcon
          title="每一拍数据加载失败"
          action={<Button onClick={() => void analysis.resultQuery.refetch()}>重新加载</Button>}
        />
      );
    }
    return (
      <AnalysisStateNotice
        state={analysis}
        dataLabel="每一拍数据"
        onReload={() => void analysis.resultQuery.refetch()}
      />
    );
  }
  const result = analysis.resultQuery.data;
  if (!result) return null;
  const shots = sortShots(result.shots);
  const rallies = sortRallies(result.rallies);
  const points = sortPoints(result.points ?? []);
  return (
    <Card title="每一拍 Demo 数据" extra={<Tag>结构化结果</Tag>}>
      <Tabs
        items={[
          {
            key: 'shots',
            label: `Shots (${shots.length})`,
            children:
              shots.length === 0 ? (
                <Empty description="没有 Shot 数据" />
              ) : (
                <Table
                  rowKey="id"
                  columns={shotColumns}
                  dataSource={shots}
                  pagination={pagination}
                  scroll={{ x: 1120 }}
                  expandable={{
                    expandedRowRender: (shot) => (
                      <Descriptions size="small" bordered column={{ xs: 1, md: 3 }}>
                        <Descriptions.Item label="起点">
                          x {formatCoordinate(shot.startPoint.x)} / y{' '}
                          {formatCoordinate(shot.startPoint.y)}
                        </Descriptions.Item>
                        <Descriptions.Item label="终点">
                          x {formatCoordinate(shot.endPoint.x)} / y{' '}
                          {formatCoordinate(shot.endPoint.y)}
                        </Descriptions.Item>
                        <Descriptions.Item label="落点">
                          {shot.bouncePoint
                            ? `x ${formatCoordinate(shot.bouncePoint.x)} / y ${formatCoordinate(shot.bouncePoint.y)}`
                            : '未提供'}
                        </Descriptions.Item>
                      </Descriptions>
                    ),
                  }}
                />
              ),
          },
          {
            key: 'rallies',
            label: `Rallies (${rallies.length})`,
            children:
              rallies.length === 0 ? (
                <Empty description="没有 Rally 数据" />
              ) : (
                <Table
                  rowKey="id"
                  columns={rallyColumns}
                  dataSource={rallies}
                  pagination={pagination}
                  scroll={{ x: 900 }}
                />
              ),
          },
          {
            key: 'points',
            label: `Points (${points.length})`,
            children:
              points.length === 0 ? (
                <Empty description="Point 数据未提供" />
              ) : (
                <Table
                  rowKey="id"
                  columns={pointColumns}
                  dataSource={points}
                  pagination={pagination}
                  scroll={{ x: 820 }}
                />
              ),
          },
        ]}
      />
    </Card>
  );
}
