# 网球视频分析系统 v0.1

用于验证“身份、上传视频、创建分析任务、生成数据、展示结果”闭环的前端 Demo。阶段 15-C 已收口
Mobile/Web Mock 与 Real API Draft 切换边界：缺失或空白 `USE_MOCK` 默认保持 Mock，只有显式 `false`
进入 Real API Draft；切换后必须重启进程。Auth、Video 读取/删除、Task/Result 读取和 Mobile 创建任务
具备可由 Local Contract Stub 验证的 Level 2 Draft HTTP 能力，其余未确认契约保持 Level 1 安全错误。

## 当前状态

| 模块                           | 当前状态                                                            |
| ------------------------------ | ------------------------------------------------------------------- |
| Mobile App                     | Mock 身份、上传、列表、详情、轮询、摘要和完整结果页已接入。         |
| Web Dashboard                  | 视频管理、分析详情、Overview 统计、Recharts 和 DEV 控制已接入。     |
| shared-types                   | 提供 Video、AnalysisTask、AnalysisResult 和通用错误等稳定前端类型。 |
| Mock 数据与 Service            | Mobile 与 Web 各自使用唯一 Repository；Web Snapshot 已升级为 v2。   |
| API mode                       | 默认 Mock；显式 false 使用部分 Real API Draft Service。             |
| Backend / CV / Data Processing | 尚未创建；Local Contract Stub 不是 Backend 或正式 API。             |
| 阶段 10 结果展示               | 9 项指标、球速/回合/相对落点/能力画像静态可视化已接入。             |
| 尚未实现                       | 播放器、真实上传、正式 Backend/数据库/CV/统计/日志/retry 契约。     |

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

## API 模式

- `EXPO_PUBLIC_USE_MOCK` / `VITE_USE_MOCK` 缺失、空白或为 `true` 时使用 Mock。
- 只有精确 `false` 进入 Real API Draft；此时必须提供合法的公开 Base URL。
- Mobile Real Access Token 只保存在运行内存，重启后需重新登录。
- Web Real Session 只保存在当前标签页 `sessionStorage`，仍不是生产级认证。
- Real queued/processing Task 使用远程轮询提示；`runtimeActive` 仍只代表本地 Mock Runtime。
- 远程 logout 失败仍会完成本地 Token、Session 和身份清理，并显示安全错误。
- Real 上传、retry、Statistics、CV 和 Logs 只返回明确 Level 1 错误，不回退 Mock。
- 不使用 Supabase，不包含数据库密码、管理员密钥、Service Role key 或真实 Token。

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
│        ├─ features/statistics/ # Overview 聚合、Query、Presentation 和图表
│        ├─ features/demo-control/ # DEV-only Web Demo 数据控制
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
