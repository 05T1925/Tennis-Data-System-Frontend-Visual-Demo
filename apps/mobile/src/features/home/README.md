# Mobile 首页模块

## 职责

首页负责组合当前 Auth User、上传入口、拍摄建议、累计统计、最近分析和最近 3 条视频。页面只负责
展示、交互和导航，不直接读取 Mock 数组，也不自行计算全局统计。

首页明确不负责文件选择、上传进度、视频播放、分析任务轮询、分析结果详情、完整视频列表或统计
图表。现有 `/upload` 和 `/videos/[videoId]` 仅作为导航目标。

## 数据边界

- `VideoService` 返回按 `createdAt` 倒序排列的 `Video[]`，默认和最大 limit 均为 3。Hook 仍会
  防御性截取 3 条。当前 Mock 数据只属于固定 Demo User，未知 userId 返回空数组。
- `StatisticsService` 返回 `HomeOverview`，其中包含四项累计统计和轻量
  `LatestAnalysisSummary`。累计统计不由最近视频推算，完整 `AnalysisResult` 和 CV payload 不进入
  首页；未知 userId 返回零统计和空最近分析。
- 两个 Service 均支持 `AbortSignal`，不依赖 React、Router 或 Query cache。

当前只有确定性的 Mock Service。未来接入 Real Service 时保持现有接口，在 Service 边界增加 API
DTO 和 Adapter，将 snake_case 转成领域模型；页面和 Query Hook 不应随传输格式变化。

## TanStack Query

根 `QueryProvider` 位于 `SafeAreaProvider` 和 `AuthSessionProvider` 之间，稳定创建唯一
`QueryClient`。Auth 恢复完成前受保护首页不挂载，因此不会提前查询。

首页使用两个独立 Query：

```text
['home', 'recentVideos', userId, 3]
['home', 'overview', userId]
```

自动 retry 关闭，`staleTime` 为 60 秒，缓存回收时间为 30 分钟。手动重试只 refetch 失败分区；
refetch 有旧数据时继续显示旧数据。Query Hook 会将非取消异常归一化为 `AppError`；取消异常继续
交给 TanStack Query 处理，不会显示为业务错误。

## Mock 场景

通过公开的 `EXPO_PUBLIC_HOME_MOCK_SCENARIO` 切换，不需要修改页面：

- `success`：固定视频、累计统计和最近分析。
- `empty`：空视频、零统计和无最近分析。
- `error`：两个查询首次失败，手动重试成功。
- `video-error`：只有视频查询首次失败。
- `statistics-error`：只有统计查询首次失败。
- 未知值：回退 `success`。

Mock 延迟固定为 700 ms，不使用随机数据或随机错误。

仓库已在 `apps/mobile/.env.example` 提供公开示例值
`EXPO_PUBLIC_HOME_MOCK_SCENARIO=success`；真实 `.env` 不属于本模块读取或提交范围。

## 页面状态

- loading：问候、上传和拍摄建议立即显示，数据分区显示骨架。
- empty：保留完整首页结构，并显示首次上传引导、零统计和局部空状态。
- error：两个查询分别显示错误和真实 refetch，不互相覆盖成功数据。
- success：显示四项统计、最近分析和最多 3 条最近视频。
