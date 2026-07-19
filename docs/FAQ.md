# 常见问题

## 1. 为什么默认使用 Mock？

v0.1 首先验证完整前端产品流程。Mock 不依赖尚未实现的 Backend、数据库、对象存储或 CV 服务，
缺失、空白或为 `true` 的 `USE_MOCK` 都确定性进入 Mock。

## 2. 如何切换 Real API Draft？

将 Mobile 的 `EXPO_PUBLIC_USE_MOCK` 或 Web 的 `VITE_USE_MOCK` 精确设为 `false`，并提供合法
的公开 API Base URL。Real 是前端 Draft，不代表正式 Backend 已接通。

## 3. 为什么修改环境变量后需要重启？

Expo 和 Vite 在启动/构建时读取公开环境变量，Service Factory 也在当前进程中固定选择模式。

## 4. 为什么 Real 上传不可用？

上传初始化、二进制传输、完成确认和存储契约尚未由 Backend 确认。前端返回 Level 1 安全错误，
不会伪造请求或回退 Mock。

## 5. 为什么 retry、Statistics、CV 和 Logs 可能显示未配置？

这些 Real 契约仍为 Level 1。Mock 中存在对应演示能力，不等于 Real API 已实现。

## 6. Local Contract Stub 是 Backend 吗？

不是。它是仓库外的前端测试夹具，只验证 method、path、DTO、错误和轮询边界。

## 7. 为什么 Mobile Real 登录重启后消失？

Mobile Real Access Token 按当前 Draft 只保存在运行内存，避免将 Token 写入 AsyncStorage。

## 8. 为什么 Web Real Session 只在当前标签页？

Web 将 Real Session 放在 `sessionStorage`。关闭标签页后会话消失，这仍不是生产级认证方案。

## 9. 为什么 App 和 Web 的 Mock 数据不共享？

Mobile 使用 AsyncStorage DemoDataRepository，Web 使用独立 localStorage Snapshot。隔离可以避免
Web 修改 Mobile 状态或共享 Query keys。

## 10. 如何重置 Web Demo 数据？

在开发环境、Mock 模式的 Overview 使用“重置 Demo 数据”并确认。操作只影响当前浏览器 Snapshot。

## 11. 如何重置 Mobile Demo 数据？

当前没有面向用户的全局 reset 按钮。可以使用现有公开 Mock 场景重新演示；开发排障时只能操作本
应用自己的 Storage key，不能使用 `AsyncStorage.clear()`。

## 12. Demo 凭据是不是正式账号？

不是。页面展示的 Mobile/Web Demo 凭据是公开前端数据，不提供正式身份或服务端授权。

## 13. 为什么不能放管理员密钥或 Service Role key？

`EXPO_PUBLIC_*` 和 `VITE_*` 会进入客户端 bundle，任何用户都可能读取。管理员/服务端秘密只能
由未来 Backend 安全保存。

## 14. Expo 的 8 个版本提示是什么意思？

`expo install --check` 建议 8 个 Expo 包对齐较新的 patch。当前版本仍能测试和启动；阶段 16 将其
作为既有 maintenance warning，不自动升级。

## 15. 为什么 Web build 有大于 500 kB warning？

主 JS 约 1,384.65 kB（gzip 435.67 kB），Vite 因未压缩尺寸超过阈值提示。build 成功，但后续仍应
评估代码拆分和依赖体积。

## 16. 为什么干净安装后第一次 typecheck 可能失败？

当前 HEAD 的 Mobile tsconfig 包含 Expo 自动生成类型。完全干净安装尚没有
`expo-env.d.ts` 和 `.expo/types/router.d.ts`，fetch mock 的重载类型可能不一致。

## 17. 正确的新电脑验证顺序是什么？

先 frozen install，再运行 `pnpm mobile:start`；看到 Metro ready 后停止，然后运行 lint、
typecheck、测试和 Web build。详见[新电脑指南](SETUP_NEW_MACHINE.md)。

## 18. 5173 或 8081 被占用怎么办？

先识别并停止本轮或已知开发进程，再按原命令重启。不要结束来源不明的用户进程，也不要把本地地址
描述成公网地址。

## 19. 为什么任务页面打不开？

Web 任务路由是 `/analysis-tasks`。其他任务短路径不存在，会进入 404。

## 20. 为什么 `/cv-data` 或 `/statistics` 是占位页？

它们保留内部导航和边界说明。当前实际结构化 Result、CV Fixture 和 Logs 在视频详情五个 Tabs；
Overview 提供 Snapshot 统计与图表。

## 21. 如何确认页面离开后轮询停止？

在详情 active Task 中观察请求/调用时间，离开详情后等待超过 3 秒；应不再出现该 Task 调用。终态后
同样应停止。Mock 静态 active Seed 没有 Runtime 时不持续轮询。

## 22. 是否已经支持生产发布？

不支持。Mock Demo 可本地演示；Real API Draft 只适合契约边界验证。

## 23. 是否已经完成 Android/iOS 真机测试？

没有。阶段 16 只确认 Expo 配置与 Metro ready，未完成真机或 Development Build 人工验收。

## 24. 当前有哪些已知中低风险问题？

当前剩余中风险为首次 Expo 前 typecheck、Mobile Real 分页参数 Draft 漂移、Mobile Real 有界 N+1
和缺少根 Error Boundary。M4 已在阶段 16-B 关闭：入口文档中的阶段 15 未提交、旧分支和旧 HEAD
已修正，文档一致性扫描未发现残留旧状态。低风险为 Ant Design List deprecation、部分展示文件
较长，以及任务/占位路由容易被误解。详见
[发布准备评估](RELEASE_READINESS.md)。
