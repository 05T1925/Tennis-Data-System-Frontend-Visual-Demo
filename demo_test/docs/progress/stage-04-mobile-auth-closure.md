# 阶段 4：完成 Mobile Mock 登录闭环与会话持久化

## 1. 阶段信息

- 阶段编号：4
- 阶段名称：完成 Mobile Mock 登录闭环与会话持久化
- 英文标识：`mobile-auth-closure`
- 执行日期：2026-07-14
- 当前分支：`feature/stage-04-mobile-auth-closure`
- 当前状态：满足 Demo 阶段提交条件，等待 Git 提交。

## 2. 本阶段目标与用户场景

在阶段 3 的单一 Auth Context、根 `Stack.Protected` 和四个 Tab 上增量实现：

```text
登录表单 → Zod 校验 → AuthService → MockAuthService → 固定模拟响应
→ 保存版本化 Session → 进入受保护路由 → 启动恢复 → 退出清理
```

用户可输入邮箱密码或使用 Demo 按钮登录；必须同意协议；错误凭据和固定网络错误会得到清楚
提示；重启可恢复 Session；退出成功后回到登录页且不能返回受保护页面。

## 3. 本阶段明确不做

不实现真实后端、真实 Token、Refresh Token、注册、找回/修改密码、验证码、第三方或生物识别
登录、Web 登录、协议详情页、上传、视频、分析、CV、统计、TanStack Query、Zustand、数据库或
测试框架初始化，不重建导航、Auth Context、主题或基础组件。

## 4. 修改前项目状态与第一轮探索结论

- 分支正确，开始时无已跟踪修改。
- 存在用户管理的未跟踪文件
  `other_docs/网球视频分析前端Demo详细开发计划书.md`；未读取或修改。
- Provider 只保存 `User | null`，`signInDemo`/`signOut` 均为同步内存操作。
- 根路由已使用 `Stack.Protected` 区分登录页和 Tabs/上传/详情页。
- 登录页只有一个 Demo 按钮；“我的”页已有退出入口。
- `AppButton` 已支持 loading、disabled 和无障碍状态，不需要修改。
- Mobile 未直接安装 React Hook Form、Zod、resolver 或 AsyncStorage。
- 仓库没有测试框架和测试命令。

## 5. 最初实施计划

1. 使用 Expo 兼容方式安装 AsyncStorage，使用 pnpm 安装表单依赖。
2. 建立 Auth 类型、Service 接口、固定 Mock Service、错误映射、Schema 和 Storage。
3. 升级现有 Provider，公开恢复状态、当前操作、错误和异步认证操作。
4. 使用 React Hook Form + Zod 实现登录表单、密码显示和协议勾选。
5. 根布局在恢复完成前阻止路由判断；“我的”页实现一致的异步退出。
6. 更新模块说明、架构、项目状态和阶段记录。
7. 执行定向、整仓、Android export、Metro 和 Git 只读验证。

## 6. 实际完成内容

- 登录页已使用 React Hook Form、Zod 和 resolver。
- 邮箱在提交输出中 trim 并转为小写；密码至少 8 位；协议必须勾选。
- 密码支持显示/隐藏且字段值不被重置。
- 新增 `AuthService` 与固定延迟的 `MockAuthService`。
- 普通登录和 Demo 登录共用 Provider、Service 和持久化流程。
- Provider 使用同步 ref 锁阻止普通登录、Demo 登录和退出并发。
- Session key 与对象内部均使用 v1，持久化 Mock token 和 `User`，不保存密码。
- 登录保存成功后才更新内存身份；保存失败保持未登录。
- 启动状态为 `restoring`，恢复完成前根布局不挂载受保护路由。
- 损坏 Session 会尝试清理；清理失败仍结束恢复并回到未登录，避免白屏和循环。
- 退出时先调用 Service、再清理 Storage，全部成功后才清除内存身份。
- 退出清理失败保留登录状态并显示错误。
- 继续使用现有 Provider、hook、Demo User、Protected Routes、Tabs、PageShell、AppButton、
  AppCard 和主题。

## 7. 与计划不同的地方及原因

