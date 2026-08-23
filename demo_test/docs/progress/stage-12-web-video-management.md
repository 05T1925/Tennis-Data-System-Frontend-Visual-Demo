# 阶段 12：Web 视频管理与基础详情

## 1. 阶段信息

- 阶段：12-C
- 日期：2026-07-17
- 状态：代码修正、自动验证和人工交互验收完成，等待 ChatGPT 最终提交资格判断。

## 2. 分支

`feature/stage-12-web-video-management`

## 3. 基线 HEAD

`73df9131423a7670d6ba65d3ffe577376a3feeec`

## 4. Git 前置状态

分支与 HEAD 正确；实施前已跟踪工作区干净、暂存区为空。已知用户材料未读取或处理。

## 5. 原始要求去重

复用阶段 11 的 QueryClient、Auth、Router、Layout、导航、详情高亮和 404，不重建应用基础。

## 6. 已完成与推迟范围

完成 Web 视频列表、筛选、分页、详情、Clipboard 和单条删除。retry、Result/CV、reset/统计及
Real API 分别推迟到阶段 13、14、15。

## 7. Web 数据源架构决定

`Page → Query Hook → Web VideoService → MockWebVideoService → WebDemoDataRepository → localStorage`。

## 8. 为什么不使用 Mobile Repository

Mobile Repository 依赖 App 私有目录和 AsyncStorage，身份与 Web 管理员 actor 不同。Web 只共享
`@tennis/shared-types` 包根类型。

## 9. Snapshot

version 1 Snapshot 只含 `videos` 和 `analysisTasks`，不含 Result、CV、runtime、Auth 或 Query 状态。

## 10. Storage key

只使用 `tennis.web.demo.data.v1`，不访问 `tennis.web.admin.session.v1`，不调用 Storage clear。

## 11. Schema

Zod 校验版本、ID、枚举、ISO 时间、有限数值、Task 引用、每 Video 单 Task 和最小状态一致性。

## 12. Seed

固定 24 条 Video，覆盖全部上传状态、not_ready、not_created、全部 Task 状态、4 个 userId、多个日期、
零大小、零时长和长标题；不使用随机数、当前时间、真实路径、URL、个人信息或 Token。

## 13. Service

`listVideos` 负责搜索、筛选、排序、page clamp 和分页；`getVideoById` 返回 Video + 可选 Task；
`deleteVideo` 只删除单条 Web Demo Video 并级联 Task。

## 14. Actor 边界

Mock Service 只接受 `demo-web-admin`，但列表展示多个 `Video.userId`。该校验不是服务端授权。

## 15. Query keys

使用 `all`、`lists()`、`list(actor, params)`、`details()`、`detail(actor, videoId)` 层级。

## 16. URL 参数

参数为 `q/uploadStatus/analysisStatus/from/to/page/pageSize`；默认值不写 URL，非法值规范化，未知参数保留。

## 17. 搜索语义

匹配 Video ID、userId、title、originalFileName，trim、忽略大小写、明确提交，不使用 debounce。

## 18. 上传状态筛选

支持 all、idle、uploading、uploaded、failed、canceled。

## 19. 分析状态筛选

支持 all、not_ready、not_created 及五种 AnalysisStatus，不把上传和分析状态合并。

## 20. 时间范围

使用 `Video.createdAt` 作为“上传记录时间”，采用浏览器本地日历和结束日 next-day exclusive 边界。

## 21. 排序

有效 createdAt 倒序，相同时间按 videoId，非法日期稳定排后，不修改 Repository 数组。

## 22. 分页

page 从 1 开始，pageSize 允许 10/20/50；Service 返回合法 page，页面使用 replace 修正 URL。

## 23. 列表页面状态

覆盖 initial loading、repository empty、filtered empty、full error、stale refetch error、success 和更新状态。

## 24. 基础详情范围

