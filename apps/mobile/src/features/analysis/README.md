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

当前没有 CV、后台任务、页面轮询或结果 UI。后续页面应通过 TanStack Query 调用 Service，并在
start/retry/完成后按阶段 6 文档失效 task、result、video detail 和 home overview 查询。
