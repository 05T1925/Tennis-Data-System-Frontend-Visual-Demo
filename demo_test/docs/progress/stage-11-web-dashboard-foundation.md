# 阶段 11：Web 后台基础框架

## 1. 阶段信息

- 阶段：11-B
- 英文标识：`web-dashboard-foundation`
- 日期：2026-07-16

## 2. 分支

`feature/stage-11-web-dashboard`

## 3. 基线

HEAD `66d890c`，提交标题 `feat(mobile): complete analysis result workflow`。

## 4. Git 开始状态

本地分支与 `origin/feature/stage-11-web-dashboard` 一致；工作区、暂存区和未跟踪文件均为空。

## 5. 阶段 11-A 结论

Web 已有 React/Vite/TypeScript/React Router 脚手架、单一 Router、基础 Layout 和占位页面。本阶段
在原结构增量实现，不重新初始化工程。

## 6. 原始要求去重

保留既有 Router、页面、CSS 入口和 `DashboardLayout`；本阶段补齐身份、Provider、后台壳和页面
入口。视频、任务、CV、统计业务数据推迟，不重建 Vite、shared-types 或 Mobile 能力。

## 7. 本阶段准确范围

Web Mock 管理员身份、当前标签页会话恢复、路由保护、Ant Design 后台壳、QueryClient、集中导航
元数据、基础页面和 404。

## 8. 后续阶段范围

- 阶段 12：Web 视频管理、筛选和视频详情。
- 阶段 13：分析任务、CV 原始数据、结构化结果和失败重试。
- 阶段 14：统计看板和开发数据控制。

## 9. 修改前 Web 状态

`/` 直接渲染概览，登录页和业务页面均为占位；没有 Auth、Guard、QueryClient、Ant Design、CV
路由或 404。

## 10. 依赖决定

只批准 `antd`、`@ant-design/icons`、`@tanstack/react-query`，没有引入表单、状态、图表或测试库。

## 11. 安装命令

`pnpm --filter @tennis/web-dashboard add antd @ant-design/icons @tanstack/react-query`

## 12. 实际依赖版本

- `antd`：6.5.1
- `@ant-design/icons`：6.3.2
- `@tanstack/react-query`：5.101.2

安装出现 `uuid@7.0.3` 传递依赖 deprecated 提示和一次 registry 慢请求；没有升级既有直接依赖。

## 13. Provider 层级

`StrictMode → ConfigProvider → WebQueryProvider → WebAuthProvider → RouterProvider`。ConfigProvider
覆盖登录与后台，Guard/Layout 可读取 Auth。

## 14. QueryClient

通过 `useState` 每个 App 生命周期创建一次。默认 `retry: false`、`staleTime: 60s`、`gcTime: 30m`、
关闭窗口聚焦请求、开启重连请求。本阶段没有业务 Query 或 Devtools。

## 15. Mock 管理员

从 `@tennis/shared-types` 包根使用 `User`，ID 为 `demo-web-admin`，显示名为 `Demo 管理员`，角色为
合法 `admin`。

## 16. Mock 凭据

邮箱 `admin@tennis.local`，密码 `TennisAdmin123!`，均为公开本地 Demo 值，不是真实秘密。

## 17. Session 结构

只保存 `{ version: 1, userId: 'demo-web-admin' }`，不保存密码、完整 User、Token、错误或 Router/Query
状态。

## 18. sessionStorage 策略

Key 为 `tennis.web.admin.session.v1`。刷新可恢复，关闭标签页后自然失效。损坏、版本错误或未知
userId 会清理并回到未登录；Storage 不可用映射为安全错误。

## 19. Auth Provider

管理 restoring/authenticated/unauthenticated、当前 User、操作类型和 AppError。登录先保存再更新
身份；退出先执行 Mock logout 再清理；同步 ref 锁防止重复操作。

## 20. Guard

Protected Route、Public-only Route 和 Root Redirect 在恢复期间显示中性 Spin，使用 replace 跳转，
页面和 Provider 不直接导航。

## 21. 路由表

`/`、`/login`、`/overview`、`/videos`、`/videos/:videoId`、`/analysis-tasks`、`/cv-data`、
`/statistics`、`/system`、`*`。

## 22. 根重定向

已登录进入 `/overview`，未登录进入 `/login`，恢复完成前不提前跳转。

