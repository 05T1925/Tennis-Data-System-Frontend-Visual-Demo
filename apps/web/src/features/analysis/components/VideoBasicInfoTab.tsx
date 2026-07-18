import type { Video } from '@tennis/shared-types';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Progress,
  Space,
  Tag,
  Typography,
} from 'antd';

import type { WebAnalysisDetailState } from '../hooks/useWebAnalysisDetail';
import { getSafeAnalysisFailureMessage } from '../../demo-data';
import {
  courtTypeLabels,
  formatDateTime,
  formatDuration,
  formatFileSize,
  formatVideoTitle,
  getAnalysisStageLabel,
  getAnalysisStatusPresentation,
  getSafeProgress,
  getUploadStatusPresentation,
  matchTypeLabels,
  playModeLabels,
} from '../../videos';

export function VideoBasicInfoTab({
  video,
  analysis,
}: {
  video: Video;
  analysis: WebAnalysisDetailState;
}) {
  const task = analysis.taskQuery.data ?? null;
  const uploadStatus = getUploadStatusPresentation(video.uploadStatus);
  const uploadProgress = getSafeProgress(video.uploadProgress, {
    succeeded: video.uploadStatus === 'uploaded',
    missingLabel: '数据待确认',
  });
  const analysisStatus = getAnalysisStatusPresentation({ video, analysisTask: task });
  const analysisProgress = getSafeProgress(task?.progress, {
    succeeded: task?.status === 'succeeded',
  });

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <Card title="视频基础信息">
        <Descriptions bordered column={{ xs: 1, md: 2, xl: 3 }}>
          <Descriptions.Item label="视频 ID">
            <span className="safe-route-value">{video.id}</span>
          </Descriptions.Item>
          <Descriptions.Item label="用户 ID">{video.userId}</Descriptions.Item>
          <Descriptions.Item label="名称">
            {formatVideoTitle(video.title, video.originalFileName)}
          </Descriptions.Item>
          <Descriptions.Item label="原始文件名">
            {video.originalFileName || '数据待确认'}
          </Descriptions.Item>
          <Descriptions.Item label="MIME type">{video.mimeType || '数据待确认'}</Descriptions.Item>
          <Descriptions.Item label="文件大小">
            {formatFileSize(video.fileSizeBytes)}
          </Descriptions.Item>
          <Descriptions.Item label="时长">
            {formatDuration(video.durationSeconds)}
          </Descriptions.Item>
          <Descriptions.Item label="视频类型">
            {matchTypeLabels[video.matchType] ?? '数据待确认'}
          </Descriptions.Item>
          <Descriptions.Item label="比赛形式">
            {playModeLabels[video.playMode] ?? '数据待确认'}
          </Descriptions.Item>
          <Descriptions.Item label="场地">
            {video.courtType ? courtTypeLabels[video.courtType] : '数据待确认'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">{video.note?.trim() || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(video.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(video.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="上传信息">
        {video.uploadStatus === 'failed' && (
          <Alert
            className="analysis-inline-alert"
            type="error"
            showIcon
            title="上传失败"
            description="该视频尚未完成上传，因此不能重试分析。本阶段不提供上传重试。"
          />
        )}
        <Descriptions bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="上传状态">
            <Tag color={uploadStatus.color}>{uploadStatus.label}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="上传进度">
            {uploadProgress.value === null ? (
              uploadProgress.label
            ) : (
              <Progress percent={uploadProgress.value} />
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="分析任务">
        {!analysis.taskEnabled ? (
          <Alert type="info" showIcon title="上传尚未完成，未创建分析任务。" />
        ) : analysis.taskQuery.isPending ? (
          <Typography.Text type="secondary">正在读取分析任务…</Typography.Text>
        ) : analysis.taskQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="分析任务加载失败"
            action={<Button onClick={() => void analysis.taskQuery.refetch()}>重试</Button>}
          />
        ) : task === null ? (
          <Alert type="info" showIcon title="当前视频尚未创建分析任务。" />
        ) : (
          <Space orientation="vertical" size="middle" className="page-stack">
            {task.status === 'failed' && (
              <Alert
                type="error"
                showIcon
                title="分析失败"
                description={getSafeAnalysisFailureMessage(task.errorMessage)}
                action={
                  <Button
                    type="primary"
                    danger
                    loading={analysis.retrying}
                    disabled={!analysis.retryAllowed}
                    onClick={() => void analysis.retryAnalysis()}
                  >
                    重新分析
                  </Button>
                }
              />
            )}
            {analysis.retryError && <Alert type="error" showIcon title={analysis.retryError} />}
            <Descriptions bordered column={{ xs: 1, md: 2, xl: 3 }}>
              <Descriptions.Item label="Task ID">
                <span className="safe-route-value">{task.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={analysisStatus.color}>{analysisStatus.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="阶段">
                {getAnalysisStageLabel(task.stage)}
              </Descriptions.Item>
              <Descriptions.Item label="进度">
                {analysisProgress.value === null ? (
                  analysisProgress.label
                ) : (
                  <Progress percent={analysisProgress.value} />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="重试次数">{task.retryCount}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(task.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {formatDateTime(task.startedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {formatDateTime(task.completedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {formatDateTime(task.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
            {task.errorCode && (
              <Collapse
                items={[
                  {
                    key: 'developer-error',
                    label: (
                      <Space>
                        <Tag>开发信息</Tag>错误代码
                      </Space>
                    ),
                    children: <Typography.Text code>{task.errorCode}</Typography.Text>,
                  },
                ]}
              />
            )}
          </Space>
        )}
      </Card>
    </Space>
  );
}
