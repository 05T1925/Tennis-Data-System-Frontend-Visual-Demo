import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Descriptions, Flex, message, Space, Spin, Tag } from 'antd';
import { useMemo } from 'react';

import { webApiMode } from '../../../config/env';
import { copyTextToClipboard, getSafeAppErrorMessage } from '../../videos';
import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';
import { downloadDemoJson, safeStringifyDemoJson } from '../jsonTransfer';
import { createCvSummary, formatConfidence, formatCoordinate } from '../presentation';
import { AnalysisStateNotice } from './AnalysisStateNotice';
import { JsonTreeViewer } from './JsonTreeViewer';

export function CvDemoOutputTab({
  analysis,
  videoId,
}: {
  analysis: WebAnalysisDetailState;
  videoId: string;
}) {
  const isMockMode = webApiMode.status === 'ready' && webApiMode.mode === 'mock';
  const [messageApi, contextHolder] = message.useMessage();
  const cv = analysis.canDisplayCv ? analysis.cvQuery.data : null;
  const serialized = useMemo(() => {
    if (!cv) return null;
    try {
      return safeStringifyDemoJson(cv);
    } catch {
      return null;
    }
  }, [cv]);

  if (!analysis.cvEnabled || !analysis.canDisplayCv) {
    if (analysis.cvEnabled && analysis.cvQuery.isPending) {
      return <Spin description={isMockMode ? '正在加载 CV Demo 数据' : '正在加载 CV API 数据'} />;
    }
    if (analysis.cvEnabled && analysis.cvQuery.isError) {
      return (
        <Alert
          type="error"
          showIcon
          title={isMockMode ? 'CV Demo 数据加载失败' : 'CV API 数据加载失败'}
          action={<Button onClick={() => void analysis.cvQuery.refetch()}>重新加载</Button>}
        />
      );
    }
    return (
      <AnalysisStateNotice
        state={analysis}
        dataLabel={isMockMode ? 'CV Demo 数据' : 'CV API 数据'}
        onReload={() => void analysis.cvQuery.refetch()}
      />
    );
  }
  if (!cv) return null;
  const payload = cv.output.payload;
  const summary = createCvSummary(cv);

  async function copyJson(): Promise<void> {
    if (!serialized) {
      messageApi.error('Demo JSON 暂时无法生成。');
      return;
    }
    try {
      await copyTextToClipboard(serialized);
      messageApi.success('CV Demo JSON 已复制。');
    } catch {
      messageApi.error('无法复制 CV Demo JSON，请检查浏览器权限后重试。');
    }
  }

  function downloadJson(): void {
    if (!serialized) {
      messageApi.error('Demo JSON 暂时无法生成。');
      return;
    }
    try {
      downloadDemoJson(serialized, videoId);
      messageApi.success('CV Demo JSON 下载已开始。');
    } catch (error) {
      messageApi.error(getSafeAppErrorMessage(error, '无法下载 CV Demo JSON。'));
    }
  }

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      {contextHolder}
      <Alert
        type="warning"
        showIcon
        title="Web-private Demo fixture"
        description="非正式 CV contract，仅用于前端展示和交互验证。坐标为 0–1 Demo 标准化坐标，不是像素或正式球场坐标；confidence 不能解释为真实算法精度。"
      />
      <Card title="CV Demo 摘要" extra={<Tag>开发信息</Tag>}>
        <Descriptions bordered column={{ xs: 1, md: 2, xl: 3 }}>
          <Descriptions.Item label="demoSchema">{cv.demoSchema}</Descriptions.Item>
          <Descriptions.Item label="Frame 数">{summary.frameCount}</Descriptions.Item>
          <Descriptions.Item label="球场关键点">
            {summary.courtKeypointCount ?? '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="球员轨迹">
            {summary.playerTrackCount ?? '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="球员轨迹采样">
            {summary.playerSampleCount ?? '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="网球轨迹点">
            {summary.ballTrackCount ?? '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="帧级置信度">
            {summary.confidenceFrameCount ?? '未提供'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="球场关键点">
        {payload.courtKeypoints?.length ? (
          <Descriptions bordered column={{ xs: 1, md: 2 }}>
            {payload.courtKeypoints.map((point) => (
              <Descriptions.Item key={point.id} label={point.label}>
                x {formatCoordinate(point.x)} / y {formatCoordinate(point.y)} / confidence{' '}
                {formatConfidence(point.confidence)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : (
          <Alert type="info" showIcon title="球场关键点未提供。" />
        )}
      </Card>
      <Card title="轨迹与帧级置信度摘要">
        <Descriptions bordered column={{ xs: 1, md: 3 }}>
          <Descriptions.Item label="球员轨迹">
            {payload.playerTracks
              ?.map((track) => `${track.playerId}: ${track.samples.length}`)
              .join('；') || '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="网球轨迹">
            {payload.ballTrack ? `${payload.ballTrack.length} 个采样点` : '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="帧级置信度">
            {payload.frameConfidences ? `${payload.frameConfidences.length} 帧` : '未提供'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card
        title="原始 Demo JSON"
        extra={
          <Flex gap={8} wrap>
            <Button icon={<CopyOutlined />} onClick={() => void copyJson()}>
              复制 JSON
            </Button>
            <Button icon={<DownloadOutlined />} onClick={downloadJson}>
              下载 Demo JSON
            </Button>
          </Flex>
        }
      >
        <JsonTreeViewer value={cv} />
      </Card>
    </Space>
  );
}