- 两个小型 Schema 合并到职责明确的 `schemas.ts`，避免只有少量声明的目录碎片。
- Demo 凭据与 Mock 判断保留在 `MockAuthService.ts`，Provider 只引用 Demo 凭据发起同一登录流程。
- 错误映射单独保留，因为需要覆盖 Service、读取、保存、清理和损坏重置等多个错误。
- 未修改 `AppButton.tsx` 和组件出口；现有 loading、disabled、busy 能力已满足要求。
- 依赖安装后的递归锁文件检查误入依赖目录并超时；安装实际已成功，随后用限定范围 `rg` 复查。
- 根 format check 被禁止修改的用户未跟踪 Markdown 阻塞，因此保留真实失败并补充本阶段范围检查。

## 8. 新增文件

| 文件                                                             | 职责                                            |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| `apps/mobile/src/features/auth/types.ts`                         | Session、凭据、状态、操作和 Provider API 类型。 |
| `apps/mobile/src/features/auth/authErrors.ts`                    | 认证/存储错误到 `AppError` 的归一化。           |
| `apps/mobile/src/features/auth/schemas.ts`                       | 登录表单和持久化 Session 的 Zod Schema。        |
| `apps/mobile/src/features/auth/services/AuthService.ts`          | 可由 Mock/Real 替换的认证行为接口。             |
| `apps/mobile/src/features/auth/services/MockAuthService.ts`      | 固定延迟、凭据判断和 Mock Session。             |
| `apps/mobile/src/features/auth/storage/authSessionStorage.ts`    | AsyncStorage 读取、保存、清理与校验。           |
| `apps/mobile/src/features/auth/components/AuthTextField.tsx`     | 登录专用输入、错误和密码显示切换。              |
| `apps/mobile/src/features/auth/components/AgreementCheckbox.tsx` | 协议勾选及无障碍状态。                          |
| `apps/mobile/src/features/auth/README.md`                        | Auth 数据流、职责、安全和替换边界。             |
| `docs/progress/stage-04-mobile-auth-closure.md`                  | 本阶段完整记录。                                |

## 9. 修改文件

| 文件                                                    | 修改原因                                                  |
| ------------------------------------------------------- | --------------------------------------------------------- |
| `apps/mobile/app/_layout.tsx`                           | 恢复完成前显示最小 loading，再挂载现有 Protected Routes。 |
| `apps/mobile/app/index.tsx`                             | 恢复期间不提前重定向。                                    |
| `apps/mobile/app/(auth)/login.tsx`                      | 完整登录表单、两种登录、状态和错误展示。                  |
| `apps/mobile/app/(tabs)/profile.tsx`                    | 展示恢复身份、退出 loading 和退出错误。                   |
| `apps/mobile/src/features/auth/AuthSessionProvider.tsx` | 认证状态与登录/恢复/退出流程编排。                        |
| `apps/mobile/src/features/auth/demoUser.ts`             | 补充固定 Demo 邮箱。                                      |
| `apps/mobile/src/features/auth/index.ts`                | 导出表单 Schema/类型与既有 Provider API。                 |
| `apps/mobile/package.json`                              | 添加四个阶段必需依赖。                                    |
| `pnpm-lock.yaml`                                        | 同步依赖解析结果。                                        |
| `docs/ARCHITECTURE.md`                                  | 记录 Auth Service、Storage、Schema 和恢复边界。           |
| `docs/PROJECT_STATUS.md`                                | 更新阶段 4 真实能力、验证、限制和待验收状态。             |

## 10. 删除文件

无。

## 11. Auth 文件职责与接口

页面只负责 RHF 表单、展示和交互；Provider 只负责状态与流程编排；`AuthService` 定义
`login(credentials)` 和 `logout(session)`；`MockAuthService` 实现固定行为；Storage 独立操作
AsyncStorage；Schema 执行运行时校验；Router 继续负责访问边界。

Provider 对外提供等价于：

```ts
status: 'restoring' | 'authenticated' | 'unauthenticated';
user: User | null;
isAuthenticated: boolean;
activeOperation: 'password-login' | 'demo-login' | 'logout' | null;
authError: AppError | null;
login(credentials): Promise<void>;
signInDemo(): Promise<void>;
signOut(): Promise<void>;
clearAuthError(): void;
```

Provider 不包含 AsyncStorage 实现、Zod Schema、账号判断、表单逻辑或页面文案。

## 12. MockAuthService 行为

