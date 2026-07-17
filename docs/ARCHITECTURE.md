# 架构说明

## 1. 当前已实现架构

当前仓库是 pnpm monorepo，已存在两个可运行前端脚手架和一个轻量共享类型包：

```text
apps/mobile (@tennis/mobile)
        ├─ Expo Router Protected Routes 与四个底部 Tab
        ├─ TanStack Query Provider 与首页独立 Query
        ├─ 相册视频选择、上传表单与 Upload Query/Mutation workflow
        ├─ 视频列表 Query、AnalysisTask useQueries 与列表 View Model
        ├─ 视频详情 Query、单 AnalysisTask observer 与 Result 摘要
        ├─ 独立 Result 路由、非轮询 Task 状态核验与普通 View 静态图表
        ├─ React Context Mock Session 状态与流程编排
        ├─ AuthService / MockAuthService
        ├─ VideoService / MockVideoService ──────┐
        ├─ AnalysisService / MockAnalysisService ├─ DemoDataRepository
        ├─ StatisticsService / MockStatisticsService ─┘
        │                                  ├─ 内存 Snapshot + 写队列
        │                                  ├─ Zod Runtime Schema
        │                                  ├─ AsyncStorage tennis.demo.data.v1
        │                                  ├─ Seed / Factory / Clock / ID
        │                                  └─ 惰性上传与分析状态推进
        ├─ Zod 校验与 AsyncStorage Session 持久化
        ├─ Mobile 主题与环境配置
        └─ import type ─┐
                        ├─ packages/shared-types
apps/web                │
(@tennis/web-dashboard) ┘
        ├─ Ant Design ConfigProvider
        ├─ 单例 TanStack QueryClient Provider
        ├─ Web 独立 Mock Auth Context + sessionStorage
        ├─ React Router Guard 与集中导航元数据
        ├─ Dashboard Sidebar / Header / Content
        └─ Web 主题、基础页面与环境配置
```

Mobile 当前已具备可恢复的 Mock 登录闭环、首页产品切片，以及统一的本地 Demo 业务数据与
Service 底座。上传页现已接入相册选择、元数据校验、业务表单、Mock 上传进度和失败重试；视频
列表和视频详情已经接入业务，详情包含受控任务轮询和简要 Result 摘要；独立完整结果页已展示
9项指标和四类静态可视化，完整统计仍未接入。Web 已建立 Mock 管理员身份、受保护后台框架，并在
阶段 12-B 接入 Web 私有视频管理数据层、筛选分页和基础详情；Task Result、CV 和统计仍未接入。

Web 视频数据流为 `Page → Query Hook → Web VideoService → MockWebVideoService →
WebDemoDataRepository → localStorage`。Repository 使用 version 1 Snapshot、Zod Runtime Schema、
串行写队列和 `tennis.web.demo.data.v1` 独立 key；不访问 Mobile Repository、AsyncStorage 或 Mobile
Query keys。列表在 Service 层完成搜索、状态/日期筛选、排序和分页，详情只返回 Video 与可选
AnalysisTask，单条删除在一次 Snapshot 更新中级联关联 Task。本阶段不接入 Result、CV、轮询或 HTTP。

## 2. 当前前端边界

### Mobile App

`apps/mobile` 面向普通网球用户。当前采用 Expo 57、React Native 0.86、Expo Router 和
TypeScript，路由位于 `app/`，公共代码位于 `src/`。根布局通过 `SafeAreaProvider` 和
`AuthSessionProvider` 提供应用级上下文，并使用 `Stack.Protected` 将未登录可访问的登录路由
与登录后可访问的 Tabs、上传页、视频详情页和完整结果页分开。四个底部 Tab 使用稳定的 Expo Router
`Tabs`，非 Tab 页面仍由根 Stack 管理。

`AuthSessionProvider` 保留阶段 3 的单一 Auth Context，只负责 `restoring`、`authenticated`、
`unauthenticated` 状态以及登录、恢复和退出编排。认证行为由 `AuthService` 定义，当前
`MockAuthService` 使用固定延迟和固定账号场景；AsyncStorage 的具体读写、Zod Session 校验和
错误映射均位于独立模块。页面负责表单和交互，不直接访问 Service 或 Storage。