展示 Video 基础字段、上传信息和可选 Task 基础状态；不展示 retry、Result、CV、日志、JSON 或图表。

## 25. Clipboard

使用 `navigator.clipboard.writeText`，处理不可用和 reject，不使用 `document.execCommand`。

## 26. 删除语义

Popconfirm 二次确认；删除非乐观、按 videoId 上锁、持久化成功后更新内存、失败保留旧数据和缓存。

## 27. Cache 失效

删除前精确取消相关 Query；成功 remove detail 并 invalidate lists 前缀；不清空 QueryClient。

## 28. Mock 场景

`VITE_WEB_VIDEO_MOCK_SCENARIO` 支持 success、empty、error-once；固定可取消延迟，不提供场景控制 UI。

## 29. 新增文件

新增 `features/demo-data/**`、`features/videos/**` 及本阶段记录。

## 30. 修改文件

修改两个视频页面、Web env/CSS/package、根锁文件和 README/AGENTS/ARCHITECTURE/PROJECT_STATUS。

## 31. 删除文件

无。

## 32. 依赖变化

新增 `zod@^4.4.3`、`vitest@^4.1.10` 和 Web test script；没有其他直接依赖升级。

## 33. 测试文件和用例

Web 7 个测试文件、88 个用例，覆盖 Schema、Repository、Storage、Service、URL、Presentation、Clipboard。

## 34. 自动验证真实结果

以下命令退出码均为 0：Web test、lint、typecheck、build；根 lint、typecheck、format check、
Web build；Mobile test；`git diff --check`。Web 为 7 个测试文件、88 个用例，Mobile 为 15 个
测试文件、287 个用例。Web build 转换 3248 modules，主 JS 1,293.29 kB、gzip 407.89 kB，
保留大于 500 kB chunk warning。

首次 Web typecheck 因 `erasableSyntaxOnly` 拒绝 5 处构造函数参数属性而失败，改为显式字段后通过。
首次 Web test 有 50 个用例通过，但两个 suite 因 Node 环境导入时访问 window 而失败；Storage
Adapter 改为无浏览器安全初始化后，7 文件/88 用例全部通过。定向 Prettier 首次命令因参数数组
传递错误失败，修正参数 splatting 后完成；`.env.example` 无 parser，最终根 format check 通过。

`expo install --check` 退出码 1，只报告阶段 10 已知的 8 个 Expo 补丁差异，没有新增差异，本阶段
未升级依赖。静态扫描未发现 Mobile/AsyncStorage/Expo/React Native/Axios/真实 fetch、Storage
clear、execCommand、测试 skip/only/todo 或禁止范围 diff；唯一锁文件仍为根 `pnpm-lock.yaml`。

## 35. Vite 运行结果

启动前 5173/5174 无既有监听，本轮使用 5173；Starter PID 37144，监听 PID 14988，进程链为
37144 → 45000 → 41076 → 14988。`/`、`/login`、`/overview`、`/videos`、
`/videos/video-web-demo-succeeded`、
`/analysis-tasks`、`/cv-data`、`/statistics`、`/system`、`/not-found-demo` 均返回 200 text/html。
仅终止本轮进程树，停止后 5173 监听为 0，临时日志已删除。HTTP 200 只证明 Vite 与 SPA fallback，
不代表页面交互通过。初始 cleanup 脚本曾误匹配其 PowerShell 祖先进程并自行终止；后续按明确 PID
完成清理，没有继续操作无关进程。

## 36. 人工验收真实状态

阶段 12-B 截止时待用户人工验收。应用内浏览器两次在读取 DOM 时因执行环境切换中断，未形成可靠登录、列表、URL、
详情、Clipboard、删除、1024/1440/1920、键盘或控制台证据；这些项目均未冒充通过。纯逻辑测试和
HTTP 200 不代表交互通过。

## 37. 未执行项

阶段 12-B 截止时，阶段 12-C、阶段 13～15、Web UI 自动测试和完整浏览器人工矩阵未执行。

