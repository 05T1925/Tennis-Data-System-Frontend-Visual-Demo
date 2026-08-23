import { Alert, Card, Space, Typography } from 'antd';

import { PageIntro } from '../components/PageIntro';

export function CvDataPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro title="CV 数据" description="查看视觉算法原始输出与结构化分析结果的调试入口。" />
      <Alert
        type="info"
        showIcon
        title="CV Output 与 AnalysisResult 是不同的数据层。"
        description="CV Output 表示原始或近原始视觉输出；AnalysisResult 是供产品消费的结构化结果。"
      />
      <Card>
        <Typography.Title level={4}>数据查看尚未接入</Typography.Title>
        <Typography.Paragraph type="secondary">
          本阶段不生成示例 JSON，也不安装 JSON Viewer。原始输出和结构化记录将在后续业务阶段接入。
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
