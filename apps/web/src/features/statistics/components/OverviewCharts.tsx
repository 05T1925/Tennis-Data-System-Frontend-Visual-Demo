import { Card, Empty, Space, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  durationBucketPresentation,
  formatAnalysisSuccessRate,
  formatVideoTooltip,
  overviewStatusPresentation,
} from '../presentation';
import type { WebOverviewStatistics } from '../types';

type TooltipValue = number | string | readonly (number | string)[] | undefined;

function videoFormatter(value: TooltipValue): [string, string] {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  return [formatVideoTooltip(numeric), '数量'];
}

export default function OverviewCharts({ data }: { data: WebOverviewStatistics }) {
  const trendTotal = data.uploadTrend.reduce((sum, item) => sum + item.count, 0);
  const statusData = data.statusDistribution
    .filter(({ count }) => count > 0)
    .map((item) => ({
      ...item,
      name: overviewStatusPresentation[item.bucket].label,
      color: overviewStatusPresentation[item.bucket].color,
    }));
  const durationData = data.durationDistribution
    .filter(({ count }) => count > 0)
    .map((item) => ({
      ...item,
      name: durationBucketPresentation[item.bucket].label,
      color: durationBucketPresentation[item.bucket].color,
    }));
  const successData = [
    { name: '成功', value: data.successRate.succeeded, color: '#28775c' },
    { name: '分析失败', value: data.successRate.failed, color: '#b33c35' },
  ].filter(({ value }) => value > 0);

  return (
    <section aria-label="总览图表" className="overview-chart-grid">
      <Card
        className="overview-chart-card overview-chart-wide"
        title="最近 7 天新增视频"
        extra="单位：个视频"
      >
        {trendTotal === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="最近 7 天暂无新增视频" />
        ) : (
          <div className="overview-chart-canvas" data-chart="upload-trend">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.uploadTrend} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} width={36} />
                <Tooltip formatter={videoFormatter} labelFormatter={(label) => `日期 ${label}`} />
                <Bar dataKey="count" name="新增视频" fill="#28775c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="overview-chart-card" title="视频业务状态分布" extra="单位：个视频">
        {statusData.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无视频状态数据" />
        ) : (
          <div className="overview-chart-canvas" data-chart="status-distribution">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart accessibilityLayer>
                <Pie data={statusData} dataKey="count" nameKey="name" outerRadius={92}>
                  {statusData.map((item) => (
                    <Cell key={item.bucket} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={videoFormatter} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <Typography.Text type="secondary">
          共 {data.metrics.totalVideos} 个视频，每个视频只进入一个状态。
        </Typography.Text>
      </Card>

      <Card className="overview-chart-card" title="分析成功率" extra="单位：%">
        {data.successRate.rate === null ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无已完成或失败的分析样本" />
        ) : (
          <Space
            orientation="vertical"
            className="page-stack overview-success-chart"
            align="center"
          >
            <div className="overview-chart-canvas" data-chart="success-rate">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={successData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={88}
                  >
                    {successData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={videoFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Typography.Title level={3} className="overview-rate-value">
              {formatAnalysisSuccessRate(data.successRate.rate)}
            </Typography.Title>
            <Typography.Text type="secondary">成功 /（成功 + 分析失败）</Typography.Text>
          </Space>
        )}
      </Card>

      <Card className="overview-chart-card" title="视频时长分布" extra="单位：个视频">
        {durationData.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无视频时长数据" />
        ) : (
          <div className="overview-chart-canvas" data-chart="duration-distribution">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData} accessibilityLayer margin={{ left: 4, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-18} textAnchor="end" height={64} />
                <YAxis allowDecimals={false} width={36} />
                <Tooltip formatter={videoFormatter} />
                <Bar dataKey="count" name="视频数量" radius={[3, 3, 0, 0]}>
                  {durationData.map((item) => (
                    <Cell key={item.bucket} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </section>
  );
}