- 固定延迟：700 ms。
- 成功账号：`demo@tennis.local` / `TennisDemo123!`。
- 网络错误账号：`network@tennis.local` / `NetworkDemo123!`。
- 仅完整匹配网络错误账号和密码时返回 `MOCK_NETWORK_ERROR`。
- 其他格式正确但不匹配的凭据返回 `INVALID_CREDENTIALS`。
- 成功返回 `version: 1`、`mock-demo-session-token-v1` 和固定 Demo User。
- 不使用随机失败，不访问 React、Router 或 Storage。

## 13. 表单 Schema 规则

- `email`：字符串、trim、小写转换、有效邮箱格式。
- `password`：必填且至少 8 位，不自动 trim。
- `acceptedTerms`：boolean，通过 refine 强制为 `true`。
- 字段错误与 `authError` 分开；修改字段或协议会清理旧 Service 错误。
- Demo 登录只要求协议，不要求用户先填写普通登录字段。

## 14. Session 结构与持久化

storage key：`tennis.auth.session.v1`。

```ts
{
  version: 1,
  token: string,
  user: User,
}
```

保存内容为版本、Mock token 和 User；不保存密码、协议勾选、输入内容或请求状态。保存前和读取后
均通过 Zod 校验对象内部 `version`。只有保存成功后 Provider 才设为 `authenticated`。

## 15. 启动恢复、无效 Session 与状态机

```text
restoring
├─ 无数据 → unauthenticated
├─ v1 Session 有效 → authenticated
├─ JSON/Schema/version 无效 → 尝试清理 → unauthenticated
└─ 读取或损坏清理失败 → authError + unauthenticated
```

恢复完成前根布局显示 ActivityIndicator，不挂载 Stack，防止登录页或受保护页面闪烁。无效数据
清理失败也会退出 `restoring`，不显示技术堆栈，不进入无限 loading 或路由循环。

## 16. 登录、并发和错误状态

普通登录为 `password-login`，Demo 登录为 `demo-login`。Provider 的同步 ref 锁保证任一认证操作
期间其他操作立即返回；页面根据 `activeOperation` 只给对应按钮显示 loading，同时禁用两个登录
按钮和输入。新请求开始清除旧错误，字段变化也清除旧认证错误。

登录 Service 成功但 Storage 保存失败时，Provider 不写入内存 Session，状态保持未登录并展示
`SESSION_SAVE_FAILED`。

## 17. 路由保护变化

没有新建导航或替换 Expo Router。现有保护规则保持：未登录仅开放 `(auth)/login`，已登录开放
`(tabs)`、`upload/index` 和 `videos/[videoId]`。唯一变化是恢复完成前不创建根 Stack；根 index
也在 `restoring` 时不重定向。

## 18. 退出流程

```text
点击退出 → activeOperation=logout → AuthService.logout
→ Storage.removeItem → 清除内存 Session → unauthenticated
→ Stack.Protected 返回登录页
```

Service 或 Storage 清理失败时保留当前 Session 和 `authenticated` 状态，显示退出错误，避免界面
退出但重启后重新登录。退出期间按钮 loading 且不能重复触发。

## 19. 页面状态覆盖

- loading：启动恢复、普通登录、Demo 登录、退出。
- initial/empty：无错误的初始登录表单。
- error：字段校验、协议、错误凭据、固定网络错误、读/写/清理 Session 错误。
- success：进入主应用、重启恢复、退出返回登录页；需用户人工确认交互结果。

## 20. 新增依赖、package 与锁文件

| 包名                                        | 版本      | 用途                | 安装方式      |
| ------------------------------------------- | --------- | ------------------- | ------------- |
| `@react-native-async-storage/async-storage` | `2.2.0`   | 原生 Session 持久化 | Expo 兼容安装 |
| `react-hook-form`                           | `^7.81.0` | 表单状态            | pnpm          |
| `zod`                                       | `^4.4.3`  | 运行时校验          | pnpm          |
| `@hookform/resolvers`                       | `^5.4.0`  | RHF/Zod 连接        | pnpm          |

只修改 Mobile `package.json` 和根 `pnpm-lock.yaml`。只有根锁文件；没有 `package-lock.json`、
`yarn.lock` 或 Mobile 嵌套锁文件。安装只出现既有上游 `uuid@7.0.3` 弃用提示。

## 21. 环境变量、shared-types 与 Web 变化

- 环境变量：无变化，未读取或修改 `.env*`。
- shared-types：无变化，只消费既有 `User` 和 `AppError`。
- Web：无源码变化，仅执行既有 build 验证。
- `other_docs`：未读取、修改、移动、删除或暂存。

