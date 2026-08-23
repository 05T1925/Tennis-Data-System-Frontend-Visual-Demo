# 阶段 1：初始化前端项目脚手架

## 1. 阶段编号和名称

- 阶段编号：1
- 阶段名称：初始化前端项目脚手架
- 执行日期：2026-07-13

## 2. 当前分支

`chore/stage-01-project-init`

## 3. 本阶段目标

建立可运行的 pnpm monorepo 前端骨架，包括 Expo Mobile、React + Vite Web Dashboard、共享类型、基础路由、主题、环境变量示例、ESLint、Prettier、统一命令和文档记录。本阶段不实现任何业务闭环功能。

## 4. 修改前状态

- 仓库只有阶段 0 Markdown 文档和 3 个未跟踪 Word 原始材料。
- 不存在 `package.json`、workspace、锁文件、App、Web、共享类型或可运行命令。
- 工作区除 3 个 Word 文件外没有未提交改动。

## 5. 环境检查结果

| 检查项         | 结果                                                             |
| -------------- | ---------------------------------------------------------------- |
| 当前分支       | `chore/stage-01-project-init`，符合要求。                        |
| Node.js        | `v24.18.0`，满足 create-expo-app 和 create-vite 的当前版本要求。 |
| pnpm           | `11.7.0`，可正常执行。                                           |
| Corepack       | `0.35.0`，可正常执行。                                           |
| 阶段 0 文档    | 9 份要求文件全部存在。                                           |
| 已有工程冲突   | 无；开始前不存在 `package.json` 和 `apps/`。                     |
| 未提交代码冲突 | 无；仅有 3 个禁止触碰的 Word 文件。                              |

环境满足要求后继续实施，没有自动安装或升级全局 Node.js、pnpm。

## 6. Node.js 版本

`v24.18.0`

## 7. pnpm 版本

`11.7.0`

根 `package.json` 使用 `"packageManager": "pnpm@11.7.0"`。

## 8. Expo SDK 版本

- Expo 配置解析的 SDK：`57.0.0`
- 安装的 `expo` 包：`57.0.4`
- 安装的 `expo-router`：`57.0.4`

## 9. React Native 版本

`0.86.0`

## 10. React 版本

- Mobile：`19.2.3`
- Web Dashboard：`19.2.7`

两端保留官方模板各自兼容版本，没有强制统一。

## 11. Vite 版本

- 模板声明：`^8.1.1`
- 锁文件实际解析：`8.1.4`

## 12. TypeScript 版本

- Mobile：`6.0.3`
- Web Dashboard：`6.0.3`
- shared-types：`6.0.3`

## 13. 实际完成内容

- 创建 pnpm workspace 和根统一命令。
- 使用当前官方稳定 `create-expo-app` default 模板创建 Mobile，保留 Expo 兼容依赖版本。
- 使用当前官方 Vite React TypeScript + ESLint 模板创建 Web Dashboard。
- 建立 Mobile 与 Web 基础路由、导航和动态 `videoId` 参数展示。
- 建立 Mobile Safe Area、主题 token、环境配置读取和占位页壳组件。
- 建立 Web DashboardLayout、主题 CSS、全局响应式样式和占位页组件。
- 创建 `@tennis/shared-types`，两端以 `workspace:*` 引用并使用 `import type`。
- 建立三端 ESLint flat config、根 Prettier、Git ignore/attributes 和环境变量示例。
- 安装依赖、生成唯一根锁文件并完成静态检查、构建和启动验证。
- 更新 README、AGENTS、架构、项目状态和本阶段记录。

## 14. 未完成内容

- 登录、认证、验证码：未实现。
- 视频选择、上传、进度、播放、列表业务：未实现。
- 分析任务、轮询、CV 数据、分析结果和统计图表：未实现。
- Mock Service、Real API、Backend、CV、Data Processing、数据库：未实现。
- TanStack Query、Zustand、React Hook Form、Zod、Ant Design、Recharts：未安装。
- 测试框架、Husky、lint-staged、CI/CD、EAS：未配置。
- Mobile 真机、模拟器和浏览器交互：未验证。

