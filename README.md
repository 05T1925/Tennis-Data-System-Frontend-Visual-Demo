# 网球视频分析系统 v0.1

用于验证“身份、上传视频、创建分析任务、生成数据、展示结果”闭环的前端 Demo。当前已推进到
阶段 13-C：Mobile 保持阶段 10 的 Mock 业务闭环；Web 在阶段 12 视频管理基础上新增分析任务
retry、结构化结果、Shot/Rally/Point、任务日志和 Web-private CV Demo 数据查看。独立审查提出的
Runtime 轮询、日志刷新和失败信息安全问题已最小修正；阶段 13 改动仍未提交。
补充修正已使大型 JSON 按 50 项真实分页，并以统一的 1000 行可见树规划保留全局节点保护。
Result Summary 已统一安全处理非有限值、负数和整数约束，CV Copy 失败文案已限定为 CV JSON 场景；
关键人工交互验收已经完成，部分非阻塞扩展矩阵仍保持未执行；阶段 13-C 等待最终提交资格判断。

## 当前状态

| 模块                           | 当前状态                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| Mobile App                     | Mock 身份、上传、列表、详情、轮询、摘要和完整结果页已接入。         |
| Web Dashboard                  | 视频管理、五类详情视图、分析 retry、结果及 CV Demo 数据已接入。     |
| shared-types                   | 提供 Video、AnalysisTask、AnalysisResult 和通用错误等稳定前端类型。 |
| Mock 数据与 Service            | Mobile 与 Web 各自使用唯一 Repository；Web Snapshot 已升级为 v2。   |
| Backend / CV / Data Processing | 尚未创建；当前上传、任务推进和结果数据均为本地确定性 Mock。         |
| 阶段 10 结果展示               | 9 项指标、球速/回合/相对落点/能力画像静态可视化已接入。             |
| 尚未实现                       | Web 统计、播放器、Real API、Backend 和真实 CV。                     |

## 环境要求

- Node.js：满足 Expo 和 Vite 当前要求；本阶段使用 `v24.18.0`。
- pnpm：本阶段使用 `11.7.0`，以根 `package.json` 的 `packageManager` 为准。
- 不依赖全局 Expo CLI。

## 安装与命令

```powershell
pnpm install
pnpm mobile:start
pnpm --filter @tennis/mobile test
pnpm --filter @tennis/web-dashboard test
pnpm web:dev
pnpm web:build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm format
```

`pnpm mobile:start` 启动 Expo/Metro，`pnpm web:dev` 默认启动 Vite 开发服务器。Mobile 和 Web 使用
Vitest 运行纯 TypeScript 领域、Service 和 workflow 测试；当前没有 React Native 或 Web UI 测试框架。Web 登录
使用公开 Demo 凭据和当前标签页会话，仅用于验证前端流程，不是正式权限系统。

## 目录结构

```text
.
├─ apps/
│  ├─ mobile/
│  │  ├─ app/                 # Expo Router 路由
│  │  ├─ src/components/      # 可复用展示组件
│  │  ├─ src/config/          # Mobile 环境配置
│  │  └─ src/theme/           # Mobile 主题变量
│  └─ web/
│     └─ src/
│        ├─ app/              # React Router、导航元数据和应用 Provider
│        ├─ components/
│        ├─ features/auth/    # Web 独立 Mock 管理员会话
│        ├─ features/demo-data/ # Web 独立 localStorage Demo Snapshot
│        ├─ features/videos/  # Web 视频 Service、Query、列表和详情
│        ├─ features/analysis/ # Web 分析 Service、Query、Tabs 和 CV Demo Viewer
│        ├─ layouts/
│        ├─ pages/
│        ├─ config/
│        └─ styles/
├─ packages/shared-types/     # 两端共享的基础 TypeScript 类型
├─ docs/
├─ package.json
└─ pnpm-workspace.yaml
```

## 环境变量与安全

从两端的 `.env.example` 创建本地配置时，不得提交真实 `.env`。`EXPO_PUBLIC_*` 和 `VITE_*` 都会进入客户端包，只能存放公开配置，禁止存放数据库密码、服务端密钥、管理员密钥或 Token。

## 文档

- [产品需求](docs/PRODUCT_REQUIREMENTS.md)
- [架构说明](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [API 草案](docs/API_CONTRACT.md)
- [术语表](docs/GLOSSARY.md)
- [项目状态](docs/PROJECT_STATUS.md)
- [阶段 1 记录](docs/progress/stage-01-project-init.md)
- [阶段 8 记录](docs/progress/stage-08-mobile-video-list.md)
- [阶段 9 记录](docs/progress/stage-09-mobile-video-detail.md)
- [阶段 10 记录](docs/progress/stage-10-mobile-analysis-result.md)

`other_docs/` 中的三个 Word 文件是未跟踪的原始材料，不属于工程交付物，不得修改、暂存或提交。该目录由用户在阶段 1 执行期间统一整理。
