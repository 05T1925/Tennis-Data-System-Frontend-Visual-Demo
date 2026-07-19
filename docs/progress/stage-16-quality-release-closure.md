# 阶段 16：质量、演示与发布准备收口

## 1. 阶段信息

阶段 16-C，日期 2026-07-19。阶段 16-B 已将 16-A 只读审计结论转化为演示、安装和发布前文档；
本轮只修正文档事实并刷新审查材料，不修改业务源码。

## 2. 分支

`feature/stage-16-quality-release-closure`，跟踪同名 origin 分支。

## 3. 基线 HEAD

`a12c77f085412ee40eab66fe7013362a3de80746`，
`feat(api): add mock and real service boundary`。

## 4. A 阶段审计结论

当前仓库 lint、生成 Expo 类型后的 typecheck、Mobile/Web tests 和 Web build 可通过；Mock 模式、
状态、轮询、安全和 Domain 边界符合当前 Demo 目标。A 阶段未发现适合阶段 16 小范围修复的高风险
业务代码问题。

## 5. 去重

阶段 16 不重新实现阶段 1～15 功能，只复验安装、启动、质量门禁、核心 Web Mock 流程和文档事实。
历史阶段记录保留当时状态，不回写。

## 6. 风险标准

高风险仅限安装/构建/启动阻塞、安全泄露、模式串线、数据破坏、失控轮询和关键白屏。可控重复请求、
质量环境依赖和维护债务分别按中低风险记录，不扩大代码范围。

## 7. 高风险结论

没有符合严格标准、且需要在阶段 16 修复的高风险业务代码问题。

## 8. A 阶段识别的中风险

M1 为首次 Expo 类型生成前的干净安装 typecheck；M2 为 Mobile Real 分页参数 Draft 漂移；M3 为
Mobile Real 有界 1+N；M4 为入口状态文档旧事实；M5 为两端缺少根 Error Boundary。

最终剩余中风险为 M1、M2、M3、M5。

### 阶段 16-B 已关闭项

M4：入口文档中的阶段 15 未提交、旧分支和旧 HEAD 已修正；文档一致性扫描未发现残留旧状态。

## 9. 低风险 L1～L3

L1 为 Ant Design List deprecation；L2 为部分展示文件超过 500 行；L3 为任务真实路由和独立
CV/Statistics 占位页易被误解。

## 10. 不修改业务源码的决定

阶段 16-B 处理 M4 文档事实、M1 新电脑操作顺序，并记录其他中低风险；M4 已关闭。阶段 16-C
继续禁止修改 apps、packages、测试、Router、Query、Service、Repository、package 和 lock。

## 11. 修改文件

`README.md`、`AGENTS.md`、`docs/PROJECT_STATUS.md`；因架构文档仍把阶段 15 Real/DTO 和
Recharts 写成未接入，最小修正 `docs/ARCHITECTURE.md`。

## 12. 新增文档

`DEMO_GUIDE.md`、`FAQ.md`、`SETUP_NEW_MACHINE.md`、`RELEASE_READINESS.md` 和本记录。

## 13. README

更新阶段 15 提交、Mock/Real/未实现边界、真实路由、安全说明和四个最终入口链接。

## 14. AGENTS

保留既有开发规则，新增阶段 16 文档-only、业务源码冻结、独立审查和 readiness 真实性约束。

## 15. PROJECT_STATUS

更新当前分支/HEAD、测试和 build 基线、中低风险、未执行项及三层 readiness。

## 16. DEMO_GUIDE

覆盖 Web 30 步、Mobile 推荐流程、Real Draft、演示时间、reset/端口清理和禁止宣称。

## 17. FAQ

覆盖 24 个模式、Session、安全、安装、路由、轮询、warning 和 readiness 问题。

## 18. SETUP_NEW_MACHINE

记录 Windows/Node/pnpm 实际环境、frozen install、首次 Expo 类型生成顺序、启动、验证和故障处理。

## 19. RELEASE_READINESS

区分本轮、历史与未执行证据；记录风险、warning、安全和 Mock/Real/Production 三层结论。

## 20. 自动验证

阶段 16-B 当前仓库复验：Mobile 17/332、Web 29/252；分包与整仓 lint/typecheck、format check、
`git diff --check` 和 Web build 均通过。Build 为 3857 modules，主 JS 1,384.65/435.67 kB、
OverviewCharts 383.90/109.22 kB、Mock services 8.39/3.01 kB（原始/gzip）。Expo check 退出码 1，
仅为既有 8 个 patch 差异；未升级。

## 21. 干净安装