Session 使用 `tennis.auth.session.v1` key，并在持久化对象内部保存 `version: 1`、Mock token 和
`User`；不保存密码。Provider 保存 Session 成功后才进入登录态，退出清理成功后才清除内存身份。
启动恢复完成前根布局不挂载受保护路由，避免登录页或主应用闪烁。损坏 Session 会尝试清理，
清理失败也会结束恢复并回到登录页。该能力仍是公开 Demo 凭据构成的 Mock 认证，不具备正式
认证安全性。

根 Provider 在 `SafeAreaProvider` 与 `AuthSessionProvider` 之间加入独立 `QueryProvider`。
`QueryClient` 只稳定创建一次；默认关闭自动 retry，`staleTime` 为 60 秒，缓存回收时间为 30
分钟。QueryProvider 不读取或修改 Auth，恢复完成前首页不会挂载，也不会提前查询。

首页使用两个包含 `userId` 的独立 Query：最近视频与首页统计。一个请求失败不会覆盖另一个的
成功数据，手动重试只 refetch 失败分区。VideoService 负责最近视频排序和 limit，
StatisticsService 负责累计统计、最近分析投影和数值归一化；页面不得直接读取 Mock 数据或从
最近 3 条视频推算总统计。当前 Mock 场景为固定 700 ms 延迟，并支持 success、empty、error、
video-error 和 statistics-error。错误场景首次失败后可通过真实 refetch 恢复，不使用随机失败。
Mock 视频和统计只对固定 Demo User 返回数据，未知 userId 分别返回空视频和零统计，避免把 Demo
用户数据无条件暴露给其他查询身份。被取消和未知身份的请求不会消耗首次失败次数。

Mock 延迟在正常完成和 Abort 时都会移除 listener，Abort 时同时清除 timeout。Home Query Hook
保留取消异常，并将其他未知异常归一化为 AppError，因此 UI 只展示安全 userMessage。

阶段 6 增加唯一模块级 DemoDataRepository。MockVideoService、MockAnalysisService 和
MockStatisticsService 通过构造函数共享该实例，不需要 React Provider。Repository 保存 version 1
Snapshot，通过 Zod 校验 Video、AnalysisTask、AnalysisResult、runtime 和关联关系；独立
AsyncStorage key 为 `tennis.demo.data.v1`，与 Auth key 完全隔离。

Repository 使用单一初始化 Promise 与 Promise 写队列。候选 Snapshot 在 Zod 校验和持久化成功后
才替换内存，保存失败不会产生部分内存提交。无数据创建确定性 Seed；损坏 JSON、错误版本或
Schema 失败会单次回退 Seed，不递归重试。普通初始化读取/写入失败会释放 rejected 初始化
Promise，后续调用可以重试。reset 只覆盖 Demo key，不清理 Auth。

Runtime Schema 同时约束 active 实体必须具有 runtime、terminal 实体不得保留 runtime、状态/阶段/
进度一致、Result 必须对应 succeeded Task、summary 数量与数组一致，以及 Shot/Rally/Point 双向
引用。候选 Snapshot 校验失败统一映射为 Repository AppError，不向 Service 泄漏 ZodError。

上传和分析使用 persisted startedAt 的惰性时间推进，不使用后台 Timer。每次 Repository 访问会
reconcile：上传完成原子创建唯一 Task，分析完成原子创建唯一 Result；App 重启后下一次访问自动
追赶。系统时间倒退时已持久化进度不回退。测试注入可变 Clock、顺序 ID 与 Memory Storage，不
依赖真实等待或原生 AsyncStorage。

当前没有 Real VideoService、Real AnalysisService 或 Real StatisticsService。未来接入 API 时应在
Service 边界增加 DTO 与 Adapter，处理 snake_case 到 camelCase，保持页面、Query Hook 和领域
消费模型不变；Real Service 不复用 Demo Repository。

阶段 7 新增独立 Upload feature。`useVideoPicker` 通过 expo-image-picker 请求或确认相册权限，只
允许单选 MP4/MOV 视频；expo-file-system 仅在 Picker 缺少大小时通过 `File.size` 读取元数据，
不会读取完整视频内容。相机和麦克风权限由 config plugin 显式关闭，页面不调用相机 API。Android
pending result 与用户主动重新选择共享同一最新请求序号，旧结果不会覆盖更新的页面草稿。