## 38. 已知问题和风险

localStorage 不是数据库；Web 与 Mobile 不同步；createdAt 不是精确上传完成时间；没有 Backend/Real API；
没有 Web UI 自动测试；既有 Web bundle warning 可能继续存在。

## 39. 安全边界

不显示 technicalMessage/stack/Storage key，不存 Token，不读真实 `.env`，不读取视频字节或真实 URL。

## 40. 阶段 13 推迟项

Analysis retry、Result、Shot/Rally/Point、CV JSON、任务日志、下载和图表。

## 41. Git 最终状态

分支保持 `feature/stage-12-web-video-management`，HEAD 保持 `73df913`。阶段 12 文件全部未暂存、
未提交、未推送，暂存区为空；没有修改 Mobile、shared-types、阶段 0～11 记录或禁止 Web 基础文件。
本阶段未执行 add、commit、push 或其他 Git 写操作。

## 42. 阶段 12-C 待检查项

重点检查 Schema 关系、Storage 恢复、URL 循环/page clamp、日期时区、placeholder/stale error、删除锁与
Abort、表格布局/无障碍、禁止跨端导入、依赖 diff、文档事实和人工验收状态。

# 阶段 12-C：独立审查问题的最小修正与提交前复验

## 43. 独立审查范围

本轮只修正阶段 12-C 指定的 Storage 导入期访问、Presentation/Mock 分层、非法日期旧数据、
VideoTable 嵌套交互，以及补充授权的 Overview、NotFound、VideoDetail 既有 Link/Button 嵌套。
没有开始 retry、Result、CV、统计、Real API 或阶段 13 及后续功能。

## 44. localStorage 导入期风险与延迟解析

原 Storage Adapter 的默认构造参数会在 Repository 单例创建时读取 `window.localStorage`，getter
异常可能越过 Query/page error 状态。现改为保存可注入的 `StorageResolver`，只在 `read()` 或
`write()` 的 try/catch 内解析 Storage。window 不存在、resolver/getItem 异常映射为安全加载
AppError，resolver/setItem 异常映射为安全保存 AppError；仍只访问
`tennis.web.demo.data.v1`，不访问 Auth session key，也不调用 Storage clear。

## 45. Presentation/Mock 边界修正

新增纯 TypeScript `videoStatus.ts`，集中推导 `not_ready`、`not_created` 和五种 Task status。
Mock Service 与 Presentation 均依赖该纯函数；Presentation 不再导入 Mock Service、Service、
Repository 或 env。

## 46. 非法日期 stale data 隔离

列表 Hook 只在合法日期时启用 Query 和 `keepPreviousData`。页面再以 `dateRangeValid` 显式隔离
可见 data；当 `from > to` 时不显示旧表格、total、empty/filtered-empty 或旧错误，也不执行
page clamp，只保留筛选区和日期错误提示。

## 47. 四个页面的交互嵌套修正

VideoTable 的查看入口改为单一 Button，通过 `onView(videoId)` 交给 VideosPage `navigate()`，并
保留查询参数、Tooltip 和 aria-label。补充授权后，OverviewPage、NotFoundPage 和
VideoDetailPage 的 Link 包裹 Button 也改为单一 Button + `navigate()`。原目标路径、按钮文案、
图标、详情返回查询参数、404 restoring 分支，以及详情删除成功后的 replace 导航均保持不变。

## 48. 测试变化

Web 测试由阶段 B 的 7 文件/88 用例增加为 7 文件/97 用例。新增或强化 Storage resolver 延迟调用、
resolver/getItem/setItem 异常和 Demo/Auth key 隔离测试；状态测试覆盖 `not_ready`、
`not_created`、queued、processing、succeeded、failed、canceled，并验证 Presentation 与 Mock
Service 共用纯状态推导。没有新增 Web UI 测试库，也没有减少既有测试。

