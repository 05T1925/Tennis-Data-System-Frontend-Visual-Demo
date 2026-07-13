# 网球视频分析系统 v0.1

用于验证“身份、上传视频、创建分析任务、生成数据、展示结果”闭环的前端 Demo。当前已完成阶段 1 工程脚手架，仅包含可运行的 Mobile、Web Dashboard、共享类型和占位路由，不包含业务实现。

## 当前状态

| 模块                           | 当前状态                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Mobile App                     | Expo 57、React Native 0.86、Expo Router 与 TypeScript 脚手架可运行；页面均为占位页。 |
| Web Dashboard                  | React 19、Vite 8、React Router 与 TypeScript 脚手架可运行；页面均为占位页。          |
| shared-types                   | 可直接消费 TypeScript 源码；当前只有基础工程验证类型。                               |
| Backend / CV / Data Processing | 尚未创建。                                                                           |
| 业务功能                       | 登录、上传、视频、分析任务、结果、统计和 Mock Service 均尚未实现。                   |

## 环境要求

- Node.js：满足 Expo 和 Vite 当前要求；本阶段使用 `v24.18.0`。
- pnpm：本阶段使用 `11.7.0`，以根 `package.json` 的 `packageManager` 为准。
- 不依赖全局 Expo CLI。

## 安装与命令

```powershell
pnpm install
pnpm mobile:start
pnpm web:dev
pnpm web:build
pnpm lint
pnpm typecheck
pnpm format:check
pnpm format
```

`pnpm mobile:start` 启动 Expo/Metro，`pnpm web:dev` 默认启动 Vite 开发服务器。阶段 1 未配置测试框架，因此当前没有测试命令。

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

`other_docs/` 中的三个 Word 文件是未跟踪的原始材料，不属于工程交付物，不得修改、暂存或提交。该目录由用户在阶段 1 执行期间统一整理。
