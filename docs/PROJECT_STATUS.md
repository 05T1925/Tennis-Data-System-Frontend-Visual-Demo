# 项目状态

最近更新时间：2026-07-14

## 当前阶段

阶段 7-C：Mobile 视频选择与 Mock 上传页面闭环的简化修正检查已完成。当前分支为
`feature/stage-07-mobile-video-upload`，所有改动保持未暂存、未提交，等待用户执行 Git 提交。

## 状态摘要

Mobile 保持阶段 4 Mock 登录/Session 和阶段 5 首页能力，新增唯一 DemoDataRepository。Video、
Analysis、Statistics 三个 Mock Service 共享 version 1 Snapshot、Zod Runtime Schema、内存状态和
AsyncStorage `tennis.demo.data.v1` 持久化。Auth key 和认证代码未修改。

VideoService 已向后兼容扩展列表、详情、创建元数据、模拟上传和级联删除。AnalysisService 支持
开始、查询 Task/Result、确定性阶段推进、ball_tracking 固定失败及原地 retry。StatisticsService
不再维护独立统计 JSON，而是从当前用户 Repository 动态聚合。

上传和分析采用时间戳惰性推进，不运行后台 Timer；App 重启后下次查询会追赶。固定 Seed 包含
分析成功、处理中、失败和上传失败样例。当前仍是 Mock Service/Data 层，页面尚未接入完整上传、
列表、详情或结果业务，Real API、Backend、CV 和数据库均未实现。

Mobile 上传页现支持从系统相册单选视频，覆盖 Native 权限、limited、系统设置、Web 用户手势和
Android pending result。pending result 与用户主动重新选择采用“最新请求优先”保护，避免旧结果覆
盖新草稿；离开确认同一时刻最多弹出一组。页面只接受 MP4/MOV，限制最大 500 MiB，不设置时长
上限；展示文件名、大小、时长和格式，并用 React Hook Form + Zod 收集训练/比赛、单双打、场地和
备注。

上传 workflow 直接复用阶段 6 createVideo、startUpload 和 getVideoById，通过 TanStack Query 每
500ms 读取真实 Mock 进度。公开 success/fail-once 场景提供确定性失败，重试复用同一 videoId；
完成后刷新精确缓存并 replace 到详情骨架。URI 只在页面内存中存在，不进入 Repository 或存储。

## 模块状态

| 模块                    | 状态             | 真实说明                                                    |
| ----------------------- | ---------------- | ----------------------------------------------------------- |
| Mobile Auth             | ✅ 阶段 4 保持   | Auth、Session key、Provider 和路由未修改。                  |
| Mobile 首页             | ✅ 阶段 5 保持   | 两个 Query、五种场景、四态和 UI 未修改。                    |
| Demo Data               | ✅ 阶段 6-C 收口 | 单例 Repository、严格 Schema、可重试初始化、写队列、reset。 |
| Video Service           | ✅ Mock 底座     | recent/list/detail/create/startUpload/delete；页面未接入。  |
| Analysis Service        | ✅ Mock 底座     | start/task/result/retry 与惰性阶段推进；无 CV。             |
| Statistics Service      | ✅ 动态聚合      | 从当前 Repository 数据计算首页统计。                        |
| Mobile 上传页           | ✅ Mock 闭环     | 相册选择、表单、进度、fail-once、retry、离开提示和导航。    |
| 其他 Mobile 业务页面    | ⏳ 仍为骨架      | 完整列表、详情、结果和完整统计尚未实现。                    |
| Web Dashboard           | ⏳ 占位          | 源码未修改。                                                |
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

阶段 7 新增 Expo SDK 兼容的 expo-image-picker `57.0.2` 和 expo-file-system `57.0.0`。阶段 6的
Vitest 与 Mobile `test` script 继续用于纯逻辑测试。测试使用 Node
环境、Memory Storage、可变 Clock 和确定性 ID，不依赖 React Native UI 测试库或原生
AsyncStorage。

当前 Mobile 共 7 个测试文件、88 个用例，除阶段 6 Repository、Video、Analysis 和 Statistics
覆盖外，新增 Asset Adapter、表单 Schema、上传 workflow 与 fail-once 决策测试，并在阶段 7-C
补充 pending result 竞态和离开确认去重断言。Mobile test、Mobile/整仓 lint 与 typecheck、Expo
dependency check、格式检查、Web build、Android/iOS 静态 export、Metro 和 diff check 均通过；
Mobile lint 最终为 0 warning，详细结果记录在阶段 7 文档。

## 当前限制与风险

- 当前上传只模拟元数据和状态，不传输真实视频字节。
- Expo Go 可验证选择流程，但自定义原生权限配置仍需 Development Build/原生构建确认。
- FileSystem 对不同平台 content URI 的大小回退仍需真机验证。
- 页面失焦没有新增全局 AppState/focusManager；页面卸载会停止轮询，Repository 状态继续推进。
- 上传页通过 detail Query 轮询；其他尚未接入的页面仍只会在下一次 Service 访问时物化状态。
- AsyncStorage 不提供跨多个 JS runtime 的数据库事务；当前 Demo 假设单 App JS runtime。
- 新建上传默认成功；公开 `fail-once` 场景让新建 idle Video 首次上传失败，同一 Video 重试成功。
- 首页统计现从实际 Seed 聚合，因此数值与阶段 5 独立写死数据不同，但接口和状态行为保持兼容。
- 未执行 Android/iOS 真机人工交互或视觉验收。
- 当前没有相机、真实上传、完整视频列表 UI、详情业务、播放器、算法或正式分析结果。

## 下一阶段条件

- 阶段 7-C 简化修正检查完成，阶段 7 满足 Demo 提交条件，等待用户执行 Git 提交。
- 后续页面接入必须通过 TanStack Query/Mutation 调用 Service，并按文档失效业务 Query。
- Real API 接入时新增 DTO/Adapter 和 Real Service，不让页面或 Repository 承担传输转换。