## 22. 自动化测试状态

仓库当前没有测试框架或测试命令，因此未执行自动化测试，不声称“测试通过”。持久化故障注入
分支已实现，但没有自动化测试覆盖。

## 23. 执行过的主要命令与真实结果

| 命令或检查                                                  | 真实结果                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `git status --short --branch` / `git branch --show-current` | 分支正确；开始时只有用户未跟踪 Markdown。                    |
| Expo install AsyncStorage                                   | 通过；安装兼容版本 `2.2.0`。                                 |
| pnpm add RHF/Zod/resolver                                   | 依赖安装通过。后续递归锁文件扫描超时，不影响安装结果。       |
| 限定范围锁文件搜索                                          | 通过；只有根 `pnpm-lock.yaml`。                              |
| 首轮 Mobile typecheck                                       | 失败；协议 literal true 与默认 false 类型冲突。              |
| Schema 修正后 Mobile typecheck                              | 通过。                                                       |
| Mobile lint                                                 | 通过。                                                       |
| 根 lint                                                     | 通过。                                                       |
| 根 typecheck                                                | 通过。                                                       |
| `pnpm format:check`                                         | 失败；唯一警告为禁止修改的用户未跟踪 `other_docs` Markdown。 |
| 本阶段允许范围 Prettier                                     | 通过。                                                       |
| `pnpm web:build`                                            | 通过；Vite 转换 35 个模块。                                  |
| Expo Android export                                         | 通过；1406 个模块、29 个输出文件，临时目录已删除。           |
| `pnpm mobile:start`                                         | 通过；返回 `packager-status:running`。                       |
| Metro 清理                                                  | 通过；结束后 8081 监听数为 0，临时日志已删除。               |
| `git diff --check`                                          | 通过，无空白错误。                                           |

## 24. 人工验证清单

以下均为待用户执行，不标记通过：

### 初始与路由

- [ ] 1. 清除 App 本地 Session 后启动，确认显示登录页。
- [ ] 2. 直接访问 Tabs、`/upload`、`/videos/demo-video`，确认未登录无法进入。
- [ ] 3. 启动恢复期间确认不闪现登录页或受保护页面。

### 表单与协议

- [ ] 4. 空表单提交，确认必填提示。
- [ ] 5. 错误邮箱和少于 8 位密码分别显示字段提示。
- [ ] 6. 正确格式但未勾选协议，普通登录不能提交成功。
- [ ] 7. 未勾选协议点击 Demo 登录，确认显示协议提示。
- [ ] 8. 测试密码显示/隐藏，确认内容不丢失。
- [ ] 9. 测试邮箱首尾空格和大小写，确认成功账号可登录。

### Mock 错误

- [ ] 10. 使用格式正确但错误凭据，确认延迟后显示“邮箱或密码不正确”。
- [ ] 11. 使用 `network@tennis.local` / `NetworkDemo123!`，确认固定网络错误。
- [ ] 12. 修改邮箱或密码后确认旧 Service 错误被清理。
- [ ] 13. 登录失败后修正输入并可重新提交。

### 重复提交

- [ ] 14. 快速重复点击普通登录，确认只产生一个请求。
- [ ] 15. 普通登录期间点击 Demo 登录，确认不会并发。
- [ ] 16. Demo 登录期间点击普通登录，确认不会并发。
- [ ] 17. 只在当前提交按钮显示 loading，但两个按钮都禁用。

### 登录与恢复

- [ ] 18. 使用成功账号登录并进入首页。
- [ ] 19. 关闭并重启 App，确认不闪现登录页并恢复主应用。
- [ ] 20. 确认恢复的 User 显示名和邮箱正确。
- [ ] 21. 使用 Demo 按钮登录，确认同样持久化且重启可恢复。
- [ ] 22. 放入无法解析 JSON 的 Session，确认清理并回到登录页。
- [ ] 23. 放入字段缺失或 `version` 非 1 的 Session，确认清理并回到登录页。

### 持久化失败

- [ ] 24. 通过人工故障注入模拟保存失败，确认不进入登录态并显示保存失败。
- [ ] 25. 模拟退出清理失败，确认保留登录态并显示退出失败。
- [ ] 26. 模拟损坏 Session 清理失败，确认仍结束恢复、无白屏和路由循环。

