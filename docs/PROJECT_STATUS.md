# 项目状态

最近更新时间：2026-07-14

## 当前阶段

阶段 5-C：Mobile 首页实际代码检查、必要修正与提交前收口已完成。阶段 5 满足 Demo 提交条件，
等待用户执行 Git 提交。当前分支为 `feature/stage-05-mobile-home`，改动保持未提交和未暂存。

## 状态摘要

Mobile 在阶段 4 的 Mock 登录、Session 持久化和 Protected Routes 基础上，新增 TanStack Query
Provider、VideoService、StatisticsService 和确定性 Mock 实现。已登录用户首页现在显示当前身份
问候、上传入口、拍摄建议、累计视频/击球/回合/训练时长、最近分析和最近 3 条视频。

首页真实覆盖 loading、empty、error、success，以及视频或统计单查询失败。错误场景首次失败后
可通过 Query refetch 成功恢复，不依赖 App 重启。当前仍然只有 Mock 数据，没有 Real API、
Backend、CV 或数据库。

阶段 5-C 检查发现阶段 5-B 的 Mock Service 会向任意非空 userId 返回同一份 Demo 数据，并且
Query 对未知异常只依赖静态错误泛型。现已改为仅固定 Demo User 可获得 Mock 私有数据，未知用户
返回空数据；非取消异常在 Query 边界归一化为 AppError。Abort listener 清理也改为显式执行。

## 模块状态

| 模块                           | 状态                   | 真实说明                                               |
| ------------------------------ | ---------------------- | ------------------------------------------------------ |
| Mobile Auth                    | ✅ 阶段 4 能力保持     | 本阶段未修改 Auth、Session、登录、恢复或退出。         |
| Mobile 首页                    | ✅ Mock 产品切片已实现 | 两个独立 Query 与完整四态；人工交互验收未执行。        |
| Mobile 视频/上传/详情/统计 Tab | ⏳ 仍为骨架            | 本阶段只导航到既有页面，没有扩展其业务。               |
| Web Dashboard                  | ✅ 脚手架构建已验证    | 源码未修改，页面仍为占位。                             |
| shared-types                   | ✅ 核心模型保持        | 复用 Video、AnalysisStatus、AppError，没有修改共享包。 |
| Backend / CV / Data Processing | ⏳ 尚未实现            | 未创建。                                               |
| Real Service / API             | ⏳ 尚未实现            | 当前 Video/Statistics 只有确定性 Mock Service。        |

## Mobile 首页当前能力

- 问候使用恢复后的 Auth User，名称按 displayName、email 本地部分、`球友` 回退。
- 上传 CTA 使用既有 `/upload` 路由，不实现文件选择或上传。
- 拍摄建议为固定产品文案，不放在页面大数组中。
- StatisticsService 返回四项累计统计和轻量最近分析摘要；首页不从最近视频推算总统计。
- VideoService 按 `createdAt` 倒序并最多返回 3 条；Hook 另做防御性截取；未知 userId 返回空数组。
- StatisticsService 只向固定 Demo User 返回 Mock 统计；未知 userId 返回零统计和空最近分析。
- 最近视频可导航到既有 `/videos/[videoId]`，空 ID 不触发导航。
- Service 支持 AbortSignal；页面卸载或退出后 Query 可取消未完成的 Mock 延迟。
- Abort 会清除 timeout 和 listener，不消耗确定性首次失败次数。
- 数值边界将负数、NaN 和 Infinity 归一化为 0；日期、标题和未知状态安全降级。
- 小屏页面可滚动；统计卡片在窄屏或较大字体下改为单列。

## Query 与 Mock

- 根 Provider 顺序为 SafeAreaProvider → QueryProvider → AuthSessionProvider → RootNavigator。
- QueryClient 稳定创建一次；retry 为 false，staleTime 为 60 秒，gcTime 为 30 分钟。
- Query keys 为 `['home', 'recentVideos', userId, 3]` 和
  `['home', 'overview', userId]`。
- 两个 Query 独立；单查询失败不会抹掉另一个成功结果。
- 支持 `success`、`empty`、`error`、`video-error`、`statistics-error`；未知值回退
  `success`。
- Mock 延迟固定 700 ms，不使用随机数据、随机延迟或随机错误。
- `error`、`video-error`、`statistics-error` 仅对应查询首次失败，手动 refetch 后成功。

## 新增依赖

| 依赖                    | 版本      | 用途                            |
| ----------------------- | --------- | ------------------------------- |
| `@tanstack/react-query` | `5.101.2` | Mobile 服务端状态、缓存和重试。 |

阶段 5-B 只修改 Mobile `package.json` 和根 `pnpm-lock.yaml`，没有额外锁文件。阶段 5-C 未修改
依赖或锁文件；只在已有、已跟踪的 `apps/mobile/.env.example` 增加公开 Demo 场景默认值。真实
`.env` 没有读取或修改。

## 自动验证状态

- Mobile dependency list：通过，确认 React Query 5.101.2。
- Mobile lint：通过。
- Mobile typecheck：通过。
- 根 lint：通过。
- 根 typecheck：通过。
- 根 format check：通过，所有匹配文件符合 Prettier。
- Web build：通过，Vite 转换 35 个模块。
- Mock 场景运行探测：通过，五个场景和 unknown 回退均符合设计；AbortSignal 取消通过。
- 阶段 5-C 隔离/取消探测：通过；未知用户为空、Abort 不消耗首次失败、正常/取消 listener 均
  add 1/remove 1，limit 边界符合预期。
- 修正后 Expo Android export：通过，1466 个模块、29 个输出文件；临时目录已删除。
- 修正后 Metro：`packager-status:running`；结束后 8081 监听数为 0，临时日志已删除。
- `git diff --check`：通过，无空白错误。
- 当前没有测试框架或测试命令，因此未执行自动化测试，不声称测试通过。
- 人工交互验收未执行。
- 用户决定当前 Demo 阶段以实际代码检查、场景探测、构建和启动验证作为提交依据；这不等同于
  人工交互验收通过。

## 当前限制与风险

- 当前首页数据和错误均为本地 Mock，不代表真实后端行为。
- 场景配置在 JS 进程启动时读取；切换场景需要重启本轮 Metro。
- React Native 前后台 focusManager 集成本阶段未实现；缓存 stale 后会在正常重新挂载或手动操作时
  按 Query 策略处理。
- Query cache 未在退出时主动清空，但 query key 包含 userId，不会把一个身份的数据渲染到另一
  身份；正式认证阶段仍应补充缓存清理策略。
- 未在 Android/iOS 真机或模拟器执行人工视觉和交互验收。
- 根 README 的阶段 1 摘要仍然滞后；本阶段按禁止范围未修改。
- 完整视频列表、真实上传、详情业务、分析任务、结果页、统计 Tab 和 Web 业务仍未实现。

## 下一阶段前置条件

- 阶段 5 已满足 Demo 提交条件，等待用户执行 Git 提交和推送。
- 如需提高发布质量，应补充真机人工交互和自动化测试，而不是将当前未执行项写成通过。
- 下一业务阶段继续选择单一切片，不同时扩展上传、完整视频列表、分析和统计页。
