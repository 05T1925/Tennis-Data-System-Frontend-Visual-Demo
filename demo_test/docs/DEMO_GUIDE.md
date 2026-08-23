# 网球视频分析系统 v0.1 演示指南

## 1. 演示定位

这是用于验证网球视频分析产品流程的前端 Demo。推荐演示默认 Mock 模式下的身份、模拟上传、
任务推进、失败重试、结果展示和内部 Web Dashboard。Mock 数据、CV Fixture 和能力画像均不代表
正式算法输出、真实视频处理或生产系统。

## 2. 演示前准备

```powershell
pnpm install --frozen-lockfile
```

默认缺失或空白 `USE_MOCK` 即使用 Mock。可以参考
`apps/mobile/.env.example` 和 `apps/web/.env.example` 配置公开 Demo 场景，但演示不需要任何
真实密钥。不要在 `EXPO_PUBLIC_*`、`VITE_*` 或本地 `.env` 中写数据库密码、管理员密钥、
Service Role key 或 Token。

完全干净安装时，先按[新电脑安装与启动指南](SETUP_NEW_MACHINE.md)启动一次 Expo 以生成类型。
正式演示前运行测试和 build，并在 Web Overview 使用“重置 Demo 数据”恢复默认 Snapshot。

## 3. 推荐启动方式

Web：

```powershell
pnpm web:dev
```

Vite 默认使用本机 5173 端口。Mobile：

```powershell
pnpm mobile:start
```

Expo/Metro 通常监听本机 8081。终端显示 `Waiting on http://localhost:8081` 只表示 Metro ready。
这些地址是本地开发地址，不是公网服务。端口被占用时先停止占用进程；不要在演示资料中静默改用
另一端口。局域网访问还受防火墙和网络模式影响。

## 4. Web 演示脚本

1. 打开 `/login`，说明公开 Demo 管理员不是正式账号。
2. 使用“使用 Demo 管理员进入”，观察保护路由跳转至 `/overview`。
3. 查看 Overview 七项指标、Recharts、最近新增、最近失败和当前处理中列表。
4. 展示仅 DEV + Mock 可见的 Demo Control。
5. 进入 `/videos`，依次验证 keyword、uploadStatus、analysisStatus、日期、分页和 pageSize。
6. 刷新 URL，说明筛选状态可恢复；使用不存在关键词展示“筛选空”。
7. 打开视频详情，依次查看基础信息、结构化结果、每一拍数据、CV 原始输出和分析任务日志五个 Tabs。
8. 打开 failed Task，执行 retry，观察 queued、processing 和 succeeded 的 Mock Runtime 推进。
9. 在成功后查看 Result、CV Fixture 和 Logs。明确 Fixture 不是正式 CV 或算法精度证明。
10. 返回 Overview，创建 success、processing、failed 三类场景；选择 active Task 执行 Force Complete。
11. 使用 Reset 恢复默认 Snapshot。
12. 查看 `/analysis-tasks`、`/cv-data`、`/statistics` 和 `/system`。
13. 打开 `/not-found-demo` 验证 404，然后退出。
14. 再次登录并刷新，验证当前标签页 Mock Session 恢复；演示结束前退出。

`/analysis-tasks` 是真实任务路由。不存在名为 `/tasks` 的任务路由。独立 `/cv-data` 与
`/statistics` 当前是明确占位页；实际 Result、CV Fixture 和 Logs 位于 Video Detail Tabs。

## 5. Mobile 推荐演示脚本

> 阶段 16 未完成 Android/iOS 真机人工验收。以下是推荐演示流程，不代表本轮已全部在真机执行。

1. 使用 Demo 登录，查看首页 Overview 和最近视频。
2. 进入视频列表并展示上传、分析状态分离及本地筛选。
3. 从相册选择 MP4/MOV，填写训练/比赛、单双打、场地和备注。
4. 提交模拟上传，观察进度；使用 `fail-once` 场景展示失败和 retry。
5. 上传成功后进入详情，观察 queued、processing；离开详情后再返回。
6. Task 成功后查看详情摘要和完整 Result 的九项指标及 Demo 图表。
7. 保持登录状态并重启应用，验证 Mock Session 可以恢复。
8. 随后执行 logout，再次重启应用，验证身份保持清理状态且不会自动恢复。

视频字节不会上传到真实存储。选择的 URI 只保存在页面内存草稿中。

## 6. Real API Draft 演示边界

Mobile 使用：

```text
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_BASE_URL=<public-base-url>
```

Web 使用：

```text
VITE_USE_MOCK=false
VITE_API_BASE_URL=<public-base-url>
```

修改后必须重启 Expo/Vite。Base URL 是公开客户端配置，不能包含 credentials、query、hash 或密钥。

Level 2 Draft 覆盖 login/me/logout、Video list/detail/delete、Video analysis task/result，以及
Mobile start analysis 等已记录前端边界。真实上传、retry、Statistics、CV 和 Logs 等仍为 Level 1，
会返回明确未配置错误，不回退 Mock。Local Contract Stub 仅为前端测试夹具，不是 Backend。

## 7. 演示时间

- 5 分钟：Web 登录、Overview、筛选、一个详情 Result、Demo Control reset。
- 10～15 分钟：完整 Web 流程，并介绍 Mobile 推荐闭环和 Real API Draft 边界。

## 8. 演示后清理

1. 在 Web/Mobile 退出账号。
2. Web 使用 Reset Demo Data 恢复默认 Snapshot。
3. 在运行 Vite 和 Metro 的终端按 `Ctrl+C`。
4. 确认 5173 和 8081 不再监听。
5. 不提交本地 `.env`、运行日志、截图、下载文件或构建目录。

## 9. 禁止宣称

- 已完成正式 Backend、数据库、Supabase 或真实上传。
- CV Fixture 是真实 CV，或当前数据代表算法精度。
- 当前管理员登录是正式权限系统。
- 系统已经生产部署或具备 Production readiness。
- Android/iOS 真机和 Development Build 已全面验证。

演示中的每个结果都应以“本地 Mock/前端 Draft”描述。
