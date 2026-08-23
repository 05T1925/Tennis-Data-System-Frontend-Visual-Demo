# 阶段 9：Mobile 视频详情、受控分析轮询与结果摘要

## 1. 阶段信息

- 阶段编号：9
- 英文标识：`mobile-video-detail`
- 执行日期：2026-07-15
- 状态：阶段 9-B 实现与自动验证完成，等待阶段 9-C 独立检查。

## 2. 分支

`feature/stage-09-mobile-video-detail`

## 3. 基线提交

`b782bb7 feat(mobile): complete video list workflow`

## 4. 原始要求去重

本阶段只实现视频详情、上传/分析状态、阶段进度、受控 Task 轮询、失败 retry 和简要 Result 摘要。
Auth、Protected Route、QueryProvider、Service、Repository、阶段 8 keys/状态与基础组件全部复用。

## 5. 用户场景

登录用户从视频列表或上传完成页进入详情，查看视频信息、分析阶段和进度；失败时原地重试，成功
后自动看到少量可理解的 Demo 指标。

## 6. 阶段目标

跑通 `route + user → Video → Task polling → Result summary`，且轮询只在详情页前台聚焦时运行。

## 7. 明确不做

未实现播放器、缩略图、视频字节/URI读取、列表轮询、全局后台轮询、完整结果页、Shot/Rally/Point
明细、图表、画像、分享、Web、Real API、Backend 或 CV。

## 8. 阶段 A 结论

阶段 A确认现有 Video/Analysis Service、唯一 Repository 和 shared-types 足够；推荐 canonical Result
key、函数式 `refetchInterval`、局部 focus/AppState、组合恢复边缘和 Result `staleTime: 0`。

## 9. 最终架构

```text
route videoId + Auth userId
→ useVideoDetail / Video detail Query
→ uploaded
→ useAnalysisPolling / single Task Query
→ succeeded
→ Result Query
→ VideoDetailContent
```

页面只规范化参数、读取身份、调用 Hook 和提供返回导航。Hook 负责 Query/retry/cache，纯函数负责
安全决策和格式化，组件负责展示。

## 10. Query keys

```text
['videos', 'detail', userId, videoId]
['analysis', 'task', userId, videoId]
['analysis', 'result', userId, videoId]
['analysis', 'retry', userId]
```

所有业务代码通过 factory 生成 key，没有页面 tuple 字面量。

## 11. Video Query

仅在 trim 后 userId/videoId 非空时启用，调用 `videoService.getVideoById`、传递 Query AbortSignal、
`refetchOnMount: 'always'`、`retry: false`。`VIDEO_NOT_FOUND` 统一显示不存在或无权访问。

## 12. Task Query

仅在 Video Query 成功且 `uploadStatus === 'uploaded'` 时启用。详情只有一个 observer，调用
`getAnalysisTaskByVideoId` 并传递 AbortSignal；error 和 null 都停止自动轮询并提供手动刷新。

## 13. Result Query

仅在 uploaded 且 Task succeeded 后启用，使用 canonical result key、AbortSignal、`staleTime: 0`
和 `retry: false`。Result 不轮询，null/error 只影响摘要区。

## 14. queued 轮询

页面聚焦、AppState active且 Query 无错误时返回 3000 ms。

## 15. processing 轮询

页面聚焦、AppState active且 Query 无错误时返回 2000 ms。

## 16. terminal 停止

succeeded、failed、canceled、unknown、task null/undefined和 query error全部返回 false。

## 17. 页面焦点

`useAnalysisPolling` 通过 Expo Router navigation focus/blur subscription 和
`useSyncExternalStore` 读取局部焦点，不改变其他 Query。

## 18. AppState

初始读取 `AppState.currentState`，只注册一个 change listener；inactive、background和未知值暂停，
cleanup 调用 subscription.remove。

## 19. Resume 立即查询

只观察 `isScreenFocused && appState === 'active'` 的 false→true。初次观察不触发；active/null Task
且无 error/fetching时立即 refetch一次，terminal不请求。

## 20. 防多重轮询

唯一 Task Query 的 `refetchInterval` 是唯一 timer来源。焦点/AppState 同时恢复只形成一个组合边缘；
identity generation隔离路由变化，卸载后 observer和 listener均清理。

## 21. Retry

仅 uploaded + failed允许。同步 identity锁防连续点击，AbortController在 identity变化/卸载时取消。
retry前精确 cancel task；成功写入 returned queued task、移除精确 Result cache并失效首页 overview；
失败保留旧 Task、显示安全错误并精确 refetch当前 active task。不调用 `startAnalysis`。

## 22. 进度和 Stage

stage文案集中覆盖 queued到completed八阶段及 unknown。progress有限值 clamp 0～100，NaN/Infinity
回退0，succeeded强制100，failed保留最后安全值。进度条提供 progressbar role和数值。

## 23. 页面状态

