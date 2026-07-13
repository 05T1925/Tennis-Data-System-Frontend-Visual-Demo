# 阶段 2：建立共享核心数据模型

## 1. 阶段编号和名称

- 阶段编号：2
- 阶段名称：建立共享核心数据模型
- 执行日期：2026-07-13

## 2. 当前分支

`feature/stage-02-shared-types`

## 3. 本阶段目标

在 `@tennis/shared-types` 建立供 App、Web、未来 Mock Service 和 Real API 共用的 v0.1
核心 TypeScript 数据模型，统一命名、状态和导出边界，建立无测试框架的类型检查示例，并同步
数据模型与项目状态文档。本阶段不实现 UI、Service、API、Mock、Backend、CV 或数据处理。

## 4. 修改前项目状态

- 阶段 1 的 pnpm monorepo、Expo Mobile、Vite Web Dashboard、占位路由和根检查命令已存在。
- `packages/shared-types` 直接消费 TypeScript 源码，仅导出 `AppSurface` 和 `ProjectStage`。
- Mobile 和 Web 各有一个从包根导入 `AppSurface` 的 `import type`。
- 数据模型和 API 文档仍是阶段 0 Draft，部分字段和状态命名与阶段 2 目标不一致。
- 登录、上传、任务、结果、Mock/Real Service、Backend、CV 和数据处理均未实现。
- 当前没有测试框架或测试命令。
- 修改前 Git 有用户管理的未跟踪 `other_docs/` 和根目录 `pace`，本阶段均未处理。

## 5. 实际完成内容

- 按 common、user、video、analysis 和 api 职责拆分共享类型。
- 实现 User、Video、AnalysisTask、结构化网球记录、CV 原始输出、AnalysisResult 和错误模型。
- 使用字符串联合类型统一上传状态、分析状态、分析阶段和领域分类，不使用 TypeScript enum。
- 保持 `src/index.ts` 为唯一公共导出入口，并保留阶段 1 脚手架类型。
- 新增 `type-tests/models.typecheck.ts`，覆盖正向模型实例和两个关键负向边界。
- 将 type-tests 纳入 shared-types 的 lint 和 TypeScript 检查范围。
- 同步 DATA_MODEL、PROJECT_STATUS，并对 API_CONTRACT 和 ARCHITECTURE 做必要的小范围边界更新。
- 完成安装、lint、typecheck、格式检查、Web 构建以及 Vite/Expo 最小启动验证。

## 6. 未完成内容

- 所有业务页面、Service、API 请求、DTO Adapter、Mock 数据和运行时数据校验：未实现。
- Backend、CV、Data Processing、数据库和分析算法：未实现。
- 测试框架与自动化测试：未配置、未执行。
- Mobile 真机、模拟器及完整交互：未验证。
- CourtPoint 坐标语义、PlayerProfile 评分范围和 CV payload 契约：仍待确认。

## 7. 新增文件

| 文件                                                   | 作用                                    |
| ------------------------------------------------------ | --------------------------------------- |
| `packages/shared-types/src/common.ts`                  | 基础别名和脚手架兼容类型。              |
| `packages/shared-types/src/user.ts`                    | User 与 UserRole。                      |
| `packages/shared-types/src/video.ts`                   | Video、上传状态和视频分类。             |
| `packages/shared-types/src/analysis.ts`                | 分析任务、网球记录、CV 输出和分析结果。 |
| `packages/shared-types/src/api.ts`                     | API 响应与前端错误模型。                |
| `packages/shared-types/type-tests/models.typecheck.ts` | 编译期类型使用示例和关键负向边界。      |
| `docs/progress/stage-02-shared-types.md`               | 本阶段完整执行记录。                    |

## 8. 修改文件

| 文件                                  | 修改内容                                             |
| ------------------------------------- | ---------------------------------------------------- |
| `packages/shared-types/src/index.ts`  | 改为全部公共类型的统一导出入口。                     |
| `packages/shared-types/package.json`  | shared-types lint 覆盖 `src` 与 `type-tests`。       |
| `packages/shared-types/tsconfig.json` | include 覆盖源码和类型检查示例。                     |
| `docs/DATA_MODEL.md`                  | 按已编码模型统一字段、状态、关系和 Draft 边界。      |
| `docs/PROJECT_STATUS.md`              | 更新阶段、模块状态、验证、风险和下一阶段条件。       |
| `docs/API_CONTRACT.md`                | 同步 ApiResponse envelope 和 AnalysisTask 字段命名。 |
| `docs/ARCHITECTURE.md`                | 更新 shared-types 当前职责与禁止承载内容。           |

