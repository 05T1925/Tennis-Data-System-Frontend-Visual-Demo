# 阶段 7：Mobile 视频选择与 Mock 上传页面闭环

## 1. 阶段信息

- 阶段编号：7
- 英文标识：`mobile-video-upload`
- 日期：2026-07-14
- 状态：阶段 7-C 简化修正检查完成，阶段 7 满足 Demo 提交条件，等待用户执行 Git 提交。

## 2. 分支和基线

- 分支：`feature/stage-07-mobile-video-upload`
- 基线：`90f9c37 feat(mobile): add persistent mock video analysis services`
- 开始时暂存区和已跟踪工作区为空。
- 用户管理的 `other_docs/网球视频分析前端Demo详细开发计划书.md` 保持未跟踪。

## 3. 原始要求去重

阶段 6 已提供 `createVideo`、`startUpload`、`getVideoById`、Mock 进度、持久化、失败后重启和
上传完成创建 AnalysisTask。本阶段没有复制状态机、Repository 或 Schema，只实现选择器、元数据
Adapter、表单、Query/Mutation 编排、失败体验、离开保护、缓存刷新和导航。

## 4. 用户批准事项

采用 MP4/MOV、最大 500 MiB、无时长上限；安装 Image Picker 和 FileSystem；提供 `success` 与
`fail-once` 场景；允许添加相册权限 plugin；只最小导出既有 `homeQueryKeys`；成功后进入现有详情
骨架。未实现相机、真实上传、列表、详情业务、播放器、Real API、Backend 或 CV。

## 5. 实际依赖版本

- `expo-image-picker`: `57.0.2`
- `expo-file-system`: `57.0.0`

依赖通过当前 Expo CLI 的 `expo install` 安装。只改 Mobile package 与根 pnpm 锁文件；没有新增
package-lock、yarn.lock 或 Mobile 嵌套锁文件，也没有升级无关直接依赖。安装过程仅出现既有
`uuid@7.0.3` deprecated subdependency 和慢 tarball 警告。

## 6. app.json

保留 `expo-router`，新增 `expo-image-picker` plugin。相册文案为“允许网球视频分析选择你相册中的
训练或比赛视频。”，并设置 `cameraPermission: false`、`microphonePermission: false`。
`expo config --type introspect` 证实 Android 没有 CAMERA/RECORD_AUDIO，iOS 没有
NSCameraUsageDescription/NSMicrophoneUsageDescription。

## 7. 权限

Native 点击选择时先读取媒体库权限，必要时请求；limited 允许继续并提示范围有限；不可再次询问
时提供 `Linking.openSettings()`。Web 在用户点击调用链内直接打开选择器，不展示 Native 设置提示。
权限对象和原始异常不会显示给用户。

## 8. Picker 参数

使用 `mediaTypes: ['videos']`、`allowsMultipleSelection: false`、`allowsEditing: false`、
`base64: false`。只取第一条有效 asset；取消不会报错，也不会清空更换前的选择；没有 mount 自动
弹窗、相机 API、完整文件读取或 URI 日志。

## 9. Pending result

本地 Expo 类型确认 `getPendingResultAsync` 可用。Android mount 后调用一次，只处理有效结果；
canceled 保留原选择，pending error 转换为安全文案，不自动打开 Picker。阶段 7-C 增加“最新请求
优先”保护，旧 pending result 不会覆盖用户更新后的主动选择。

## 10. Asset 字段

Mobile 私有 `SelectedVideoAsset` 包含 `uri`、`fileName`、`fileSizeBytes`、可选
`durationSeconds` 和受限 `mimeType`。URI 仅存在于页面生命周期内。

## 11. FileSystem fallback

文件大小按 Picker `fileSize`、Web `File.size`、Native `expo-file-system` 新版 `File.size` 顺序
读取。FileSystem 仅读取元数据，不读取完整视频，不使用 legacy API。

## 12. duration 转换

Picker 的毫秒时长仅转换一次为秒。0 合法，缺失允许继续，存在时必须有限且非负；非法时长显示
安全校验文案。

## 13. 支持格式

仅接受 `video/mp4` 和 `video/quicktime`。优先验证 MIME；MIME 缺失且 type 已确认是 video 时，
才允许由 `.mp4`/`.mov` 推断。图片、Live Photo、paired video、未知 MIME 和未知扩展均拒绝。

## 14. 500 MiB

常量为 `500 * 1024 * 1024`，即 524,288,000 bytes；UI 统一显示“最大 500 MB”。大小必须是有限
正整数且不超过上限，缺失、空文件和超限有独立安全文案。

## 15. 无时长上限

本阶段不设置最长时长限制，只校验已有 duration 是否有效；缺失时显示“时长未提供”。