## 15. 新增文件

| 文件或目录                                 | 作用                                                   |
| ------------------------------------------ | ------------------------------------------------------ |
| `package.json`                             | 根包信息、pnpm 版本和统一脚本。                        |
| `pnpm-workspace.yaml`                      | workspace 范围与依赖构建白名单。                       |
| `pnpm-lock.yaml`                           | 唯一依赖锁文件。                                       |
| `.gitignore`、`.gitattributes`             | 忽略规则和文本/二进制换行策略。                        |
| `.prettierrc.json`、`.prettierignore`      | 根格式化规则和范围。                                   |
| `apps/mobile/`                             | Expo Mobile 工程、配置和必要官方图标资源。             |
| `apps/mobile/app/`                         | Expo Router 根路由、认证、Tabs、上传与视频详情占位页。 |
| `apps/mobile/src/components/PageShell.tsx` | 可复用 Mobile 占位页面壳。                             |
| `apps/mobile/src/config/env.ts`            | Mobile 公开环境变量读取。                              |
| `apps/mobile/src/theme/tokens.ts`          | Mobile 颜色、间距、圆角和字号 token。                  |
| `apps/web/`                                | React + Vite Web Dashboard 工程。                      |
| `apps/web/src/app/router.tsx`              | Web 路由表。                                           |
| `apps/web/src/layouts/DashboardLayout.tsx` | Dashboard 基础导航布局。                               |
| `apps/web/src/components/PageIntro.tsx`    | 可复用 Web 占位页介绍组件。                            |
| `apps/web/src/pages/*.tsx`                 | 7 个 Web 占位页面。                                    |
| `apps/web/src/config/env.ts`               | Web 公开环境变量读取。                                 |
| `apps/web/src/styles/*.css`                | Web 语义主题和全局响应式样式。                         |
| `packages/shared-types/`                   | 共享基础 TypeScript 类型和检查配置。                   |
| `docs/progress/stage-01-project-init.md`   | 本阶段完整执行记录。                                   |

## 16. 修改文件

| 文件                     | 修改内容                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `README.md`              | 更新真实状态、环境要求、命令、目录、安全和文档入口。          |
| `AGENTS.md`              | 更新实际目录、包、命令、ESLint/Prettier 和阶段 1 后协作边界。 |
| `docs/ARCHITECTURE.md`   | 区分当前前端工程与未实现服务端架构，明确 shared-types 边界。  |
| `docs/PROJECT_STATUS.md` | 记录脚手架、路由、依赖、命令、验证、风险和下一阶段条件。      |

## 17. 删除文件

只删除官方模板生成且与本项目无关的示例文件；阶段 0 文件和 Word 原件没有删除。阶段执行期间，用户将 3 个 Word 原件从根目录移动到 `other_docs/` 统一管理，该操作不是 AI 执行的工程变更。

- Mobile：`src/app` 示例路由、示例动画/Tab/主题组件、示例 hooks/constants/global CSS、`scripts/reset-project.js`、模板 README。
- Mobile 示例图片：Expo badge/logo、React logo、教程图、Tab 示例图标和 glow 图。
- Web：模板 `App.css`、`index.css`、README、`src/assets` 示例图片、`public` 示例图标。

## 18. 删除模板示例文件及原因

删除原因是官方示例内容包含 Expo/Vite 教程、计数器、外部文档链接和演示动画，与网球视频分析工程骨架无关。清理后减少无关依赖和代码噪音；`app.json` 仍引用的应用图标、启动图、Android 自适应图标、Web favicon 和 iOS 图标资源全部保留。

## 19. 最终目录结构