Picker URI 只保存在上传页面的内存草稿中，不进入 CreateVideoInput、DemoDataRepository、
AsyncStorage、storagePath 或 playbackUrl。React Hook Form 与 Zod 负责业务字段，Upload workflow
通过 TanStack Mutation 调用既有 createVideo/startUpload，通过 500ms detail Query 调用
getVideoById 观察阶段 6惰性进度。离开保护使用 Expo Router 对应的 `usePreventRemove`，同一时刻
只允许一组确认提示，成功 replace 前临时 bypass。上传完成仍由 Repository 原子创建唯一
AnalysisTask，页面不调用 startAnalysis。成功后只精确失效视频、首页和 task keys，并 replace 到现
有详情骨架。

阶段 8 在 Videos Feature 内增加 canonical video Query keys、集中状态展示配置和私有列表 View
Model。视频 Tab 使用一个 `listVideos` Query 查询当前用户全部视频，再对有效且去重的 videoId
使用独立 AnalysisTask `useQueries`；单条 task pending/error 只影响对应卡片。状态筛选完全在客户端
执行，不产生新的 Repository 访问。

Videos 与 Analysis Feature 分别拥有 video list/detail、analysis task/retry 的 canonical Query key。
Upload Feature 保留兼容 factory 并委托这些定义，实际 tuple 与阶段 7一致。PageShell 仍拥有唯一
纵向 ScrollView，只通过可选 RefreshControl 支持下拉刷新。刷新精确 refetch 当前用户列表和活动
task 前缀，不清空 QueryClient。

失败分析任务通过现有 `retryAnalysis` Mutation 原地重试。Hook 按 videoId 隔离 AbortController、
loading 和安全错误；成功后将返回的 queued task 直接写入对应 cache，并精确失效首页 overview。
视频列表继续不做自动轮询，也不承载详情数据或 AnalysisResult 展示。

阶段 9 将详情骨架替换为 `useVideoDetail` 和 `VideoDetailContent`。详情 Query 继续使用
`['videos', 'detail', userId, videoId]`；只有 Video 成功且 uploaded 时才启用唯一 Task Query。
Task Query 通过函数式 `refetchInterval` 在 queued/processing 分别使用 3 秒/2 秒间隔，terminal、
error、页面失焦及 AppState 非 active 时返回 false。

详情轮询使用 Expo Router navigation focus subscription 和一个局部 AppState listener，不配置
全局 focusManager。组合环境从 false 恢复为 true 时，对 active/null Task 立即 refetch 一次；初次
挂载、terminal、error 和已有 fetch 不重复。卸载由 Query observer 和 subscription cleanup 收口。

详情 retry 沿用 `retryAnalysis`、canonical task/retry keys 和单视频 Abort/锁。成功后写入 queued
task cache、移除精确 result cache并失效首页 overview；失败保留 Video/Task并精确 refetch Task。
Task succeeded 后 `['analysis', 'result', userId, videoId]` 自动启用，`staleTime: 0` 且不轮询。
Video、Task、Result 和 retry错误分别隔离；详情继续只展示summary，完整结果由阶段10的独立
Result页面承担，播放器仍未实现。

阶段 10 在 Protected Stack 中增加 `/videos/[videoId]/result`。`useAnalysisResult` 复用 canonical
Video detail、Analysis Task 和 Result keys。结果页不设置Task轮询；每次页面挂载时主动核验Video
和Task，错误状态允许手动refetch，并遵循QueryClient的全局重连策略。Task succeeded后才启用
Result Query；Task和Result都不设置refetchInterval、AppState、focus或timer。展示资格同时要求当前
Task Query success/succeeded和Result Query success/non-null，因此disabled Query暴露的旧Result
cache不能进入完整页面。

`analysisResultPresentation.ts` 将9项指标、球速点、Rally柱形、`[0,1]` Demo相对点位和四项能力
画像转换成只读展示数据。图表全部使用普通 React Native View/ScrollView，无SVG、Canvas、动画或
图表库；每个分区独立空状态。CourtPoint只作相对示意，PlayerProfile能力条只表达本次四项相对
高低，不声明百分制、专业评级或算法精度。阶段 11 已建立 Web 后台基础框架；阶段 12-B 已接入
Web 私有视频管理数据层、列表和基础详情。

### Web Dashboard

`apps/web` 面向内部团队。当前采用 React 19、Vite 8、React Router、Ant Design、TanStack Query
和 TypeScript。应用层级为 `ConfigProvider → WebQueryProvider → WebAuthProvider → RouterProvider`；
QueryClient 在 Provider 生命周期中只创建一次；阶段 12-B 的 Web 视频 Query 复用该实例。

