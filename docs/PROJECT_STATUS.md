# 项目状态

最近更新时间：2026-07-14

## 当前阶段

阶段 6-C：统一 Mock 数据服务简化修正检查、必要修正和完整自动复验已完成。阶段 6 满足 Demo
提交条件，等待用户执行 Git 提交。当前分支为 `feature/stage-06-mock-data-services`，所有改动保持
未暂存、未提交。

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

## 模块状态

| 模块                    | 状态             | 真实说明                                                    |
| ----------------------- | ---------------- | ----------------------------------------------------------- |
| Mobile Auth             | ✅ 阶段 4 保持   | Auth、Session key、Provider 和路由未修改。                  |
| Mobile 首页             | ✅ 阶段 5 保持   | 两个 Query、五种场景、四态和 UI 未修改。                    |
| Demo Data               | ✅ 阶段 6-C 收口 | 单例 Repository、严格 Schema、可重试初始化、写队列、reset。 |
| Video Service           | ✅ Mock 底座     | recent/list/detail/create/startUpload/delete；页面未接入。  |
| Analysis Service        | ✅ Mock 底座     | start/task/result/retry 与惰性阶段推进；无 CV。             |
| Statistics Service      | ✅ 动态聚合      | 从当前 Repository 数据计算首页统计。                        |
| Mobile 业务页面         | ⏳ 仍为骨架      | 阶段 6 未修改 App 页面。                                    |
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

阶段 6 新增唯一开发依赖 Vitest `4.1.10` 和 Mobile `test` script。纯 TypeScript 测试使用 Node
环境、Memory Storage、可变 Clock 和确定性 ID，不依赖 React Native UI 测试库或原生
AsyncStorage。

当前阶段 4 个测试文件、48 个用例覆盖 Repository 初始化并发/失败重试/损坏恢复/写失败/并发/
reset、防御性副本，Storage key 隔离，Video 创建/上传/删除/Abort 提交点，Analysis 完整阶段/
失败/retry/Result/重启与时间倒退，以及动态统计和首页五场景。Mobile/整仓 lint 与 typecheck、
格式检查、Web build、Android export、Metro 和 diff check 均通过；详细结果记录在阶段 6 文档。

## 当前限制与风险

- 页面没有轮询，惰性状态只在下一次 Service/Repository 访问时物化。
- AsyncStorage 不提供跨多个 JS runtime 的数据库事务；当前 Demo 假设单 App JS runtime。
- 新建上传默认成功，固定失败通过 Seed 或测试 runtime 表达。
- 首页统计现从实际 Seed 聚合，因此数值与阶段 5 独立写死数据不同，但接口和状态行为保持兼容。
- 未执行 Android/iOS 真机人工交互或视觉验收。
- 当前没有真实视频文件、真实上传、算法或正式分析结果。

## 下一阶段条件

- 阶段 6 已满足 Demo 提交条件，等待用户决定是否执行 Git 提交和推送。
- 后续页面接入必须通过 TanStack Query/Mutation 调用 Service，并按文档失效业务 Query。
- Real API 接入时新增 DTO/Adapter 和 Real Service，不让页面或 Repository 承担传输转换。
