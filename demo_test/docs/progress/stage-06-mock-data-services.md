# 阶段 6：建立统一 Mock 视频与分析数据服务底座

## 1. 阶段信息

- 阶段编号：6
- 阶段名称：建立统一 Mock 视频与分析数据服务底座
- 英文标识：`mock-data-services`
- 执行日期：2026-07-14
- 当前分支：`feature/stage-06-mock-data-services`
- 基线提交：`571a661 feat(mobile): build mock-powered home dashboard`
- 当前状态：阶段 6-C 简化修正检查完成，阶段 6 满足 Demo 提交条件，等待用户执行 Git 提交。

## 2. 原始要求去重与目标

保留阶段 4 AuthService/Session 和阶段 5 QueryProvider、首页 UI、`getRecentVideos`、
`getHomeOverview`，不重建既有能力。本阶段建立一个本地 Demo 业务数据源，使查询视频、创建元
数据、模拟上传、自动建 Task、推进分析、生成 Result、retry、级联删除、reset 和重启恢复可在
Service 层闭环。

## 3. 明确不做

未修改认证、页面或 Web；未实现真实文件选择/上传、播放器、页面轮询、结果 UI、图表、Real
API、HTTP Client、Supabase、Backend、数据库、CV、Zustand、WebSocket/SSE、后台任务、推送或
React Native UI 测试。

## 4. 阶段 A 结论与用户批准

阶段 6-A 确认阶段 5 有互不关联的视频数组和统计 JSON，没有 AnalysisService 或业务持久化；
shared-types 现有 Video、AnalysisTask、AnalysisResult 和 AppError 足够，时间推进元数据可留在
Mobile 私有 Snapshot。用户批准统一 Repository、内存 + AsyncStorage、Factory、时间戳推进、
三个 Service 共享以及新增 Vitest。

## 5. 最终目录与架构

新增 `features/demo-data`，集中 types、Schema、依赖、Storage、Factory、transition、Repository、
管理 Service、README 和测试；新增 `features/analysis` 的公共接口、Mock 实现、出口和 README。
Video/Statistics 在原目录增量修改。

```text
MockVideoService ───────┐
MockAnalysisService ────┼─ DemoDataRepository
MockStatisticsService ──┘  ├─ 内存 Snapshot
                           ├─ Promise 写队列
                           ├─ Zod Runtime Schema
                           ├─ AsyncStorage Adapter
                           ├─ Seed / Factory
                           └─ Clock / ID / reconcile
```

三个生产 Mock Service 从 `demo-data/index.ts` 导入同一个稳定 Repository。Repository 不依赖
React、Router、Auth 或 QueryClient；不需要 Provider。

## 6. Snapshot 与 Runtime Schema

Snapshot 使用字面量 `version: 1`，包含 `videos`、`analysisTasks`、`analysisResults`，以及按实体
ID 索引的 uploads/analyses runtime。上传 runtime 保存 startedAt、durationMs、outcome；分析
runtime 保存 startedAt、stageDurationMs、outcome 和可选 failureStage。

Zod 在读取和保存前完整校验：非空 ID、ISO datetime、联合枚举、有限非负数、整数、0～100
进度、置信度、runtime 正时长、runtime 与实体状态关联、每个视频至多一个 Task/Result，以及
Shot/Rally/Result 引用完整性。未修改 shared-types。

## 7. Storage、初始化与损坏恢复

- Demo key：`tennis.demo.data.v1`
- Auth key：`tennis.auth.session.v1`，未读取或修改
- 生产 Adapter：AsyncStorage getItem/setItem/removeItem，只操作 Demo key
- 禁止并且未调用 AsyncStorage.clear

首次访问通过唯一 initialization Promise 初始化。无数据时生成并保存 Seed；JSON 损坏、版本错误
或 Schema 失败时单次回退 Seed 并尝试覆盖。覆盖无效数据失败时仍允许当前进程使用内存 Seed，
不递归、不无限重试。正常写失败统一为 `DEMO_DATA_SAVE_FAILED`。

