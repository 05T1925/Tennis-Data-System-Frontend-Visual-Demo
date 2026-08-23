import { Card, Statistic, Typography } from 'antd';

import { formatAverageAnalysisDuration } from '../presentation';
import type { WebOverviewStatistics } from '../types';

export function OverviewMetricCards({ metrics }: Pick<WebOverviewStatistics, 'metrics'>) {
  const items = [
    { title: '总视频数', value: metrics.totalVideos },
    { title: '今日新增视频', value: metrics.todayCreatedVideos },
    { title: '等待分析', value: metrics.waitingForAnalysis },
    { title: '分析中', value: metrics.processing },
    { title: '成功', value: metrics.succeeded },
    { title: '分析失败', value: metrics.failed },
  ];
  return (
    <section aria-label="总览指标" className="overview-metric-grid">
      {items.map((item) => (
        <Card key={item.title} size="small" className="overview-metric-card">
          <Statistic title={item.title} value={item.value} suffix="个" />
        </Card>
      ))}
      <Card size="small" className="overview-metric-card">
        <Statistic
          title="平均分析耗时"
          value={formatAverageAnalysisDuration(metrics.averageAnalysisDurationSeconds)}
        />
        <Typography.Text type="secondary">
          有效样本 {metrics.averageAnalysisDurationSampleCount} 个
        </Typography.Text>
      </Card>
    </section>
  );
}
