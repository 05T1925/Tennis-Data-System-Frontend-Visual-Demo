# Mobile Demo Data 模块

本模块是阶段 6 的本地 Mock 业务数据底座。它统一保存 `Video`、`AnalysisTask`、
`AnalysisResult` 及惰性状态推进元数据，供 MockVideoService、MockAnalysisService 和
MockStatisticsService 共享。它不是未来 Real Service 的本地数据库实现。

## Snapshot 与持久化

Snapshot 内含字面量 `version: 1`、三个领域实体数组，以及 uploads/analyses runtime map。Storage
Adapter 只操作 AsyncStorage key `tennis.demo.data.v1`；Auth 使用的
`tennis.auth.session.v1` 不会被读取、覆盖或删除。Timer、Promise、AbortSignal、Query/UI 状态、
视频二进制和认证信息均不持久化。

首次访问只初始化一次。无存储数据时生成 Seed；JSON、版本或 Schema 无效时用 Seed 覆盖。无效
数据覆盖失败时当前进程仍可使用内存 Seed，避免初始化循环。正常保存失败抛出
`DEMO_DATA_SAVE_FAILED`，且内存只在持久化成功后提交。普通读取或首次 Seed 保存失败会清除本次
rejected initialization Promise，后续调用可以重新初始化。

## Schema、Seed 与 Repository

Zod 在读取和写入两侧校验 ID、ISO 时间、枚举、有限数值、0～100 进度、active/terminal 状态、
runtime 双向关联、Result 对应 succeeded Task、summary/数组计数，以及 Video/Task/Result 和
Shot/Rally/Point 的引用完整性。Seed 包含成功、处理中、分析失败和上传失败四条固定视频；处理中
样例的 startedAt 使用注入 Clock 当前时间作为锚点。

Factory 集中创建 Video、Task、Result 和 Seed。生产 Clock 使用真实时间，ID Generator 使用时间戳
与进程内序列，不依赖随机数或 UUID 包；测试注入可变 Clock、顺序 ID 和 Memory Storage。

Repository 使用一个初始化 Promise 和一个 Promise 写队列。所有 reconcile、update 和 reset 共用
该队列，避免并发写覆盖。Service 获得的是 Zod 解析后的防御性副本，不能修改内部数组。

## 惰性推进与 reset

上传和分析不使用后台 Timer。每次 Repository 访问根据 persisted startedAt 和当前 Clock 计算
进度：上传完成时原子创建唯一 Task；分析完成时原子创建唯一 Result。App 重启后下一次访问会
追赶状态。系统时间倒退时保留已经持久化的较高进度，不允许上传或分析阶段回退。

`demoDataService.resetDemoData()` 覆盖本模块 key 并恢复 Seed，不调用 AsyncStorage.clear，不访问
Auth，也不操作 QueryClient。未来页面 Mutation 在 reset 后应失效全部 Demo 业务 Query。

## Mock/Real 与测试

页面和 Query Hook 只依赖 Service，不访问 Repository 或 AsyncStorage。未来 Real Service 应使用
HTTP DTO/Adapter，不复用本 Demo Repository。运行测试：

```powershell
pnpm --filter @tennis/mobile test
```
