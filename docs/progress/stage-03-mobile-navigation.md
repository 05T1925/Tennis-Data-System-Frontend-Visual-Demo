# 阶段 3：完成 Mobile 身份导航、Tab 导航和统一页面骨架

## 1. 阶段编号和名称

- 阶段编号：3
- 阶段名称：完成 Mobile 身份导航、Tab 导航和统一页面骨架
- 执行日期：2026-07-13

## 2. 当前分支

`feature/stage-03-mobile-navigation`

## 3. 本阶段目标

建立未登录到 Demo 登录、四个底部 Tab、上传与视频详情结构页、退出回登录页的 Mobile 基础
产品导航闭环；同时建立统一页面容器、按钮、卡片、空状态、区块标题和主题规则。本阶段不实现
正式认证、持久化、视频上传、分析业务或真实/Mock 业务数据。

## 4. 修改前状态

- 阶段 1 已有 Expo Router 文件路由、四个 Tab、Safe Area 和轻量主题，但页面均为占位页。
- 阶段 2 已从 `@tennis/shared-types` 包根导出 `User` 等核心领域类型。
- 根 index 固定重定向到 Tabs，没有身份判断或路由保护。
- 登录、上传、视频详情以及四个 Tab 页面只展示工程占位说明。
- 当前没有测试框架或测试命令。
- 开始时分支正确，`git status --short --branch` 只显示分支行，工作区无未提交修改。

## 5. 实际完成内容

- 使用 React Context 建立固定 Demo User 和只存在于内存的身份会话。
- 根布局放置 `SafeAreaProvider`、`AuthSessionProvider` 和 `Stack`。
- 使用 `Stack.Protected` 分隔未登录登录路由与登录后的 Tabs、上传、视频详情路由。
- Expo Web 首次加载发现登录 Screen 名称与实际文件路由不一致后，已修正为
  `(auth)/login`，复验不再出现路由警告。
- 根 index 根据身份重定向到登录页或首页。
- 使用稳定 `Tabs` 建立首页、视频、统计、我的四个中文 Tab。
- 建立统一 PageShell、AppButton、AppCard、EmptyState 和 SectionTitle。
- 完善主题颜色、间距、圆角、字号、字重和布局 token。
- 将所有 Mobile 页面替换为基本产品结构，并清楚标明尚未接入的业务。
- 更新架构、项目状态与阶段记录。

## 6. 未完成内容

正式认证、账号表单、Token、身份持久化、Service、API、TanStack Query、Zustand、React Hook
Form、Zod、视频选择与上传、视频数据、分析任务、轮询、CV 输出、结果和图表均未实现。用户已
完成人工页面与导航验收；具体设备平台未在本次记录中确认，因此不扩大记录为全部平台均通过。

## 7. 新增文件

| 文件                                                    | 作用                                            |
| ------------------------------------------------------- | ----------------------------------------------- |
| `apps/mobile/src/features/auth/AuthSessionProvider.tsx` | 内存身份 Context、Provider 和消费 hook。        |
| `apps/mobile/src/features/auth/demoUser.ts`             | 固定且无真实个人信息的 Demo User。              |
| `apps/mobile/src/features/auth/index.ts`                | auth 模块统一出口。                             |
| `apps/mobile/src/components/AppButton.tsx`              | primary/secondary、disabled、loading 预留按钮。 |
| `apps/mobile/src/components/AppCard.tsx`                | 通用卡片容器。                                  |
| `apps/mobile/src/components/EmptyState.tsx`             | 通用空状态和可选操作。                          |
| `apps/mobile/src/components/SectionTitle.tsx`           | 页面内部区块标题和说明。                        |
| `apps/mobile/src/components/index.ts`                   | 通用组件统一出口。                              |
| `docs/progress/stage-03-mobile-navigation.md`           | 本阶段完整执行记录。                            |

## 8. 修改文件

