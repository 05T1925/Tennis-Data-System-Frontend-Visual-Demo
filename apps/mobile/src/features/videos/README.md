# Mobile Videos 模块

Videos Feature 提供当前 Mobile Demo 的视频 Service、视频列表 Query、列表消费模型和展示组件。生产
Mock 实例与 Analysis、Statistics Service 共享唯一 `DemoDataRepository`；页面不访问 Repository、
AsyncStorage 或固定数据数组。

## 数据流

```text
Auth User
→ videoQueryKeys.list(userId)
→ videoService.listVideos
→ 有效且去重的 videoId
→ analysisQueryKeys.task(userId, videoId)
→ useQueries
→ VideoListItemViewModel
→ 状态筛选与视频卡片
```

列表只查询一次全部视频，筛选在客户端完成。每条 AnalysisTask Query 独立保存 pending、error 和
data，一条任务失败不会使整个列表进入错误状态。当前没有分页、搜索或自动轮询。

## Query keys

Videos Feature 拥有以下 canonical keys：

```text
['videos', 'list', userId]
['videos', 'detail', userId, videoId]
```

Analysis Feature 拥有 task 和 retry keys。Upload Feature 的兼容 factory 委托给这两处定义，因此
阶段 7 的缓存失效仍命中同一 tuple。

## 状态与筛选

上传未完成时优先展示 uploadStatus；只有 uploaded 视频才消费 AnalysisTask。状态文字、语义颜色、
筛选分类和 retry 资格集中在 `videoPresentation.ts`。筛选为全部、上传阶段、等待分析、分析中、
已完成和异常，切换筛选不会访问 Repository。

只有 uploaded 且 task failed 的有效视频允许快速重试。重试调用 AnalysisService 原地更新任务，
成功后直接写入对应 task cache；同一视频防重复，不同视频互不阻塞。阶段 8 不轮询重试后的状态。

## Mock 场景与替换边界

`EXPO_PUBLIC_VIDEO_LIST_MOCK_SCENARIO` 支持 success、empty、error，且只包裹 listVideos。empty 不
修改 Repository；error 仅让当前 Demo 用户第一次有效请求失败，refetch 后恢复。该配置不影响
首页、详情、上传或分析 Service。

未来 Real VideoService 应通过 DTO/Adapter 接入 API，并保持 VideoService、Query keys 和 View
Model 消费边界稳定。当前能力不代表真实上传、Backend、对象存储或 CV 已实现。
