import { Space } from 'antd';

import { ModulePlaceholder } from '../components/ModulePlaceholder';
import { PageIntro } from '../components/PageIntro';

export function VideosPage() {
  return (
    <Space orientation="vertical" size="large" className="page-stack">
      <PageIntro title="视频管理" description="统一查看用户上传的视频并进入分析详情。" />
      <ModulePlaceholder
        title="视频 Service 尚未接入"
        currentState="当前阶段只提供视频管理页面入口，不生成或展示虚构视频。"
        nextCapabilities={['视频数据表格', '搜索、筛选与分页', '视频详情和播放信息']}
      />
    </Space>
  );
}