| 文件                                       | 修改内容                                         |
| ------------------------------------------ | ------------------------------------------------ |
| `apps/mobile/app/_layout.tsx`              | Provider 顺序、根 Stack 和 Protected Routes。    |
| `apps/mobile/app/index.tsx`                | 根据身份重定向。                                 |
| `apps/mobile/app/(auth)/login.tsx`         | Demo 身份产品入口和非正式认证提示。              |
| `apps/mobile/app/(tabs)/_layout.tsx`       | 统一四 Tab 样式。                                |
| `apps/mobile/app/(tabs)/index.tsx`         | 用户问候、上传入口、最近分析空状态和统计预览。   |
| `apps/mobile/app/(tabs)/videos.tsx`        | 视频空状态、上传入口和 demo-video 结构预览入口。 |
| `apps/mobile/app/(tabs)/statistics.tsx`    | 分析结果空状态和无虚构数值的指标结构。           |
| `apps/mobile/app/(tabs)/profile.tsx`       | Demo 身份、阶段说明和退出按钮。                  |
| `apps/mobile/app/upload/index.tsx`         | 拍摄建议、禁用选择按钮和返回行为。               |
| `apps/mobile/app/videos/[videoId].tsx`     | 参数、视频/状态/结果结构占位和返回行为。         |
| `apps/mobile/src/components/PageShell.tsx` | Safe Area、滚动、统一间距、标题和页脚能力。      |
| `apps/mobile/src/theme/tokens.ts`          | 补齐语义颜色、字重和布局 token。                 |
| `docs/ARCHITECTURE.md`                     | 补充本地身份、路由保护与职责分离。               |
| `docs/PROJECT_STATUS.md`                   | 更新阶段 3 状态、验证、限制和下一阶段条件。      |

## 9. 删除文件

无。

## 10. 每个 Auth 文件的职责

- `demoUser.ts`：从 `@tennis/shared-types` 包根导入 `User`，提供明显的本地演示身份，不含
  密码、验证码、Token、真实手机号或真实个人信息。
- `AuthSessionProvider.tsx`：保存 `User | null`，提供派生的 `isAuthenticated`、同步
  `signInDemo` 和 `signOut`；不访问网络、存储或路由。`useAuthSession` 在 Provider 外调用时
  抛出明确开发错误。
- `index.ts`：提供稳定模块出口，页面不深层导入实现文件。

## 11. 路由保护实现方式

根 `_layout.tsx` 在 `AuthSessionProvider` 内读取 `isAuthenticated`。`Stack.Protected` 以
`!isAuthenticated` 保护 `(auth)/login`，以 `isAuthenticated` 保护 `(tabs)`、`upload/index` 和
`videos/[videoId]`。Provider 不操作路由，也没有 useEffect replace 鉴权循环。

## 12. Demo 身份数据说明

Demo User 的 ID 为 `demo-user-local`，显示名为 `Demo 球员`，角色为 `user`，时间字段为固定
ISO 8601 演示值。数据不对应真实用户，也没有认证凭据。

## 13. 登录状态生命周期

初始 `user` 为 `null`。点击“使用 Demo 身份进入”后设为固定 Demo User；点击退出后恢复
`null`，受保护路由随 guard 变化失效。状态只存在于当前 React 内存，不写入 AsyncStorage、
SecureStore 或网络；App 刷新或重启后恢复未登录。

## 14. Tab 路由列表

| 路由                 | 标签 | 保护状态 |
| -------------------- | ---- | -------- |
| `/(tabs)`            | 首页 | 仅登录后 |
| `/(tabs)/videos`     | 视频 | 仅登录后 |
| `/(tabs)/statistics` | 统计 | 仅登录后 |
| `/(tabs)/profile`    | 我的 | 仅登录后 |

## 15. Stack 路由列表

| 路由                | 用途             | 保护状态 |
| ------------------- | ---------------- | -------- |
| `/`                 | 身份分流重定向   | 根路由   |
| `/(auth)/login`     | Demo 登录入口    | 仅未登录 |
| `/upload`           | 上传页面结构     | 仅登录后 |
| `/videos/[videoId]` | 视频详情页面结构 | 仅登录后 |

## 16. 通用组件列表

- `PageShell`：统一安全区、背景、滚动、页面间距、标题/说明和可选页脚。
- `AppButton`：primary/secondary、按下反馈、disabled 和 loading 预留接口。
- `AppCard`：统一背景、边框、圆角和内边距。
- `EmptyState`：统一标题、说明和可选操作按钮。
- `SectionTitle`：统一页面内部区块标题和可选说明。

## 17. 主题变量变化

保留现有 `colors`、`spacing`、`radii`、`fontSizes`，增加 `primaryPressed`、`primarySoft`、
`surfacePressed`、`onPrimary`、`textDisabled`、`disabled` 等语义颜色，以及 `fontWeights`、
`layout.pagePadding`、`layout.controlHeight`。没有创建第二套主题或暗色模式。

## 18. Safe Area 处理方式

根节点只放一个 `SafeAreaProvider`。所有页面通过 `PageShell` 使用 `SafeAreaView`；Tab 页面默认
处理 top/left/right，避免和 Tab bar 重复底部留白；登录、上传和详情 Stack 页面显式处理四边。
ScrollView 内容包含统一底部间距，Stack 页底部按钮位于安全区内。

## 19. 页面结构说明