## 8. Repository 与写队列

getSnapshot、update、reset 和 reconcile 共用 Promise 队列。更新顺序是：读取最后成功快照、克隆、
reconcile、执行 updater、再次 reconcile、Zod 校验、持久化、最后替换内存。保存失败保留最后一份
成功内存快照。所有返回值再次经过 Schema 解析，外部修改数组不会改变内部状态。

reset 使用当前 Clock 创建 Seed 并覆盖 Demo key；成功后才替换内存。它不清除 Auth、不退出登录、
不调用 QueryClient。

## 9. Seed、Factory、Clock 与 ID

集中 Factory 提供 createVideo、createAnalysisTask、createAnalysisResult、createDemoSeed。Seed 包含：

- `video-demo-succeeded`：uploaded + succeeded/completed + Result。
- `video-demo-processing`：uploaded + queued runtime，无 Result，startedAt 锚定注入 Clock。
- `video-demo-failed`：uploaded + failed/ball_tracking + 固定错误，无 Result。
- `video-demo-upload-failed`：failed 上传，用于 failed → uploading → uploaded。

Seed ID 和 Result 内部 Shot/Rally/Point ID 固定，reset 后一致。生产 Clock 返回真实 Date；ID 由
时间戳和进程内序列生成，不使用 Math.random 或 UUID 依赖。测试注入 MutableClock、顺序 ID 和
Memory Storage。

## 10. VideoService

保留 `getRecentVideos({ userId, limit?, signal? })`，新增 listVideos、getVideoById、createVideo、
startUpload、deleteVideo。

- list：当前 userId、可选 uploadStatus、createdAt 倒序，无分页。
- detail：不存在和越权统一 `VIDEO_NOT_FOUND`。
- create：trim 文本，拒绝空文件名/MIME、负数、NaN、Infinity；初始 idle/0。
- upload：idle/failed/canceled 可进入 uploading；uploading 幂等；uploaded 返回
  `UPLOAD_NOT_ALLOWED`。并发调用在 Repository 队列内重新检查状态。
- delete：一次 update 级联 Video、Task、Result、upload runtime 和 analysis runtime。

## 11. 上传推进

默认上传持续 5000 ms。reconcile 使用 elapsed/duration，系统时间倒退按 0，未完成最大 99，完成
为 100。默认运行时 outcome 为 succeeded；失败由固定 Seed或测试 runtime 表达。

上传成功在一个 Snapshot 中设置 uploaded/100、更新时间、删除 upload runtime、检查唯一 Task、
创建 queued Task 和 analysis runtime。重复 reconcile 不重复建 Task。没有后台 Timer。

## 12. AnalysisService 与状态推进

公共方法为 startAnalysis、getAnalysisTaskByVideoId、getAnalysisResultByVideoId、retryAnalysis。
所有操作先通过关联 Video 校验 userId。只有 uploaded Video 可开始；queued/processing/succeeded
幂等返回；failed 必须 retry；并发 start 在写队列内收敛为一个 Task。

集中阶段和进度：queued/0、court_detection/10、player_detection/25、ball_tracking/45、
trajectory_processing/65、event_extraction/80、statistics_generation/92、completed/100。默认每阶段
1000 ms。

failed outcome 固定在 ball_tracking，设置 `BALL_TRACKING_UNSTABLE` 和“网球轨迹不稳定，无法
生成可靠结果”，删除 runtime，不生成 Result。retry 原地复用 Task ID、retryCount +1、清除错误
和 completedAt、回到 queued/0、删除不一致旧 Result，并以 succeeded outcome 重新开始。

成功时设置 succeeded/completed/100、completedAt，删除 runtime，并用 Factory 生成唯一 Result。
Result 包含一致的 Shot/Rally/Point 关联，不含 CV payload。terminal Task 和已有 Result 不会被
重复修改或生成。