```text
.
├─ apps/
│  ├─ mobile/
│  │  ├─ app/
│  │  │  ├─ (auth)/login.tsx
│  │  │  ├─ (tabs)/
│  │  │  ├─ upload/index.tsx
│  │  │  ├─ videos/[videoId].tsx
│  │  │  ├─ _layout.tsx
│  │  │  └─ index.tsx
│  │  ├─ assets/
│  │  ├─ src/components/
│  │  ├─ src/config/
│  │  ├─ src/theme/
│  │  ├─ .env.example
│  │  ├─ app.json
│  │  ├─ eslint.config.js
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ web/
│     ├─ src/app/
│     ├─ src/components/
│     ├─ src/config/
│     ├─ src/layouts/
│     ├─ src/pages/
│     ├─ src/styles/
│     ├─ .env.example
│     ├─ eslint.config.js
│     ├─ package.json
│     ├─ vite.config.ts
│     └─ tsconfig.json
├─ packages/shared-types/
│  ├─ src/index.ts
│  ├─ eslint.config.js
│  ├─ package.json
│  └─ tsconfig.json
├─ other_docs/                 # 用户管理的未跟踪 Word 原始材料
├─ docs/progress/
├─ package.json
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

## 20. 根脚本列表

| 脚本           | 作用                                        |
| -------------- | ------------------------------------------- |
| `mobile:start` | 启动 Expo/Metro。                           |
| `web:dev`      | 启动 Vite 开发服务器。                      |
| `web:build`    | Web TypeScript 构建检查并生成 Vite 生产包。 |
| `lint`         | 递归执行三个 workspace 的 lint。            |
| `typecheck`    | 递归执行三个 workspace 的 TypeScript 检查。 |
| `format`       | 使用根 Prettier 写入格式。                  |
| `format:check` | 检查允许范围文件格式。                      |

## 21. App 路由列表

| 路由                 | 当前作用                  |
| -------------------- | ------------------------- |
| `/`                  | 重定向到主 Tabs。         |
| `/(auth)/login`      | 登录占位页。              |
| `/(tabs)`            | 首页占位页。              |
| `/(tabs)/videos`     | 视频占位页。              |
| `/(tabs)/statistics` | 统计占位页。              |
| `/(tabs)/profile`    | 我的占位页。              |
| `/upload`            | 上传占位页。              |
| `/videos/[videoId]`  | 展示 `videoId` 路由参数。 |

## 22. Web 路由列表

| 路由               | 当前作用                  |
| ------------------ | ------------------------- |
| `/login`           | 登录占位页。              |
| `/`                | Dashboard 概览占位页。    |
| `/videos`          | 视频占位页。              |
| `/videos/:videoId` | 展示 `videoId` 路由参数。 |
| `/analysis-tasks`  | 分析任务占位页。          |
| `/statistics`      | 统计占位页。              |
| `/system`          | 系统占位页。              |

## 23. 共享类型包说明

- 包名：`@tennis/shared-types`，`private: true`。
- 统一出口：`src/index.ts`。
- 当前类型：`AppSurface`、`ProjectStage`。
- Mobile 和 Web 均通过 `workspace:*` 引用并各有一次 `import type`。
- 不使用 tsup、rollup 或其他构建工具，直接消费 TypeScript 源码。
- 未提前实现 DATA_MODEL 中的完整领域模型。

## 24. 主题变量说明

- Mobile `src/theme/tokens.ts`：定义 `colors`、`spacing`、`radii`、`fontSizes`，包含 background、surface、primary、text、textSecondary、border、success、warning、danger、info 语义色。
- Web `theme.css`：使用同语义 CSS 自定义属性，并定义 spacing、radius 和 font size。
- Web `global.css`：只实现基础 Dashboard 骨架、响应式布局和占位页面视觉，不依赖 UI 框架。

## 25. 环境变量说明

- Mobile 示例：`EXPO_PUBLIC_API_BASE_URL`、`EXPO_PUBLIC_USE_MOCK`，通过静态 `process.env.EXPO_PUBLIC_*` 访问。
- Web 示例：`VITE_API_BASE_URL`、`VITE_USE_MOCK`，通过 `import.meta.env.VITE_*` 访问。
- 两端代码、示例文件、README 和 AGENTS 均提示公开前缀会进入客户端，不得保存数据库密码、服务端/管理员密钥或 Token。
- `.env` 和 `.env.*` 被忽略，`.env.example` 允许提交；没有创建真实 `.env`。

## 26. ESLint 配置说明

- Mobile：ESLint 9 flat config，继承 `eslint-config-expo/flat`，脚本为 `expo lint`。
- Web：保留 Vite React 官方 flat config，使用 ESLint 10、typescript-eslint、React Hooks 和 React Refresh 推荐配置。
- shared-types：使用 `@eslint/js` 与 `typescript-eslint` 推荐 flat config。
- 根 `pnpm lint` 递归调度三者，没有关闭核心规则或加入 `eslint-disable`。

## 27. Prettier 配置说明

- 版本：`3.9.5`，固定安装于根项目。
- 规则：singleQuote `true`、semi `true`、trailingComma `all`、printWidth `100`、endOfLine `lf`。
- 排除 node_modules、构建目录、锁文件、Word 原件和未修改的阶段 0 基线文档，避免无意义整体格式化。
- `apps/mobile/expo-env.d.ts` 由 Expo 自动生成且已被 Git 忽略；根 Prettier 同样忽略该文件，不要求人工格式化。
- 未配置 Husky 或 lint-staged。

## 28. 新增依赖及用途

| workspace    | 依赖                                                                                                       | 用途                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 根           | `prettier@3.9.5`                                                                                           | 统一格式化。                                   |
| Mobile       | Expo 57、Expo Router、React Native 0.86、Safe Area、Screens、Linking、Constants、Status Bar、Splash Screen | 官方 Mobile 脚手架、路由、安全区域和启动能力。 |
| Mobile       | React 19.2.3、React DOM、React Native Web                                                                  | Expo 官方兼容运行时。                          |
| Mobile       | ESLint 9、eslint-config-expo、TypeScript、React 类型                                                       | lint 与类型检查。                              |
| Web          | React 19.2.7、React DOM、React Router DOM 7.18.1                                                           | Web 渲染和路由。                               |
| Web          | Vite 8.1.4、React plugin、TypeScript、ESLint 10 及官方模板 lint 依赖                                       | 开发、构建、类型和 lint。                      |
| shared-types | TypeScript、ESLint、@eslint/js、typescript-eslint                                                          | 共享源码类型和 lint。                          |
| Mobile / Web | `@tennis/shared-types`（workspace link）                                                                   | 验证两端共享类型解析。                         |

未安装业务依赖或大型 UI/图表库。

## 29. 锁文件变化

- 新增根 `pnpm-lock.yaml`。
- 没有 `package-lock.json`、`yarn.lock`、`bun.lock` 或 `bun.lockb`。
- 没有嵌套 pnpm 锁文件或嵌套独立安装。
- pnpm 11 默认阻止未审核依赖构建脚本；`pnpm-workspace.yaml` 仅将 `unrs-resolver` 标为 `allowBuilds: true`。

## 30. 执行过的命令

主要命令包括：

```powershell
git status --short
git branch --show-current
node --version
pnpm --version
corepack --version
pnpm dlx create-expo-app@latest --help
pnpm dlx create-vite@latest --help
pnpm dlx create-expo-app@latest apps/mobile --template default --no-install --no-agents-md --yes
pnpm create vite@latest apps/web --template react-ts --no-interactive --no-immediate --eslint
pnpm install
pnpm lint
pnpm typecheck
pnpm format:check
pnpm web:build
pnpm web:dev
pnpm mobile:start
git diff --check
```

还执行了限定文件读取、版本查询、依赖列表、端口请求、进程关闭、锁文件/敏感文件和目录检查命令。

## 31. 每条命令的真实结果

| 命令或检查               | 真实结果                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 环境与分支检查           | 通过，满足继续实施条件。                                                                                    |
| create-expo-app help     | 当前 CLI 4.0.0 支持 `--no-install` 和 `--no-agents-md`。                                                    |
| create-vite help         | 当前 CLI 9.1.1 支持 React TS、`--eslint`、`--no-immediate`。                                                |
| 两个脚手架创建           | 成功；没有自动安装、嵌套 Git 或嵌套 AGENTS。                                                                |
| 第一次 `pnpm install`    | 失败：pnpm 11 阻止未审核的 `unrs-resolver` 构建脚本。依赖已解析但命令非零退出。                             |
| 第二次 `pnpm install`    | 失败：`package.json` 中旧 `pnpm.onlyBuiltDependencies` 在 pnpm 11 不再读取。                                |
| 第三次 `pnpm install`    | 失败：旧 `onlyBuiltDependencies` 在 pnpm 11 已被移除。                                                      |
| 第四次 `pnpm install`    | 失败：pnpm 自动添加的 `allowBuilds` 占位项与手工项形成重复 YAML 键。                                        |
| 最终 `pnpm install`      | 通过；合并为单一 `allowBuilds.unrs-resolver: true` 后 postinstall 完成。                                    |
| 首次 `pnpm lint`         | 通过。                                                                                                      |
| 首次 `pnpm typecheck`    | 通过。                                                                                                      |
| 首次 `pnpm format:check` | 失败，报告 10 个允许范围文件格式不一致。                                                                    |
| 定向 Prettier 写入       | 成功，只格式化报告的 10 个允许范围文件。                                                                    |
| 复验 `pnpm format:check` | 通过。                                                                                                      |
| `pnpm web:build`         | 通过；35 个模块，Vite 8.1.4。                                                                               |
| 首次 Vite 自动清理脚本   | 验证脚本异常退出；Vite 日志已显示 ready，但清理条件过宽。随后确认并关闭完整进程链。                         |
| Vite 复验                | 通过；`/videos/demo-video` HTTP 200，关闭后 5173 无监听。                                                   |
| 首次 Expo 状态脚本       | Metro 已就绪，但 PowerShell 将状态体作为字节数组导致自动匹配误判；进程已关闭。                              |
| Expo UTF-8 复验          | 通过；状态为 `packager-status:running`，关闭后 8081 无监听。                                                |
| 最终 `format:check`      | 历史首次失败源于 Expo 自动生成的 `expo-env.d.ts`；该 Git 忽略文件现也由 Prettier 忽略，不再要求手工格式化。 |
| pnpm 安装提示            | 上游 `uuid@7.0.3` 标记 deprecated；未阻止安装。                                                             |

## 32. 启动验证过程

### Web

1. 通过根命令启动 `pnpm web:dev`。
2. Vite 8.1.4 在 297 ms 内 ready，地址为 `http://localhost:5173/`。
3. 请求 `http://localhost:5173/videos/demo-video` 返回 HTTP 200，验证开发服务器和嵌套路由 fallback。
4. 主动关闭本次根进程和全部后代进程。
5. 复查 5173 端口监听数为 0。

