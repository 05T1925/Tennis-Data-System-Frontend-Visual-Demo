# 阶段 5：完成 Mobile 首页产品形态与 Mock 查询闭环

## 1. 阶段信息

- 阶段编号：5
- 阶段名称：完成 Mobile 首页产品形态与 Mock 查询闭环
- 英文标识：`mobile-home`
- 执行日期：2026-07-14
- 当前分支：`feature/stage-05-mobile-home`
- 基线提交：`5d11c17 feat(mobile): complete mock authentication session flow`
- 当前状态：阶段 5-C 简化修正检查已完成，满足 Demo 提交条件，等待用户执行 Git 提交。

## 2. 本阶段唯一目标

在阶段 4 的当前 Auth User、Protected Routes 和 Mobile 页面骨架上，建立：

```text
Auth User + VideoService + StatisticsService
→ 确定性 Mock Service
→ 两个独立 TanStack Query
→ 首页 loading / empty / error / success
→ 既有上传页和视频详情页导航
```

## 3. 阶段 A 探索与批准

阶段 5-A 已完成只读探索，确认首页为 `apps/mobile/app/(tabs)/index.tsx`，根布局只有 Safe Area
和 Auth Provider，Mobile 未安装 TanStack Query，shared-types 的 Video、AnalysisStatus 和 AppError
足以支撑首页且无需修改共享包。

用户审查阶段 A 计划后，提供阶段 5-B 指令并要求据此直接工作。本阶段不再等待二次计划确认。

## 4. 开始前状态

- 分支为 `feature/stage-05-mobile-home`。
- HEAD 为阶段 4 最终提交 `5d11c17`。
- 暂存区为空，没有阶段 4 遗留的已跟踪修改或未知删除。
- 只有用户未跟踪文件 `other_docs/网球视频分析前端Demo详细开发计划书.md`。
- `other_docs` 未读取、修改、移动、删除、格式化或暂存。

## 5. 明确不做

不修改 Auth、Session、其他三个 Tab、上传页、视频详情页、Web 或 shared-types；不实现真实上传、
完整视频列表、详情业务、分析轮询、结果页、图表、完整统计页、Real API、Backend、数据库、CV、
Zustand、Axios、日期库、第三方 Skeleton、React Query Devtools 或测试框架。

## 6. 实际完成内容

- 安装 `@tanstack/react-query` 5.101.2。
- 建立稳定 QueryProvider，并接入根 Provider 层级。
- 建立 VideoService、MockVideoService、固定视频数据、排序、limit 和 AbortSignal。
- 建立 StatisticsService、首页消费模型、MockStatisticsService、数值归一化和 AbortSignal。
- 建立 success、empty、error、video-error、statistics-error 五个确定性场景。
- 建立两个包含 userId 的独立 Query 和分区 refetch。
- 首页使用当前 Auth User 生成本地时段问候，并提供安全名称回退。
- 首页新增明显上传 CTA、三条拍摄建议、四项累计统计、最近分析和最近 3 条视频。
- 最近视频使用既有 Video 类型，点击进入已有详情路由；空 ID 不导航。
- 页面覆盖 loading 骨架、首次使用 empty、完整和局部 error、success、局部缺失及保留旧数据的
  refetch 状态。
- 更新 Home README、架构、项目状态和本阶段记录。

## 7. 与阶段 A 计划的差异

阶段 A 列出了更细的候选文件。本阶段按 Demo 文件数量控制进行合并：

- Home 静态文案与格式化函数合并为 `homeContent.ts`。
- 累计统计和最近分析合并为一个职责相关的 `HomeOverviewSection`。
- Video Mock 数据保留在 `MockVideoService.ts`，没有创建单常量文件。
- Statistics Mock 数据和归一化保留在 `MockStatisticsService.ts`。
- 没有单独创建 Home error 组件，两个数据分区直接复用 AppCard、EmptyState 和 AppButton。
- 未实现可选 AppState/focusManager；阶段 5-B 指令明确其不是强制项，避免扩大 QueryProvider。

页面、Provider、Service、Query Hook 和 UI 的职责仍保持分离。

## 8. 新增文件

