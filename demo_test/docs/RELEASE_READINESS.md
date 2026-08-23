# v0.1 Demo 发布准备评估

## 1. 评估基线

- 阶段 15 提交：`a12c77f085412ee40eab66fe7013362a3de80746`
- 阶段 16 分支：`feature/stage-16-quality-release-closure`
- 阶段 16-B 只修改文档，不修改业务源码或依赖。
- 阶段 16-C 只修正文档事实并刷新审查材料，不修改业务源码或依赖。

## 2. 已完成能力

### Mobile

默认 Mock 下具备身份、首页、视频选择、元数据表单、模拟上传、列表、详情、分析轮询、retry、
摘要和完整 Result。Real API Draft 提供部分 Auth、Video 和 Analysis HTTP 边界。

### Web

默认 Mock 下具备内部管理员登录、Overview、Recharts、视频筛选分页、详情五 Tabs、Result、
CV Fixture、Logs、retry 和 DEV Demo Control。

### 数据与模式

Mobile/Web 各自使用唯一且隔离的 Demo Repository/Snapshot。缺失、空白或 `true` 默认 Mock；
只有显式 `false` 进入 Real API Draft。Level 1 不支持方法返回明确安全错误，不回退 Mock。

## 3. 自动验证

阶段 16-B 当前仓库复验通过：Mobile 17 个测试文件、332 个用例，Web 29 个测试文件、252 个
用例；分包与整仓 lint/typecheck、format check、`git diff --check` 和 Web build 均通过。Web build
转换 3857 modules；主 JS 1,384.65 kB（gzip 435.67 kB），OverviewCharts 383.90 kB
（gzip 109.22 kB），Mock services 8.39 kB（gzip 3.01 kB）。`expo install --check` 退出码为 1，
只报告既有 8 个推荐 patch 版本差异，未升级依赖。阶段 16-C 只修改文档，业务源码未变化，因此
没有把上述阶段 16-B 自动验证写成本轮重新执行。

## 4. 干净安装

阶段 16-B 从 tracked 文件和五个授权新文档创建 346 文件的仓库外受控副本。Node `v24.18.0`、
pnpm `11.7.0` 下 frozen install 用时 30.9 秒，安装 940 packages，退出码 0。首次 Expo 启动前
整仓 typecheck 在 Mobile fetch mock 上稳定出现 TS2322，退出码 2。Metro 在 8082 ready 后生成
`apps/mobile/expo-env.d.ts` 和 `apps/mobile/.expo/types/router.d.ts`；第二次 typecheck、lint、
format check、两端测试和 Web build 全部退出码 0。临时 Metro、端口、build、日志和受控副本均在
取证后清理，不复制生成文件回当前仓库。

## 5. 人工验证边界

阶段 16-B 执行：Web 以显式 Mock 和严格 5173 启动，验证登录、保护路由、Overview/Recharts、视频关键词、
状态/日期/分页筛选、URL 刷新恢复、空态、详情五 Tabs、failed retry、Runtime 终态、场景创建、
force complete、reset、logout、Session 刷新恢复和 404；1024/1440/1920 三个视口无页面级横向
溢出。Console 仅出现既有 Ant Design List deprecation。当前仓库 Metro 在 8081 ready；两个服务
停止后端口均释放，Web Snapshot 已 reset。

历史阶段证据：阶段 15 使用仓库外 Local Contract Stub 验证部分 Real HTTP、远端轮询和 logout
边界。该证据不是阶段 16-B 本轮重新执行。

未执行：Android/iOS 真机、Development Build、正式 Backend、真实上传、真实 CV；阶段 16-A 未
实际执行 Web delete。

## 6. 高风险

阶段 16-A 未发现符合严格标准、且需要在阶段 16 修复的高风险业务代码问题。

## 7. 中风险

- M1：首次 Expo 类型生成前，干净安装 typecheck 可能失败。
- M2：Mobile Real recent videos 的 `pageSize` 与 Draft `page_size` 存在漂移。
- M3：Mobile Real 视频列表可能产生有界 1+N Task 请求。
- M5：Mobile/Web 没有应用根级 Error Boundary。

阶段 16 不修改上述业务代码。最终剩余中风险为 M1、M2、M3、M5。

## 8. 阶段 16-B 已关闭项

- M4：入口文档中的阶段 15 未提交、旧分支和旧 HEAD 已修正；文档一致性扫描未发现残留旧状态。

## 9. 低风险

- L1：Ant Design List deprecation warning。
- L2：部分展示源码超过 500 行，未发现高风险跨层耦合。
- L3：任务路由是 `/analysis-tasks`；独立 CV/Statistics 路由当前是占位页。

## 10. 已知 warning

- Expo 8 个推荐 patch 版本差异。
- Web 主 chunk 大于 500 kB。
- Ant Design List deprecation。

## 11. 安全

仓库不包含真实密钥或真实 `.env`。公开前缀只能保存公开配置。Mobile Real Token 只在内存；
Web Real Session 只在当前标签页 sessionStorage。远端 logout 失败仍完成本地退出。Local Contract
Stub 不进入仓库，也不代表 Backend。Web 客户端管理员角色不是正式服务端授权。

## 12. Readiness 结论

**Mock Demo readiness：** 通过文档和自动验证后，可用于本地演示。

**Real API Draft readiness：** 仅用于前端集成边界和 Contract Stub 验证。

**Production readiness：** 不通过。

CodeRabbit CLI 未安装，阶段 16-C CodeRabbit 审查未执行；该工具不可用不替代人工或自动验证，也不
阻塞本阶段其余质量与提交门禁。

## 13. 后续建议

后续独立任务应覆盖 Android/iOS 真机、Development Build、正式 Backend 契约、真实上传、正式权限、
Mobile Secure Storage、Token refresh、Mobile Real N+1、根 Error Boundary、Expo maintenance、
Web bundle 优化和 Ant Design deprecation。任何接入都必须保持 Mock/Real 同接口、状态分离和
DTO/Domain Adapter 边界。