## 16. 表单

React Hook Form、Zod 和 `zodResolver` 管理 title、matchType、playMode、courtType、note。默认值为
空标题、training、singles、hard、空备注。标题 trim 后必填且最多 80 字；备注最多 500 字，纯空白
映射为 undefined。首次选择以去扩展名文件名预填标题，用户改过标题后更换视频不覆盖。

## 17. Upload feature

新增独立 Upload feature，包含常量、类型、错误映射、Adapter、Schema、纯 workflow、Query keys、
Picker/上传 hooks、展示组件、测试和模块 README。页面负责交互编排，不直接访问 Repository 或
AsyncStorage。

## 18. Mutation

首次提交依次校验身份、asset 和表单，再用 Mutation 调用既有 `createVideo` 与 `startUpload`。
创建成功即保存 videoId；start 不等待整个模拟上传结束。操作锁、disabled 和 loading 防止重复
create/start。创建失败保留草稿且可重新提交；start 失败保留 videoId，重试只 start。

## 19. detail polling

detail Query key 为 `['videos', 'detail', userId, videoId]`，调用 `getVideoById` 并传递 signal。
uploading 时每 500ms refetch；idle 不轮询，uploaded/failed/canceled 停止。进度来自 Service，UI
clamp 到 0～100；没有手写 `setInterval`。

## 20. fail-once

环境场景默认 success。fail-once 下，新建 idle Video 首次 start 使用失败 outcome；持久化状态变为
failed 后，同一 Video 再次 start 使用成功 outcome。决定基于持久化 uploadStatus，不使用随机数、
文件名暗号或内存 Set，不影响 seed failed、uploading 幂等、uploaded 拒绝、列表或 AnalysisService。

## 21. retry

创建失败可重新 create；已有 videoId 的 start 失败或业务失败只调用 `startUpload`，不创建第二条
Video。已选 asset、表单与 videoId 均保留，重试仍由 detail Query 观察同一记录。

## 22. 离开保护

已选视频或非默认表单构成草稿，上传进行中构成活动操作。返回/导航时分别显示草稿或正在上传提示；
继续离开会丢弃页面内存草稿，但不会取消已提交 Mock 状态。阶段 7-C 增加离开确认去重保护，同一
时刻只会弹出一组提示。成功导航设置 bypass，避免被自身保护拦截。系统强制关闭无法由 JS 阻止。

## 23. 缓存刷新

创建后刷新视频列表、首页最近视频和首页概览；上传成功后精确刷新 detail、列表、首页两组数据和
analysis task key。刷新按 userId/videoId 隔离，没有清空整个 QueryClient。

## 24. 成功导航

uploaded 只处理一次，使用 `router.replace('/videos/[videoId]')` 进入既有详情骨架；页面不调用
`startAnalysis`，AnalysisTask 仍由阶段 6 Repository 在上传完成时原子创建。

## 25. 列表阶段边界

没有实现完整视频列表、视频详情业务或分析轮询页面。首页 Query 行为和 UI 未改，只从 feature
出口导出既有 `homeQueryKeys`。

## 26. 新增文件

- `apps/mobile/src/features/upload/`：18 个文件，覆盖 Upload 模块实现、组件、测试和 README。
- `apps/mobile/src/features/videos/services/uploadMockScenario.ts`：纯 fail-once 决策。
- `apps/mobile/src/features/videos/services/uploadMockScenario.test.ts`：场景决策测试。
- `docs/progress/stage-07-mobile-video-upload.md`：本阶段记录。

## 27. 修改文件

- `apps/mobile/app/upload/index.tsx`：产品化上传页面、表单、状态、离开保护和导航。
- `apps/mobile/app.json`：Image Picker plugin 与最小相册权限配置。
- `apps/mobile/package.json`、`pnpm-lock.yaml`：两个 Expo 兼容依赖。
- `apps/mobile/.env.example`、`apps/mobile/src/config/env.ts`：公开 Mock 上传场景及安全解析。
- `apps/mobile/src/features/videos/services/MockVideoService.ts`、`videos/index.ts`：私有场景注入。
- `apps/mobile/src/features/home/index.ts`：仅导出既有首页 Query keys。
- `docs/ARCHITECTURE.md`、`docs/PROJECT_STATUS.md`：同步真实架构、状态和限制。

## 28. 删除文件

无。

## 29. 依赖

仅新增 `expo-image-picker` 57.0.2 与 `expo-file-system` 57.0.0，无其他新依赖。

## 30. 环境变量

新增公开 Demo 配置 `EXPO_PUBLIC_UPLOAD_MOCK_SCENARIO=success`，支持 success/fail-once，空值或未知
值回退 success。未读取或写入真实 `.env`，未增加密钥。

