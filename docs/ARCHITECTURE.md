# 架构说明

## 1. 当前已实现架构

当前仓库是 pnpm monorepo，已存在两个可运行前端脚手架和一个轻量共享类型包：

```text
apps/mobile (@tennis/mobile)
        ├─ Expo Router Protected Routes 与四个底部 Tab
        ├─ React Context Mock Session 状态与流程编排
        ├─ AuthService / MockAuthService
        ├─ Zod 校验与 AsyncStorage Session 持久化
        ├─ Mobile 主题与环境配置
        └─ import type ─┐
                        ├─ packages/shared-types
apps/web                │
(@tennis/web-dashboard) ┘
        ├─ React Router 占位路由
        └─ Web 主题与环境配置
```

Mobile 当前已具备可恢复的 Mock 登录闭环和基础产品导航，但不包含正式认证、上传、视频数据、
任务、分析结果或统计业务。Web 页面仍仅验证工程和占位路由。

## 2. 当前前端边界

### Mobile App

`apps/mobile` 面向普通网球用户。当前采用 Expo 57、React Native 0.86、Expo Router 和
TypeScript，路由位于 `app/`，公共代码位于 `src/`。根布局通过 `SafeAreaProvider` 和
`AuthSessionProvider` 提供应用级上下文，并使用 `Stack.Protected` 将未登录可访问的登录路由
与登录后可访问的 Tabs、上传页和视频详情页分开。四个底部 Tab 使用稳定的 Expo Router
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

### Web Dashboard

`apps/web` 面向内部团队。当前采用 React 19、Vite 8、React Router 和 TypeScript。`DashboardLayout` 只提供基础导航，各页面仅说明尚未实现的能力；没有权限保护、数据表格、图表或后台模板。

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
- Auth 范围已接入 Mock Service、React Hook Form、Zod 和 AsyncStorage；业务数据的 Mock/Real
  Service、Adapter、TanStack Query、Zustand、Ant Design 和 Recharts 均尚未接入。

## 4. 分层原则

- 页面组织展示和交互；Service 处理请求；Adapter 转换 DTO；复杂领域逻辑独立于页面。
- Mock Service 与 Real Service 必须遵循相同接口。
- API DTO 与 Domain Model 分离，后端 snake_case 在 Adapter 转换为 camelCase。
- App 与 Web 共享稳定核心类型，不强行共享 UI 和页面。
- `uploadStatus` 与 `analysisStatus` 保持独立生命周期。

## 5. 配置与安全边界

- Mobile 通过静态属性读取 `EXPO_PUBLIC_*`；Web 通过 `import.meta.env.VITE_*` 读取环境变量。
- 两类公开前缀都会进入客户端，不得保存任何密钥、密码或管理员凭据。
- pnpm 11 仅允许 `unrs-resolver` 执行安装构建脚本，配置位于 `pnpm-workspace.yaml` 的 `allowBuilds`。

## 6. 待确认事项

- 正式身份服务、Token 安全存储与刷新、对象存储、上传方式、任务轮询/推送和失败恢复策略。
- Backend、CV 与 Data Processing 的部署和版本契约。
- API 分页、权限、错误码与最终领域模型。
- Mobile 真机兼容性和后续测试策略。
