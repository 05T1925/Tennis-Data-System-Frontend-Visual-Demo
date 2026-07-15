# Mobile Analysis 模块

本模块定义可替换的 AnalysisService，并提供基于统一 DemoDataRepository 的 MockAnalysisService。
所有方法通过关联 Video 校验 userId；不存在与无权访问统一返回安全 not found。

公开能力包括开始分析、按 videoId 查询 Task、查询 Result 和重试失败 Task。只有 uploaded Video
可以开始；queued、processing 和 succeeded Task 幂等返回；failed Task 必须走 retry。并发开始也
通过 Repository 写队列收敛成同一 Task。

阶段顺序集中定义为：

```text
queued → court_detection → player_detection → ball_tracking
→ trajectory_processing → event_extraction → statistics_generation → completed
```

状态按 persisted startedAt 和固定 stageDurationMs 惰性推进。固定失败发生在 ball_tracking，错误码
为 `BALL_TRACKING_UNSTABLE`。retry 原地复用 Task ID、增加 retryCount、清除错误和旧 Result，并
以 succeeded outcome 重新开始。

成功完成后生成结构完整且适量的 AnalysisResult；重复 reconcile 不重复生成结果。数据与 runtime
均由统一 Repository 持久化，因此 App 重启后可在下一次查询时追赶。

阶段 9 新增 canonical Result key、详情页唯一 Task Query observer 和局部受控轮询。queued 在页面
聚焦且 AppState active 时每 3 秒查询，processing 每 2 秒查询；terminal、query error、页面失焦、
inactive 和 background 均停止。环境恢复时只对 active/null Task 立即查询一次，不建立页面 timer
或全局 focusManager。

Task succeeded 后 Result Query 自动启用，使用 `staleTime: 0` 且不轮询。详情只展示
`AnalysisResult.summary` 的少量 Demo 指标；Shot、Rally、Point、图表和画像仍属于阶段 10。
未来 Real AnalysisService 保持当前接口和 Query key，由 DTO/Adapter 替换 Mock Repository 边界。