## 49. 自动验证

以下命令最终退出码为 0：Web test、lint、typecheck、build；根 lint、typecheck、format check、
Web build；Mobile test；`git diff --check`。Web 为 7 文件/97 用例，Mobile 为 15 文件/287 用例。
最终 Web build 转换 3249 modules，主 JS 1,293.06 kB、gzip 408.12 kB，仅保留大于 500 kB 的
既有 chunk warning。

`expo install --check` 退出码为 1，仅报告阶段 10 已知的 8 个 Expo 补丁版本差异：expo、
expo-constants、expo-file-system、expo-image-picker、expo-linking、expo-router、
expo-splash-screen、expo-status-bar。本轮未升级或修改这些依赖。

## 50. 静态边界扫描

整个 `apps/web/src` 扫描未发现 Mobile/AsyncStorage/React Native/Expo/Axios/真实 fetch、
`document.execCommand`、Storage clear、测试 only/skip/todo、`@ts-ignore` 或 eslint disable。
Presentation → Mock Service、Link > Button、anchor > button、button > anchor、Button href 和重复导航
模式均为 0；结果针对项目运行时源码，不包含文档或第三方代码。

## 51. Vite 最终证据

正式复验命令为 `pnpm web:dev`。启动前 5173/5174 listener 为 0；本轮使用 5173，Starter PID
26380，监听 PID 3700，进程链为 26380 → 18096 → 13344 → 40988 → 28348 → 3700。
`/`、`/login`、`/overview`、`/videos`、`/videos/video-web-demo-succeeded`、
`/analysis-tasks`、`/cv-data`、`/statistics`、`/system`、`/not-found-demo` 均返回
200 text/html。这只证明 Vite 启动和 SPA fallback 正常，不代表页面交互通过。仅按本轮明确
Starter/后代链终止进程；停止后 5173/5174 listener 为 0，临时日志为 0。

正式复验前一次预检已启动 Vite，但因请求使用 IPv4 `127.0.0.1`、服务监听 IPv6 localhost 而在
HTTP 步骤退出；随后根据已确认的本轮链 23652 → 5148 → 24812 → 43684 → 4140 → 24796
逐一清理，端口和日志均归零，没有操作无关进程。正式证据不复用该预检 PID。

## 52. 人工验收状态

用户已完成人工浏览器验收。34 个核心项目全部通过，失败项为 0，覆盖登录和十列表格、24 条 Seed
及分页、四类搜索、上传与分析状态筛选、合法/非法日期、URL 同步和历史恢复、非法参数规范化、
详情导航和查询参数保留、四类单焦点入口与 Enter 导航、Clipboard、取消/确认/持久化删除、详情
删除和 page clamp、1024/1440/1920px、横向滚动、长内容、控制台、交互 warning、退出、Session
恢复与 404 restoring。页面交互结论来自用户人工验收，不由纯函数测试、静态扫描或 HTTP 200 替代。

## 53. 证据事实修正

阶段 B 记录已按正式上传证据纠正 Starter/监听 PID、进程链、详情 SPA 路径、cleanup 事件和构建
体积。阶段 C 的构建体积、PID、进程链和路径使用本轮最终真实输出，不沿用阶段 B 数值。

## 54. Git 最终状态与依赖边界

分支保持 `feature/stage-12-web-video-management`，HEAD 保持
`73df9131423a7670d6ba65d3ffe577376a3feeec`，暂存区为空。阶段 12 改动保持未暂存、未提交、
未推送；阶段 C 没有修改 Mobile、shared-types、阶段 0～11 记录、package、锁文件或依赖，也没有
生成真实 `.env`、第二锁文件或仓库内 Vite 临时日志。本轮未执行任何 Git 写操作。

## 55. 当前提交资格

阶段 12-C 代码修正、自动验证和人工交互验收完成，等待 ChatGPT 最终提交资格判断。
