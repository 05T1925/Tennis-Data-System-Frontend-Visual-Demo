# 阶段 14：Web 总览统计与开发环境 Demo 数据控制

## 1. 阶段信息

- 阶段：14-C
- 日期：2026-07-18
- 状态：四项独立审查问题已最小修正并完成复验，等待最终提交资格判断。

## 2. 分支和基线

分支 `feature/stage-14-web-overview-statistics`，基线 HEAD
`c52caf2e0a42b02d8be517afa227f79c8795d571`，提交标题
`feat(web): add analysis workflow and CV detail`。开始时工作区、暂存区和未跟踪列表为空。

## 3. 去重

复用阶段 11 Router/Auth/Layout/QueryClient、阶段 12 Video Service 与 Query keys、阶段 13 Snapshot
v2、Analysis Service、Result/CV/Logs/Runtime、retry、失败安全文案和完整删除级联。未修改这些既有
模块，也未重建 Router、导航、身份或分析轮询。

## 4. Recharts 决策

经阶段 14-A 审查批准安装 `recharts@3.9.2`。React 19 peer 匹配、类型内置；不安装 @types、Ant
Design Charts、Chart.js 或 D3 完整包。图表只使用命名导入。

## 5. 依赖变化

Web package 只新增精确直接依赖 `recharts: 3.9.2`；根锁文件新增其必要传递依赖。React、React DOM、
Ant Design、TanStack Query、Vite、Vitest 和 Mobile 依赖未升级；根锁文件仍是唯一锁文件。

## 6. Snapshot 数据来源

Statistics Service 单次读取唯一 `WebDemoDataRepository` Snapshot。页面、组件和 Query 不读取
Repository/localStorage，不 filter/reduce Snapshot。Web 与 Mobile 数据仍隔离。

## 7. 七指标口径

总视频为全部 Video；今日新增使用 createdAt；等待分析为 uploaded 无 Task 加 queued；分析中仅
processing；成功仅 succeeded；分析失败仅 Analysis failed；平均耗时只纳入合法 succeeded Task 的
completedAt-startedAt。无耗时样本返回 null，UI 显示 `—` 和样本数 0。

## 8. 本地日期

生产使用浏览器本地自然日，不写死时区。纯 helper 生成日期 key、本地日边界、最近 7 个日历日和
下一本地午夜延迟；DST 通过 setDate 推进。Hook 使用可清理的一次性午夜 timeout 更新 Query 日期 key，
Query function 每次仍从注入 Clock 取得当前时间。

## 9. 最近 7 天趋势

固定返回今天及前 6 天，按早到晚、缺日补 0、Tooltip 单位为个视频。7 天总和为 0 时显示局部 Empty，
创建当前场景后当天 Bar 出现。

## 10. 状态分布

按上传生命周期优先，再按 Task 状态，将每个 Video 唯一归入 waiting_upload、uploading、
upload_failed、upload_canceled、task_not_created、queued、processing、succeeded、analysis_failed、
analysis_canceled。桶总数必须等于总视频。

## 11. 成功率

公式为 `succeeded / (succeeded + failed)`，failed 只指分析失败。Seed 为 60%；零分母返回 null，UI
不显示 NaN、Infinity 或 0/0。

## 12. 时长分布

固定为 `<1`、`1–3`、`3–6`、`6–10`、`>=10` 分钟和数据待确认。0 秒合法；缺失、非有限或负数进入
数据待确认；每个 Video 只进入一个桶。

## 13. 最近列表

最近新增、最近失败和当前处理中各最多 5 条，时间倒序、ID 升序 tie-break。失败列表区分上传失败与
分析失败，分析原因复用安全函数；当前处理中仅展示最近 5 个 queued/processing，DEV 控制使用同一
稳定排序结果的完整 `controllableTasks`，不会截断较旧的合法任务。

## 14. Statistics Aggregator

纯 Aggregator 不依赖 React、AntD、QueryClient、Repository、Date.now 或随机数；不修改输入，返回
新的 View Model，对非法时间、数字和空 Snapshot 防御降级。

## 15. Statistics Service

独立 MockWebStatisticsService 注入 Repository、WebClock 和可选 delay，验证 Demo actor、支持 Abort、
单次读取 Snapshot并规范化安全错误；不访问 QueryClient。

## 16. Statistics Query

Canonical key 为 `['web-statistics','overview',actorUserId,localDateKey]`。staleTime 15 秒、retry false、
聚焦刷新开启、后台 interval关闭。

## 17. 自动刷新

仅 `runtimeActiveCount > 0` 时 Overview Query 每 2 秒刷新；静态 queued/processing Seed 和开发控制
processing 无 Runtime，因此不持续轮询；Runtime 完成或 Query error 后停止。

## 18. Demo DEV 边界

Demo Panel 通过 `import.meta.env.DEV` 条件动态 import。生产 build 不显示控制标题、reset、create 或
force complete，不新增环境变量，也不模拟正式权限。

## 19. Reset

Reset 进入 Repository 写队列，创建确定性 Seed v2、完整校验、只覆盖 Web key，持久化成功后换内存。
写失败保留旧 Snapshot；不操作 Session、Mobile、localStorage.clear 或 QueryClient.clear。

## 20. 三场景

成功场景包含 uploaded Video、succeeded Task、Result、CV 和用户/开发日志；processing 为静态
ball_tracking 55%，无 Runtime/Result/CV；失败场景为可 retry 的 Analysis failed，不冒充上传失败。

