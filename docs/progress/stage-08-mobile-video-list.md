# 阶段 8：Mobile 视频列表、状态筛选与失败任务快速重试

## 1. 阶段信息

- 阶段编号：8
- 英文标识：`mobile-video-list`
- 执行日期：2026-07-14
- 当前分支：`feature/stage-08-mobile-video-list`
- 基线提交：`b5fc86e feat(mobile): complete local video upload workflow`
- 当前状态：阶段 8-C 独立审查与简化修正完成，满足 Demo 提交条件。

## 2. 原始要求去重

本阶段只实现当前用户视频列表、视频与 AnalysisTask 组合、状态标签、六个本地筛选、下拉刷新、
页面四态、单 task 错误隔离、分析失败快速重试和详情入口。Auth、QueryProvider、VideoService、
AnalysisService、DemoDataRepository、上传状态机和详情路由全部复用，没有重建。

自动轮询与详情业务推迟到阶段 9；AnalysisResult、Shot、Rally、Point、图表和画像推迟到阶段 10。
本阶段没有实现搜索、分页、真实缩略图、播放器、Real API、Backend 或 CV。

## 3. 用户场景与目标

登录用户进入视频 Tab 后可以查看自己的 Seed 或上传记录，识别上传/分析状态，按状态筛选，下拉
刷新列表与可见任务，对分析失败任务执行原地 retry，并从有效卡片进入现有详情骨架。错误文案不
暴露 Repository、Storage、Schema、URI 或技术堆栈。

## 4. 阶段 A结论与批准事项

阶段 A确认 listVideos 只返回 Video，批准使用一个列表 Query 加按有效、去重 videoId 建立的 task
useQueries，并在 Feature 内建立私有 View Model。用户同时批准 canonical Query key 收口、
PageShell 最小 RefreshControl、success/empty/error 列表场景、移动漏收测试、保持 shared-types
不变，以及最小修正 README、AGENTS、ARCHITECTURE 和 API Draft。

## 5. 最终架构

```text
Auth User
→ videoQueryKeys.list(userId)
→ videoService.listVideos
→ DemoDataRepository
→ 有效且去重的 videoId
→ analysisQueryKeys.task(userId, videoId)
→ AnalysisService.getAnalysisTaskByVideoId
→ VideoListItemViewModel
→ 状态配置和本地筛选
→ RefreshControl / retry Mutation / detail route
```

页面只读取 Auth、调用 Hook、组合展示和导航。Hook 负责 Query、useQueries、刷新、retry、Abort 和
缓存。`videoPresentation.ts` 负责状态优先级、格式化、筛选和 View Model。组件负责筛选、骨架、
卡片、empty 和局部错误。

## 6. Query keys

```text
['videos', 'list', userId]
['videos', 'detail', userId, videoId]
['analysis', 'task', userId, videoId]
['analysis', 'retry', userId]
```

Videos 与 Analysis Feature 分别拥有 canonical factories。Upload 的旧 factory 改为委托新定义，
现有 tuple 和阶段 7缓存失效保持兼容，没有循环依赖。

## 7. 视频与 Task 组合

列表 Query 调用现有 `videoService.listVideos({ userId, signal })`。Hook trim ID、跳过空 ID并去重，
再为每个唯一 ID建立 task Query。每个结果独立映射为 task/pending/error；task error 不会改变列表
Query 状态或其他卡片。重复 ID复用同一 Query，卡片 key 还包含日期、原文件名和重复序号回退。

## 8. 状态优先级和筛选矩阵

上传状态 idle、uploading、failed、canceled 始终优先。只有 uploaded 视频才消费 task。