覆盖无效 identity、Video pending/not-found/error/success、上传非完成、Task pending/null/error/五种
状态、Result pending/null/error/success。视频成功数据不会被局部错误清空。

## 24. 错误隔离

Video错误为全页；Task错误只在分析区；Result错误只在摘要区；retry错误只在失败区。UI只显示
`AppError.userMessage`、受控 task errorMessage或固定回退。

## 25. Result 摘要

只读取 `AnalysisResult.summary`，最多展示分析时长、击球、回合、可选得分点、平均每回合击球和
可选最高球速。非法必填指标显示“数据待确认”，非法/缺失可选指标省略，并标记 Demo 分析数据。

## 26. 新增文件

- `analysis/service.ts`：稳定 Analysis Service 单例，避免 Feature 内 barrel 循环。
- `analysis/analysisPresentation.ts`：轮询、恢复、状态、进度、资格和摘要纯函数。
- `analysis/hooks/useAnalysisPolling.ts`：唯一 Task Query、focus/AppState与恢复逻辑。
- `videos/videoDetailPresentation.ts`：route和视频详情安全格式化。
- `videos/hooks/useVideoDetail.ts`：Video/Task/Result组合与retry/cache。
- `videos/components/VideoDetailContent.tsx`：详情页面状态和展示。
- 三个纯函数测试文件及本阶段记录。

## 27. 修改文件

修改详情路由、Videos/Analysis出口与 result key；同步根 README、两个 Feature README、ARCHITECTURE
和 PROJECT_STATUS。未修改列表 Hook/组件、Service接口、Repository、shared-types或旧阶段记录。

## 28. 依赖变化

无新增、删除或升级依赖；package、workspace和 `pnpm-lock.yaml` 均未修改。

## 29. 测试文件和用例

新增 `analysisPolling.test.ts`、`analysisPresentation.test.ts`、`videoDetailPresentation.test.ts`。
当前 Mobile 共14个测试文件、190个用例，全部通过，无 skip/only/todo。

## 30. 自动验证真实结果

- Mobile test：14 files、190 tests通过，退出码0，无 skip/only/todo。
- Mobile lint：通过，0 warning，退出码0。
- Mobile typecheck：通过，退出码0。
- 根 lint：Mobile、Web、shared-types全部通过，退出码0。
- 根 typecheck：三个 workspace全部通过，退出码0。
- 根 format check：全部匹配文件符合Prettier，退出码0。
- Web build：Vite转换35 modules，退出码0。
- Expo install check：`Dependencies are up to date`，退出码0。
- Android export：1529 modules、29 files、5,067,840 bytes，退出码0，临时目录已删除。
- iOS export：1396 modules、25 files、3,812,249 bytes，退出码0，临时目录已删除。
- Metro：`packager-status:running`，结束后8081监听为0，本轮日志已删除。
- `git diff --check`：通过，无空白错误。

首轮 typecheck发现可选摘要字段未被 boolean helper收窄；改为 TypeScript类型谓词后通过，没有关闭
strict、lint或测试。Metro首次探测时PowerShell将响应表示为字节数组，内容实际对应
`packager-status:running`但字符串比较误判；该轮进程/端口/日志完整清理，显式UTF-8解码后重跑
通过。

## 31. 人工验证真实结果

尚未执行 Expo Web、Expo Go、Android真机、iOS真机或Development Build交互。自动纯函数测试不
等同于真实焦点、AppState、视觉、手势或无障碍验收。

## 32. 未执行项

阶段 9-B未执行上述平台人工验收；阶段 10能力、真实播放器、Real API和CV均未执行。

## 33. 风险

当前没有 React Native Hook/UI测试库，focus/AppState实际事件顺序、字体放大、小屏布局和真机后台
恢复依赖后续人工/阶段 C检查。静态 export不能替代真机。

## 34. 安全边界

详情不读取或显示 URI、storagePath、playbackUrl、userId/taskId、Token、Repository Snapshot、
technicalMessage或stack；未新增 `.env` 或 Mock场景。

## 35. 下一阶段条件

自动验证已完成，Git范围复核通过后进入阶段 9-C独立审查。阶段 10才扩展完整结果。

## 36. Git 最终状态

开始分支和HEAD正确、工作区干净。完成时分支和HEAD保持不变，阶段 9文件未暂存，暂存区为空；
没有export、Metro日志、新锁文件或真实 `.env`。全程未执行Git写操作。

## 37. 阶段 C 待检查项

重点审查唯一 Task observer、恢复边缘初次/同时事件、identity竞态、retry提交边界和 Result cache、
AppState cleanup、error隔离、无障碍、小屏/字体放大，以及文档与最终验证事实一致性。

## 38. 阶段 9-C：独立审查与简化修正

### 38.1 审查范围与人工验收状态

阶段 9-C不执行平台人工验收。Expo Web、Expo Go、Android真机、iOS真机和Development Build均为
未执行；静态export、Metro和190个自动测试不代表真实焦点、后台恢复、手势、视觉或无障碍通过。