Mobile 和 Web 文件没有修改。

## 9. 删除文件

无。

## 10. 每个类型文件的职责

- `common.ts`：传输基础别名与阶段 1 兼容类型。
- `user.ts`：不包含认证凭据的共享用户领域模型。
- `video.ts`：视频元数据、上传生命周期和比赛属性。
- `analysis.ts`：分析任务生命周期、Shot/Rally/Point、CV 原始输出和消费型分析结果。
- `api.ts`：传输层 response/error payload 与前端归一化错误。
- `index.ts`：包唯一公共出口；外部不需要深层导入。

## 11. 实现的公共类型清单

- 基础：`EntityId`、`IsoDateTimeString`、`ConfidenceScore`。
- 用户：`UserRole`、`User`。
- 视频：`UploadStatus`、`MatchType`、`PlayMode`、`CourtType`、`Video`。
- 任务：`AnalysisStatus`、`AnalysisStage`、`AnalysisTask`。
- 网球记录：`CourtPoint`、`ShotType`、`TacticalType`、`ShotRecord`、`RallyResult`、
  `RallyRecord`、`PointRecord`。
- 输出与结果：`CvOutput`、`AnalysisSummary`、`PlayerProfile`、`AnalysisResult`。
- API 与错误：`ApiErrorPayload`、`ApiResponse`、`AppError`。
- API 响应分支：`ApiSuccessResponse`、`ApiFailureResponse`。

## 12. 保留的脚手架类型

- `AppSurface` 保留 `mobile | web-dashboard`，现有两端导入无需修改。
- `ProjectStage` 覆盖 `stage-0 | stage-1 | stage-2`；小范围修正补回阶段 0。

## 13. 字段命名规则

- Domain Model 字段统一 camelCase。
- 所有实体 ID 使用 `EntityId = string`。
- 数值单位通过 Bytes、Seconds、Ms、Kmh、Meters 等字段后缀明确。
- 未知 payload 和错误 details 使用 `unknown`，没有使用 `any`。
- 未使用 TypeScript enum 或复杂 branded type。

## 14. 时间类型规则

- 创建、更新、开始和完成等业务日期时间使用 `IsoDateTimeString = string`，约定 ISO 8601。
- 视频内部位置使用 `startedAtMs`、`endedAtMs` 等 `number` 毫秒值。
- 类型别名和注释不提供运行时格式或范围验证。

## 15. 状态分离规则

- `UploadStatus`：`idle | uploading | uploaded | failed | canceled`，只表示文件上传生命周期。
- `AnalysisStatus`：`queued | processing | succeeded | failed | canceled`，只表示分析任务总体状态。
- `AnalysisStage`：从 `queued` 到 court/player/ball/trajectory/event/statistics 再到 `completed`
  的具体处理步骤。
- AnalysisTask 的字段名为 `status` 和 `stage`；类型名和领域术语明确其分析上下文。

## 16. Shot、Rally、Point 的关系

- Shot 表示一次击球，并通过 `rallyId` 归属 Rally。
- Rally 表示连续击球过程，保存 `shotIds` 和 `shotCount`，可关联一个 Point。
- Point 表示比赛计分单位，可关联一个 Rally，但不等同于 Rally。
- 数组长度、关联存在性和索引连续性属于运行时业务规则，接口本身不能保证。

## 17. CvOutput 与 AnalysisResult 的边界

- `CvOutput<TPayload = unknown>` 保存原始或近原始 CV payload，实际结构待 CV 契约确认。
- `AnalysisResult` 保存结构化、可消费结果，有独立 `version`、summary 和记录数组。
- AnalysisResult 不内嵌 CV payload，也不包含 AnalysisTask 状态字段。

## 18. ApiResponse 和 AppError 的边界

- `ApiResponse<T>` 是以 `success` 为判别字段的成功/失败联合类型：成功分支保证 `data: T`
  且不能携带 `error`；失败分支保证 `data: null` 且必须携带 `ApiErrorPayload`。
- `AppError` 是前端归一化错误；`userMessage` 面向用户，`technicalMessage` 仅供调试。
- HTTP 状态码没有硬编码进每个响应对象，DTO 到 AppError 的 Adapter 尚未实现。
- 该响应联合仍是前端/接口 Draft，不代表 Backend、Mock Service 或 Real API 已实现。

## 19. 类型检查示例说明

