import type { AnalysisTask } from '@tennis/shared-types';
import { Alert, Button, Result, Spin } from 'antd';

import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';

export function AnalysisStateNotice({
  state,
  dataLabel,
  onReload,
}: {
  state: WebAnalysisDetailState;
  dataLabel: string;
  onReload(): void;
}) {
  if (!state.taskEnabled) {
    return <Alert type="info" showIcon title="视频上传完成后才能查看分析数据。" />;
  }
  if (state.taskQuery.isPending) {
    return <Spin description="正在读取分析任务" />;
  }
  if (state.taskQuery.isError) {
    return (
      <Result
        status="error"
        title="分析任务加载失败"
        extra={<Button onClick={() => void state.taskQuery.refetch()}>重新加载</Button>}
      />
    );
  }
  return taskNotice(state.taskQuery.data, dataLabel, onReload);
}

function taskNotice(
  task: AnalysisTask | null | undefined,
  dataLabel: string,
  onReload: () => void,
) {
  if (!task) return <Alert type="info" showIcon title="当前视频尚未创建分析任务。" />;
  if (task.status === 'queued')
    return <Alert type="info" showIcon title="分析任务正在队列中等待。" />;
  if (task.status === 'processing')
    return <Alert type="info" showIcon title="分析仍在进行，请稍后查看。" />;
  if (task.status === 'failed')
    return <Alert type="error" showIcon title="分析失败，当前没有可用数据。" />;
  if (task.status === 'canceled') return <Alert type="warning" showIcon title="分析任务已取消。" />;
  if (task.status !== 'succeeded')
    return <Alert type="warning" showIcon title="分析状态待确认。" />;
  return (
    <Alert
      type="warning"
      showIcon
      title={`分析已完成，但${dataLabel}暂时不可用。`}
      action={<Button onClick={onReload}>重新加载</Button>}
    />
  );
}
