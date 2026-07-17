import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Space, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';

const MAX_VIDEO_ID_DISPLAY_LENGTH = 80;

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const normalizedVideoId = videoId?.trim() ?? '';
  const displayVideoId =
    normalizedVideoId.length > MAX_VIDEO_ID_DISPLAY_LENGTH
      ? `${normalizedVideoId.slice(0, MAX_VIDEO_ID_DISPLAY_LENGTH)}...`
      : normalizedVideoId;

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro
        title="视频详情"
        description="动态详情路由已经建立，真实视频信息与分析数据将在后续阶段接入。"
        extra={
          <Link to="/videos">
            <Button icon={<ArrowLeftOutlined />}>返回视频管理</Button>
          </Link>
        }
      />
      <Card>
        <Typography.Text type="secondary">视频参数</Typography.Text>
        <Typography.Title level={4} className="safe-route-value">
          {displayVideoId || '视频参数无效'}
        </Typography.Title>
        <Typography.Paragraph>
          本页面不会查询数据，也不会展示本地文件路径、URI 或虚构 Video 对象。
        </Typography.Paragraph>
      </Card>
    </Space>
  );
}