| 主状态                   | 文案                                | 筛选     | retry |
| ------------------------ | ----------------------------------- | -------- | ----- |
| idle / uploading         | 等待上传 / 正在上传                 | 上传阶段 | 否    |
| upload failed / canceled | 上传失败 / 上传已取消               | 异常     | 否    |
| task pending / error     | 正在确认分析状态 / 分析状态暂不可用 | 仅全部   | 否    |
| task missing / queued    | 等待分析                            | 等待分析 | 否    |
| processing               | 正在分析                            | 分析中   | 否    |
| succeeded                | 分析完成                            | 已完成   | 否    |
| analysis failed          | 分析失败                            | 异常     | 是    |
| analysis canceled        | 分析已取消                          | 异常     | 否    |
| 未知                     | 状态待确认                          | 仅全部   | 否    |

状态文字、描述、语义颜色、筛选分类和 retry 资格集中定义。筛选为全部、上传阶段、等待分析、
分析中、已完成、异常，只处理内存 View Model，不触发 Service。

## 9. 安全格式化与卡片

空标题回退“未命名训练”，标题最多两行。非法日期显示“时间待确认”；缺失、负数、NaN 或
Infinity 时长显示“时长待确认”；0 秒作为合法值显示。未知状态不会显示 undefined。卡片使用普通
View/Text 构成网球视频占位，不读取 URI、视频字节、thumbnailUrl 或网络资源。

卡片主体 Pressable 与 retry 操作区分离，避免 retry 同时导航。空 ID卡片为 disabled，不查询 task、
不导航也不 retry。筛选按钮暴露 selected，导航和 retry 按钮提供 accessibility role/state/label。

## 10. 下拉刷新

PageShell 增加可选 `refreshing` 和 `onRefresh`，内部既有 ScrollView 接入 RefreshControl；其他页面
未传参时行为不变，没有嵌套纵向 FlatList/ScrollView。Hook 使用独立 manualRefreshing 防重复，
通过 Promise.allSettled 精确 refetch 当前用户 list key 和活动 task 前缀。有旧数据时 Query 保留
卡片；列表错误显示局部提示，task 错误只改变对应卡片。

## 11. retry、Abort 与竞态

只有 uploaded、task failed 且 ID有效的条目显示 retry。Mutation 调用现有 retryAnalysis，不使用
startAnalysis。Hook 按 videoId 保存 retry lock、错误和 AbortController；同一视频防重复，不同视频
可以并发。卸载或 userId 变化会 abort 旧 controller。

retry 前取消对应 task refetch。成功后使用返回值 setQueryData，使卡片立即显示“等待分析”，并
失效首页 overview；不刷新列表、不清空 QueryClient、不创建 Result key、不启动轮询。失败保留旧
Video/Task，显示卡片级安全错误，并精确 refetch task 以处理任务已被其他流程改变的竞态。

## 12. 页面状态

- initial loading：中性三卡骨架，不创建虚假视频。
- first error：安全错误与真实重新加载按钮。
- empty：上传入口。
- filtered empty：查看全部操作，不提示重新上传。
- success：筛选、卡片、状态、刷新、retry 和导航。
- stale refresh error：保留旧列表并显示局部刷新提示。
- task pending/error：只占用对应卡片状态区。

## 13. 视频列表 Mock 场景

新增公开 `EXPO_PUBLIC_VIDEO_LIST_MOCK_SCENARIO`，支持 success、empty、error，未知值回退 success。
场景仅包裹 listVideos，使用固定 350ms 可取消延迟。empty 返回空数组且不写 Repository；error 只
让 Demo 用户第一次有效请求失败，refetch 后恢复。Abort、空/未知用户不消耗失败；首页 recent、
详情、创建、上传、删除、Analysis 和 Statistics 不受影响。

## 14. 新增文件

