# 网球视频分析系统 v0.1

用于验证“身份、上传视频、创建分析任务、生成数据、展示结果”闭环的前端 Demo。
阶段 15 已提交为 `a12c77f`；阶段 16 已完成质量、演示与发布准备收口。阶段 16-A 未发现
需要在本阶段修改的高风险业务代码问题。

## 当前能力

### Mock

- Mobile 提供 Demo 登录、首页、视频选择与模拟上传、列表、详情、分析轮询、retry 和完整 Result。
- Web 提供 Demo 管理员登录、Overview、视频筛选分页、详情五个 Tabs、Result、CV Fixture、
  Logs 和仅开发环境可见的 Demo Control。
- Mobile 与 Web 各自使用独立且唯一的本地 Repository/Snapshot；两端 Demo 数据不共享。
- Mock 是默认模式，支持不依赖 Backend 的本地产品流程演示。

### Real API Draft

- `EXPO_PUBLIC_USE_MOCK` / `VITE_USE_MOCK` 只有精确为 `false` 时进入 Real API Draft。
- 部分 Auth、Video 和 Analysis 方法具备 Level 2 Draft HTTP 边界。
- 真实上传、retry、Statistics、CV 和 Logs 等未确认契约保持 Level 1 安全错误，不回退 Mock。
- Local Contract Stub 只是仓库外前端测试夹具，不是 Backend、正式 API 或 Supabase。

### 尚未实现

正式 Backend、真实视频上传、数据库、正式 CV、正式 Statistics、正式 Logs、正式 retry、
Token refresh、正式管理员授权、Supabase 和生产发布能力均未实现。Android/iOS 真机与
Development Build 尚未在阶段 16 完成人工验收。

## 快速开始

实际验证环境为 Node `v24.18.0`、pnpm `11.7.0` 和 Windows；它们不是 manifest 声明的唯一
支持环境。

```powershell
pnpm install --frozen-lockfile
pnpm mobile:start
pnpm web:dev
```

Web 默认使用 Vite 端口 5173，Mobile 使用 Expo/Metro，通常监听 8081。完全干净安装后应先启动
一次 Expo 以生成被忽略的类型文件，再运行整仓 typecheck；详见新电脑指南。

常用验证命令：

```powershell
pnpm lint
pnpm typecheck
pnpm format:check
pnpm --filter @tennis/mobile test
pnpm --filter @tennis/web-dashboard test
pnpm web:build
```

Web 任务页面的真实路由是 `/analysis-tasks`。实际 Result、CV Fixture 和 Logs 位于
`/videos/:videoId` 的详情 Tabs；独立 `/cv-data` 和 `/statistics` 当前仍为明确占位页。

## API 模式与安全

- `USE_MOCK` 缺失、空白或为 `true` 时默认 Mock；切换环境变量后必须重启 Vite/Expo。
- `EXPO_PUBLIC_*` 和 `VITE_*` 都会进入客户端，只能保存公开配置，不能保存数据库密码、
  管理员密钥、Service Role key、Access Token 或其他秘密。
- Mobile Real Token 只保存在运行内存，应用重启后需要重新登录。
- Web Real Session 只保存在当前标签页的 `sessionStorage`，不代表生产级认证。

## 文档入口

- [新电脑安装与启动](docs/SETUP_NEW_MACHINE.md)
- [演示指南](docs/DEMO_GUIDE.md)
- [常见问题](docs/FAQ.md)
- [Demo 发布准备评估](docs/RELEASE_READINESS.md)
- [产品需求](docs/PRODUCT_REQUIREMENTS.md)
- [架构说明](docs/ARCHITECTURE.md)
- [API Draft](docs/API_CONTRACT.md)
- [项目状态](docs/PROJECT_STATUS.md)

`other_docs/` 中的 Word 原始材料不属于工程交付物，不得修改、暂存或提交。
