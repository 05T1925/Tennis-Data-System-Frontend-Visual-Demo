# 项目状态

最近更新时间：2026-07-17

## 当前阶段

阶段 11-C：Web 后台基础框架代码与文档收口完成，等待关键人工交互验收和独立提交资格判断。
当前分支为 `feature/stage-11-web-dashboard`，HEAD 保持已提交的阶段 10 基线 `66d890c`；阶段 11
改动未暂存、未提交。阶段 11-C 未执行人工浏览器验收；Expo dependency check 保留阶段 10 已
确认的 8 个既有补丁版本例外。

## 状态摘要

Mobile 保持阶段 4 Mock 登录/Session 和阶段 5 首页能力，新增唯一 DemoDataRepository。Video、
Analysis、Statistics 三个 Mock Service 共享 version 1 Snapshot、Zod Runtime Schema、内存状态和
AsyncStorage `tennis.demo.data.v1` 持久化。Auth key 和认证代码未修改。

Web 新增独立 Mock 管理员身份、版本化 sessionStorage、恢复/登录/退出编排、Protected 与
Public-only Guard、根重定向和安全 404。Ant Design 后台 Layout 提供可折叠 Sidebar、Header、
Mock 标识、用户与退出入口；集中导航元数据统一菜单高亮、页面标题和面包屑。TanStack Query
Provider 已建立但没有虚假业务 Query。七个业务入口仍只提供基础结构，不包含视频表格、Task
列表、CV JSON、统计图表或失败重试。

VideoService 已向后兼容扩展列表、详情、创建元数据、模拟上传和级联删除。AnalysisService 支持
开始、查询 Task/Result、确定性阶段推进、ball_tracking 固定失败及原地 retry。StatisticsService
不再维护独立统计 JSON，而是从当前用户 Repository 动态聚合。

上传和分析采用时间戳惰性推进，不运行后台 Timer；App 重启后下次查询会追赶。固定 Seed 包含
分析成功、处理中、失败和上传失败样例。当前仍是 Mock Service/Data 层，Real API、Backend、CV
和数据库均未实现。

Mobile 上传页现支持从系统相册单选视频，覆盖 Native 权限、limited、系统设置、Web 用户手势和
Android pending result。pending result 与用户主动重新选择采用“最新请求优先”保护，避免旧结果覆
盖新草稿；离开确认同一时刻最多弹出一组。页面只接受 MP4/MOV，限制最大 500 MiB，不设置时长
上限；展示文件名、大小、时长和格式，并用 React Hook Form + Zod 收集训练/比赛、单双打、场地和
备注。

上传 workflow 直接复用阶段 6 createVideo、startUpload 和 getVideoById，通过 TanStack Query 每
500ms 读取真实 Mock 进度。公开 success/fail-once 场景提供确定性失败，重试复用同一 videoId；
完成后刷新精确缓存并 replace 到视频详情页。URI 只在页面内存中存在，不进入 Repository 或存储。

Mobile 视频 Tab 现通过一个 listVideos Query 查询当前用户全部视频，再对有效且去重的 videoId
建立独立 AnalysisTask Queries。Feature 私有 View Model 统一上传/分析状态优先级、安全格式化和
六个本地筛选；PageShell 通过现有 ScrollView 的 RefreshControl 支持精确下拉刷新。分析失败任务
可按 videoId 独立 retry，成功后立即写入 queued task cache。视频列表不自动轮询；详情页由阶段 9
使用局部焦点和 AppState 执行受控任务轮询。

阶段 8-C 为手动刷新增加同步 ref 锁与 userId 切换 generation，快速连续触发不会并发进入，旧用户
刷新也不能结束新用户的刷新状态。单卡 retry 错误会依据最新 View Model 自动剪枝，仅在视频仍
存在且 `canRetry` 时保留。独立审查发现的架构、shared-types、环境示例和阶段记录链接事实冲突已
最小修正。

Mobile 视频详情现通过 canonical detail key 查询真实 Video，只在 uploaded 后挂载一个
AnalysisTask Query。queued 在页面聚焦且 AppState active 时每 3 秒查询，processing 每 2 秒；
terminal、query error、页面失焦、inactive 和 background 均停止。焦点或前台恢复形成一次组合
边缘，对 active/null Task 立即查询，不新增页面 timer 或全局 focusManager。