| 文件                                                                    | 职责                                   |
| ----------------------------------------------------------------------- | -------------------------------------- |
| `apps/mobile/src/providers/QueryProvider.tsx`                           | 稳定 QueryClient 与根 Query Provider。 |
| `apps/mobile/src/features/home/homeContent.ts`                          | 问候、文案、日期/状态/数值格式化。     |
| `apps/mobile/src/features/home/hooks/useHomeQueries.ts`                 | 两个首页 Query、keys、状态和 refetch。 |
| `apps/mobile/src/features/home/components/HomeSectionSkeleton.tsx`      | 无第三方依赖的数据分区骨架。           |
| `apps/mobile/src/features/home/components/HomeOverviewSection.tsx`      | 四项累计统计与最近分析。               |
| `apps/mobile/src/features/home/components/RecentVideosSection.tsx`      | 最近视频、空状态、错误和点击交互。     |
| `apps/mobile/src/features/home/index.ts`                                | Home 稳定公共出口。                    |
| `apps/mobile/src/features/home/README.md`                               | 首页职责、数据流和替换边界。           |
| `apps/mobile/src/features/videos/services/VideoService.ts`              | 最近视频 Service 接口。                |
| `apps/mobile/src/features/videos/services/MockVideoService.ts`          | 固定视频、排序、limit、延迟和场景。    |
| `apps/mobile/src/features/videos/index.ts`                              | Video Service 稳定出口和实例。         |
| `apps/mobile/src/features/statistics/types.ts`                          | HomeOverview 与最近分析消费模型。      |
| `apps/mobile/src/features/statistics/services/StatisticsService.ts`     | 首页统计 Service 接口。                |
| `apps/mobile/src/features/statistics/services/MockStatisticsService.ts` | 固定统计、归一化、延迟和场景。         |
| `apps/mobile/src/features/statistics/index.ts`                          | Statistics Service 稳定出口和实例。    |
| `docs/progress/stage-05-mobile-home.md`                                 | 阶段 5 完整记录。                      |

## 9. 修改文件

| 文件                               | 修改原因                                          |
| ---------------------------------- | ------------------------------------------------- |
| `apps/mobile/app/_layout.tsx`      | 在 Safe Area 和 Auth 之间接入 QueryProvider。     |
| `apps/mobile/app/(tabs)/index.tsx` | 将占位首页升级为完整 Mock 产品首页。              |
| `apps/mobile/src/config/env.ts`    | 解析五种公开 Mock 场景，未知值回退 success。      |
| `apps/mobile/.env.example`         | 增加公开首页 Mock 场景示例值。                    |
| `apps/mobile/package.json`         | 新增唯一依赖 `@tanstack/react-query`。            |
| `pnpm-lock.yaml`                   | 同步 React Query 依赖解析。                       |
| `docs/ARCHITECTURE.md`             | 记录 Query、Service、Mock/Real 边界和首页数据流。 |
| `docs/PROJECT_STATUS.md`           | 更新阶段 5 真实能力、验证、限制和下一阶段条件。   |

## 10. 删除文件

无。

## 11. Provider 与 QueryClient

Provider 顺序：

```text
SafeAreaProvider
└─ QueryProvider
   └─ AuthSessionProvider
      └─ RootNavigator
```

QueryProvider 使用 `useState(() => new QueryClient(...))`，保证客户端只创建一次。它不读取或修改
Auth。Auth 恢复期间受保护首页不挂载，因此不会提前执行首页查询。

默认 Query 策略：

```text
retry: false
staleTime: 60_000
gcTime: 30 * 60_000
refetchOnReconnect: true
```

## 12. Query keys 与组合策略

```text
['home', 'recentVideos', userId, 3]
['home', 'overview', userId]
```

两个 Query 不使用 Promise.all。Query function 将 TanStack Query 的 AbortSignal 传入 Service。
userId 为空时不请求。首次使用 isPending；手动 refetch 使用 isFetching；有旧数据时不切回整页
骨架。视频和统计分别 refetch，单查询失败不会覆盖另一查询的成功数据。

## 13. VideoService

