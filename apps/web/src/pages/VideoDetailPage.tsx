import { ArrowLeftOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  message,
  Popconfirm,
  Progress,
  Result,
  Space,
  Spin,
  Tag,
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';
import { useWebAuth } from '../features/auth';
import {
  copyTextToClipboard,
  courtTypeLabels,
  formatDateTime,
  formatDuration,
  formatFileSize,
  formatVideoTitle,
  getAnalysisStageLabel,
  getAnalysisStatusPresentation,
  getSafeAppErrorMessage,
  getSafeProgress,
  getUploadStatusPresentation,
  matchTypeLabels,
  normalizeRouteVideoId,
  playModeLabels,
  useDeleteWebVideo,
  useWebVideoDetail,
} from '../features/videos';

export function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const normalizedVideoId = normalizeRouteVideoId(videoId);
  const { user } = useWebAuth();
  const actorUserId = user?.id ?? '';
  const location = useLocation();
  const navigate = useNavigate();
  const [messageApi, messageContext] = message.useMessage();
  const detailQuery = useWebVideoDetail({ actorUserId, videoId: normalizedVideoId });
  const deletion = useDeleteWebVideo(actorUserId);
  const returnTarget = `/videos${location.search}`;

  async function copyVideoId(): Promise<void> {
    try {
      await copyTextToClipboard(normalizedVideoId);
      messageApi.success('视频 ID 已复制。');
    } catch (error) {
      messageApi.error(getSafeAppErrorMessage(error, '无法复制视频 ID，请重试。'));
    }
  }

  if (!normalizedVideoId) {
    return (
      <Result
        status="warning"
        title="视频参数无效"
        extra={<Button onClick={() => navigate(returnTarget)}>返回视频管理</Button>}
      />
    );
  }

  if (detailQuery.isPending) {
    return (
      <div className="video-page-loading" aria-busy="true">
        <Spin size="large" description="正在加载视频详情" />
      </div>
    );
  }

  if (detailQuery.isError || detailQuery.data === undefined) {
    return (
      <Result
        status="404"
        title="无法查看视频详情"
        subTitle={getSafeAppErrorMessage(detailQuery.error, '未找到该视频。')}
        extra={
          <Space>
            <Button onClick={() => void detailQuery.refetch()}>重新加载</Button>
            <Button onClick={() => navigate(returnTarget)}>返回视频管理</Button>
          </Space>
        }
      />
    );
  }

  const { video, analysisTask } = detailQuery.data;
  const uploadStatus = getUploadStatusPresentation(video.uploadStatus);
  const analysisStatus = getAnalysisStatusPresentation(detailQuery.data);
  const uploadProgress = getSafeProgress(video.uploadProgress, {
    succeeded: video.uploadStatus === 'uploaded',
    missingLabel: '数据待确认',
  });
  const analysisProgress = getSafeProgress(analysisTask?.progress, {
    succeeded: analysisTask?.status === 'succeeded',
  });
  const deleting = deletion.deletingVideoIds.has(video.id);
  const deleteError = deletion.deleteErrors.get(video.id);

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      {messageContext}
      <PageIntro
        title="视频详情"
        description="查看 Web 私有 Demo 视频元数据和基础分析任务状态。"
        extra={
          <Flex gap={8} wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(returnTarget)}>
              返回视频管理
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => void copyVideoId()}>
              复制视频 ID
            </Button>
            <Popconfirm
              title="删除当前 Web Demo 视频？"
              description="将同时删除关联分析任务，不影响 Mobile，也不会调用真实 Backend；当前 UI 内不可撤销。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deleting }}
              disabled={deleting}
              onConfirm={async () => {
                const deleted = await deletion.deleteVideo(video.id);
                if (deleted) navigate(returnTarget, { replace: true });
              }}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                删除 Demo 视频
              </Button>
            </Popconfirm>
          </Flex>
        }
      />
      {deleteError && <Alert type="error" showIcon title={deleteError} />}
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
        {analysisTask === null ? (
          <Alert
            type="info"
            showIcon
            title={
              video.uploadStatus === 'uploaded'
                ? '当前视频尚未创建分析任务。'
                : '上传尚未完成，未创建分析任务。'
            }
          />
        ) : (
          <Descriptions bordered column={{ xs: 1, md: 2, xl: 3 }}>
            <Descriptions.Item label="Task ID">
              <span className="safe-route-value">{analysisTask.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={analysisStatus.color}>{analysisStatus.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="阶段">
              {getAnalysisStageLabel(analysisTask.stage)}
            </Descriptions.Item>
            <Descriptions.Item label="进度">
              {analysisProgress.value === null ? (
                analysisProgress.label
              ) : (
                <Progress percent={analysisProgress.value} />
              )}
            </Descriptions.Item>
            <Descriptions.Item label="重试次数">{analysisTask.retryCount}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(analysisTask.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="开始时间">
              {formatDateTime(analysisTask.startedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="完成时间">
              {formatDateTime(analysisTask.completedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {formatDateTime(analysisTask.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </Space>
  );
}