详情失败任务继续调用 `retryAnalysis` 原地重试，成功写入 queued task cache并移除精确 Result
cache。Task succeeded 后 canonical Result Query 自动启用且不轮询，只展示真实 summary 的最多
六项 Demo指标。详情页本身继续只展示简要summary；播放器仍未实现；完整结果由阶段10独立Result
页面提供。

阶段 9-C 将详情 retry状态绑定到当前 identity访问周期：切换userId/videoId会在新渲染提交前清除
旧 pending/error并abort旧Controller；finally只有仍拥有当前Controller的请求才能释放lock，避免
A→B→A时旧请求清除新retry锁。当前没有Hook/UI测试库，该生命周期收口由代码owner约束、静态
审查和完整回归保证，不代表真机焦点或后台恢复已人工验收。

阶段 10 新增受保护的 `/videos/[videoId]/result`独立结果页。结果页通过canonical Video、Task、
Result keys查询同一Service。Task不设置自动轮询；每次结果页挂载时主动核验，错误可手动refetch，
并遵循QueryClient全局重连策略；Result同样不设置自动轮询。只有当前Task succeeded且当前Result
Query success/non-null时才向页面暴露Result，disabled Query中可能存在的旧缓存不会进入指标或
图表。详情摘要仅在同样资格满足时显示完整结果入口。

完整结果固定展示 9 项指标，并用普通 React Native View 实现球速折线、回合柱形、Demo `[0,1]`
相对落点和非百分制能力条。Presentation 纯函数负责格式化、稳定排序、过滤和文字摘要；各分区
独立处理空数据。没有修改 shared-types、Seed、Schema、Service 或阶段 9轮询架构。

## 模块状态

| 模块                    | 状态             | 真实说明                                                    |
| ----------------------- | ---------------- | ----------------------------------------------------------- |
| Mobile Auth             | ✅ 阶段 4 保持   | Auth、Session key、Provider 和路由未修改。                  |
| Mobile 首页             | ✅ 阶段 5 保持   | 两个 Query、五种场景、四态和 UI 未修改。                    |
| Demo Data               | ✅ 阶段 6-C 收口 | 单例 Repository、严格 Schema、可重试初始化、写队列、reset。 |
| Video Service           | ✅ Mock + 列表   | list 接入 Query、场景、筛选、刷新、卡片和详情入口。         |
| Analysis Service        | ✅ Mock 底座     | start/task/result/retry 与惰性阶段推进；无 CV。             |
| Statistics Service      | ✅ 动态聚合      | 从当前 Repository 数据计算首页统计。                        |
| Mobile 上传页           | ✅ Mock 闭环     | 相册选择、表单、进度、fail-once、retry、离开提示和导航。    |
| Mobile 视频列表         | ✅ 阶段 8-C      | 刷新竞态、retry 错误生命周期和文档事实已收口。              |
| Mobile 视频详情         | ✅ 阶段 9-B      | 详情、受控轮询、retry 和简要 Result 摘要已接入。            |
| Mobile 完整结果         | ✅ 阶段 10-C     | 独立审查、文档事实和提交前验证已收口。                      |
| 其他 Mobile 业务页面    | ⏳ 仍为骨架      | 完整统计尚未实现。                                          |
| Web Dashboard           | ✅ 阶段 11-C     | 基础框架代码与文档收口；人工验收待完成，业务数据未接入。    |
| Real API / Backend / CV | ⏳ 未实现        | 当前能力不代表真实上传或分析。                              |

## 数据、并发与安全边界

- Demo storage key：`tennis.demo.data.v1`；Auth key：`tennis.auth.session.v1`。
- Repository 不调用 AsyncStorage.clear，只操作自己的 key。
- 所有写操作串行；持久化成功后才替换内存。
- 所有权通过传入 userId 和关联 Video 验证；未知用户得不到 Demo 用户数据。
- 上传完成只创建一个 Task；分析完成只创建一个 Result。
- reset 恢复确定性 Seed，不退出登录，也不操作 QueryClient。
- Snapshot 不保存二进制、Token、密码、Timer、Promise、AbortSignal 或 UI/Query 状态。