接口接收 userId、可选 limit 和 AbortSignal，返回 shared-types 的 Video[]。Mock 实现固定延迟 700
ms，按 createdAt 倒序，非法日期排在合法日期之后。limit 默认 3，归一化到 1～3；Hook 再截取
前三条，防止未来 Service 实现错误。

Mock 数据使用无真实隐私的固定训练记录，覆盖长标题、空标题、时长 0、失败状态和非法日期等
边界。页面对空标题、未知状态和空 ID 安全降级。

## 14. StatisticsService

接口接收 userId 和可选 AbortSignal，返回 Mobile 内部 HomeOverview：四项累计统计和轻量
LatestAnalysisSummary。它复用 AnalysisStatus，但不向首页传递完整 AnalysisResult 或 CV 数据。

Service 将负数、NaN、Infinity 归一化为 0，计数和毫秒取非负整数，空标题回退“未命名训练”，
非法分析时间回退 null。训练时长内部统一为毫秒，UI 再格式化为小时和分钟。

## 15. Mock 场景

公开配置 `EXPO_PUBLIC_HOME_MOCK_SCENARIO` 支持：

- `success`：3 条最近视频、非零统计和最近分析。
- `empty`：空视频、零统计和 latestAnalysis null。
- `error`：两个查询首次失败，第二次成功。
- `video-error`：视频首次失败，统计首次成功；视频重试成功。
- `statistics-error`：统计首次失败，视频首次成功；统计重试成功。
- 未知值：回退 `success`。

Mock 不使用随机数据、随机延迟或随机错误。首次失败状态由每个 Service 实例独立记录，JS 进程
重启后重置。

临时切换示例：

```powershell
$env:EXPO_PUBLIC_HOME_MOCK_SCENARIO='empty'
pnpm mobile:start
```

## 16. 首页状态

- loading：问候、上传 CTA、建议立即显示；统计/分析和视频分区显示结构骨架。
- empty：两个 Query 成功且视频为空、统计为零、最近分析为空；显示首次上传引导，同时仍显示
  零统计和两个局部空状态。
- error：两个失败时分别显示统计/分析和视频错误；一个失败时保留另一个成功分区。
- success：显示四项统计、最近分析和最多 3 条视频。
- 局部缺失：无分析显示局部空状态；无视频显示局部空状态；非法字段使用安全回退。
- refetch：有旧数据时继续显示旧数据和轻量刷新提示；失败后提供对应分区的真实 refetch。

## 17. 页面与导航

问候读取现有 Auth User，名称按非空 displayName、email 本地部分、`球友` 回退；时段使用设备本地
小时，无日期库。

上传 CTA 使用 `router.navigate('/upload')`。视频使用带参数的 `router.navigate` 进入
`/videos/[videoId]`，导航前检查 ID 非空。没有修改或实现上传页、详情页、视频 Tab 或统计 Tab。

首页继续复用 PageShell、AppButton、AppCard、EmptyState、SectionTitle、现有主题和 Safe Area，
没有创建第二套基础组件。统计卡片在窄屏或 fontScale 大于 1.2 时切换单列。

## 18. 依赖与锁文件

- 新增 `@tanstack/react-query@5.101.2`。
- 只修改 Mobile package.json 和根 pnpm-lock.yaml。
- 未生成 package-lock.json、yarn.lock 或 Mobile 嵌套锁文件。
- 安装出现既有上游 `uuid@7.0.3` deprecated 提示，不影响安装成功。

## 19. shared-types、Auth、Web 与环境变化

- shared-types：未修改；只复用 Video、AnalysisStatus 和 AppError。
- Auth：未修改；现有 Session、Provider、登录、恢复和退出保持原样。
- Web：源码未修改，只执行既有 build。
- 环境文件：未读取或修改真实 `.env` / `.env.*`；只读取并修改已跟踪的 `.env.example`。
- 配置：只增加公开、非敏感的 Mock 场景解析。
- `other_docs`：未读取、修改、移动、删除、格式化或暂存。

## 20. 自动验证

