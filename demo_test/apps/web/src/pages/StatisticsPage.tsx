import { Space } from 'antd';

import { ModulePlaceholder } from '../components/ModulePlaceholder';
import { PageIntro } from '../components/PageIntro';

export function StatisticsPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro title="统计看板" description="面向内部团队的业务统计和处理趋势入口。" />
      <ModulePlaceholder
        title="统计数据尚未接入"
        currentState="当前页面不展示虚构指标，也未安装图表库。"
        nextCapabilities={['上传量与状态分布', '分析成功率与处理时长', '结构化结果统计与趋势']}
      />
    </Space>
  );
}
