# 项目状态

最近更新时间：2026-07-13

## 当前阶段

阶段 2：共享核心数据模型已建立并完成自动验证。

当前分支：`feature/stage-02-shared-types`

## 状态摘要

pnpm monorepo、Expo Mobile、Vite Web Dashboard 和占位路由保持不变。`@tennis/shared-types`
现已提供 v0.1 核心领域类型、统一导出入口和不依赖测试框架的类型检查示例。类型已编码不代表
Backend、CV、数据处理、Mock Service、Real API 或业务页面已实现。

## 模块状态

| 模块                           | 状态              | 真实说明                                                 |
| ------------------------------ | ----------------- | -------------------------------------------------------- |
| Mobile App                     | ✅ 脚手架已验证   | Expo/Metro 可启动；页面仍为占位页，真机未验证。          |
| Web Dashboard                  | ✅ 脚手架已验证   | Vite 可启动和构建；页面仍为占位页。                      |
| shared-types                   | ✅ 核心模型已建立 | 核心领域、状态、结果与错误类型统一导出；含类型检查示例。 |
| Backend / CV / Data Processing | ⏳ 尚未实现       | 未创建。                                                 |
| Mock Service / Real API        | ⏳ 尚未实现       | 未接入。                                                 |

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

- `pnpm install`、`pnpm lint`、`pnpm typecheck`、`pnpm format:check`、`pnpm web:build`：通过。
- `pnpm web:dev`：Vite 启动成功，验证后主动关闭且 5173 无监听。
- `pnpm mobile:start`：Expo/Metro 启动成功，验证后主动关闭且 8081 无监听。
- 未配置测试框架或测试命令；未声称自动化测试通过。
- Mobile 真机、模拟器和完整页面交互：未验证。

## 未实现业务

登录认证、视频选择与上传、视频列表与播放、任务创建与轮询、CV 输出生成、数据处理、结果展示、
统计图表、Mock Service、Real API、数据库、Backend 和 CV 算法均未实现。

## 已知问题与风险

- 高：Backend、上传、CV payload、CourtPoint 坐标语义和分析指标算法仍是 Draft。
- 中：类型别名只表达传输约定，不提供 ISO 格式、进度或置信度范围的运行时校验。
- 中：Mobile 仅完成 Metro 和静态检查验证，尚未进行真机/模拟器验证。
- 低：依赖树的上游 `uuid@7.0.3` 弃用提示未影响当前安装。

## 下一阶段前置条件

- 选择一个单一垂直业务切片并明确验收路径。
- 依据已编码 Domain Model 确认该切片的 API DTO 和 Adapter 映射。
- 建立 Mock Service 与 Real Service 的共同接口，不让页面直接依赖传输 DTO。
- 决定首批运行时校验和自动测试策略；不要把 TypeScript 类型当作数据验证。

建议下一阶段优先建立 Service/Adapter 基线与最小 Mock 数据，再选择身份或视频上传中的一个切片。