Web Auth 使用合法的共享 `User` admin 角色和公开 Demo 凭据，sessionStorage 只保存版本与 Demo
userId。恢复、登录、退出由独立 Context 编排，Storage 损坏或不可用时只向 UI 暴露安全错误。
Protected/Public-only Guard 分别处理后台和登录路由，根路径确定性重定向。该客户端 Guard 不是
服务端授权，也不提供正式权限或 RBAC。

`DashboardLayout` 通过集中导航元数据生成 Sidebar、页面标题、选中项和面包屑；动态视频详情
高亮视频管理。视频列表和基础详情通过 Web 私有 Service、Repository 和 Query Hook 查询确定性
Mock 数据；总览、分析任务、CV、统计和系统页面仍为阶段 11 基础结构。Web 不导入 Mobile 代码，
不读取 AsyncStorage 或 Mobile DemoDataRepository；Real Service 和 DTO Adapter 仍推迟到阶段 15。

### shared-types

`packages/shared-types` 直接导出 TypeScript 源码，现已包含 `User`、`Video`、分析任务、结构化
分析结果和通用错误等 v0.1 核心领域类型，并保留 `AppSurface`、`ProjectStage`。两端通过
`workspace:*` 和统一的 `src/index.ts` 出口解析类型。

shared-types 只承载稳定的跨端类型，不共享 UI、页面组件、Service、DTO Adapter、运行时校验
或业务算法。CV 原始 payload 保持 `unknown`，避免将未确认的 CV 契约伪装为稳定领域模型。
传输层 `ApiResponse<T>` 使用成功/失败可辨识联合：成功分支保证存在 `data: T`，失败分支保证
存在 `error` 且 `data` 为 `null`。该类型边界仍是前端 Draft，不表示 Backend 或 API 已实现。

## 3. 尚未实现的计划架构

以下模块与数据流仍是计划，不是当前实现：

```text
App / Web Dashboard
        ↓
Mock Service 或 Real Service
        ↓
Backend → CV Module → Data Processing
        ↓
CV Output / Analysis Result / Statistics
```

- Backend：计划负责身份、视频、任务、权限、API 与存储协作，尚未创建。
- CV Module：计划产生球场、球员、球和轨迹等原始输出，尚未创建。
- Data Processing：计划生成 Shot、Rally、Point、Analysis Result 和 Statistics，尚未创建。
- Auth 范围已接入 Mock Service、React Hook Form、Zod 和独立 AsyncStorage Session；Mobile 已
  接入 TanStack Query、统一 Demo Repository、Video/Analysis/Statistics Mock Service 和 Vitest
  纯 TypeScript 状态测试。Web 已接入 Ant Design 与 TanStack Query 基础 Provider，但 Real
  Service、Web 业务 DTO Adapter、Zustand 和 Recharts 均尚未接入。

## 4. 分层原则

- 页面组织展示和交互；Service 处理请求；Adapter 转换 DTO；复杂领域逻辑独立于页面。
- Mock Service 与 Real Service 必须遵循相同接口。
- API DTO 与 Domain Model 分离，后端 snake_case 在 Adapter 转换为 camelCase。
- App 与 Web 共享稳定核心类型，不强行共享 UI 和页面。
- `uploadStatus` 与 `analysisStatus` 保持独立生命周期。

## 5. 配置与安全边界

- Mobile 通过静态属性读取 `EXPO_PUBLIC_*`；Web 通过 `import.meta.env.VITE_*` 读取环境变量。
- 两类公开前缀都会进入客户端，不得保存任何密钥、密码或管理员凭据。
- Mobile 的已跟踪 `.env.example` 提供首页、上传和视频列表的公开 Mock 场景示例；真实 `.env`
  不读取、不提交。
- pnpm 11 仅允许 `unrs-resolver` 执行安装构建脚本，配置位于 `pnpm-workspace.yaml` 的 `allowBuilds`。

## 6. 待确认事项

- 正式身份服务、Token 安全存储与刷新、对象存储、上传方式、任务轮询/推送和失败恢复策略。
- Backend、CV 与 Data Processing 的部署和版本契约。
- API 分页、权限、错误码与最终领域模型。
- Mobile 真机兼容性和后续测试策略。