- `features/videos/queryKeys.ts`：canonical video keys。
- `features/analysis/queryKeys.ts`：canonical task/retry keys。
- `features/videos/service.ts`：无循环依赖的视频 Service 单例。
- `features/videos/videoPresentation.ts`：状态、格式化、筛选与 View Model。
- `features/videos/hooks/useVideoList.ts`：列表/task Query、刷新和 retry。
- `features/videos/components/VideoListContent.tsx`：筛选、骨架、卡片与页面状态。
- `features/videos/services/videoListMockScenario.ts`：列表延迟和安全 Mock 错误。
- `features/videos/__tests__/videoPresentation.test.ts`：纯逻辑覆盖。
- `features/videos/__tests__/videoListScenario.test.ts`：列表场景边界。
- `features/videos/__tests__/analysisRetry.test.ts`：Service retry 回归。
- `features/videos/README.md`：模块边界和替换说明。
- `docs/progress/stage-08-mobile-video-list.md`：本记录。

## 15. 修改、移动和未修改文件

修改视频 Tab、PageShell、AppButton、Videos/Analysis 出口、MockVideoService、Upload key 兼容层、
公开 env 配置、README、AGENTS、ARCHITECTURE、PROJECT_STATUS 和 API_CONTRACT。AppButton 只增加
可选 accessibilityLabel；PageShell 只增加可选刷新 props。

`features/videos/services/uploadMockScenario.test.ts` 通过普通文件修改移动到
`features/videos/__tests__/uploadMockScenario.test.ts`，现被 Vitest 收集；未使用 git mv，未修改
Vitest include。

Auth、DemoDataRepository、Schema、transitions、shared-types、详情业务页、Statistics 页、Web
源码、旧阶段记录和 `other_docs` 均未修改。

## 16. 依赖和环境变化

没有新增、删除或升级依赖；Mobile/root package 与 `pnpm-lock.yaml` 未变化，仓库仍只有根 pnpm
锁文件。只修改已跟踪 `.env.example` 并增加公开场景示例；没有读取或修改真实 `.env`。

## 17. 测试

Vitest 最终收集 11 个测试文件、134 个用例，全部通过。阶段 7原有 7 文件/88 用例保持，移动后的
fail-once 测试开始真实收集；新增覆盖状态优先级、六筛选、异常数据、task pending/error、ID去重、
场景隔离、Abort、unknown user 和 Analysis retry 原地更新/拒绝分支。没有 skip、only 或 todo，
没有新增 UI 测试依赖。

## 18. 自动验证真实结果

| 命令或检查          | 结果                                                          |
| ------------------- | ------------------------------------------------------------- |
| Mobile test         | 11 files、134 tests 通过，退出码 0                            |
| Mobile lint         | 通过，0 warning，退出码 0                                     |
| Mobile typecheck    | 通过，退出码 0                                                |
| 根 lint / typecheck | Mobile、Web、shared-types 全部通过                            |
| 根 format check     | 通过                                                          |
| Web build           | 35 modules，Vite build 通过                                   |
| Expo install check  | Dependencies are up to date                                   |
| Android export      | 1523 modules、29 files，临时目录已删除                        |
| iOS export          | 1390 modules、25 files，临时目录已删除                        |
| Metro               | `packager-status:running`；本轮进程已结束，8081 listener 为 0 |
| git diff check      | 通过，无空白错误                                              |

## 19. 人工验证真实状态

已执行静态检查：页面未引用 Repository/AsyncStorage/固定 JSON，Query tuple 保持，列表没有 timer、
refetchInterval、AppState 或焦点轮询；卡片导航与 retry 操作区分离；空 ID、重复 ID和错误文案均有
防御处理。

以下交互平台均未执行，不能写成通过：Expo Web、Expo Go、Android 真机、iOS 真机、Development
Build。附件中的列表视觉、下拉手势、字体放大、Safe Area、实际按压、返回导航和控制台观察清单
仍待人工验收。静态 export 只证明可打包，不代表真机交互通过。

## 20. 已知问题与风险