## 23. 404

公共安全回退根据身份提供返回总览或返回登录，不暴露 Router 内部错误。

## 24. 导航元数据

单一 `navigation.tsx` 管理路径、菜单 key、名称、图标、标题和面包屑。动态视频详情高亮视频管理并
显示“视频管理 / 视频详情”。

## 25. Dashboard Layout

复用并升级既有 Layout，使用 Ant Design `Layout/Sider/Header/Content/Menu`，不承载业务数据。

## 26. Sidebar

展开 240px、折叠 80px、`xl` breakpoint、可手动折叠；包含总览、视频、任务、CV、统计和系统。

## 27. Header

显示折叠按钮、标题、面包屑、本地 Mock、Demo 用户、管理员身份和退出入口；无通知、服务器状态或
Token。

## 28. Content

统一浅灰背景、16～24px padding、`min-width: 0`、内部滚动，最大内容宽度 1600px。

## 29. 页面基础结构

总览提供真实范围和模块入口；视频、任务、统计使用统一空状态；详情安全截断 videoId；CV 明确
CvOutput/AnalysisResult 边界；系统只展示公开静态事实；所有页面不查询或伪造业务数据。

## 30. 响应式

通过 Sider breakpoint 和 1100/900/680px CSS 规则覆盖 1024～1920px 目标；真实多宽度浏览器矩阵
因浏览器控制中断未执行。

## 31. shared-types 复用

只从包根导入 `User` 和 `AppError`，未修改 shared-types，未创建重复 Web User 模型。

## 32. 安全边界

Mock Auth 与 Route Guard 不是正式授权；不生成/保存 Token，不 fetch、不接 Backend/Supabase，不
导入 Mobile、不读取 AsyncStorage 或 DemoDataRepository，不展示技术错误。

## 33. 新增文件

新增导航元数据、两个 Provider、七个 Auth 模块文件和 README、ModulePlaceholder、CV 页面、404
页面及本记录。

## 34. 修改文件

修改 Web package/根锁文件、main、router、PageIntro、DashboardLayout、七个既有页面、两份 CSS，
以及 README、ARCHITECTURE、PROJECT_STATUS。`App.tsx` 保持不变。

## 35. 删除文件

无。

## 36. 依赖和锁文件

直接依赖只新增批准的三项；仅 `apps/web/package.json` 和根 `pnpm-lock.yaml` 有依赖变化，无第二锁
文件，Mobile 依赖不变。

## 37. 配置变化

Vite、TypeScript、ESLint、根 package、workspace、env 示例和 AGENTS 均未修改。

## 38. 自动验证

- Web lint：通过，0 warning。
- Web typecheck：通过。
- Web build：通过；主 JS 约 979.22 kB、gzip 312.83 kB，有 500 kB chunk warning。
- 根 lint/typecheck/format check/Web build：通过。
- Mobile：15 files、287 tests 通过。
- Expo check：退出码 1，仅阶段 10 相同 8 个补丁版本差异。

## 39. Vite 运行验证

阶段 11-B 最终正式验证使用 5173，根 PID 为 30996。`/`、`/login`、`/overview`、`/videos`、
`/videos/demo-video`、`/analysis-tasks`、`/cv-data`、`/statistics`、`/system`、
`/not-found-demo` 均返回 HTTP 200 和 `text/html` SPA fallback。停止后 5173 和 5174 监听均为 0，
本轮日志已删除。HTTP 200 只证明 Vite 与 SPA fallback 加载，不证明认证、跳转、菜单高亮或 Session
交互通过。

## 40. 人工验证

浏览器实际确认未登录 `/` 重定向 `/login`、登录页内容完整且修正 Ant Design 6 弃用属性后控制台
无 warning。浏览器控制随后重复中断；登录、退出、其他导航、1024～1920px、键盘与完整控制台
矩阵未执行。

## 41. 未执行项

正确/错误凭据提交、Demo 快捷登录、恢复、退出、浏览器后退、标签页失效、各后台页面交互、侧栏
折叠和全部目标宽度人工验收未执行。没有 Web UI 自动测试框架。

## 42. 已知风险

Mock 身份不是生产授权；会话只在当前标签页；Web 与 Mobile 数据不同步；Web 尚无业务数据和 UI
自动测试；Backend/CV/Real API 未接入；Ant Design 初始 bundle 有 chunk size warning。