从 tracked 文件和本阶段五个未跟踪文档创建 346 文件的仓库外受控副本，排除 .git、node_modules、
dist、env、用户压缩包和审查材料。frozen install 30.9 秒、940 packages、退出码 0；首次 typecheck
因 Mobile fetch mock TS2322 退出 2。Metro 在 8082 ready 并生成两个 Expo 类型文件后，第二次
typecheck、lint、format check、两端测试和 Web build 全部退出 0。临时副本及生成物在取证后清理。

## 22. Web 启动

显式 Mock、严格 5173，Vite 262 ms ready；监听 PID 39112。验收后停止完整进程链，5173 释放。
stderr 只记录 Ant Design List deprecation。

## 23. Metro 启动

当前仓库 Metro 在 8081 ready，干净副本 Metro 在 8082 ready；两者停止后端口释放。只确认 Expo
配置和 Metro ready，不声称 Android/iOS 或 Development Build 通过。

## 24. Web 人工流程

已验证登录、保护路由、Overview 与 15 个 Recharts surface、关键词/状态/日期/分页筛选、URL 刷新
恢复、空态、详情五 Tabs、failed retry、Runtime 终态、Demo Control 场景创建、force complete、
reset、logout、Session 刷新恢复、404 和 1024/1440/1920 三种视口。Mock mutation 结束后已恢复
默认 Snapshot；未执行 delete。

## 25. Mobile 人工未执行项

阶段 16 不执行 Android/iOS 真机、Expo Go 完整 UI 流程或 Development Build。

## 26. Real Stub 历史证据边界

阶段 15 的 Local Contract Stub 是历史证据；阶段 16 不把它写成本轮重跑，也不称其为 Backend。

## 27. 控制台

Console 只捕获两次既有 Ant Design List deprecation；未捕获其他 React warning、unhandled
rejection、resource 404 或卸载后 state update。List deprecation 保持 L1，不在本阶段修复。

## 28. Network

阶段 16-A 已确认 Mock 不访问 Real Base URL、详情离开与终态停止、静态 active Seed 不持续轮询。
本轮浏览器复验观察到 retry 从 queued 到 terminal，终态不再推进；只执行一次 retry、一次场景创建、
一次 force complete 和一次确认 reset，没有重复 destructive mutation。浏览器接口未提供请求级
Network 导出，因此不把 A 阶段 Network 证据伪写成本轮重新捕获。

## 29. 依赖

阶段 16 未新增、删除或升级依赖，package/lock 无 diff。引用 16-A 结论：未发现可证明未使用的
直接依赖。

## 30. 安全

复验敏感模式、公开变量、Token/Session、无真实 env、无 Stub 和文档不要求服务端秘密。

## 31. 轮询

Mobile queued/processing 为 3s/2s且受焦点/AppState控制；Web Mock 只对 Runtime active 轮询；
Web Real 由 source-neutral polling hint 控制。

## 32. 状态字段

uploadStatus 与 analysisStatus 继续使用独立 shared-types/DTO/UI 映射。

## 33. 类型一致性

App/Web 共享 Domain；DTO、Adapter 和运行时 Schema 保持端内，不深层导入 shared-types。

## 34. 已知 warning

Expo 8 个 patch、Web 主 chunk 大于 500 kB、Ant Design List deprecation。

## 35. 剩余风险

中风险 M1、M2、M3、M5，以及真机、Development Build、正式 Backend/上传/CV/权限/Token、
安全存储、Expo maintenance 和 bundle 优化仍待后续独立任务。最终剩余风险不再包含 M4。

## 36. Demo readiness

Mock Demo 在本地文档、自动验证和 reset 前提下可演示。

## 37. Real Draft readiness

只适合前端集成边界与 Contract Stub 验证。

## 38. Production readiness

不具备。

## 39. Git 状态

阶段 16 改动保持未暂存、未提交、未推送，暂存区为空；最终门禁见仓库外审查材料。

## 40. 阶段 16-C 文档事实修正

修正 Web Mock 与 Real API Draft 的 HTTP 路径表述，将 M4 移为阶段 16-B 已关闭项，并把 Mobile
Session 演示拆分为登录状态恢复和 logout 后保持清理两个确定性场景。本轮只修改文档，业务源码
未变化，因此没有把阶段 16-B 的自动验证、Web/Mobile runtime 或人工流程写成本轮重新执行。
CodeRabbit CLI 未安装，记录为未执行。

## 41. 阶段 16-C 审查材料

阶段 16-C 审查材料已在仓库外刷新。最终条目统计与校验值仅记录于仓库外审查材料和最终审查回复，
不写入源码 ZIP 内部文件。