## 13. StatisticsService 与首页兼容

`getHomeOverview` 签名保持不变。success 从 Repository 按当前 userId 聚合全部 Video 数、有效训练
时长、Result summary 的 shots/rallies，并从有 Result 的 succeeded Task 中按 completedAt、
result.createdAt 选择最近分析。删除、完成和 reset 后重新查询会反映新数据。

首页 `success`、`empty`、`error`、`video-error`、`statistics-error` 保持。场景只包裹
getRecentVideos/getHomeOverview，不写 Repository；unknown user 和 Abort 不消耗首次失败。其他
Video 方法与 AnalysisService 不受首页场景影响。首页 UI、Hook、query key 和四态未修改。

## 14. userId、Abort 与错误

固定 Demo 数据属于 `demo-user-local`。未知用户列表为空、统计为零、详情和关联分析统一安全 not
found，不泄露其他用户记录。Repository 不读取 Session 或 Token。

公开 Service 方法接受 AbortSignal。开始前已取消会立即拒绝；首页延迟取消会清 timeout、移除
listener且不消耗首次失败；Repository 写入在提交前检查 signal，取消不产生内存部分提交。

使用 AppError 区分 VIDEO_NOT_FOUND、INVALID_VIDEO_INPUT、UPLOAD_NOT_ALLOWED、
ANALYSIS_NOT_FOUND、ANALYSIS_NOT_READY、ANALYSIS_RETRY_NOT_ALLOWED、DEMO_DATA_LOAD_FAILED、
DEMO_DATA_SAVE_FAILED 等。页面只应显示 userMessage。

## 15. Mock/Real 与 Query Cache 边界

Mock Service 依赖 Demo Repository；未来 Real Service 应依赖 HTTP DTO/Adapter，不复用该
Repository。页面只依赖 Service，不访问 AsyncStorage 或 Mock 数组。本阶段未创建假的 Real
Service，也未实现 Mutation Hook。

后续失效规则：create 失效 list/recent/home；upload 失效 list/detail/recent/task；分析完成失效
task/result/detail/home；retry 失效 task/result/home；delete 移除 detail/task/result 并失效
list/recent/home；reset 失效全部 Demo 业务 Query。不得清 Auth Storage 或 Auth 状态。

## 16. 新增、修改与删除文件

新增 Demo Data 模块、Analysis 模块、Vitest 配置、3 个测试文件与测试辅助文件、本阶段记录和两个
模块 README。修改 VideoService/MockVideoService/出口、MockStatisticsService/出口、Mobile
package、根锁文件、ARCHITECTURE 和 PROJECT_STATUS。

删除文件：无。两个原 Mock Service 文件使用同路径替换实现，不属于文件删除。

禁止范围检查：Auth、App 页面、Web、shared-types、README、阶段 0～5 记录、Draft DATA/API/PRD
均未修改；`other_docs` 未读取或处理。

## 17. 依赖和测试配置

唯一新增依赖为 Mobile devDependency `vitest@4.1.10`，根 pnpm-lock.yaml 同步；新增
`"test": "vitest run"`。Vitest 使用 Node 环境、显式导入测试 API，无 Jest、jsdom、MSW、覆盖率
插件或 UI 测试依赖。

## 18. 测试用例与首次失败

测试共 3 个 `.test.ts` 文件和 1 个 helper，最终 33 个用例：

- Repository：Seed、恢复、损坏/版本回退、保存失败、并发、reset、防御性副本。
- Video：输入、隔离、上传进度、幂等/并发、完成唯一 Task、失败/canceled 重传、删除、Abort。
- Analysis：上传前拒绝、start/retry 并发、完整阶段、完成唯一 Result、固定失败、retry、重启追赶。
- Statistics/Home：动态聚合、分析完成后的统计变化、delete/reset、empty 隔离、三种错误组合、
  unknown/Abort。