- 当前没有 React Native UI 测试库，RefreshControl、Pressable 和 Hook 并发行为未做组件级自动化。
- Seed 活动分析约 7 秒后惰性完成；人工观察 queued/processing 需要重新 Seed 或 retry 失败任务。
- error 场景用于首次错误与 refetch 恢复；有旧数据刷新失败主要依赖 Query 状态逻辑和后续人工故障
  验证。
- 列表不轮询，状态只在首次进入、下拉刷新、上传失效、retry 返回或正常重新挂载时更新。
- 当前仍是本地 Mock，AsyncStorage 不是正式数据库或跨 runtime 事务系统。

## 21. 安全边界和模块影响

没有记录或持久化视频 URI、Token、密码、AbortSignal 或 Query 状态。UI 只显示 AppError.userMessage
或受控回退，不显示 technicalMessage、堆栈、Schema 或 Storage key。

首页 Query/UI 未重构；retry 只精确失效 overview。Upload workflow 继续使用兼容 key factory，
既有失效行为不变。详情路由未修改，仍是阶段 3骨架。Web 只执行既有 build，没有源码变化。

## 22. 下一阶段与阶段 C待检查

阶段 8-C 应重点复核 useQueries 动态列表、manual refresh error 状态、per-video retry 并发、userId
切换 Abort、Pressable 操作区、无障碍和小屏布局，并决定是否需要最小修正。阶段 9再实现详情业务、
任务轮询停止规则和结果刷新；不得把轮询补到阶段 8列表。

## 23. Git 状态

开始时分支正确、HEAD 为 b5fc86e、工作区和暂存区为空。阶段 8-B 全程未执行 add、commit、push、
pull、fetch、merge、rebase、reset、clean、checkout、switch、restore、stash、tag 或 git mv。
最终改动保持未暂存，暂存区为空；完整最终 Git 输出由阶段 8-B 回复提供。

## 24. 阶段 8-C：独立审查与简化修正

### 24.1 审查结论与问题

独立审查确认阶段 8主体架构合格，同时指出两个刷新状态竞态、retry 卡片错误生命周期缺口、三处
文档事实冲突，以及阶段 8-B runtime validation 文件缺少 iOS export 可核对输出。本轮只修正这些
问题，没有改 Query key、Service、Repository、组件架构或阶段 9/10边界。

### 24.2 手动刷新同步锁

`useVideoList` 新增 `manualRefreshLockRef`。refresh 在任何 await 前同步检查并占用锁，RefreshControl
和“再次刷新”按钮继续调用同一函数，因此同一用户快速连续触发只能有一个流程进入。React state
`manualRefreshing` 只负责 UI，不再承担互斥职责。刷新仍只 refetch 当前用户 list exact key 和活动
task 前缀，没有 timer、全局状态或无关缓存失效。

### 24.3 userId 切换与刷新 generation

Hook 新增 `refreshGenerationRef`。每次刷新捕获当前 generation；userId 变化和组件卸载都会递增
generation 并释放旧锁。旧刷新 finally 只有 generation 仍匹配时才能释放锁或修改 refreshing state，
因此用户 A的旧请求不能结束用户 B的新刷新。卸载后 mounted guard 与 generation 共同阻止 setState，
旧用户 Query 仍按自己的 key 正常收口，不取消或污染其他用户缓存。

### 24.4 retry 过期错误清理

`videoPresentation.ts` 新增纯函数 `pruneRetryErrorsByVideoItems`。它只保留当前列表中仍存在且
`item.canRetry === true` 的 videoId 错误，并在无需变化时返回原 Map，避免 effect 更新循环。
`useVideoList` 在 items 变化后使用该函数：task 变为 queued、processing、succeeded、canceled、
missing，上传不再 uploaded，或视频被删除时，旧错误会清除；其他仍 failed 且可 retry 的错误保留。

### 24.5 测试变化

`videoPresentation.test.ts` 增加 6 个用例，覆盖 failed retryable 错误保留、queued/processing/
succeeded 后清除、视频移除后清除，以及清理过期项时其他 retryable 视频不受影响。刷新锁未为测试
引入 Hook/UI 依赖，通过同步 ref 占锁、generation 比较和静态代码审查验证。