- 登录：产品名称/说明、Demo 主按钮和本地身份生命周期提示，没有假表单。
- 首页：Demo 用户问候、上传入口、最近分析空状态和使用破折号的统计预览。
- 视频：无视频空状态、上传入口和明确标注的 demo-video 详情结构预览。
- 统计：无结果空状态与击球次数、回合数、平均球速、跑动距离结构，无虚构数值。
- 我的：Demo 显示名、身份标记、阶段边界和退出按钮。
- 上传：拍摄建议、禁用的后续选择按钮和返回行为。
- 详情：显示 videoId，分别占位视频信息、分析状态和分析结果，并提示无真实数据。

## 20. 页面未实现的业务

没有身份请求、视频权限、文件选择、上传进度、视频列表数据、播放器、分析任务、分析轮询、CV
输出、分析结果、统计计算或图表。页面没有直接 fetch，也没有内联假业务数组；仅有静态说明、
指标名称和拍摄建议。

## 21. 新增依赖

无。

## 22. package.json 变化

无。

## 23. shared-types 变化

无；只从包根消费既有 `User` 类型。

## 24. Web 变化

无；未读取或修改 Web 业务代码。仅执行既有 `web:build` 验证 workspace 未受影响。

## 25. 环境变量变化

无；未读取、创建或修改 `.env`、`.env.*` 或 `.env.example`。

## 26. 执行过的命令

```powershell
git status --short --branch
rg --files <限定范围>
pnpm exec prettier --write <本阶段 Mobile 文件>
pnpm --filter @tennis/mobile lint
pnpm --filter @tennis/mobile typecheck
pnpm mobile:start
pnpm --filter @tennis/mobile exec expo export --platform android --output-dir <系统临时目录>
pnpm install --offline --frozen-lockfile --force
pnpm lint
pnpm typecheck
pnpm format:check
pnpm web:build
git diff --check
git status --short
git diff --stat
```

另执行了限定文件读取、Expo Router 本地类型支持搜索、Metro HTTP/端口探测、进程树清理和
临时 export 目录清理。没有执行 git add、commit、push 或 merge。

## 27. 每条命令的真实结果

| 命令或检查                            | 真实结果                                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 分支与状态检查                        | 通过；分支为 `feature/stage-03-mobile-navigation`，修改前工作区干净。                                                                  |
| 定向 Prettier                         | 通过；本阶段 Mobile 文件符合根格式规则。                                                                                               |
| Mobile lint                           | 通过。                                                                                                                                 |
| Mobile typecheck                      | 通过。                                                                                                                                 |
| 首次 Metro `Invoke-WebRequest` 探测   | 失败；日志已显示 Waiting，但 45 秒内未从 `127.0.0.1` 取得状态；进程树与 8081 已清理。                                                  |
| 第二次 Metro `Invoke-WebRequest` 探测 | 失败；改用 localhost 仍超时；进程树与 8081 已清理。                                                                                    |
| Metro curl 复验                       | 通过；IPv4 与 localhost 均返回 `packager-status:running`，8081 清理后监听数为 0。                                                      |
| 旧式 Android bundle URL 探测          | 失败；Metro 状态正常，但该 URL 返回 404；未视为应用编译结果，8081 已清理。                                                             |
| Expo Android export                   | 通过；1241 个模块成功打包，临时输出已删除。                                                                                            |
| 首次 Expo Web 页面加载                | 页面可编译和加载，但日志发现根 Stack 将登录 Screen 错写为不存在的 `(auth)`；随后修正为 `(auth)/login`。                                |
| 修正后 Expo Web 复验                  | 通过；根页面返回 200，最新日志无 auth 路由警告，8081 最终监听数为 0。清理时一次完整进程表读取被 Windows 拒绝，但目标服务和端口已关闭。 |
| 最终依赖链接恢复                      | 首次非交互 `pnpm exec prettier` 因无 TTY 中止并影响根 `.bin` 链接；使用离线 frozen-lockfile force 安装恢复，锁文件哈希前后相同。       |
| 受限环境整仓 lint 首次执行            | Mobile 定向检查已通过；根 lint 创建 workspace 子进程时遇到 `spawn EPERM`，随后在获准的非沙箱环境重跑通过。                             |
| 根 `pnpm lint`                        | 通过；Mobile、Web、shared-types 均通过。                                                                                               |
| 根 `pnpm typecheck`                   | 通过；Mobile、Web、shared-types 均通过。                                                                                               |
| `pnpm format:check`                   | 通过。                                                                                                                                 |
| `pnpm web:build`                      | 通过。                                                                                                                                 |
| `git diff --check`                    | 通过。                                                                                                                                 |
| `git status --short`                  | 已执行；只包含本阶段允许范围内的修改和新增文件。                                                                                       |
| `git diff --stat`                     | 已执行；没有 Web、shared-types、package 或锁文件变化。                                                                                 |
| 最终 `pnpm mobile:start`              | 通过；返回 `packager-status:running`，日志无立即错误，主动关闭后 8081 监听数为 0。                                                     |