### Mobile

1. 通过根命令启动 `pnpm mobile:start`。
2. Expo 输出 `Starting Metro Bundler` 和 `Waiting on http://localhost:8081`。
3. 请求 `http://localhost:8081/status`，UTF-8 解码结果为 `packager-status:running`。
4. 主动关闭本次根进程和全部后代进程。
5. 复查 8081 端口监听数为 0。
6. 未登录 Expo 账号，未配置 EAS，未进行真机或模拟器测试。

## 33. 人工验证步骤

自动完成了启动、HTTP/Metro 状态和关闭验证。后续人工可执行：

1. 运行 `pnpm mobile:start`，在模拟器或 Expo Go 中逐个打开 Tabs、登录、上传和视频详情占位页。
2. 确认 `/videos/demo-video` 显示 `videoId`，Safe Area 无明显遮挡。
3. 运行 `pnpm web:dev`，访问 7 个 Web 路由并刷新动态详情路由。
4. 在窄屏和桌面宽度确认 Dashboard 导航无明显溢出。
5. 验证完成后主动关闭两个开发服务。

上述设备和视觉人工步骤本阶段未执行，不标记为通过。

## 34. 与原计划不同的地方

- 最新 Expo default 模板将示例路由放在 `src/app`；按阶段要求迁移为根 `app/`，并清理 `src/app` 示例。
- 最新 Expo default 模板没有在 `--no-install` 阶段生成 ESLint 配置；手工新增兼容的 `eslint-config-expo/flat` 配置。
- pnpm 11 已移除 `onlyBuiltDependencies`，改用官方当前 `allowBuilds` 映射。
- create-vite 当前使用 `--no-immediate` 控制不自动安装，不使用旧式 `--no-install` 猜测参数。
- Web 模板声明 Vite `^8.1.1`，锁文件实际解析为 `8.1.4`。

