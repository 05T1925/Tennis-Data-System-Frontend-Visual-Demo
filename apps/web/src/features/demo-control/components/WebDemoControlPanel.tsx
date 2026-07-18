import {
  CheckCircleOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Flex, Popconfirm, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import type { WebOverviewStatistics } from '../../statistics';
import { getOverviewAnalysisLabel, getOverviewStageLabel } from '../../statistics/presentation';
import { useWebDemoControls } from '../hooks/useWebDemoControls';

export default function WebDemoControlPanel({
  actorUserId,
  controllableTasks,
}: {
  actorUserId: string;
  controllableTasks: WebOverviewStatistics['controllableTasks'];
}) {
  const [selectedVideoId, setSelectedVideoId] = useState<string>();
  const visibleSelectedVideoId = controllableTasks.some(
    ({ videoId }) => videoId === selectedVideoId,
  )
    ? selectedVideoId
    : undefined;
  const controls = useWebDemoControls(actorUserId, visibleSelectedVideoId);

  return (
    <Card className="overview-demo-controls" title="开发环境 Demo 控制" extra="仅 DEV">
      <Space orientation="vertical" size="middle" className="page-stack">
        <Alert
          type="warning"
          showIcon
          title="这些操作只修改当前浏览器的 Web Demo 数据。"
          description="不会影响 Mobile、登录 Session 或真实服务。"
        />
        {controls.success && (
          <Alert
            type="success"
            showIcon
            closable
            title={controls.success}
            onClose={controls.clearNotice}
          />
        )}
        {controls.error && (
          <Alert
            type="error"
            showIcon
            closable
            title={controls.error}
            onClose={controls.clearNotice}
          />
        )}
        <Flex gap={8} wrap>
          <Popconfirm
            title="重置 Web Demo 数据？"
            description="重置将覆盖当前 Web Demo 数据，且无法撤销。仅影响当前浏览器中的 Web Demo 数据。"
            okText="确认重置"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => controls.resetDemoData()}
          >
            <Button
              danger
              icon={<ReloadOutlined />}
              loading={controls.operation === 'reset'}
              disabled={controls.busy && controls.operation !== 'reset'}
            >
              重置 Demo 数据
            </Button>
          </Popconfirm>
          <Button
            icon={<CheckCircleOutlined />}
            loading={controls.operation === 'create-success'}
            disabled={controls.busy && controls.operation !== 'create-success'}
            onClick={() => void controls.createScenario('success')}
          >
            创建分析成功场景
          </Button>
          <Button
            icon={<ExperimentOutlined />}
            loading={controls.operation === 'create-processing'}
            disabled={controls.busy && controls.operation !== 'create-processing'}
            onClick={() => void controls.createScenario('processing')}
          >
            创建分析处理中场景
          </Button>
          <Button
            danger
            icon={<ExperimentOutlined />}
            loading={controls.operation === 'create-failed'}
            disabled={controls.busy && controls.operation !== 'create-failed'}
            onClick={() => void controls.createScenario('failed')}
          >
            创建分析失败场景
          </Button>
        </Flex>
        <div className="overview-force-complete">
          <Typography.Text strong>让指定任务立即完成</Typography.Text>
          <Flex gap={8} wrap>
            <Select
              className="overview-task-select"
              value={visibleSelectedVideoId}
              placeholder="选择 queued 或 processing Task"
              showSearch
              optionFilterProp="label"
              options={controllableTasks.map((item) => ({
                value: item.videoId,
                label: `${item.title} · ${getOverviewAnalysisLabel(item.status)} · ${getOverviewStageLabel(item.stage)}`,
              }))}
              onChange={setSelectedVideoId}
              disabled={controls.busy || controllableTasks.length === 0}
            />
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={controls.operation === 'force-complete'}
              disabled={
                !visibleSelectedVideoId ||
                (controls.busy && controls.operation !== 'force-complete')
              }
              onClick={() => visibleSelectedVideoId && void controls.forceComplete()}
            >
              立即完成
            </Button>
          </Flex>
        </div>
      </Space>
    </Card>
  );
}