最终 Vitest 收集 11 个文件、140 个用例，全部通过；没有 `.skip`、`.only` 或 `.todo`。Mobile lint
退出码 0且无 warning，Mobile typecheck 退出码 0。

### 24.6 文档事实修正

- ARCHITECTURE 前部改为“视频列表已接入，详情、结果和完整统计仍未接入”。
- ARCHITECTURE 环境段同步首页、上传和视频列表三类公开 Mock 场景示例。
- AGENTS 将 shared-types 修正为 v0.1 稳定核心领域类型，并明确不包含 UI、Service、DTO Adapter、
  运行时 Schema 或业务算法。
- README 保留阶段 1历史链接并增加阶段 8记录链接。

### 24.7 iOS export 核实证据

本轮使用新的系统临时目录重新执行：

```text
pnpm --filter @tennis/mobile exec expo export --platform ios --output-dir C:\Users\28641\AppData\Local\Temp\tennis-stage08c-ios-301d3563c83b4aea92da44a635e122c5
```

真实结果：退出码 0；`iOS Bundled ... (1390 modules)`；23 assets、1 iOS HBC bundle、1
metadata.json，共 25 个输出文件、3,779,454 bytes。输出目录为上述系统临时路径，验证后
`TEMP_OUTPUT_REMOVED=True`。这是静态 export，不代表 iOS 真机验收。

### 24.8 完整自动复验

| 命令或检查          | 阶段 8-C 真实结果                                              |
| ------------------- | -------------------------------------------------------------- |
| Mobile test         | 11 files、140 tests 通过，退出码 0                             |
| Mobile lint         | 通过，0 warning，退出码 0                                      |
| Mobile typecheck    | 通过，退出码 0                                                 |
| 根 lint / typecheck | Mobile、Web、shared-types 全部通过                             |
| 根 format check     | 通过                                                           |
| Web build           | Vite 转换 35 modules，退出码 0                                 |
| Expo install check  | `Dependencies are up to date`                                  |
| Android export      | 1523 modules、29 files、5,035,095 bytes，临时目录已删除        |
| iOS export          | 1390 modules、25 files、3,779,454 bytes，临时目录已删除        |
| Metro               | 启动前 8081 为 0；status running；结束后 8081 为 0，日志已删除 |
| git diff check      | 通过，无空白错误                                               |

Android 本轮输出目录为
`C:\Users\28641\AppData\Local\Temp\tennis-stage08c-android-ba6e5d4f2bcb4f5bbb76af1dd097838b`，
退出码 0且 `TEMP_OUTPUT_REMOVED=True`。Metro `/status` 返回 `packager-status:running`，只终止本轮
根 PID 48744及其进程树。

### 24.9 人工验证与限制

Expo Web、Expo Go、Android 真机、iOS 真机和 Development Build 均未执行。RefreshControl 手势、
字体放大、Safe Area、真实按压和视觉细节仍待人工验收；静态 export 不能替代真机交互。列表继续
不自动轮询，详情仍为骨架，当前没有 React Native UI 自动测试框架，所有数据仍来自 Mock。

### 24.10 Git 状态与提交资格

阶段 8-C 开始时分支为 `feature/stage-08-mobile-video-list`，HEAD `b5fc86e`，阶段 8-B 改动完整、
暂存区为空。用户要求的 `stage-08-runtime-validation.txt` 保持原样，本轮未修改；没有新增审查日志
或临时产物。全程未执行任何 Git 写操作，最终所有改动仍未暂存，暂存区为空。

刷新同步防重、跨用户 generation、retry 错误剪枝、文档事实和 iOS 证据均已收口，完整自动验证
通过。阶段 8-C 满足 Demo 提交条件，等待用户执行 Git 提交；未开始阶段 9。