`packages/shared-types/type-tests/models.typecheck.ts` 使用 `satisfies` 创建 User、Video、
AnalysisTask、ShotRecord、RallyRecord、AnalysisResult、`ApiResponse<AnalysisResult>` 和 AppError。
文件还验证 `stage-0`、`stage-2` 均满足 ProjectStage，并增加失败 ApiResponse 正向示例。
`@ts-expect-error` 覆盖 UploadStatus 拒绝 `processing`、AnalysisResult 缺少 version、成功响应
data 为 null、失败响应缺少 error，以及成功响应携带 error。文件不输出日志、不依赖 React、
不进入应用 bundle，并由 shared-types tsconfig 和根 `pnpm typecheck` 检查。这是编译期示例，
不是自动化测试框架。

## 20. 新增依赖

无。

## 21. 依赖变化

无；`pnpm-lock.yaml` 未产生内容变化。

## 22. 环境变量变化

无；没有创建或修改 `.env`、`.env.*` 或 `.env.example`。

## 23. 页面变化

无。

## 24. 路由变化

无。

## 25. Mock 变化

无；Mock Service 和 Mock 数据均未实现。

## 26. API 实现变化

无；仅同步 Draft API 文档中的响应 envelope 和 AnalysisTask 字段命名，没有实现请求层。

## 27. 执行过的命令

```powershell
git status --short
git branch --show-current
pnpm exec prettier --write <本阶段修改文件>
pnpm --filter @tennis/shared-types lint
pnpm --filter @tennis/shared-types typecheck
pnpm install
pnpm lint
pnpm typecheck
pnpm format:check
pnpm web:build
pnpm web:dev
pnpm mobile:start
git status --short
git diff --stat
git diff --check
```

还执行了限定文件读取、shared-types 引用搜索、HTTP/Metro 探测、进程树关闭、端口残留、
锁文件/环境文件/依赖和进程检查命令。

## 28. 每条命令的真实结果

| 命令或检查             | 真实结果                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 分支与状态检查         | 分支正确；已有未跟踪 `other_docs/` 和 `pace`，均未处理。                                                                 |
| 定向 Prettier          | 成功；只针对本阶段允许修改的代码、配置和文档。                                                                            |
| shared-types lint      | 通过，覆盖 `src` 与 `type-tests`。                                                                                        |
| shared-types typecheck | 通过，两个 `@ts-expect-error` 均对应真实类型错误。                                                                        |
| `pnpm install`         | 通过；4 个 workspace 已是最新，410 ms，pnpm 11.7.0。                                                                      |
| `pnpm lint`            | 通过；shared-types、Mobile 和 Web 全部通过。                                                                              |
| `pnpm typecheck`       | 通过；shared-types、Mobile 和 Web 全部通过。                                                                              |
| `pnpm format:check`    | 通过；所有匹配文件符合 Prettier。                                                                                         |
| `pnpm web:build`       | 通过；Vite 8.1.4，35 个模块，748 ms。                                                                                     |
| 首次 Vite 自动探测     | 失败；错误透传额外 `--` 参数且探测地址与监听地址不匹配，30 秒超时；日志显示 Vite 实际已 ready，进程树和 5173 端口已清理。 |
| Vite 复验              | 通过；`http://localhost:5173/videos/demo-video` 返回 200。                                                                |
| Expo/Metro 复验        | 通过；`http://localhost:8081/status` 返回 `packager-status:running`。                                                     |
| 服务清理               | 通过；主动关闭两棵进程树，5173 和 8081 监听数均为 0。                                                                     |
| 最终 Git/安全检查      | 通过；详见第 29 节和最终报告。                                                                                            |

## 29. 人工检查步骤

- 核对所有公共类型均由 `src/index.ts` 导出，外部无需深层导入。
- 核对 Mobile/Web 现有 `AppSurface` import 未被修改且整仓 typecheck 通过。
- 核对没有 `any`、enum、`@ts-ignore`、eslint-disable 或新业务依赖。
- 核对 UploadStatus/AnalysisStatus、CvOutput/AnalysisResult、Rally/Point 分离。
- 核对类型文件和文档均未包含密码、Token、密钥或隐私数据。
- 核对没有新锁文件、真实 `.env`、页面修改或后台服务残留。

未执行真机、模拟器、完整导航或视觉验收。

## 30. 与计划不同的地方

- 阶段 0 文档中的 `pending`、驼峰阶段值、`analysisStatus`/`analysisStage` 字段和
  `dataVersion` 与阶段 2 要求不一致；按阶段 2 契约统一为 `idle`、snake_case 阶段值、
  `status`/`stage` 和 `version`，并同步文档。
