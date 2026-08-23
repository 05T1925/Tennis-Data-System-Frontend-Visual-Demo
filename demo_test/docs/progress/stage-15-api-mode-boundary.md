# 阶段 15：Mobile / Web Mock 与 Real API 切换边界

## 1. 阶段信息与 Git 基线

阶段 15-C，日期 2026-07-18。分支 `feature/stage-15-api-mode-boundary`；基线 HEAD
`ba4f5e18004ee0de68df1dc33c7af2616ada54c2`，提交 `feat(web): add overview statistics and demo controls`。
开始时工作区、暂存区和未跟踪列表为空。

## 2. 去重与 Service 审计

复用全部 Service 接口、Mock 实现、唯一 Mobile Repository、唯一 Web Snapshot、Query keys、页面
数据流和错误 UI。新增 Web Auth Service；既有稳定出口改由 Factory 选择。未重写 Repository、Seed、
Runtime、Router、shared-types 或旧阶段记录。

## 3. API mode、strict parser 与 Mock 默认

`USE_MOCK` 缺失/空白/`true` 为 Mock，精确 `false` 为 Real，其他非空值返回 `API_MODE_INVALID`。
Real URL 必须绝对、无 credentials/query/hash；开发 HTTP 只允许 localhost/127.0.0.1/::1，生产仅
HTTPS；尾斜杠被移除。Parser 返回 discriminated result，不在 import 时 throw。切换需重启，Query
key 不加入 mode。

## 4. Service Factory 与惰性 Mock

Mobile/Web Factory 在启动时固定选择。Mock bundle 首次方法调用才动态 import并缓存，所有 Mobile
Mock Service 仍共享 `demoDataRepository`，所有 Web Mock Service 仍共享 `webDemoDataRepository`。
Real/invalid 模式不执行 Mock loader；invalid 返回安全 Unconfigured Service，不静默回退。

## 5. HTTP Client、Token Store 与错误

两端私有 Client 支持 GET/POST/DELETE、path、URLSearchParams、JSON body、AbortSignal、Bearer、204、
JSON Schema、request_id 及 400/401/403/404/409/429/5xx/network 映射。Authorization、完整 URL、响应
body 和 stack 不进入 UI。Token Store 可注入，页面不传 Token，Token 不进入 Query key。

## 6. Auth Draft 与 Session mode

Auth login/me/logout 为 Level 2 Frontend Integration Draft。Mobile v2 Session 区分 mode：旧 v1 只在
Mock 模式迁移；Real Token 只在运行内存，不写 AsyncStorage，重启后重新登录。Web v2 Session 在当前
标签页 sessionStorage 保存 mode、Token、User 和可选 expiresAt；v1 只在 Mock 模式迁移，mode mismatch
清理。密码和管理员密钥不保存。两端 Auth Service 提供独立幂等本地凭据清理；远端 logout 失败仍会
删除本地 Session、Token 和身份，Session 提交失败也会丢弃 Token。Web Real Service 拒绝非 admin
Stub User，但前端角色不是正式授权。

## 7. DTO 与 Adapter

两端使用现有 Zod 校验 Draft envelope、User、Video、Task、Result；Adapter 纯函数转换 snake_case，
处理 nullable/ISO/有限数字/枚举，并验证 Shot/Rally/Point ID 唯一、Shot/Rally 双向归属、Point 双向
引用及 summary 数量；Rally `shotIds` 不允许重复或跨 Rally 复用。DTO 不进入
shared-types，非法响应统一为 `REAL_API_RESPONSE_INVALID`。

## 8. Video 与 Analysis 等级

Mobile/Web Video list/detail/delete 为 Level 2；Mobile recent 使用 page/pageSize 并截取，Mobile list
的 uploadStatus 在 Adapter 后过滤；Web 复杂筛选是 Stub Profile 假设。Mobile createVideo/startUpload
返回 `REAL_UPLOAD_TRANSPORT_NOT_CONFIGURED`。Mobile start/task/result 和 Web task/result 为 Level 2；
Real Web 始终保持 `runtimeActive=false`，并由 source-neutral `pollingActive` 在 queued/processing 时
继续请求、终态/null 时停止；Mock 未提供 hint 时仍由 Runtime 决定。Web 列表分别映射筛选后 `total`
与未筛选 `unfiltered_total`。retry 返回 `REAL_RETRY_CONTRACT_NOT_CONFIGURED`，不隐式查 taskId。

## 9. Statistics、CV、Logs 与 Demo Control

两端 Statistics、Web CV、Web Logs 分别返回明确 Level 1 错误。Demo Control 没有 Real 实现，只在
`DEV && ready Mock` 动态加载；Real 页面不创建其 Repository 或显示 reset/create/force complete。

