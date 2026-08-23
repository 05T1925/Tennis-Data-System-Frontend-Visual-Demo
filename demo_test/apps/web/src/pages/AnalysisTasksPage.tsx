import { Space } from 'antd';

import { ModulePlaceholder } from '../components/ModulePlaceholder';
import { PageIntro } from '../components/PageIntro';

export function AnalysisTasksPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro title="分析任务" description="用于排查视频分析生命周期和处理异常。" />
      <ModulePlaceholder
        title="分析任务 Service 尚未接入"
        currentState="当前阶段不创建任务列表、不轮询，也不提供重试操作。"
        nextCapabilities={['Task 状态与分析阶段', '任务日志与安全失败原因', '失败任务重试']}
      />
    </Space>
  );
}
