# Mobile Auth 模块

本模块负责 Mobile v0.1 的 Mock 登录、认证状态编排、Session 持久化和启动恢复。统一入口为
`index.ts`，页面只通过 `useAuthSession` 使用认证能力。

## 数据流

登录页使用 React Hook Form 和 Zod 校验输入，再调用 Provider。Provider 通过 `AuthService`
调用 `MockAuthService`；服务返回 Session 后，Provider 先交给 Storage 保存，保存成功才更新内存
身份。Demo 按钮使用固定凭据走相同流程，不直接写入用户状态。

启动时 Provider 从 Storage 读取 Session，并通过 Zod 校验对象内的 `version`、`token` 和 `user`。
恢复完成前状态为 `restoring`，根路由不会提前判断登录状态。损坏数据会尝试清理；即使清理失败，
也会结束恢复并回到未登录状态，避免白屏或路由循环。

退出时 Provider 先调用 Service，再清除持久化 Session，全部成功后才清除内存身份。清除失败时
保留当前身份并展示错误，避免界面已退出但重启后重新登录的不一致。

## 职责边界

- `AuthSessionProvider.tsx`：状态和登录、恢复、退出流程编排，不包含存储、Schema 或账号判断。
- `services/AuthService.ts`：定义可替换的认证行为。
- `services/MockAuthService.ts`：固定延迟、Demo 成功账号、固定网络错误和错误凭据判断。
- `storage/authSessionStorage.ts`：封装 AsyncStorage；页面不得直接读写 Session。
- `schemas.ts`：登录表单与持久化 Session 的运行时校验。
- `authErrors.ts`：将认证和存储错误归一化为 `AppError`。
- `components/`：仅包含登录专用输入和协议勾选展示。

## 固定 Mock 场景

- 成功：`demo@tennis.local` / `TennisDemo123!`
- 网络错误：`network@tennis.local` / `NetworkDemo123!`
- 其他格式正确但不匹配的凭据：`INVALID_CREDENTIALS`

持久化 key 为 `tennis.auth.session.v1`，对象内部也包含 `version: 1`。只保存 Mock token 和
`User`，不保存密码、协议勾选或表单内容。

## 安全与后续替换

这是公开凭据和演示 Token 构成的 Mock 认证，不具备真实认证安全性。后续接入
`RealAuthService` 时应保持 `AuthService`、Provider 和页面边界，并重新设计安全 Token 存储、
过期和刷新策略。账号判断、存储读写、DTO 转换、导航和页面文案都不应塞入登录页面。