| 命令或检查                                               | 真实结果                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm --filter @tennis/mobile add @tanstack/react-query` | 通过；安装 5.101.2，只更新 Mobile package 和根锁文件。                  |
| `pnpm --filter @tennis/mobile list --depth 0`            | 通过；Mobile 共列出 22 个直接包。                                       |
| 定向 Prettier                                            | 通过；只格式化本阶段允许文件。                                          |
| `pnpm --filter @tennis/mobile lint`                      | 通过。                                                                  |
| `pnpm --filter @tennis/mobile typecheck`                 | 通过。                                                                  |
| `pnpm lint`                                              | 通过；Mobile、Web、shared-types 均通过。                                |
| `pnpm typecheck`                                         | 通过；Mobile、Web、shared-types 均通过。                                |
| `pnpm format:check`                                      | 通过；所有匹配文件符合 Prettier。                                       |
| `pnpm web:build`                                         | 通过；Vite 8.1.4 转换 35 个模块。                                       |
| Mock 场景运行探测                                        | 通过；五种场景、unknown 回退、首次失败后成功和 AbortSignal 均符合设计。 |
| Expo Android export                                      | 通过；1466 个模块、29 个输出文件，临时目录已删除。                      |
| `pnpm mobile:start`                                      | 通过；返回 `packager-status:running`。                                  |
| Metro 清理                                               | 通过；只终止本轮进程树，8081 最终监听数为 0，临时日志已删除。           |
| `git diff --check`                                       | 通过；无空白错误。                                                      |

Mock 场景探测使用 Node 24 的实验性 TypeScript transform 直接加载实际 config 和 Mock Service。
命令退出 0，同时输出 Node experimental/module-type warning；警告不影响探测结果，也没有修改
package type。

## 21. 未执行验证

- 仓库没有自动化测试框架或测试命令，因此未执行自动化测试，也不声称测试通过。
- 未执行 Android/iOS 真机或模拟器人工交互验收。
- 未人工确认大字体、极小屏、返回行为、快速连点和视觉细节。
- 未验证 iOS export 或发布构建；本阶段只要求 Android export 和 Metro。

## 22. 已知问题与风险

- 当前全部首页业务数据来自 Mock，不代表真实服务可用。
- 切换 Mock 场景需要重启 JS/Metro 进程；Fast Refresh 后 Service 首次失败计数可能沿用当前模块
  实例，完整重启可恢复确定性初始状态。
- 未实现 React Native AppState/focusManager；这是阶段 5-B 的非强制项。
- Query cache 不在退出时主动清空，但 userId 已进入 key；正式多用户认证阶段应增加清理策略。
- 人工交互验收未执行，布局和导航仍需用户在目标设备验证。
- 根 README 的阶段描述滞后，但属于本阶段禁止修改范围。

## 23. 安全说明

没有读取真实环境文件、密钥、Token、密码、真实视频或用户隐私。Mock 数据为固定虚构训练记录。
UI 只显示 AppError.userMessage，不显示 technicalMessage 或堆栈。没有使用 any、@ts-ignore、随机
失败或 lint 禁用。

## 24. 提交前状态

阶段 5-C 已完成实际代码检查、必要修正、场景复验、Android export、Metro 和整仓质量门禁。
阶段 5 当前满足 Demo 提交条件，等待用户执行 Git 提交。人工交互和自动化测试仍未执行，不得
将其写成通过。

## 25. 最终 Git 状态

阶段 5 所有改动保持未提交、未暂存。暂存区为空；没有执行 add、commit、push、pull、merge、
rebase、reset、clean、checkout、restore 或 stash。用户 `other_docs` 未跟踪文件保持原样。最终
branch、status、name-status、stat、diff check 和 untracked 清单在阶段 5-C 最终回复中提供。

## 26. 阶段 5-C：实际代码检查、必要修正与提交前收口

### 26.1 检查信息与范围

- 检查日期：2026-07-14。
- 分支与基线：`feature/stage-05-mobile-home`，HEAD `5d11c17`。
- 开始时阶段 5 改动未提交、未暂存，没有意外删除或阶段外已跟踪修改。
- 完整检查根 Provider、首页路由、Home Query/UI、Video/Statistics Service、配置、现有基础组件、
  Auth User 类型、shared-types、package/lock 和阶段 5 文档。
- `apps/mobile/.env.example` 存在且已被 Git 跟踪；真实 `.env` 未读取或修改。
- 用户 `other_docs` 未跟踪文件未读取、修改、移动、删除、格式化或暂存。

### 26.2 QueryProvider 检查

Provider 层级为 SafeAreaProvider → QueryProvider → AuthSessionProvider → RootNavigator。
QueryClient 使用 `useState(() => new QueryClient(...))` 稳定创建一次；没有第二个 Provider、
Devtools、AppState 或复杂监听。retry、staleTime、gcTime 和 refetchOnReconnect 与文档一致。
QueryProvider 不依赖 Auth 或 Router，阶段 4 restoring 和 Stack.Protected 未被破坏。

### 26.3 发现的问题

1. 中等：MockVideoService 使用传入的任意 userId 动态生成同一套 Demo 视频；
   MockStatisticsService 对任意非空 userId 返回 Demo 统计。query key 虽包含 userId，但 Service
   没有真实隔离，存在将 Demo 用户数据返回给未知身份的问题。
2. 低：`useQuery<..., AppError>` 只提供静态类型。未来 Service 若抛出普通 Error，UI 依赖
   `userMessage.trim()` 可能无法安全降级。
3. 低：Abort listener 使用 `{ once: true }` 会在触发后由平台移除，但 onAbort 分支没有显式
   remove，与本轮要求的对称清理不够清楚。
4. 配置收口：已有 `.env.example` 尚未列出 `EXPO_PUBLIC_HOME_MOCK_SCENARIO`。

未发现高严重度问题。

### 26.4 实际修正

- `MockVideoService.ts`：建立固定 `demo-user-local` Mock 数据，按 `video.userId === userId` 过滤；
  未知或空 userId 返回空数组，且不消耗首次失败次数。排序仍在新数组上完成，不修改模块级数组。
- `MockStatisticsService.ts`：只对固定 Demo User 返回成功/错误场景数据；未知或空 userId 返回
  归一化零统计和 `latestAnalysis: null`，不消耗首次失败次数。
- 两个 Mock Service：Abort 分支在 clearTimeout 后显式 removeEventListener，再 reject；正常完成
  也移除 listener。
- `useHomeQueries.ts`：保留 signal aborted 的取消异常；其他未知异常在 Query 边界归一化为
  AppError。两个 Query、keys、enabled、refetch 和最多 3 条防御截取保持不变。
- `homeContent.ts`：错误文案在运行时检查字符串后再 trim，异常结构回退安全文案。
- `apps/mobile/.env.example`：增加公开、非敏感的
  `EXPO_PUBLIC_HOME_MOCK_SCENARIO=success` 示例和说明。
- Home README、ARCHITECTURE、PROJECT_STATUS 和本记录同步实际修正与提交资格。

本轮未修改依赖、锁文件、Auth、其他 Tabs、上传/详情业务、Web、shared-types 或旧阶段记录。

### 26.5 Service、Abort 与场景复验

使用 Node 24 实验性 TypeScript transform 直接加载实际 env 和两个 Mock Service，退出码为 0：

- success：当前 Demo User 返回 3 条视频，所有 video.userId 均匹配；统计 totalVideos 为 12。
- empty：视频 0 条，统计为零。
- error：两个查询首次 rejected，第二次 fulfilled。
- video-error：只有视频首次 rejected，统计首次 fulfilled；视频重试 fulfilled。
- statistics-error：只有统计首次 rejected，视频首次 fulfilled；统计重试 fulfilled。
- unknown 配置回退 success。
- 未知 userId：视频返回 `[]`；统计返回四项 0 和 `latestAnalysis: null`。
- 未知 userId 后首次 Demo 请求仍失败、第二次成功，确认未知用户不消耗首次失败。
- Video 和 Statistics 在 Abort 后约 31 ms 拒绝；listener 均 added 1、removed 1。
- Abort 后第一次 Demo 请求仍失败、第二次成功，确认取消不消耗首次失败。
- Video 正常完成 listener added 1、removed 1。
- limit：NaN → 3、Infinity → 3、-4 → 1、2.8 → 2。

探测输出包含 Node experimental/module-type warning；未修改 package type，未在仓库留下脚本，也不
将该探测称为自动化测试框架。

### 26.6 Query 与首页四态复核

- 两个独立 Query，不使用 Promise.all；keys 分别包含 userId 和视频 limit 3。
- userId 为空时 enabled false，导出的 pending 状态同时受 enabled 限制，不会永久显示骨架。
- Query function 传递 AbortSignal，自动 retry 关闭；分区按钮只调用对应 refetch。
- AppButton 在 isFetching 时 loading/disabled，避免重复 refetch。
- 有旧数据时 pending 条件不成立，继续显示旧数据和轻量刷新状态。
- loading 保留问候、上传和建议并显示分区骨架；empty 保留完整页面和首次上传引导；error 支持
  完整和局部失败；success 显示四项统计、最近分析和最多 3 条视频。
- 上传使用 `/upload`，视频详情使用 `/videos/[videoId]`，空 ID 不导航；目标页业务未修改。
- 未知状态、空标题、非法日期和非法数值均有安全降级；页面不显示 CV 或能力画像。

### 26.7 环境配置结果

`env.ts` 静态读取 `process.env.EXPO_PUBLIC_HOME_MOCK_SCENARIO`，支持 success、empty、error、
video-error、statistics-error，空值和未知值回退 success。`.env.example` 已补充公开默认值。没有
读取动态环境变量名、真实 `.env`、密钥或敏感配置。

### 26.8 阶段 5-C 验证结果

| 命令或检查                                     | 真实结果                                           |
| ---------------------------------------------- | -------------------------------------------------- |
| `pnpm --filter @tennis/mobile list --depth 0`  | 通过；React Query 5.101.2，22 个直接包。           |
| `pnpm --filter @tennis/mobile lint`            | 通过。                                             |
| `pnpm --filter @tennis/mobile typecheck`       | 通过。                                             |
| `pnpm lint`                                    | 通过；Mobile、Web、shared-types 均通过。           |
| `pnpm typecheck`                               | 通过；Mobile、Web、shared-types 均通过。           |
| `pnpm format:check`                            | 通过；所有匹配文件符合 Prettier。                  |
| `pnpm web:build`                               | 通过；Vite 8.1.4 转换 35 个模块。                  |
| Mock 隔离、场景、Abort、listener 和 limit 探测 | 通过；详细结果见 26.5。                            |
| 修正后 Expo Android export                     | 通过；1466 个模块、29 个输出文件，临时目录已删除。 |
| 修正后 `pnpm mobile:start`                     | 通过；`packager-status:running`。                  |
| Metro 清理                                     | 通过；8081 最终监听数 0，临时日志已删除。          |
| `git diff --check`                             | 通过；无空白错误。                                 |

定向 Prettier 首次把 `.env.example` 与 TypeScript 文件一起传入，TypeScript 文件已成功格式化，但
Prettier 因无法为 `.env.example` 推断 parser 使该命令退出 1；这不是环境文件内容错误。随后只对
支持的阶段 5 文件执行定向格式化，并通过根 `pnpm format:check` 验证整体格式。

### 26.9 未执行验证与已知风险

- 仓库没有自动化测试框架或测试命令，未执行自动化测试，不声称测试通过。
- 未执行 Android/iOS 真机或模拟器人工交互、极小屏、大字体、快速连点或视觉验收。
- 未执行 iOS export 或发布构建。
- 当前仍为 Mock，没有 Real API、Backend、CV 或数据库。
- Fast Refresh 可能保留 Service 实例的首次失败计数；完整 JS/Metro 重启会重置。
- 未实现可选 AppState/focusManager；Query cache 未在退出时主动清空，但 key 包含 userId，且
  Service 现已执行 Demo userId 隔离。
- 用户决定当前 Demo 阶段以实际代码检查、场景探测、构建和启动验证作为提交依据；这不代表人工
  交互验收通过。

### 26.10 阶段 5-C 结论

阶段 5-C 简化修正检查已完成，发现的问题均已在允许范围内最小修正，源代码修正后的 Mobile/
整仓质量门禁、Mock 探测、Android export 和 Metro 验证均通过。阶段 5 满足 Demo 提交条件，
等待用户执行 Git 提交。所有改动仍未暂存、未提交。