## 10. UI 模式文案

Mock 保留 Demo 登录、凭据和本地标签；Real/invalid 隐藏 Demo 凭据，显示 `Real API Draft`，数据页
使用 API 中性文案。没有重写页面结构、Query、导航或业务交互。

## 11. API Contract 与 Local Contract Stub

`API_CONTRACT.md` 保持 Draft，并新增阶段 15 Stub Profile。仓库外 Node Stub 仅用于固定数据、401、
非法 DTO 和 Abort 验证；它不是 Backend、正式 API 或 Supabase，不进入仓库。

## 12. Mock 回归与测试

阶段 15 不减少既有测试，新增 Config、Factory、HTTP、Auth/Session、DTO/Adapter、Video、Analysis 和
Unsupported Real 测试。15-C 新增远端轮询 hint、logout 500 本地退出、Session 提交失败、双向引用与
`unfiltered_total` 回归。Mobile 17 个测试文件、332 个用例通过；Web 29 个测试文件、252 个用例通过。
两端独立 lint/typecheck、Web build，以及整仓 lint/typecheck/format check/Web build 和
`git diff --check` 全部通过。`expo install --check` 仅报告与基线相同的 8 个 Expo 补丁版本差异，
按任务约束未升级并保留退出码 1。

## 13. 安全与依赖

不新增依赖；继续使用原生 fetch、Zod、Vitest、AppError 和 TanStack Query。不包含真实 `.env`、
真实 URL/Token、数据库密码、Service Role key 或管理员密钥；不使用 Axios 或 Supabase。

## 14. 未联调、风险与阶段 15-C

没有 Level 3。上传 transport、retry taskId、正式分页/筛选、Statistics、CV、Logs、Token 刷新、Mobile
Secure Storage 和服务端管理员授权仍待 Backend 决策。阶段 15-C 已最小修正 Real 轮询、本地认证
清理、DTO 双向引用、分页语义和文档事实；阶段 15 仍等待最终提交资格判断。

Mock Web 在严格 5173 端口验证 Demo 登录、`本地 Mock`、Snapshot Overview 和 DEV Demo Control，
即使 API Base 指向不可用端口也不发 API 请求。Real 缺配置在 5174 验证隐藏 Demo 凭据与快捷登录，
提交后显示安全配置错误。Real Local Contract Stub 在 5175（Stub 43115）验证 login、视频列表、401、
非法 DTO、Abort 和 Level 1 上传错误；页面显示 `Real API Draft`，不显示 Demo Control/Mock 标签。
Stub 仅记录 method/path，不记录 Token 或 body，且不是 Backend。Mobile 的 Stub HTTP 测试通过临时
集成测试执行；未执行 Expo Go、Android/iOS 真机、Development Build 或真实 Backend 联调。

15-C Real Stub Web 使用 5176（Stub 43116）：Task 请求依次在 `14:34:24.930` queued、
`14:34:27.962` processing、`14:34:29.987` succeeded，间隔约 3.03 秒和 2.03 秒，终态后停止并在结果
Tab 请求 Result。`runtimeActive` 始终为 false。筛选返回 total 0 / unfiltered_total 5 时页面显示
“当前筛选条件没有结果”。logout 500 显示安全错误但本地回到登录页，刷新不恢复身份；控制台无错误。
监听 PID 为 Web 12516、Stub 2444，停止后 5176/43116 无监听。

显式 Mock Web 使用 5177（监听 PID 11100）复验 Demo 登录、Snapshot Overview、DEV Demo Control、
失败任务 retry 后 Runtime 轮询推进、静态 queued 无 Runtime 不持续推进、刷新恢复和 logout；API Base
指向不可用本地端口仍无 API 或控制台错误。停止后 5177 无监听。Mobile Mock 完整闭环由 332 个自动
用例覆盖；本轮未执行 Mobile 真机 UI 验收。

Web build 转换 3857 modules：主 JS 1,384.65 kB（gzip 435.67 kB），OverviewCharts 383.90 kB
（gzip 109.22 kB），惰性 Mock service chunk 8.39 kB（gzip 3.01 kB）。保留大于 500 kB warning。
阶段 15 未新增、删除或升级依赖。

## 15. Git 状态

最终门禁确认分支 `feature/stage-15-api-mode-boundary`，HEAD
`ba4f5e18004ee0de68df1dc33c7af2616ada54c2`，暂存区为空。阶段 15 改动保持未暂存、未提交、
未推送；package/lock、shared-types、Demo Repository/Seed/Runtime、Query keys、Router 和阶段 0～14
记录均无 diff。仓库内没有真实 `.env`、Stub、日志、dist 或审查材料。