独立审查接受Video detail Query、唯一Task observer、3秒/2秒轮询、terminal/error/null停止、局部
focus/AppState、恢复单次refetch、Result key/自动启用/不轮询、详情UI、错误隔离和阶段10边界。
本轮没有重写这些架构。

### 38.2 retryState残留问题

阶段 9-B的retryState仅按identity过滤显示，但identity effect没有清除状态。A→B→A或离开后回到
同一视频时，旧pending/error存在重新可见的风险。

初版按审查建议在effect中同步`setRetryState(null)`，Mobile test和typecheck通过，但React lint的
`react-hooks/set-state-in-effect`拒绝该模式。本轮未关闭规则，改为React允许的条件渲染期状态调整：
保存`retryStateIdentity`，identity变化时在新渲染提交前同步将retryState清为null。identity effect
继续只负责generation递增、abort旧Controller和清理旧ref，因此切换userId/videoId或返回同一
videoId都不会恢复上一访问周期的loading/error。

### 38.3 retry owner ABA收口

阶段 9-B finally分别比较Controller和identity。A旧请求被abort、切B、再回A启动新请求时，旧A的
finally可能因identity相同而释放新A lock。

现在finally先要求`retryControllerRef.current === controller`，只有请求仍精确拥有当前Controller时
才同时清理Controller和相同identity的lock。旧请求看到新Controller后不执行任何owner清理，不能
释放新请求锁。success/catch仍保留mounted和generation保护；identity变化仍abort旧请求；retry
Task/Result cache规则、Service调用和单Task不变。

当前没有Hook/UI测试库，因此identity切换和ABA收口由代码级owner约束及回归测试保证，未声称完成
真机生命周期自动测试。

### 38.4 文档事实修正

- AGENTS更新为阶段9，并最小补充Videos列表/详情、Analysis Task轮询/retry/Result摘要职责。
- PROJECT_STATUS将上传完成去向从“详情骨架”改为“视频详情页”。
- PROJECT_STATUS保留列表不轮询，并明确详情使用局部focus和AppState受控轮询。
- 当前阶段更新为阶段9-C完成；明确自动验证通过、人工平台未执行及Demo代码提交边界。

### 38.5 审查材料清理

根目录`apps.rar`已使用普通PowerShell Move-Item移动到：

```text
C:\Users\28641\Desktop\tennis-stage09-review-evidence\apps-stage09.rar
```

目标不存在冲突，未覆盖文件；移动后源文件不存在、目标存在。根目录
`stage-09-git-output.txt`检查时原本不存在。未使用git clean、git rm、restore或其他Git修复命令。

### 38.6 自动回归真实结果

- Mobile test：14 files、190 tests全部通过，退出码0；无skip/only/todo。
- Mobile lint：通过，0 warning，退出码0。
- Mobile typecheck：通过，退出码0。
- 根lint：Mobile、Web、shared-types全部通过，退出码0。
- 根typecheck：三个workspace全部通过，退出码0。
- 根format check：全部匹配文件符合Prettier，退出码0。
- Web build：Vite转换35 modules，退出码0。
- Expo install check：`Dependencies are up to date`，退出码0。
- `git diff --check`：通过，无空白错误。

### 38.7 静态export与Metro

Android使用新临时目录
`C:\Users\28641\AppData\Local\Temp\tennis-stage09c-android-343bff35f425462e8cdad87d5efcec57`：
1529 modules、29 files、5,067,929 bytes，退出码0，目录已删除。

iOS使用新临时目录
`C:\Users\28641\AppData\Local\Temp\tennis-stage09c-ios-e5f001c16cfa446ba31ffa6aa0019b32`：
1396 modules、25 files、3,812,339 bytes，退出码0，目录已删除。

Metro启动前8081监听为0，根PID 36336，`/status`返回`packager-status:running`。仅终止本轮进程树；
结束后8081监听为0，两份系统临时日志均已删除。

### 38.8 当前限制与人工验收

当前仍是Mock，没有真实播放器、Real API、Backend或CV；视频列表继续不轮询；完整Result、Shot、
Rally、Point、图表和画像属于阶段10。没有Hook/UI自动测试。Expo Web、Expo Go、Android真机、
iOS真机和Development Build均未执行。

### 38.9 Git状态与提交条件

开始与完成时分支保持`feature/stage-09-mobile-video-detail`，HEAD保持`b782bb7`，暂存区为空。阶段
9-B源码、测试和文档均保留未暂存；package、锁文件、真实`.env`和阶段0～8记录未修改。没有export
目录、Metro日志或根目录审查压缩包。全程未执行Git写操作，未开始阶段10。

retry identity生命周期、owner ABA、文档事实和审查材料均已收口，完整自动验证通过。阶段9-C满足
Demo代码提交条件，等待用户执行Git提交；这不代表平台人工体验已经验收。