## 31. 测试

Mobile 最终 7 个测试文件、88 个用例全部通过，无 skip/only/todo。新增 4 个文件覆盖 Adapter 的
类型/URI/文件名/大小/时长/MIME/CreateVideoInput，表单 Schema，workflow 终态/轮询/进度/离开/
单次导航/retry，以及 success/fail-once/持久化重试决策。阶段 7-C 额外补充 2 个用例，验证
“仅接受最新 picker 结果”和“离开确认单次打开”。首次测试即通过；首次整体验证随后在 lint 暴露
12 errors、4 warnings，修正 ref 更新时机、effect 内状态写入、手工 memoization 和导入后重跑通
过。本轮阶段 7-C 增量修正后再次通过；最新 Vitest duration 2.15s、tests 199ms，退出码 0。

## 32. lint/typecheck/format

- Mobile lint：退出码 0，最终 0 warning。
- Mobile typecheck：退出码 0。
- 根 lint：退出码 0，58.4s。
- 根 typecheck：退出码 0，10.2s。
- `pnpm format:check`：退出码 0，5.3s。
- `pnpm web:build`：退出码 0，35 modules，Vite build 1.00s。
- `git diff --check`：退出码 0。

## 33. Expo install check

`expo install --check` 退出码 0，输出 `Dependencies are up to date`。

## 34. Android export

退出码 0；1514 modules；27 assets；1 Android HBC bundle；1 metadata.json；共 29 个输出文件；
bundle 约 51.5s。产物位于新的系统临时目录，统计后删除，`TempOutputRemoved=True`。

## 35. iOS export

Windows 上静态 export 成功，退出码 0；1381 modules；23 assets；1 iOS HBC bundle；1
metadata.json；共 25 个输出文件；bundle 约 50.2s。临时目录统计后删除，
`TempOutputRemoved=True`。

## 36. Metro

首次探测中 Metro 已监听，但 PowerShell 将响应内容表示为字节数组，验证脚本字符串比较误判；进程、
端口和日志仍正确清理。改用 UTF-8 解码后重跑，`/status` 返回 `packager-status:running`，退出码 0。
随后只终止本轮 PID 进程树，8081 listener 数为 0，临时日志已删除。

## 37. 人工验证

完成静态人工检查：Picker 参数、Native/Web/limited/denied/cancel/pending 分支、FileSystem metadata
fallback、URI 映射边界、create/start 防重复、polling 终止、fail-once、同 ID retry、单次成功导航、
离开 bypass、精确 Query invalidation、首页 key 导出、原生权限 introspection，以及页面/feature 不
引用 Repository、AsyncStorage、Mock 数组、相机 API、startAnalysis 或手写 timer。

## 38. 未执行项

未执行 Android/iOS 真机交互、Expo Go 人工选择、Development Build 权限弹窗、Web 浏览器人工操作
或视觉验收。阶段 7-B 不含 UI 测试框架，未执行真实文件上传、真实 API 或 Backend 联调。

## 39. 风险

- 不同厂商/平台 content URI 的 `File.size` 回退仍需真机确认。
- Expo Go 可验证选择流程，但 app.json 的最终原生权限需 Development Build/原生构建确认。
- 页面卸载会停止 polling；Mock Repository 继续按时间戳惰性推进，重新访问后追赶。
- create 已持久化而组件立即卸载时，可能留下 idle Mock Video；这是阶段 6 Service 提交边界，不等同于
  真实后台上传。
- 当前只模拟元数据和状态，不传输视频字节；详情仍是骨架。

## 40. Git 状态

当前分支正确，改动均未暂存、未提交、未推送；`git diff --cached --name-status` 为空，
`git diff --check` 通过。没有修改 Auth、Analysis、Statistics、Web、shared-types、阶段 0～6记录、
阶段 6 Repository/Schema/状态推进；没有生成真实 `.env`、export 产物、Metro 日志或额外锁文件。

## 41. 用户文件状态

`other_docs/网球视频分析前端Demo详细开发计划书.md` 未被 Codex 读取、修改、移动、格式化或暂存，
仍为用户管理的未跟踪文件。

## 42. 阶段 7-C：简化修正检查与提交前收口

- 检查日期：2026-07-14。
- 实际检查文件：上传页、Upload feature、MockVideoService fail-once、homeQueryKeys、原生配置、
  阶段文档和测试。
- Picker API 结论：`launchImageLibraryAsync` 使用 `mediaTypes: ['videos']`、`allowsMultipleSelection:
false`、`allowsEditing: false`、`base64: false`；不调用相机，不请求麦克风，不读取 base64。
- 权限结论：只在点击后请求权限；limited 可继续；denied 且不可再次询问时提供设置入口；Web 不走
  Native 设置提示；取消选择不会清空现有草稿。
