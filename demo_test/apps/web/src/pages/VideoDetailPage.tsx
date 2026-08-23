import { ArrowLeftOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, message, Popconfirm, Result, Space, Spin, Tabs } from 'antd';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';
import { webApiMode } from '../config/env';
import {
  AnalysisLogsTab,
  AnalysisResultTab,
  areWebDetailSearchParamsEqual,
  CvDemoOutputTab,
  parseWebDetailTab,
  removeWebDetailTab,
  ShotDataTab,
  updateWebDetailTab,
  useWebAnalysisDetail,
  VideoBasicInfoTab,
  type WebDetailTab,
} from '../features/analysis';
import { useWebAuth } from '../features/auth';
import {
  copyTextToClipboard,
  getSafeAppErrorMessage,
  normalizeRouteVideoId,
  useDeleteWebVideo,
  useWebVideoDetail,
} from '../features/videos';

export function VideoDetailPage() {
  const isMockMode = webApiMode.status === 'ready' && webApiMode.mode === 'mock';
  const { videoId } = useParams<{ videoId: string }>();
  const normalizedVideoId = normalizeRouteVideoId(videoId);
  const { user } = useWebAuth();
  const actorUserId = user?.id ?? '';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const parsedTab = useMemo(
    () => parseWebDetailTab(new URLSearchParams(searchString)),
    [searchString],
  );
  const [messageApi, messageContext] = message.useMessage();
  const detailQuery = useWebVideoDetail({ actorUserId, videoId: normalizedVideoId });
  const deletion = useDeleteWebVideo(actorUserId);
  const analysis = useWebAnalysisDetail({
    actorUserId,
    videoId: normalizedVideoId,
    uploadStatus: detailQuery.data?.video.uploadStatus ?? '',
    activeTab: parsedTab.tab,
  });
  const listSearchParams = removeWebDetailTab(new URLSearchParams(searchString));
  const returnTarget = `/videos${listSearchParams.size ? `?${listSearchParams}` : ''}`;

  useEffect(() => {
    const current = new URLSearchParams(searchString);
    if (!areWebDetailSearchParamsEqual(current, parsedTab.normalizedSearchParams)) {
      setSearchParams(parsedTab.normalizedSearchParams, { replace: true });
    }
  }, [parsedTab.normalizedSearchParams, searchString, setSearchParams]);

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

  const { video } = detailQuery.data;
  const deleting = deletion.deletingVideoIds.has(video.id);
  const tabItems: { key: WebDetailTab; label: string; children: React.ReactNode }[] = [
    {
      key: 'basic',
      label: '基础信息',
      children: <VideoBasicInfoTab video={video} analysis={analysis} />,
    },
    { key: 'result', label: '结构化结果', children: <AnalysisResultTab analysis={analysis} /> },
    { key: 'shots', label: '每一拍数据', children: <ShotDataTab analysis={analysis} /> },
    {
      key: 'cv',
      label: 'CV 原始输出',
      children: <CvDemoOutputTab analysis={analysis} videoId={video.id} />,
    },
    { key: 'logs', label: '分析任务日志', children: <AnalysisLogsTab analysis={analysis} /> },
  ];

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      {messageContext}
      <PageIntro
        title="视频详情"
        description={
          isMockMode
            ? '查看 Web 私有 Demo 视频、结构化分析结果和非正式 CV Fixture。'
            : '查看 Real API Draft 视频和结构化分析结果；CV 正式契约尚未配置。'
        }
        extra={
          <Flex gap={8} wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(returnTarget)}>
              返回视频管理
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => void copyVideoId()}>
              复制视频 ID
            </Button>
            <Popconfirm
              title={isMockMode ? '删除当前 Web Demo 视频？' : '删除当前视频？'}
              description={
                isMockMode
                  ? '将同时删除关联 Task、Result、CV、日志和 Runtime；不影响 Mobile 或真实 Backend。'
                  : '将通过 Real API Draft 删除当前视频；服务端级联语义仍等待 Backend 确认。'
              }
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
                {isMockMode ? '删除 Demo 视频' : '删除视频'}
              </Button>
            </Popconfirm>
          </Flex>
        }
      />
      {deletion.deleteErrors.get(video.id) && (
        <Result status="error" title={deletion.deleteErrors.get(video.id)} />
      )}
      <Tabs
        activeKey={parsedTab.tab}
        destroyOnHidden
        items={tabItems}
        onChange={(key) => setSearchParams(updateWebDetailTab(searchParams, key as WebDetailTab))}
      />
    </Space>
  );
}
