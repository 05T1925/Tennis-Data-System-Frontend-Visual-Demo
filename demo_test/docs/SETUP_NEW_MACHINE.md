# 新电脑安装与启动指南

## 已验证环境

阶段 16-A 实际验证环境：

- Windows
- Node `v24.18.0`
- pnpm `11.7.0`

这是实际验证组合，不是 manifest 声明的唯一支持版本。pnpm 版本以根 `packageManager` 为准。

## 1. 获取和安装

```powershell
git clone <repository-url>
cd demo_test
corepack enable
pnpm install --frozen-lockfile
```

使用真实仓库地址替换占位符。不要运行 `npm install`、`pnpm update` 或其他会改变唯一根锁文件
的安装方式。安装退出码应为 0，workspace 应包含根、Mobile、Web 和 shared-types。

## 2. 环境配置

默认不创建 `.env` 也会进入 Mock。需要选择公开场景时，可分别参考：

- `apps/mobile/.env.example`
- `apps/web/.env.example`

复制为本地 `.env` 是可选操作；不得提交它。公开变量只能包含模式、公开 Base URL 和 Demo 场景。
不得填写数据库密码、管理员密钥、Service Role key、Access Token 或其他秘密。Mock 演示不需要
真实密钥。

## 3. 首次 Expo 类型生成

当前 HEAD 在完全干净安装后、首次启动 Expo 前执行 `pnpm typecheck`，可能因 Expo 生成类型尚
不存在而失败。阶段 16-A 已稳定观察到这一限制。

首次运行：

```powershell
pnpm mobile:start
```

确认终端显示 `Starting Metro Bundler` 和 `Waiting on http://localhost:8081`（或实际端口）后，
按 `Ctrl+C` 停止。Expo 会生成以下被 Git 忽略的文件：

```text
apps/mobile/expo-env.d.ts
apps/mobile/.expo/types/router.d.ts
```

然后再运行：

```powershell
pnpm typecheck
```

不得把首次 Expo 启动前的干净安装 typecheck 写成已经通过。

## 4. 启动应用

Mobile：

```powershell
pnpm mobile:start
```

Metro ready 不代表 Android/iOS 真机或 Development Build 已通过。

Web：

```powershell
pnpm web:dev
```

默认打开 `http://localhost:5173/login`。任务页面使用 `/analysis-tasks`。

## 5. 推荐验证顺序

```powershell
pnpm lint
pnpm typecheck
pnpm format:check
pnpm --filter @tennis/mobile test
pnpm --filter @tennis/web-dashboard test
pnpm web:build
```

预期基线是 Mobile 17/332、Web 29/252；Web build 成功但保留大 chunk warning。
`expo install --check` 当前仍报告 8 个推荐 patch 差异，不应在阶段 16 自动升级。

## 6. 常见问题

### PowerShell execution policy

优先使用已安装 Node/Corepack 提供的 `pnpm.cmd`。如果组织策略阻止脚本，按本机管理员规范处理，
不要关闭安全策略或运行来源不明的脚本。

### Corepack 或 pnpm 不存在

确认 Node 安装和 `corepack enable` 成功，再运行 `pnpm --version`；预期与 packageManager 对齐。

### 端口占用

Vite 默认 5173，Metro 通常 8081。先识别占用进程，只停止确定属于本项目的开发进程，再重启。

### 缓存和多个 node_modules

不要混用 npm/yarn/pnpm 或复制其他电脑的 node_modules。需要重新验证时，在仓库外做干净副本；
不要删除 pnpm 全局 Store，也不要对主工作区执行危险清理命令。

### Expo 类型或 patch warning

先完成首次 Metro ready 以生成类型，再 typecheck。8 个 patch 提示是既有 maintenance 项，不是
安装失败。

### Web chunk warning

大于 500 kB 是性能 warning，当前 build 仍应退出 0。不要通过忽略 build 失败来掩盖其他错误。

### 局域网、Windows 和 WSL

本地 URL 不自动对局域网公开；防火墙和 Expo 网络模式可能影响设备访问。避免在 Windows 与 WSL
之间共享同一 node_modules，路径大小写、盘符和文件监听行为也可能不同。

## 7. 启动完成验收

- [ ] `pnpm install --frozen-lockfile` 退出码 0。
- [ ] Metro 进入 ready，随后端口可以正常释放。
- [ ] Web `/login` 可打开。
- [ ] lint、Expo 类型生成后的 typecheck、Mobile/Web tests 通过。
- [ ] Web build 通过；已知 chunk warning 已记录。
- [ ] 本地配置没有真实密钥。
- [ ] package.json 和 pnpm-lock.yaml 没有意外改动。

继续演示前请阅读[演示指南](DEMO_GUIDE.md)和[FAQ](FAQ.md)。