首轮 25 个用例中 22 个通过、3 个失败：两个 Repository 测试构造了无效关联快照；分析测试在
Seed 初始化前推进 Clock；fake timer 拒绝预期注册较晚产生 unhandled rejection。修正测试数据、
初始化顺序和 Promise 处理，并将任意 Storage 写异常统一映射为 DEMO_DATA_SAVE_FAILED。第二轮
25/25 通过。并发自查后又将 upload/analysis 状态判断移入写队列，并补充 canceled 重传、分析
完成后的统计变化、并发 retry 等用例至 33 个，最终通过。

## 19. 自动验证结果

- Vitest：3 个测试文件、33 个用例通过，退出码 0；最终运行 581 ms，tests 118 ms。
- Mobile lint：通过，退出码 0；实现初次 lint 虽退出 0，但有 5 条空接口/数组风格警告，已改为
  type alias 和 readonly array，最终无警告，未使用 lint disable。
- Mobile typecheck：通过，退出码 0。
- 根 lint：通过，Mobile、Web、shared-types 均完成，退出码 0。
- 根 typecheck：通过，三个 workspace 均完成，退出码 0。
- 根 format check：通过，所有匹配文件符合 Prettier，退出码 0。
- Web build：通过，Vite 8.1.4 转换 35 个模块，最终构建 166 ms，退出码 0。
- Android export：最终复验通过，1476 个模块、27 个 assets、1 个 bundle、1 个 metadata，共 29
  个输出文件；最终命令 13.8 s，系统临时目录已删除。
- Metro：最终 `/status` 严格得到 `packager-status:running`；只关闭本轮进程树，8081 最终监听数
  为 0，两个临时日志已删除。
- git diff check：最终通过，无空白错误。

Metro 首次探测未启动进程，因为 PowerShell 不允许 stdout/stderr 重定向到同一文件，随后脚本
超时；没有产生 8081 listener。第二次 Metro 实际启动成功，但 PowerShell 将响应解析为 byte[]，
字符串比较误判；该轮进程、端口和日志均已清理。第三次增加 UTF-8 解码后严格通过。失败过程未
隐藏。

## 20. 未执行验证、已知问题与风险

未执行 Android/iOS 真机或模拟器人工交互、视觉验收、iOS export 或发布构建。页面没有业务接入
和轮询，状态只在下次 Service 访问时物化。AsyncStorage 不提供跨多个 JS runtime 的事务，本 Demo
假设单 App JS runtime。当前结果为固定 Demo 数据，不代表 CV 或真实算法能力。

## 21. 下一阶段条件与 Git 状态

阶段 6-B 已完成完整验证，下一步进入阶段 6-C 简化修正检查。后续页面接入应使用 TanStack Query
Mutation 和上述失效规则；Real API 另建 DTO/Adapter/Real Service。

所有改动保持未暂存、未提交；未执行 add、commit、push、pull、merge、rebase、reset、clean、
checkout、restore 或 stash。当前分支为 `feature/stage-06-mock-data-services`，暂存区为空；唯一
范围外未跟踪项仍为用户管理的 `other_docs/网球视频分析前端Demo详细开发计划书.md`，未读取或
处理。

## 22. 阶段 6-C：简化修正检查与提交前收口

### 22.1 检查范围与日期

- 检查日期：2026-07-14。
- 分支与基线：`feature/stage-06-mock-data-services`，HEAD `571a661`。
- 完整读取 Demo Data、Video、Analysis、Statistics、测试、首页兼容入口、配置、依赖、阶段 6
  文档和 shared-types 实际定义；首页与 shared-types 只读。
- 开始时阶段 6-B 改动未提交、未暂存，无意外删除；用户 `other_docs` 未跟踪文件未读取或处理。

### 22.2 单例、依赖与队列结论