## 28. 人工验证步骤

- [x] 首次启动进入登录页。
- [x] 登录页没有底部 Tab。
- [x] 点击 Demo 登录进入首页。
- [x] 四个 Tab 均可切换。
- [x] 首页上传入口可进入上传页。
- [x] 上传页返回正常。
- [x] 视频页可以打开 demo-video 详情结构。
- [x] 详情页显示 demo-video。
- [x] 详情页返回正常。
- [x] 页面标题未被安全区遮挡。
- [x] 页面底部未被 Tab 遮挡。
- [x] 点击退出返回登录页。
- [x] 退出后返回键不能进入受保护页面。
- [x] 重启 App 后恢复未登录状态。
- [x] 控制台没有红色错误。

## 29. 已完成的人工验证

用户已逐项完成第 28 节的人工页面与导航验收，15 项全部通过。用户已完成人工页面与导航验收；
具体设备平台未在本次记录中确认。Protected Routes、退出行为、返回行为和内存身份生命周期
符合本阶段要求。

## 30. 未执行的人工验证

具体设备平台未在本次记录中确认，因此无法准确列出某一特定平台为已执行或未执行；本记录不
推断 Expo Web、Android 模拟器、Android 真机或 iOS 模拟器/真机的单独覆盖状态，也不写成
全部平台均通过。

## 31. 与计划不同的地方

- 原计划使用 Metro bundle HTTP 地址补充编译验证；当前 Expo 版本对尝试的旧式 URL 返回
  404，因此改用官方 CLI `expo export --platform android`，并成功完成实际 Android 打包。
- PowerShell `Invoke-WebRequest` 对 Metro 状态两次超时；改用 `curl --noproxy` 后状态成功。
- Expo Web 首次加载暴露静态检查未捕获的 Screen 名称问题，已按实际文件路由修正并复验。
- 最终验证期间 pnpm 非交互依赖检查影响本地 `.bin` 链接；使用锁文件离线恢复且锁哈希未变。
- 受限环境阻止整仓 lint 创建子进程；获准在沙箱外执行相同命令后通过。
- 自动验证完成后，用户补充执行了完整人工页面与导航验收，15 项全部通过。
- 没有安装图标库；Tab 使用清楚的中文文字标签。

## 32. 已知问题

- Demo 登录状态不持久化，刷新或重启必然退出；这是阶段 3 的预期行为。
- 当前没有测试框架或自动测试命令。
- 人工验收的具体设备平台未确认，未覆盖平台的兼容性仍待后续按需验证。

## 33. 潜在风险

### 高风险

无本阶段新增高风险。Backend、真实认证、上传和分析契约仍未实现，不能据此页面骨架推断正式
业务可用。

### 中风险

- 人工验收平台未确认，无法据此判断其他设备平台的兼容性覆盖情况。
- 后续接入正式身份时必须重新验证会话恢复、启动状态和路由保护，同时保持 Provider、路由和
  页面职责边界。

### 低风险

- 当前 Tab 只显示文字；可读性满足本阶段要求，但未来品牌视觉可能需要复用既有图标体系。

## 34. 对后续阶段的影响

- 页面已具备承载 loading/empty/error/success 的统一容器和空状态组件。
- 后续 Service/Query 可以在不改变路由保护边界的前提下接入页面。
- 正式认证需要重新定义会话恢复和启动 loading 状态，不能把 Demo Context 直接视为 AuthService。
- 上传与详情页已保留 Stack 路由，不会进入底部 Tab。

## 35. 下一阶段前置条件

- 选择单一业务切片。
- 确认 Service 接口、DTO、Adapter 和错误结构。
- 明确 loading、empty、error 和 success 状态。
- 决定首批测试与运行时校验策略。

## 36. 建议下一阶段任务

建议下一阶段建立视频 Service/Adapter 接口与最小 Mock 视频列表，用 TanStack Query 管理服务端
状态，完整覆盖 loading、empty、error 和 success；不要同时实现正式认证、真实上传、轮询和
分析结果。

## 37. other_docs 状态

- 读取：否。
- 修改：否。
- 移动：否。
- 删除：否。
- 暂存：否。

`other_docs/` 保持原样。本阶段未读取或处理其中 Word 原始材料，也未执行 git add、commit、
push、merge 或 Git 历史修改。