- pending result 结论：Android mount 最多调用一次；成功结果仍走同一 Asset Adapter；阶段 7-C
  加入请求序号保护，pending result 与用户主动重新选择同时发生时以最新请求为准。
- FileSystem fallback 结论：仅按 Picker `fileSize` → Web `File.size` → Native `File.size` 读取
  元数据；不读字节、不复制视频；异常显示安全文案，不泄露 URI。
- Adapter 结论：仅接受 MP4/MOV；图片、livePhoto、pairedVideo、未知 MIME 和无效 URI 均拒绝；URI
  只保存在 `SelectedVideoAsset`，不会进入 `CreateVideoInput`、Repository、AsyncStorage 或 Query key。
- 表单结论：title 首次按文件名去扩展名预填；用户手工修改后更换视频不覆盖；note 纯空白转
  `undefined`；字段校验与 shared-types 枚举一致。
- create/start/detail 竞态结论：create 成功后只创建一次记录；start 成功后直接写入 detail cache，
  随后进入 uploading polling，不会卡在 idle；retry 继续复用同一 videoId。
- polling 结论：仅 uploading 时按 500ms 轮询；idle 未 start 不轮询；terminal 停止；不使用手写
  `setInterval`；progress 保留并 clamp 到 0～100。
- fail-once 结论：新建 idle 首次 start 失败、failed/canceled 再 start 成功、uploading 幂等、
  uploaded 拒绝；逻辑基于持久化 `uploadStatus`，不依赖随机数或内存 Set。
- retry 结论：create 失败可重新 create；已有 videoId 的 start 失败和业务 failed 都只重新 start，
  不重复 create。
- 成功单次处理结论：uploaded 只触发一次成功导航与缓存收口；页面不调用 `startAnalysis`。
- Query keys 结论：`homeQueryKeys` 与首页实际 key 一致；上传完成只精确失效 detail、list、recent、
  overview 和 analysis task，不清空 QueryClient。
- 离开保护结论：草稿、idle、failed、canceled、uploading 都会提示；uploading 文案明确“上传会继
  续”；阶段 7-C 新增弹窗去重保护；成功 replace 前临时 bypass。
- URI/隐私结论：未发现 URI 持久化、日志打印、Repository 写入、AsyncStorage 写入、storagePath 或
  playbackUrl 泄露。
- 原生权限结论：Android introspection 不含 CAMERA/RECORD_AUDIO；iOS 不含
  NSCameraUsageDescription/NSMicrophoneUsageDescription，保留正确相册说明。
- 发现问题：
  1. pending result 与主动选择缺少先后序保护。
  2. 离开确认缺少防重复弹窗保护。
- 根因：
  1. `useVideoPicker` 只有 mounted guard，没有比较请求新旧。
  2. `usePreventRemove` 回调每次触发都直接弹窗，没有“提示已打开”状态。
- 实际修正：
  1. `useVideoPicker` 增加 request id 保护，只应用最新选择结果。
  2. 上传页增加 leave prompt open guard，限制同一时刻只出现一组确认提示。
- 新增测试：`workflow.test.ts` 补充 2 个用例，覆盖最新 picker 结果与单次 leave prompt。
- 自动验证：本轮修正后重新执行 Mobile test、Mobile lint、Mobile typecheck、Expo install check、
  根 lint、根 typecheck、根 format check、Web build、Android export、iOS export、Metro 与
  `git diff --check`。
- 未执行验证：Android/iOS 真机人工交互、Expo Go 人工选择、Development Build 权限弹窗、Web 人工
  浏览器验收、视觉验收、真实上传。
- 风险：真机 content URI 和实际系统返回差异仍需后续人工验证。
- Git 状态：所有阶段 7 改动仍未暂存、未提交；无 export 产物、Metro 日志或额外锁文件。
- 是否满足 Demo 提交条件：满足。
- 用户文件未被 Codex 修改：是。
- 用户将在最终人工提交时将用户文件纳入版本控制：是。
- 结论：阶段 7-C 简化修正检查完成，阶段 7 满足 Demo 提交条件，等待用户执行 Git 提交。

## 43. 用户最终提交决定

用户计划在阶段 7 最终人工 Git 提交时将上述 `other_docs` 文件纳入版本控制。Codex 在阶段 7
没有执行任何 Git 写操作。

## 结论与下一步

阶段 7-C 简化修正检查完成，阶段 7 满足 Demo 提交条件。所有改动保持未暂存、未提交状态，等待
用户执行 Git 提交和推送。