- `demo-data/index.ts` 只创建一个生产 DemoDataRepository；三个 Mock Service 通过稳定出口共享。
- Service 没有分别 new Repository；AsyncStorage Adapter 只有一个生产实现。
- Repository 不依赖 React、Router、QueryClient 或 Auth Provider，未发现循环 import 风险。
- getSnapshot、update、reset、reconcile 共用单一 Promise 写队列，内部纯 reconcile 不重新 enqueue，
  未发现嵌套队列死锁。
- 并发 create、startUpload、startAnalysis、retry、reset/update 均由调用入队顺序决定，不混合
  Snapshot；delete 在 reconcile 后级联清理，不会复活实体。

### 22.3 发现的问题与根因

未发现高风险问题。发现三个中风险问题和一个测试质量缺口：

1. 初始化失败恢复：普通 Storage read 或首次 Seed write 失败后，`initialization` 会永久保留
   rejected Promise，后续调用无法重新初始化。根因是 await rejection 后没有释放同一个 Promise。
2. 时间倒退：上传按当前 elapsed 重新计算进度，分析按当前 elapsed 重新选择阶段；设备时间倒退
   会覆盖已经持久化的较高进度。根因是 reconcile 只 clamp 到零，未与实体已有进度取最大值。
3. Schema 关联：已有 Schema 只验证 runtime → entity，未验证 active entity → runtime，也未完整
   约束 terminal 状态、Result/succeeded Task、summary 数量、重复 ID 和 Point/Rally 双向引用。
4. 测试缺口：未直接覆盖初始化并发/失败重试、提交点之后 Abort、Storage key、时间倒退、严格
   Schema、reset/update 顺序和 delete/reconcile 顺序。

### 22.4 实际修正

- `DemoDataRepository.ts`：初始化失败时仅释放当前 rejected initialization Promise，使后续调用
  可重试；Storage read 失败归一化为 `DEMO_DATA_LOAD_FAILED`；候选 Schema 失败归一化为
  `DEMO_DATA_SAVE_FAILED`；无效存储覆盖失败时显式提交内存 Seed 并返回，不保留空 catch。
- `transitions.ts`：上传进度与现有进度取最大值；分析目标进度低于现有进度时保持当前阶段，确保
  系统时间倒退不回退。
- `schemas.ts`：补充重复 Video/Task/Result 与嵌套实体 ID、uploading/runtime 双向关系、uploaded
  进度、active Task/runtime、状态/阶段/进度、succeeded/failed terminal 约束、Result 必须对应
  succeeded Task、summary/数组数量、Shot/Rally/Point videoId 及双向引用；failureStage 固定为
  `ball_tracking`。
- `testUtils.ts`：Memory Storage 增加一次性 read failure 和可控 write gate，测试持久化提交点。
- 新增 `storage.test.ts`，直接测试生产 AsyncStorage Adapter 只访问 Demo key。

### 22.5 Abort 提交边界

Repository 在开始 Storage write 前最后检查 AbortSignal。写入开始后不再检查 signal；写成功后
更新内存并返回成功。因此不会出现“Storage 已提交但调用方收到 AbortError”的模糊结果。排队等待
和写入前 abort 仍会取消且不提交；首页延迟 abort 清 timer/listener，不消耗首次失败。

### 22.6 Schema、Seed 与 Factory 复核

严格 Schema 现在同时检查字段和关联，候选错误不会向 Service 泄漏 ZodError。四类 Seed 均属于
`demo-user-local`，固定实体及 Shot/Rally/Point ID，处理中 startedAt 锚定注入 Clock。Factory 每次
创建新对象，不使用 Math.random、真实路径或隐私。Result summary 与实际数组一致。

### 22.7 上传与分析阈值复核

- 上传 elapsed < 0 按 0；等于 0 保持 0；中间进度最大 99；恰好 duration 时 uploaded/100；超过
  duration 幂等。时间倒退不降低已有进度。
- uploading 重复 start 不重置 startedAt；failed/canceled 可重试；uploaded 拒绝；完成只创建一个
  Task；delete 后不会被 reconcile 恢复。
