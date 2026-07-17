import { Alert, Button, Empty, message, Result, Space, Spin, Tag } from 'antd';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { PageIntro } from '../components/PageIntro';
import { useWebAuth } from '../features/auth';
import { VideoFilters } from '../features/videos/components/VideoFilters';
import { VideoTable } from '../features/videos/components/VideoTable';
import {
  areSearchParamsEqual,
  clampWebVideoPage,
  clearWebVideoFilters,
  copyTextToClipboard,
  createWebVideoTableItem,
  getSafeAppErrorMessage,
  hasActiveWebVideoFilters,
  parseWebVideoSearchParams,
  updateWebVideoSearchParams,
  useDeleteWebVideo,
  useWebVideoList,
  type WebVideoPageSize,
} from '../features/videos';

export function VideosPage() {
  const { status, user } = useWebAuth();
  const actorUserId = user?.id ?? '';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageApi, messageContext] = message.useMessage();
  const searchString = searchParams.toString();
  const parsed = useMemo(
    () => parseWebVideoSearchParams(new URLSearchParams(searchString)),
    [searchString],
  );
  const listQuery = useWebVideoList({
    actorUserId,
    params: parsed.params,
    enabled: status === 'authenticated' && parsed.dateRangeValid,
  });
  const deletion = useDeleteWebVideo(actorUserId);
  const data = parsed.dateRangeValid ? listQuery.data : undefined;
  const items = useMemo(() => data?.items.map(createWebVideoTableItem) ?? [], [data?.items]);

  useEffect(() => {
    const current = new URLSearchParams(searchString);
    if (!areSearchParamsEqual(current, parsed.normalizedSearchParams)) {
      setSearchParams(parsed.normalizedSearchParams, { replace: true });
    }
  }, [parsed.normalizedSearchParams, searchString, setSearchParams]);

  useEffect(() => {
    if (parsed.dateRangeValid && data !== undefined && data.page !== parsed.params.page) {
      setSearchParams(clampWebVideoPage(new URLSearchParams(searchString), data.page), {
        replace: true,
      });
    }
  }, [data, parsed.dateRangeValid, parsed.params.page, searchString, setSearchParams]);

  function patchFilters(patch: Parameters<typeof updateWebVideoSearchParams>[1]): void {
    setSearchParams(updateWebVideoSearchParams(searchParams, patch));
  }

  async function copyVideoId(videoId: string): Promise<void> {
    try {
      await copyTextToClipboard(videoId);
      messageApi.success('视频 ID 已复制。');
    } catch (error) {
      messageApi.error(getSafeAppErrorMessage(error, '无法复制视频 ID，请重试。'));
    }
  }

  const deleteError = deletion.deleteErrors.values().next().value as string | undefined;
  const showFullLoading = parsed.dateRangeValid && listQuery.isPending && data === undefined;
  const showFullError = parsed.dateRangeValid && listQuery.isError && data === undefined;
  const hasFilters = hasActiveWebVideoFilters(parsed.params);

  return (
    <Space orientation="vertical" size="large" className="page-stack">
      {messageContext}
      <PageIntro
        title="视频管理"
        description="查看 Web 私有 Demo 视频、上传状态和基础分析任务状态。"
        extra={<Tag color="green">本地 Web Demo 数据</Tag>}
      />
      <VideoFilters
        key={parsed.params.keyword}
        params={parsed.params}
        onPatch={patchFilters}
        onClear={() => setSearchParams(clearWebVideoFilters(searchParams))}
      />
      {!parsed.dateRangeValid && (
        <Alert type="warning" showIcon title="起始日期不能晚于结束日期，请调整后重试。" />
      )}
      {parsed.dateRangeValid && deleteError && (
        <Alert
          type="error"
          showIcon
          closable
          title={deleteError}
          onClose={() => {
            for (const videoId of deletion.deleteErrors.keys()) deletion.clearDeleteError(videoId);
          }}
        />
      )}
      {showFullLoading && (
        <div className="video-page-loading" aria-busy="true">
          <Spin size="large" description="正在加载视频数据" />
        </div>
      )}
      {showFullError && (
        <Result
          status="error"
          title="视频列表加载失败"
          subTitle={getSafeAppErrorMessage(listQuery.error, '视频列表暂时加载失败，请重试。')}
          extra={<Button onClick={() => void listQuery.refetch()}>重新加载</Button>}
        />
      )}
      {data !== undefined && listQuery.error !== null && (
        <Alert
          type="error"
          showIcon
          title={getSafeAppErrorMessage(listQuery.error, '视频列表更新失败，请重试。')}
          action={<Button onClick={() => void listQuery.refetch()}>再次加载</Button>}
        />
      )}
      {data !== undefined && data.total === 0 && (
        <Empty
          description={
            data.unfilteredTotal === 0 ? '当前没有 Web Demo 视频' : '当前筛选条件没有结果'
          }
        >
          {hasFilters && (
            <Button onClick={() => setSearchParams(clearWebVideoFilters(searchParams))}>
              清除筛选
            </Button>
          )}
        </Empty>
      )}
      {data !== undefined && data.total > 0 && (
        <Space orientation="vertical" size="small" className="page-stack">
          {listQuery.isFetching && <Alert type="info" showIcon title="正在更新表格数据…" />}
          <VideoTable
            items={items}
            total={data.total}
            page={data.page}
            pageSize={data.pageSize}
            loading={listQuery.isFetching && !listQuery.isPlaceholderData}
            deletingVideoIds={deletion.deletingVideoIds}
            onView={(videoId) =>
              navigate(
                `/videos/${encodeURIComponent(videoId)}${searchString ? `?${searchString}` : ''}`,
              )
            }
            onPageChange={(page, pageSize) => {
              const normalizedPageSize = pageSize as WebVideoPageSize;
              setSearchParams(
                updateWebVideoSearchParams(
                  searchParams,
                  {
                    page: normalizedPageSize === parsed.params.pageSize ? page : 1,
                    pageSize: normalizedPageSize,
                  },
                  { resetPage: false },
                ),
              );
            }}
            onCopy={(videoId) => void copyVideoId(videoId)}
            onDelete={async (videoId) => {
              const deleted = await deletion.deleteVideo(videoId);
              if (deleted) messageApi.success('Web Demo 视频已删除。');
            }}
          />
        </Space>
      )}
    </Space>
  );
}
