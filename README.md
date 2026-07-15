# 网球视频分析系统 v0.1

用于验证“身份、上传视频、创建分析任务、生成数据、展示结果”闭环的前端 Demo。当前已推进到
阶段 8：Mobile 已具备 Mock 登录、首页、视频选择与模拟上传、视频列表、状态筛选和失败分析任务
重试；完整详情、结果展示和 Web 业务仍未实现。

## 当前状态

| 模块                           | 当前状态                                                                |
| ------------------------------ | ----------------------------------------------------------------------- |
| Mobile App                     | Mock 登录/Session、首页、统一 Demo 数据、模拟上传和视频列表已接入。     |
| Web Dashboard                  | React、Vite、React Router 脚手架可运行；业务页面仍为占位。              |
| shared-types                   | 提供 Video、AnalysisTask、AnalysisResult 和通用错误等稳定前端类型。     |
| Mock 数据与 Service            | Video、Analysis、Statistics Service 共享唯一持久化 DemoDataRepository。 |
| Backend / CV / Data Processing | 尚未创建；当前上传、任务推进和结果数据均为本地确定性 Mock。             |
| 尚未实现                       | 完整视频详情、播放器、自动分析轮询、结果 UI、完整统计和 Web 业务。      |

## 环境要求

- Node.js：满足 Expo 和 Vite 当前要求；本阶段使用 `v24.18.0`。
- pnpm：本阶段使用 `11.7.0`，以根 `package.json` 的 `packageManager` 为准。
- 不依赖全局 Expo CLI。

## 安装与命令

```powershell
pnpm install
pnpm mobile:start
pnpm --filter @tennis/mobile test
pnpm web:dev
pnpm web:build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm format
```

`pnpm mobile:start` 启动 Expo/Metro，`pnpm web:dev` 默认启动 Vite 开发服务器。Mobile 使用 Vitest
运行纯 TypeScript 领域、Service 和 workflow 测试；当前没有 React Native UI 测试框架。

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
│        ├─ app/              # React Router 配置
│        ├─ components/
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

`other_docs/` 中的三个 Word 文件是未跟踪的原始材料，不属于工程交付物，不得修改、暂存或提交。该目录由用户在阶段 1 执行期间统一整理。
