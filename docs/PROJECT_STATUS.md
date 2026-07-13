# 项目状态

最近更新时间：2026-07-13

## 当前阶段

阶段 3：Mobile 身份导航、Tab 导航和统一页面骨架已建立，自动验证和人工导航验收均已完成。

当前分支：`feature/stage-03-mobile-navigation`

## 状态摘要

Mobile 现已通过 React Context 提供固定 Demo 身份，通过 Expo Router `Stack.Protected` 保护
Tabs、上传和视频详情路由，并建立四个底部 Tab、统一页面容器与基础 UI 组件。身份仅保存在
内存中，App 刷新或重启后恢复未登录。页面只展示产品结构和明确空状态，没有正式认证、真实
视频、上传、分析或统计业务数据。用户已逐项完成 15 项人工页面与导航验收，Demo 登录、四个
Tab、上传页、详情页、退出和返回行为均通过；具体设备平台未在本次记录中确认。

## 模块状态

| 模块                           | 状态              | 真实说明                                                                                |
| ------------------------------ | ----------------- | --------------------------------------------------------------------------------------- |
| Mobile App                     | ✅ 阶段 3 已验收  | Demo 身份、受保护路由、四个 Tab 和页面骨架已实现；15 项人工验收均通过，具体平台未确认。 |
| Web Dashboard                  | ✅ 脚手架已验证   | Vite 可启动和构建；页面仍为占位页。                                                     |
| shared-types                   | ✅ 核心模型已建立 | 核心领域、状态、结果与错误类型统一导出；含类型检查示例。                                |
| Backend / CV / Data Processing | ⏳ 尚未实现       | 未创建。                                                                                |
| Mock Service / Real API        | ⏳ 尚未实现       | 未接入。                                                                                |

## shared-types 当前范围

- 基础：`EntityId`、`IsoDateTimeString`、`ConfidenceScore`。
- 用户与视频：`User`、`Video` 及相关联合类型。
- 分析：`AnalysisTask`、`CourtPoint`、Shot/Rally/Point、`CvOutput`、`AnalysisResult`。
- API 与错误：`ApiResponse`、`ApiErrorPayload`、`AppError`。
- API 响应：`ApiResponse<T>` 是成功/失败可辨识联合；成功保证 `data: T`，失败保证
  `data: null` 和 `error`。
- 保留脚手架兼容类型：`AppSurface`、覆盖 `stage-0 | stage-1 | stage-2` 的 `ProjectStage`。
- `type-tests/models.typecheck.ts` 由 shared-types 的 TypeScript 配置纳入根 `pnpm typecheck`。

上述 API 响应结构仍是前端/接口 Draft，不代表 Backend、Real API 或 Mock Service 已实现。

## Mobile 阶段 3 当前范围

- `AuthSessionProvider` 提供固定 Demo User、`isAuthenticated`、`signInDemo` 和 `signOut`。
- 登录路由仅未登录可访问；Tabs、上传页和视频详情页仅登录后可访问。
- Tab 路由为首页、视频、统计和我的；上传与详情保持为 Stack 页面。
- `PageShell` 统一 Safe Area、滚动、页面间距和可选页脚；页面复用按钮、卡片、空状态和区块标题。
- 页面没有请求、Mock 数组、随机统计、相册权限、文件访问、上传进度或分析结果。
- 登录状态不持久化，不包含 Token、真实账号数据或正式认证能力。

## 可用命令与验证状态

```powershell
pnpm install
pnpm mobile:start
pnpm web:dev
pnpm web:build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

- Mobile 定向 lint/typecheck、根 lint/typecheck、format:check、web:build 和 diff 检查：通过。
- `pnpm mobile:start`：Metro 报告 `http://localhost:8081`，curl 状态为
  `packager-status:running`；验证后主动关闭且 8081 无监听。
- Expo Android export：通过，1241 个模块成功打包；临时产物已删除。
- Expo Web 首屏加载返回 HTTP 200，修正后的根路由没有运行时路由警告。
- 未配置测试框架或测试命令；未声称自动化测试通过。
- 用户已完成 15 项人工页面与导航验收，Demo 登录、四个 Tab、上传页、详情页、退出、返回、
  Safe Area、内存身份生命周期和控制台检查均通过。
- 用户实际验收的具体设备平台未在本次记录中确认；不据此推断 Expo Web、Android 或 iOS
  各平台均已覆盖。

## 未实现业务

正式登录认证、视频选择与上传、视频列表与播放、任务创建与轮询、CV 输出生成、数据处理、结果展示、
统计图表、Mock Service、Real API、数据库、Backend 和 CV 算法均未实现。

## 已知问题与风险

- 高：Backend、上传、CV payload、CourtPoint 坐标语义和分析指标算法仍是 Draft。
- 中：身份仅在内存中，刷新或重启会退出；这是当前阶段的预期限制。
- 中：类型别名只表达传输约定，不提供 ISO 格式、进度或置信度范围的运行时校验。
- 中：人工验收的具体设备平台未确认，未覆盖平台的兼容性仍待后续按需验证。
- 中：正式认证接入时需要重新验证会话恢复、启动状态和路由保护。
- 低：依赖树的上游 `uuid@7.0.3` 弃用提示未影响当前安装。

## 下一阶段前置条件

- 选择视频上传或视频列表中的单一业务切片。
- 确认 Service 接口、DTO、Adapter 和错误结构。
- 明确 loading、empty、error 和 success 状态。
- 决定首批测试与运行时校验策略。

建议下一阶段优先建立视频 Service/Adapter 基线和最小 Mock 数据，再接入视频列表；不要同时实现
真实认证、上传、轮询和分析结果。