### 退出与稳定性

- [ ] 27. “我的”页点击退出，确认按钮 loading 且不能重复点击。
- [ ] 28. 退出成功后返回登录页，系统返回键不能进入主应用。
- [ ] 29. 退出后重启，确认保持未登录。
- [ ] 30. 检查控制台无未处理 Promise、React 状态更新、key 或路由警告。
- [ ] 31. 检查键盘输入、页面滚动、小屏按钮、协议区和 Safe Area。
- [ ] 32. 记录实际验收平台，不推断其他平台也通过。

## 25. 人工验证当前状态

未执行。项目当前为 Demo，用户决定以代码实现、自动验证、Android export、Metro 启动和独立
静态审查作为本阶段提交依据，不执行阶段 4 人工交互验收。本记录不将“未执行”写成“通过”。

## 26. 未完成内容、已知问题与风险

- 正式认证和所有视频/分析业务未实现，符合阶段边界。
- 高风险：公开 Mock token 不能用于生产，AsyncStorage 不代表正式安全凭据存储。
- 中风险：Session 保存失败、删除失败、损坏清理失败和非法 ISO Session 故障注入均未执行。
- 中风险：仓库没有自动化测试框架或测试命令，未执行自动化测试。
- 中风险：人工交互验收未执行，未形成具体设备平台的交互覆盖结论。
- 低风险：`other_docs/` 属于范围外用户材料，已由 `.prettierignore` 整体排除；用户文件未修改。

## 27. 对其他模块的影响与下一阶段条件

Web、shared-types、上传、视频、分析和统计代码均未改变。后续 RealAuthService 可在保持
`AuthService` 和页面 API 的前提下替换 Mock，但必须重新设计安全存储、Token 过期和刷新。

下一阶段前应先完成人工清单和独立 diff 审查。建议之后只选择视频上传或视频列表一个切片，建立
业务 Service/Adapter 与 TanStack Query 状态，不与真实认证同时扩展。

## 28. 最终 Git 状态

最终执行 `git status --short`、`git diff --stat`、`git diff --check` 和完整 diff 审查。工作区
保留为未提交状态；未执行 add、commit、push、pull、merge、rebase、reset、clean、stash 或历史
修改。实际输出在最终回复中完整提供。

## 29. 阶段 4-B2：Session 时间校验与认证输入配置修正

阶段 4-C 独立审查结论为“有条件通过，需要先修正”，确认两个问题：

1. 持久化 Session 的 `User.createdAt` 和 `User.updatedAt` 原本只使用非空字符串校验，不能拒绝
   `invalid`、`not-a-date` 等值。
2. 邮箱和密码共用的认证输入组件没有显式关闭系统自动更正。

本次只修改：

- `apps/mobile/src/features/auth/schemas.ts`：新增职责明确的 ISO datetime Schema，并用于两个
  User 时间字段。当前安装的 Zod 4.4.3 类型声明提供并推荐 `z.iso.datetime()`；本次使用
  `z.iso.datetime({ offset: true })`，接受现有 Demo User 的 UTC `Z` 格式及合法时区偏移，拒绝
  普通非日期字符串。其他 Session 规则、Storage、Provider 和路由流程未改变。
- `apps/mobile/src/features/auth/components/AuthTextField.tsx`：在共用 `TextInput` 上统一增加
  `autoCorrect={false}`，同时覆盖邮箱和密码输入；密码显示/隐藏、`secureTextEntry`、字段值、
  焦点、RHF 连接和无障碍行为保持不变。
- `docs/progress/stage-04-mobile-auth-closure.md`：追加本节，不覆盖阶段 4-B 的真实执行历史。
- `docs/PROJECT_STATUS.md`：记录两个问题已修正，阶段 4-C2 和人工交互验收仍待执行。

修改前已确认分支为 `feature/stage-04-mobile-auth-closure`、阶段 4-B 改动仍未提交、暂存区为空；
用户管理的 `other_docs/网球视频分析前端Demo详细开发计划书.md` 未读取或修改。

实际验证结果：

- 本地 Zod 4.4.3 API 探测确认 `z.iso.datetime` 存在；Demo UTC 时间和合法 `+08:00` 偏移通过，
  `invalid` 与 `not-a-date` 被拒绝。
