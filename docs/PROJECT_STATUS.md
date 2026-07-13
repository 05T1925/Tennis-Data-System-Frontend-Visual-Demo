# 项目状态

最近更新时间：2026-07-13

## 当前阶段

阶段 1：前端项目脚手架已完成并自动验证。

当前分支：`chore/stage-01-project-init`

## 状态摘要

仓库已从文档基线升级为 pnpm monorepo，包含可启动的 Expo Mobile、可启动和构建的 Vite Web Dashboard、共享类型包、占位路由、主题、环境变量示例、ESLint、Prettier 和统一根命令。所有页面仍是工程占位页，不代表业务功能完成。

## 模块状态

| 模块                    | 状态            | 真实说明                                                                   |
| ----------------------- | --------------- | -------------------------------------------------------------------------- |
| Mobile App              | ✅ 脚手架已验证 | Expo/Metro 可启动；基础路由、Safe Area、主题和环境读取已建立。真机未验证。 |
| Web Dashboard           | ✅ 脚手架已验证 | Vite 可启动和构建；React Router 与基础 Dashboard 导航已建立。              |
| shared-types            | ✅ 基础包已验证 | 两端可解析；仅有少量非业务类型。                                           |
| Backend                 | ⏳ 尚未实现     | 未创建。                                                                   |
| CV Module               | ⏳ 尚未实现     | 未创建。                                                                   |
| Data Processing         | ⏳ 尚未实现     | 未创建。                                                                   |
| Mock Service / Real API | ⏳ 尚未实现     | 未接入。                                                                   |

## 当前路由

- Mobile：`/`、`/(auth)/login`、`/(tabs)`、`/(tabs)/videos`、`/(tabs)/statistics`、`/(tabs)/profile`、`/upload`、`/videos/[videoId]`。
- Web：`/login`、`/`、`/videos`、`/videos/:videoId`、`/analysis-tasks`、`/statistics`、`/system`。

## 当前核心依赖

- Mobile：Expo SDK 57、React Native 0.86、React 19.2.3、Expo Router 57、TypeScript 6。
- Web：React 19.2.7、Vite 8、React Router 7、TypeScript 6。
- 工程：pnpm 11 workspace、ESLint flat config、Prettier 3、`@tennis/shared-types`。

未安装 Ant Design、Recharts、TanStack Query、Zustand、React Hook Form、Zod、测试框架、Husky 或 CI/CD 工具。

## 可用命令

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

## 验证状态

- `pnpm install`：通过；pnpm 11 显式允许 `unrs-resolver` 构建脚本。
- `pnpm lint`：通过，覆盖 Mobile、Web 和 shared-types。
- `pnpm typecheck`：通过，覆盖 Mobile、Web 和 shared-types。
- `pnpm format:check`：通过。
- `pnpm web:build`：通过。
- `pnpm web:dev`：通过，`http://localhost:5173/videos/demo-video` 返回 200，进程已关闭。
- `pnpm mobile:start`：通过，Metro 在 `http://localhost:8081` 就绪，状态为 `packager-status:running`，进程已关闭。
- Mobile 真机、模拟器和浏览器交互：未验证。

## 未实现业务

登录认证、验证码、视频选择与上传、上传进度、视频列表与播放、任务创建与轮询、CV 输出、结构化结果、统计图表、Mock Service、Real API、数据库、Backend、CV、Data Processing 均未实现。

## 已知问题与风险

- 高：Backend、上传和 CV 契约未确认，后续不得把 Draft 文档直接当成正式接口。
- 中：Mobile 仅验证 Metro 启动与类型解析，尚未进行真机/模拟器导航和视觉验证。
- 低：Mobile 与 Web 使用官方模板各自兼容的 React 精确版本，当前分别为 19.2.3 和 19.2.7；不应无理由强制统一。
- 低：依赖树包含 `uuid@7.0.3` 的上游弃用提示，不影响当前安装和验证。

## 下一阶段前置条件

- 明确下一阶段的单一业务目标、允许修改范围和验收路径。
- 确认身份、上传、存储、任务和 API 契约中与该目标直接相关的最小子集。
- 为开始业务实现建立 Mock/Real Service 公共接口和 DTO/Domain Adapter 边界。
- 决定首批自动测试范围，不在业务扩大后再补工程基线。

建议下一阶段优先建立领域模型最小子集、Service 接口与 Mock 数据边界，再选择身份或视频上传中的一个垂直切片实现。