## 测试与依赖

阶段 11-B 为 Web 新增 `antd`、`@ant-design/icons` 和 `@tanstack/react-query` 三个直接依赖，
只修改 Web package 与根锁文件。阶段 7 新增 Expo SDK 兼容的 expo-image-picker `57.0.2` 和
expo-file-system `57.0.0`。阶段 6的
Vitest 与 Mobile `test` script 继续用于纯逻辑测试。测试使用 Node
环境、Memory Storage、可变 Clock 和确定性 ID，不依赖 React Native UI 测试库或原生
AsyncStorage。

阶段 11-B 复验中 Mobile 共 15 个测试文件、287 个用例全部通过。Web 与整仓 lint/typecheck、
format check 和 Web build 通过；构建保留约 979 kB 主 JS chunk 的性能 warning。阶段10所属代码、
测试、lint、typecheck、format、build、export、Metro和diff检查通过；Android 1538 modules/29
files/5,103,216 bytes，iOS 1405 modules/25 files/3,847,712 bytes，临时目录和本轮日志均已清理。

阶段 11-C 再次完成相同 Web 与整仓 lint/typecheck/format/build，并保持 Mobile 15 个测试文件、
287 个用例通过；`git diff --check`无输出。Vite 在5173完成十个路径的SPA fallback复验并清理进程、
日志和dist。阶段 11-C 未执行人工浏览器验收。

`expo install --check`仍报告8个既有Expo包需要对齐新的推荐补丁版本；所有当前版本与HEAD相同，
阶段10未修改package、workspace或锁文件。该项作为已知基线例外，不阻塞本次Demo提交；后续通过
独立maintenance任务处理。本阶段未新增、删除或升级依赖。

## 当前限制与风险

- 当前上传只模拟元数据和状态，不传输真实视频字节。
- Expo Go 可验证选择流程，但自定义原生权限配置仍需 Development Build/原生构建确认。
- FileSystem 对不同平台 content URI 的大小回退仍需真机验证。
- 视频详情使用局部导航焦点和 AppState 控制轮询；视频列表仍不轮询，上传页继续使用阶段 7 detail
  Query 轮询。Repository 状态仍只在下次 Service 访问时物化。
- AsyncStorage 不提供跨多个 JS runtime 的数据库事务；当前 Demo 假设单 App JS runtime。
- 新建上传默认成功；公开 `fail-once` 场景让新建 idle Video 首次上传失败，同一 Video 重试成功。
- 首页统计现从实际 Seed 聚合，因此数值与阶段 5 独立写死数据不同，但接口和状态行为保持兼容。
- 视频列表 Seed 的活动任务会在约 7 秒内惰性完成，queued/processing 的人工观察依赖重新 Seed 或
  失败任务 retry。
- 未执行 Expo Web、Expo Go、Android/iOS 真机、Development Build 或视觉交互验收。
- CourtPoint 正式坐标契约和 PlayerProfile 范围仍未确认；当前只作 Demo 相对示意。
- 普通 View 折线和响应式布局尚未在真机人工验收。
- 当前没有相机、真实上传、播放器或真实算法。
- Web Mock 登录不是正式权限系统，Route Guard 不是服务端授权；会话只在当前标签页有效。
- Web 与 Mobile 不共享运行时数据，Web 不访问 Mobile DemoDataRepository。
- Web 尚无 UI 自动测试；除根重定向和登录页外的人工交互及 1024～1920px 布局未验收。

## 下一阶段条件

- 阶段 10 已提交为 `66d890c`。
- Expo Web、Expo Go、Android/iOS真机和Development Build人工验收仍未执行，不能据此声明真机
  体验通过。
- Expo 补丁对齐继续作为独立 maintenance 任务，不属于阶段 11 代码范围，也不阻塞阶段 11 基础
  框架审查。
- 阶段 11-C 代码与文档收口完成，等待人工认证、路由和导航验收后再判断提交资格；阶段 12 尚未
  开始。
- Real API 接入时新增 DTO/Adapter 和 Real Service，不让页面或 Repository 承担传输转换。