## 21. ID 策略

Clock ISO 毫秒生成安全 ASCII 时间基 ID；Repository 写队列内扫描 Snapshot 的 Video、Task、Result、
Shot、Rally、Point、CV 和 Log ID，同毫秒碰撞追加 `-2/-3`。不使用 Math.random、randomUUID 或
Date.now 拼 ID。

## 22. Force complete

只允许 uploaded 且 Task 为 queued/processing。事务先 materialize Runtime，再更新 succeeded/completed/
100、清错、删除 Runtime、复用阶段 13 fixture 生成 Result/CV并追加唯一用户/开发日志。terminal、
重复、缺失实体均拒绝；写失败回滚。

## 23. Repository 原子性

reset/create/force complete 与既有 retry/delete 共用 Promise 写队列。候选完整 Schema 校验并在 Abort
边界后持久化，只有 persist 成功才替换内存；返回完整防御性 Bundle。

## 24. Cache

Reset cancel 三个 Web 前缀后只移除 web-videos/web-analysis并 refetch active Overview。Create/force
只使用 Repository/Service 返回 Bundle 设置精确 detail/task/result/cv/logs，再失效 lists/overview；
retry 和 delete 成功路径也调用统一 Statistics cache helper，以 `refetchType: active` 精确失效
`web-statistics`。失败或 Abort 不执行成功失效；不拼装领域实体、不影响其他视频、不清空 Auth。

## 25. 页面

现有 `/overview`、导航、标题和面包屑保持。页面新增生成时间、手动刷新、七指标、四图、三个最近
列表及 DEV Panel，并覆盖 initial loading、整页 error、空 Snapshot 和局部空数据。

## 26. Recharts 动态 chunk

Overview 通过 React.lazy/Suspense 加载单独 OverviewCharts。14-C build 为 3841 modules；主 JS
1,372.91 kB、gzip 431.26 kB；图表 chunk 383.90 kB、gzip 109.06 kB。基线主 JS 1,354.63 kB、gzip
425.64 kB；主 chunk 增加 18.28 kB、gzip 5.62 kB。保留既有 500 kB warning。

## 27. 响应式

指标和图表使用 minmax Grid；图表容器固定 300px 且 min-width 0；Table 仅内部横向滚动。浏览器在
1024/1440/1920 均确认 document scrollWidth等于 clientWidth，四图非空时容器宽高非 0。

## 28. 测试

新增 9 个测试文件、42 个用例，覆盖 Aggregator、本地日期、Statistics Service/Query/Presentation、
Repository/Data Control、DemoControlService、mutation keys和精确 Cache。Web 最终 24 文件/209 用例；
无新增 UI 测试库。

## 29. 自动验证

Web test、lint、typecheck、build和根 lint/typecheck/format check/Web build通过；Mobile 15 文件/287
用例通过；git diff --check通过。Expo check仍仅报告既有 8 个补丁版本差异并退出 1，未升级依赖。

## 30. Bundle

最终 CSS 8.76 kB、gzip 2.83 kB；主 JS与图表 chunk见第 26 节。图表依赖被隔离，未实施 Router 级拆包。

## 31. Vite

14-C Dev 严格端口 5173，Starter PID 52168、Listening PID 44388，链为
52168→22484→34732→44388。七个指定路径均 200 text/html；stderr为空；停止后 5173/5174 无监听。

## 32. Preview

14-C Preview 严格端口 4173，Starter PID 41600、Listening PID 39144，链为
41600→55764→38512→39144。`/overview` 为 200 text/html；生产 UI 与 JS 均无任何 Demo 控制；停止后
4173/4174 无监听。

## 33. 人工验收

14-C 浏览器确认 Reset 后连续创建两个 processing 得到 7 个活动任务，最近列表保持 5 条，Select
包含全部 7 条；较旧 processing 与 queued Task 均可完成，Task/Result/CV/用户与开发日志正确且
terminal Task 从 Select 消失。retry 后 8.2 秒内返回即显示 Runtime、等待数增加和失败数减少；删除
后 3.2 秒内返回，总视频 24→23且最近列表移除目标。Dev/Preview 真实 SVG、生产控制边界和控制台
均复验通过。

## 34. 未执行项

跨越真实午夜的长时间浏览器等待、真实 Storage quota 失败 UI、terminal Task 通过 UI 重复完成的
明确拒绝，以及 Runtime 每 2 秒的精确中间帧未人工执行；terminal 拒绝和 2000ms policy 由既有
Repository/Query 测试覆盖。删除过程中提前离开已实际触发 Abort，未产生虚假成功。全部历史阶段
13 非阻塞扩展矩阵仍未执行。

## 35. 风险与 Git 状态

localStorage 仍非数据库；ID 时间基策略通过 Snapshot 全 ID扫描和 Repository 生命周期已发行 ID 集
避免删除/reset后复用，同毫秒碰撞追加 suffix；Recharts 增加独立 109.06 kB gzip chunk。分支和 HEAD 保持不变，阶段 14 改动未暂存、
未提交、未推送，暂存区为空。

## 36. 阶段 14-C 最终资格判断

四项独立审查问题已按最小范围修正：retry/delete Statistics invalidation、完整活动任务选择、真实
Mutation key 和项目状态事实。完成自动及人工复验并刷新十三份仓库外材料后，等待最终提交资格
判断；阶段 15、16 均未开始。