- 分析阶段数组只在 transitions 中定义一次。每个整倍数阈值进入下一阶段；完成和远超完成均只
  生成一个 Result；时间倒退不回退；failed 固定 ball_tracking；retry 原地复用 ID 且并发只增加
  一次 retryCount。

### 22.8 Service、Statistics 与首页回归

- VideoService 原 `getRecentVideos` 签名保持；list/detail/create/upload/delete 均执行 userId 隔离，
  排序不修改 Snapshot，空 title 继续由既有“未命名训练”展示策略安全处理。
- AnalysisService 通过 Video 校验所有权；非 uploaded 拒绝；active/succeeded 幂等；failed 必须
  retry；Result 不存在返回 null。
- StatisticsService 只聚合当前用户 Video 和对应 Result；处理中/失败无 Result 时不贡献 shots/
  rallies；latestAnalysis 只来自 succeeded Task + Result。
- 首页 success/empty/error/video-error/statistics-error 仍只影响两个首页查询；unknown user 和 Abort
  不消耗错误计数；首页 Hook、UI、query key 未修改。

### 22.9 reset、Auth 与测试质量

reset 只通过生产 Adapter 操作 `tennis.demo.data.v1`，不调用 AsyncStorage.clear，不访问
`tennis.auth.session.v1`、Auth Provider 或 QueryClient。保存失败保留旧内存；成功后 Repository
继续可用。

测试导入真实 Repository、Service、transition 和生产 Storage Adapter，使用 Memory Storage、
MutableClock、确定 ID 和 fake timer；无真实等待、原生存储依赖、宽泛 snapshot、only、skip、todo、
any、ts-ignore 或 lint disable。

### 22.10 新增测试与针对性结果

测试由 3 个文件 33 个用例增至 4 个文件 48 个用例。新增覆盖：初始化并发只读一次、初始化失败
可重试、无效存储覆盖失败内存回退、reset/update 队列顺序、严格 Schema/AppError、时间倒退进度
单调、delete/reconcile、写入开始后 Abort 返回成功、Result summary、Point/Rally 双向引用和生产
Storage key 隔离。

针对性测试最终 4 文件、48 用例通过，退出码 0，Vitest Duration 513 ms、tests 132 ms；Mobile
typecheck 通过。首轮 Mobile lint 退出码 0，但新增 Storage 测试有 1 条 import 顺序 warning；已
按 Vitest hoisted mock 语义调整 import，未使用 lint disable。完整复验结果见下一节。

### 22.11 完整复验、未执行项与提交资格

- Mobile test：4 个测试文件、48 个用例通过；Vitest Duration 536 ms、tests 152 ms；命令退出码
  0，无 only、skip 或 todo。
- Mobile lint：通过，退出码 0，最终无 warning。
- Mobile typecheck：通过，退出码 0。
- 根 lint：通过，Mobile、Web、shared-types 均完成，退出码 0。
- 根 typecheck：通过，三个 workspace 均完成，退出码 0。
- 根 format check：通过，所有匹配文件符合 Prettier，退出码 0。
- Web build：通过，Vite 8.1.4 转换 35 个模块，构建 771 ms，退出码 0。
- Android export：通过，1476 个模块，27 个 assets、1 个 bundle、1 个 metadata，共 29 个输出
  文件；命令退出码 0，系统临时目录已删除。
- Metro：`/status` 返回 `packager-status:running`；只关闭本轮进程树，8081 最终监听数 0，两个
  临时日志已删除。
- `git diff --check`：通过，无空白错误。

仍未执行真机/模拟器人工交互、视觉验收、iOS export、发布构建或尚未接入的页面业务流程。当前
仍为 Mock，状态只在下一次 Service 访问时物化，不代表真实上传、Backend、CV 或完整用户闭环。

阶段 6-C 简化修正检查完成，阶段 6 满足 Demo 提交条件，等待用户执行 Git 提交。所有改动继续
保持未暂存、未提交。