- `docs/ARCHITECTURE.md` 原先明确 shared-types 尚不能承载领域模型；阶段 2 完成后对此做了
  必要的小范围状态更新。
- 首次 Vite 自动探测脚本失败后修正参数和地址再验证，失败记录未隐藏。

## 31. 已知问题

- 当前没有运行时 schema 验证；TypeScript 不验证 ISO 格式、进度或置信度范围。
- Mobile 未在真实设备、模拟器或 Web 浏览器中进行交互验证。
- 当前没有测试框架和测试命令。

## 32. 潜在风险

### 高风险

- Backend、上传、CV payload、CourtPoint 坐标语义及结果计算契约尚未确认。

### 中风险

- PlayerProfile 分值和 scoringResult 仍为 Draft，后续契约变化可能需要 Adapter 和类型调整。
- 业务实现前仍需建立运行时校验与首批自动测试策略。

### 低风险

- 上游依赖树仍有 `uuid@7.0.3` 弃用提示，但不影响本阶段安装和验证。

## 33. 对后续阶段的影响

- App、Web、Mock Service 和 Real Service 可从包根共享相同 Domain Model。
- 后续 API DTO 必须与 Domain Model 分离，并通过 Adapter 处理 snake_case/camelCase 和错误映射。
- CV payload 在契约确认前应保持 unknown，不应直接泄漏到 AnalysisResult 或页面。
- 后续运行时业务逻辑需校验范围、关系、数组长度和状态迁移。

## 34. 下一阶段前置条件

- 选择一个单一垂直业务切片并确认允许读写范围与验收路径。
- 确认该切片的最小 API DTO、错误码和 Domain Adapter 映射。
- 定义 Mock Service 与 Real Service 的共同接口。
- 决定运行时校验工具和首批自动测试范围。

## 35. 建议下一阶段任务

建议阶段 3 建立 Service/Adapter 基线和最小 Mock 数据，只选择身份或视频上传中的一个垂直
切片；不要同时实现登录、上传、轮询和结果展示。

## 36. other_docs 状态说明

- 读取：否。
- 修改：否。
- 移动：否。
- 删除：否。
- 暂存：否。

`other_docs/` 保持用户管理的未跟踪状态；AI 未检查或处理其中三个 Word 原始材料的内容。
本阶段也未执行 git add、commit、push、merge 或 Git 历史修改。

## 37. 阶段 2 小范围修正

本次修正仍属于阶段 2，没有开始下一阶段：

- `ProjectStage` 从 `stage-1 | stage-2` 补全为 `stage-0 | stage-1 | stage-2`，`AppSurface`
  保持不变。
- `ApiResponse<T>` 从宽松接口强化为 `ApiSuccessResponse<T> | ApiFailureResponse` 可辨识联合。
- 成功响应保证 `data: T` 且不能携带 `error`；失败响应保证 `data: null` 且必须携带
  `ApiErrorPayload`。`AppError` 职责未改变。
- 类型示例新增 `stage-0`、`stage-2`、失败响应正向用例，以及成功 data 为 null、失败缺少
  error、成功携带 error 三条负向检查。
- DATA_MODEL 已与当前代码字段完全同步；API_CONTRACT 已同步新的成功/失败响应结构；
  ARCHITECTURE 已准确说明 shared-types 的响应联合边界。以上仍为前端/接口 Draft，不代表
  Backend、Service、Mock 或 API 请求已实现。
- 本次没有修改 Mobile/Web、其他 shared-types 领域模型、package.json、锁文件、tsconfig、
  ESLint 配置、阶段 0/1 记录、`other_docs/` 或 `pace`，也没有安装依赖或执行 Git 暂存/提交。

修正后验证结果：

| 命令                                           | 真实结果                                                      |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `pnpm --filter @tennis/shared-types lint`      | 通过。                                                        |
| `pnpm --filter @tennis/shared-types typecheck` | 通过；新增正向和负向示例均符合预期。                          |
| `pnpm lint`                                    | 通过；shared-types、Mobile、Web 均通过。                      |
| `pnpm typecheck`                               | 通过；三个 workspace 均通过。                                 |
| `pnpm format:check`                            | 通过。                                                        |
| `pnpm web:build`                               | 通过；Vite 8.1.4，35 个模块，188 ms。                         |
| `git diff --check`                             | 通过。                                                        |
| `git status --short`                           | 已执行；只有阶段 2 既有改动、用户未跟踪项及本次允许范围改动。 |

按修正要求没有重新启动 Expo 或 Vite 开发服务器。