- 定向 Prettier、Mobile lint/typecheck、根 lint/typecheck 和 Web build 均通过。
- 根 `pnpm format:check` 仍失败，唯一警告为禁止修改的用户未跟踪
  `other_docs/网球视频分析前端Demo详细开发计划书.md`；没有修改该文件或 `.prettierignore`。
- 新系统临时目录的 Android export 通过，共打包 1406 个模块并生成 29 个文件；本轮目录已删除。
- Metro `/status` 返回 `packager-status:running`；启动前确认 8081 无既有监听，只终止本轮监听
  进程，结束后 8081 监听数为 0，本轮临时日志已删除。
- 最终 Git 只读检查结果在本任务最终回复提供。

当前没有自动化测试框架，非法 ISO Session 的完整恢复仍待故障注入或未来测试设施确认。阶段 4
人工交互验收仍待用户执行，阶段 4-C2 独立静态复审仍待进行，不能据此写成阶段 4 最终验收通过。

## 30. 阶段 4-B3：收口根 Prettier 格式门禁

阶段 4-C2 已通过静态代码复审。剩余质量门禁为根 `pnpm format:check` 会扫描范围外、由用户管理
的未跟踪 `other_docs/` 目录，并因其中 Markdown 的既有格式退出失败。

本次只在 `.prettierignore` 增加目录级规则 `other_docs/`，没有修改根格式脚本、`.gitignore`、
认证代码、页面、依赖或锁文件，也没有读取、修改、移动、删除或格式化 `other_docs` 中的文件。
选择忽略整个目录而非单个文件，是因为该目录整体属于工程格式门禁范围外的用户原始材料。

加入规则后首次重新执行根 `pnpm format:check` 即通过，退出码为 0，Prettier 报告所有匹配文件
符合格式。阶段 4 人工交互验收仍待用户执行，阶段 4-C3 独立复审仍待进行；所有改动继续保持
未提交和未暂存状态，不能据此写成阶段 4 已最终验收通过。

B3 验证中，按清单将 `.prettierignore` 与两份 Markdown 一并显式传给 Prettier 的首次定向命令
退出 1，准确原因是 Prettier 3.9.5 无法为 `.prettierignore` 推断 parser，并非文件存在格式
错误。随后两份 Markdown 单独执行定向 Prettier 检查；`.prettierignore` 通过精确 Git diff 和
退出码为 0 的根 `pnpm format:check` 验证。根 lint、根 typecheck 和 Web build 均通过。本次没有
运行时代码变化，按 B3 要求未重复 Android export 或 Metro。

## 31. 阶段 4 提交前文档收口

阶段 4-C2 静态代码复审已通过。项目当前为 Demo，用户明确决定不执行阶段 4 人工交互验收，
并以以下已完成事项作为本阶段提交依据：

- Mobile Mock 登录、Session 持久化、启动恢复、路由保护和退出清理代码实现；
- Mobile 与整仓 lint/typecheck、根格式检查和 Web build；
- Expo Android export；
- Metro 启动、状态探测和端口清理；
- 阶段 4-C2 独立静态代码审查。

人工交互验收状态为“未执行”，不得写成“通过”。Session 保存失败、删除失败、损坏 Session
清理失败和非法 ISO Session 故障注入均未执行；仓库没有自动化测试框架或测试命令，因此也未
执行自动化测试。这些是当前 Demo 提交范围的已知验证缺口，后续若进入正式认证或发布级阶段需
补充覆盖。

当前实现仅为使用公开 Demo 凭据和 Mock token 的 Mock 认证，AsyncStorage 持久化不代表正式
安全认证，不包含真实 Token 签发、过期、刷新或安全凭据存储承诺。

`.prettierignore` 已新增 `other_docs/`，使范围外用户目录不再进入根 Prettier 检查或格式化；没有
读取、修改、格式化、删除或暂存其中的用户文件。加入规则后根 `pnpm format:check` 已真实通过。

综上，阶段 4 当前状态为：满足 Demo 阶段提交条件，等待 Git 提交。所有改动仍保持未提交和未
暂存状态，Git 提交由用户另行执行。

提交前最终验证中，首轮根 format check 仅发现本次更新的 `docs/PROJECT_STATUS.md` 需要格式化；
只对该允许修改文件执行 Prettier 后，根 `pnpm format:check` 复验通过。根 lint、根 typecheck 和
Web build 均通过。最终 Git 只读检查结果由本次收口回复提供。