## 35. 已知问题

- 上游依赖树包含 `uuid@7.0.3` deprecated 警告，当前无直接替换需求。
- Mobile 未在真实设备、模拟器或 Web 浏览器中进行导航和视觉验证。
- 当前没有测试框架和测试命令。

## 36. 潜在风险

### 高风险

- Backend、上传与 CV 契约尚未确认，后续不得将 Draft 文档直接实现为不可变接口。

### 中风险

- Mobile 只完成 Metro 和静态检查验证，设备平台差异尚未覆盖。
- 业务引入前尚未建立自动测试策略，下一阶段应控制首个垂直切片范围。

### 低风险

- 两端 React 补丁版本不同；这是官方模板兼容结果，不应无理由统一。
- pnpm 11 的依赖构建默认严格模式要求新增带脚本依赖时显式审核。

## 37. 对后续阶段的影响

- 后续任务可直接使用统一根命令和 workspace 包边界。
- Mobile 页面应继续使用 Safe Area 和主题 token；Web 应继续使用语义 CSS 变量。
- 领域类型不能随意堆入 shared-types，应在数据模型编码任务中确认稳定边界。
- 接入数据时必须建立 Service 接口、Mock/Real 实现和 DTO Adapter，页面不得直接承载复杂业务规则。
- 新增依赖构建脚本必须通过 pnpm `allowBuilds` 明确审核。

## 38. 下一阶段前置条件

- 明确下一阶段单一业务切片及允许读写范围。
- 确认该切片涉及的最小领域模型、API DTO 和错误状态。
- 明确 Mock Service 与 Real Service 的共同接口。
- 确认首批测试策略和可自动验证的验收路径。
- 如选择上传链路，先确认视频格式/大小、存储和上传协议；如选择身份链路，先确认身份模式。

## 39. 建议下一阶段任务

建议阶段 2 聚焦“前端领域模型最小子集与 Service/Adapter 基线”，只编码 User、Video、AnalysisTask 中首个垂直切片真正需要的字段，建立 Mock/Real Service 公共接口和自动测试基础；不要同时实现登录、上传、轮询和结果展示全部业务。

## Git 与安全补充

- Git add、commit、push、merge：无。
- Git 历史修改：无。
- 3 个 Word 原始材料：名称和大小未改变；用户在阶段执行期间将其移动到 `other_docs/`，AI 未修改文件内容、未执行移动、删除、暂存或提交。
- 真实 `.env`、密钥、Token、密码、隐私数据：无。
- 后台 Vite/Expo/Metro 进程：无残留。
