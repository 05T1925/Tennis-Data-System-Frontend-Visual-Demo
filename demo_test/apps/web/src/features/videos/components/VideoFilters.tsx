import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Input, Select, Space, Typography } from 'antd';
import { useState } from 'react';

import type { WebAnalysisStatusFilter, WebUploadStatusFilter, WebVideoListParams } from '../types';

type VideoFiltersProps = {
  params: WebVideoListParams;
  onPatch(patch: Partial<WebVideoListParams>): void;
  onClear(): void;
};

const uploadOptions: { value: WebUploadStatusFilter; label: string }[] = [
  { value: 'all', label: '全部上传状态' },
  { value: 'idle', label: '等待上传' },
  { value: 'uploading', label: '正在上传' },
  { value: 'uploaded', label: '上传完成' },
  { value: 'failed', label: '上传失败' },
  { value: 'canceled', label: '上传已取消' },
];
const analysisOptions: { value: WebAnalysisStatusFilter; label: string }[] = [
  { value: 'all', label: '全部分析状态' },
  { value: 'not_ready', label: '不可分析' },
  { value: 'not_created', label: '未创建任务' },
  { value: 'queued', label: '等待分析' },
  { value: 'processing', label: '正在分析' },
  { value: 'succeeded', label: '分析完成' },
  { value: 'failed', label: '分析失败' },
  { value: 'canceled', label: '分析已取消' },
];

export function VideoFilters({ params, onPatch, onClear }: VideoFiltersProps) {
  const [keywordDraft, setKeywordDraft] = useState(params.keyword);

  function submitSearch(): void {
    onPatch({ keyword: keywordDraft.trim() });
  }

  return (
    <Card className="video-filters" size="small">
      <Flex gap={12} wrap align="end">
        <Space orientation="vertical" size={4} className="video-filter-search">
          <Typography.Text type="secondary">关键词</Typography.Text>
          <Input
            value={keywordDraft}
            allowClear
            placeholder="视频 ID、用户、名称或文件名"
            onChange={(event) => setKeywordDraft(event.target.value)}
            onPressEnter={submitSearch}
            suffix={<SearchOutlined />}
          />
        </Space>
        <Button type="primary" icon={<SearchOutlined />} onClick={submitSearch}>
          搜索
        </Button>
        <Button
          icon={<ClearOutlined />}
          disabled={!keywordDraft && !params.keyword}
          onClick={() => {
            setKeywordDraft('');
            onPatch({ keyword: '' });
          }}
        >
          清空搜索
        </Button>
        <Space orientation="vertical" size={4}>
          <Typography.Text type="secondary">上传状态</Typography.Text>
          <Select
            className="video-filter-select"
            value={params.uploadStatus}
            options={uploadOptions}
            onChange={(uploadStatus) => onPatch({ uploadStatus })}
          />
        </Space>
        <Space orientation="vertical" size={4}>
          <Typography.Text type="secondary">分析状态</Typography.Text>
          <Select
            className="video-filter-select"
            value={params.analysisStatus}
            options={analysisOptions}
            onChange={(analysisStatus) => onPatch({ analysisStatus })}
          />
        </Space>
        <Space orientation="vertical" size={4}>
          <Typography.Text type="secondary">起始日期</Typography.Text>
          <Input
            className="video-filter-date"
            type="date"
            value={params.from ?? ''}
            onChange={(event) => onPatch({ from: event.target.value || null })}
          />
        </Space>
        <Space orientation="vertical" size={4}>
          <Typography.Text type="secondary">结束日期</Typography.Text>
          <Input
            className="video-filter-date"
            type="date"
            value={params.to ?? ''}
            onChange={(event) => onPatch({ to: event.target.value || null })}
          />
        </Space>
        <Button icon={<ClearOutlined />} onClick={onClear}>
          清除全部筛选
        </Button>
      </Flex>
    </Card>
  );
}