## 43. 阶段 12 前置条件

先完成阶段 11-C 独立审查和必要人工验收，再通过 Web Service/Query 接入视频管理；不得访问 Mobile
Repository。

## 44. Git 最终状态

分支和 HEAD 保持不变，阶段 11 文件未暂存、未提交；最终命令输出以本阶段交付报告为准。

## 45. 阶段 11-C 待检查项

重点检查 session 损坏/Storage 失败、操作锁、重定向循环、动态详情高亮、退出失败保留身份、Ant
Design 6 兼容、1024～1920px 布局、键盘可达性、bundle warning 及所有禁止范围。

## 46. 阶段 11-C 独立审查范围

审查日期为 2026-07-17。

独立审查覆盖 Provider、QueryClient、Mock Auth、sessionStorage、登录/恢复/退出编排、Guard、
Router、导航元数据、Dashboard Layout、基础页面、依赖、Git 范围、自动验证、Vite 证据和文档。

## 47. 独立审查结论

阶段 11-B 核心架构通过，不需要重写 Auth、Router、Provider、Dashboard Layout 或页面主体结构。

## 48. 发现的问题

1. 404 在 Auth restoring 期间错误显示“返回登录”。
2. 阶段记录中的 Vite 端口、PID、进程和日志描述与最终正式证据不一致。
3. ARCHITECTURE 保留两处阶段 10 的 Web 旧事实。
4. PROJECT_STATUS 的阶段 10 提交和阶段 11 前置条件已经过期。
5. 核心人工交互矩阵尚未完成。

## 49. 404 恢复状态修正

只修改 `apps/web/src/pages/NotFoundPage.tsx`。修改前 restoring 被暂时视作未登录；修改后先显示
`AuthRestoringView`，恢复完成后再按 authenticated/unauthenticated 显示返回总览或返回登录。页面
不读取 Storage，没有新增 timer，也没有改变 Router 结构。

## 50. Vite 证据统一

阶段 11-B 最终正式证据统一为 5173、根 PID 30996；十个目标路径均返回 200 `text/html`；停止后
5173/5174 监听均为 0，本轮日志已删除。HTTP 结果不代表浏览器交互通过。

## 51. 文档事实修正

ARCHITECTURE 已改为 Web 基础框架完成但业务数据未接入，并明确阶段 12 尚未开始。PROJECT_STATUS
已改为阶段 10 提交 `66d890c`、阶段 11-C 收口和人工验收待完成；Expo 补丁对齐保留为独立
maintenance 任务。

## 52. 阶段 C 自动复验

- Web lint、typecheck、build：退出码 0。
- 根 lint、typecheck、format check、Web build：退出码 0。
- Mobile：15 个测试文件、287 个用例通过，退出码 0。
- `git diff --check`：无输出，退出码 0。
- fetch、Axios、Mobile 边界、localStorage、危险代码和 shared-types 深层导入扫描均无匹配；
  sessionStorage 只命中批准的 Storage 模块。
- Expo dependency check：退出码 1，只包含阶段 10 相同的 8 个补丁版本差异。
- Web build 保留约 979.22 kB、gzip 312.83 kB 的 chunk size warning，不属于构建失败。
- Vite 使用 5173，根 PID 35472、监听 PID 19688；十个目标路径均为 200 `text/html`。停止后
  5173/5174 监听均为 0，日志已删除。

## 53. 人工验收状态

阶段 11-C 按用户决定跳过人工浏览器验收。认证、保护路由、恢复、退出、404、导航、高亮、
1024/1440/1920px 布局、键盘和控制台矩阵均记为未执行，不据此判断提交资格。

## 54. Git 最终状态

分支保持 `feature/stage-11-web-dashboard`，HEAD 保持 `66d890c`。暂存区为空，阶段 11 全部改动
未提交。阶段 11-C 只修改 NotFoundPage、ARCHITECTURE、PROJECT_STATUS 和本阶段记录；Mobile、
shared-types、阶段 0～10 记录、API、Data Model、PRD、根 package 和 workspace 均无变化。

## 55. 阶段 11 当前资格

阶段 11-C 代码和文档收口完成，等待用户完成人工认证、路由和导航验收后再判断提交资格。
