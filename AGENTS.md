# AI 协作规则

## 项目目标与当前阶段

本项目是网球视频分析系统 v0.1 的前端 Demo。阶段 1 已建立可运行的 pnpm monorepo、Expo App、Vite Web Dashboard、共享类型、占位路由、主题和检查命令；业务功能、Backend、CV 与数据处理仍未实现。

v0.1 目标是跑通“身份、上传视频、创建分析任务、生成数据、展示结果”的原型闭环，不追求正式发布能力或高精度算法。

## 当前目录与包

- `apps/mobile`：`@tennis/mobile`，Expo 57、React Native、Expo Router、TypeScript。
- `apps/web`：`@tennis/web-dashboard`，React、Vite、React Router、TypeScript。
- `packages/shared-types`：`@tennis/shared-types`，直接消费 TypeScript 源码，不包含完整领域模型。
- 包管理器：pnpm `11.7.0`；唯一锁文件为根 `pnpm-lock.yaml`。

## 可运行命令

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

当前没有测试框架或测试命令，不得声称测试已通过。

## 产品与代码边界

- App 面向普通网球用户；Web Dashboard 面向内部团队。
- 页面负责展示和交互编排，不承载复杂业务规则。
- 后续 Service 负责接口调用，Mock Service 与 Real Service 必须实现相同接口。
- Adapter 负责 API DTO 与 Domain Model 转换，尤其处理 snake_case 到 camelCase。
- 复杂业务逻辑放在领域逻辑、hooks 或 utilities；可复用组件不得绑定单一页面。
- Backend、CV Module 与 Data Processing 不属于当前前端脚手架。

## 数据与状态命名

- 字段使用英文 camelCase；所有 ID 使用 `string`；时间使用 ISO 8601 string。
- 上传生命周期使用 `uploadStatus`，分析生命周期使用 `analysisStatus`，不得混用。
- 使用 `analysisTask`、`cvOutput`、`analysisResult`、`shot`、`rally`、`point` 等统一术语，详见 [术语表](docs/GLOSSARY.md)。

## ESLint、Prettier 与 TypeScript

- ESLint 使用 flat config：Mobile 继承 `eslint-config-expo/flat`，Web 保留 Vite React flat config，shared-types 使用 `@eslint/js` 与 `typescript-eslint` 推荐规则。
- 不关闭核心 lint、strict TypeScript 或测试来掩盖错误，不新增大范围 `eslint-disable`。
- Prettier 根规则：single quote、分号、trailing comma、100 字符 print width、LF。
- 格式化范围排除未修改的阶段 0 基线文档、Word 原件、锁文件和生成目录，避免无意义整体重写。

## 阶段 1 后的读取与修改范围

- 每个任务必须先声明允许读取、允许修改和禁止修改范围；中大型任务先做有范围只读探索。
- 默认可读取当前任务相关的 App、Web、shared-types 和 Markdown 文档；禁止读取 `.env`、密钥、Token、密码、隐私数据、大视频、模型权重或数据集。
- 只修改当前任务必要文件；不得自由搜索、跨模块重构或顺手实现未要求业务。
- 不修改、移动或删除 `other_docs/` 中的 3 个 Word 原始材料。
- 需求、接口、数据模型或架构变化时同步更新对应文档；阶段结束更新项目状态和阶段记录。

## 环境变量与安全

- `.env`、`.env.*` 不提交，`.env.example` 仅使用无敏感信息示例值。
- `EXPO_PUBLIC_*` 和 `VITE_*` 会进入客户端，禁止保存数据库密码、服务端密钥、管理员密钥或 Token。
- 不提交 `node_modules`、构建产物、大视频、模型权重、数据集或隐私数据。

## Git 与验证

- 一个任务一个会话、一个分支；不直接在 `main` 开发。
- 不覆盖、删除或还原不属于当前任务的修改。
- 除非用户明确要求，不执行 `git add`、`git commit` 或 `git push`。
- 禁止强制推送、`git reset --hard`、`git clean -fd` 等危险命令。
- 完成代码任务至少运行相关 lint、typecheck 和 build；持续服务需确认启动成功后主动关闭，并如实记录未验证项。
