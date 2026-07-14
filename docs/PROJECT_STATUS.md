# 项目状态

最近更新时间：2026-07-14

## 当前阶段

阶段 4：满足 Demo 阶段提交条件，等待 Git 提交。

当前分支：`feature/stage-04-mobile-auth-closure`

## 状态摘要

Mobile 在阶段 3 的单一 `AuthSessionProvider` 和 `Stack.Protected` 基础上，新增邮箱密码 Mock
登录、Demo 快捷登录、React Hook Form + Zod 校验、固定网络错误场景、AsyncStorage Session
持久化、启动恢复和一致的异步退出流程。Session key 与对象内部均有 v1 版本；不保存密码。

该能力只使用公开 Demo 凭据和 Mock token，不连接真实 Backend，也不具备正式认证安全性。上传、
视频列表、分析任务、结果和统计仍是页面骨架。

项目当前为 Demo，用户决定不执行阶段 4 人工交互验收，并以代码实现、自动验证、Android
export、Metro 启动和独立静态审查作为本阶段提交依据。人工交互验收状态为“未执行”，不得理解
为通过。

阶段 4-C 独立审查发现持久化 User 时间字段只校验非空字符串、认证输入未显式关闭自动更正。
阶段 4-B2 已分别改为 Zod ISO 8601 datetime 校验和 `autoCorrect={false}`，阶段 4-C2 静态代码
复审已通过。阶段 4-B3 将范围外用户目录 `other_docs/` 加入 `.prettierignore`，根格式门禁不再
扫描该目录；其中的用户文件没有被修改或格式化。

## 模块状态

| 模块                           | 状态                  | 真实说明                                                        |
| ------------------------------ | --------------------- | --------------------------------------------------------------- |
| Mobile App                     | ✅ 满足 Demo 提交条件 | Mock 登录闭环已实现；自动验证、构建、启动与独立静态审查已完成。 |
| Web Dashboard                  | ✅ 脚手架已验证       | 本阶段未修改；Vite 构建通过，页面仍为占位页。                   |
| shared-types                   | ✅ 核心模型已建立     | 本阶段未修改；Mobile Auth 复用既有 `User` 和 `AppError`。       |
| Backend / CV / Data Processing | ⏳ 尚未实现           | 未创建。                                                        |
| 业务 Mock Service / Real API   | ⏳ 尚未实现           | 仅 Auth Mock Service 已实现；视频与分析业务 Service 尚未接入。  |

## Mobile Auth 当前能力

- 登录表单使用 React Hook Form 和 Zod，处理邮箱 trim/小写、邮箱格式、密码最短 8 位和协议必选。
- 密码可以显示或隐藏，切换不会重置字段内容。
- 成功账号为 `demo@tennis.local` / `TennisDemo123!`。
- 固定网络错误账号为 `network@tennis.local` / `NetworkDemo123!`。
- 其他格式正确但不匹配的凭据返回 `INVALID_CREDENTIALS`。
- 普通登录与 Demo 登录使用同一 Provider、AuthService、持久化和错误处理流程。
- Provider 公开恢复/认证状态、当前操作、`AppError`、登录、Demo 登录、退出和错误清理能力。
- 登录请求共享同步占用锁；普通登录、Demo 登录和退出不会并发执行。
- storage key 为 `tennis.auth.session.v1`，对象包含 `version: 1`、Mock token 和 `User`。
- Session 中 `User.createdAt` 和 `User.updatedAt` 使用 Zod ISO 8601 datetime 运行时校验。
- 邮箱和密码共用的认证输入组件显式关闭系统自动更正。
- 启动恢复期间不挂载受保护路由；有效 Session 恢复登录，损坏 Session 尝试清理后回到登录页。
- 保存失败不会进入登录态；退出清除失败会保留内存身份并显示错误。
- 继续使用阶段 3 的单一 Auth Context、根 `Stack.Protected`、四个 Tab 和基础组件。

## 新增依赖

| 依赖                                        | 版本      | 用途                                      |
| ------------------------------------------- | --------- | ----------------------------------------- |
| `@react-native-async-storage/async-storage` | `2.2.0`   | 持久化 Mock Session；通过 Expo 兼容安装。 |
| `react-hook-form`                           | `^7.81.0` | 登录表单状态与提交管理。                  |
| `zod`                                       | `^4.4.3`  | 表单和持久化 Session 运行时校验。         |
| `@hookform/resolvers`                       | `^5.4.0`  | 连接 React Hook Form 与 Zod。             |

只有根 `pnpm-lock.yaml`，没有生成 `package-lock.json`、`yarn.lock` 或 Mobile 嵌套锁文件。环境
变量没有变化。

## 自动验证状态

- Mobile lint：通过。
- Mobile typecheck：初次发现协议字段初始值类型冲突；修正 Schema 后复验通过。
- 根 lint：通过。
- 根 typecheck：通过。
- Web build：通过。
- Expo Android export：通过，共生成 29 个临时文件；验证后临时目录已删除。
- Metro 启动：`packager-status:running`；主动关闭后 8081 监听数为 0。
- 根 `pnpm format:check`：阶段 4-B3 通过；`other_docs/` 已作为范围外用户材料目录由
  `.prettierignore` 排除，没有格式化其中的文件。
- B3 清单中的显式 `.prettierignore` 定向 Prettier 首次退出 1，因为 Prettier 3.9.5 无法为
  ignore 文件推断 parser；两份 B3 文档改为单独定向检查，ignore 规则通过精确 diff 和成功的根
  format check 验证。
- 当前没有测试框架或测试命令，因此未执行自动化测试，也不声称测试通过。
- 阶段 4 人工交互验收未执行；项目当前为 Demo，用户决定不将其作为本阶段提交条件。
- 阶段 4-B2 的定向 Prettier、Mobile/根 lint 和 typecheck、Web build、Android export 与 Metro
  启动复验均通过；Android export 仍为 1406 个模块和 29 个输出文件，临时目录已删除；Metro
  结束后 8081 无监听。阶段 4-C2 独立静态代码复审已通过。
- 阶段 4-B3 的根 lint/typecheck 和 Web build 复验通过；未修改运行时代码，因此未重复 Android
  export 或 Metro。

## 当前限制与风险

- Mock 凭据和 token 均为公开演示数据，AsyncStorage 方案不代表正式凭据安全存储。
- 没有真实 Token 签发、过期、Refresh Token、注册、找回密码或真实后端认证。
- Session 保存失败、删除失败、损坏清理失败和非法 ISO Session 故障注入均未执行。
- 仓库没有自动化测试框架或测试命令，因此未执行自动化测试。
- `other_docs/` 是范围外用户材料目录，已从 Prettier 检查和格式化范围中整体排除。
- 阶段 4 人工交互验收未执行，这是用户针对当前 Demo 阶段作出的范围决定。
- 上传、视频、分析、CV、结果和统计业务仍未实现。

## 下一阶段前置条件

- 阶段 4 当前满足 Demo 阶段提交条件，等待用户执行 Git 提交。
- 后续若提升到正式认证或发布级质量，需要补充自动化测试、故障注入和目标平台交互验收。
- 下一业务阶段应选择视频上传或视频列表中的单一切片，并先确认 Service、DTO、Adapter 和状态边界。
