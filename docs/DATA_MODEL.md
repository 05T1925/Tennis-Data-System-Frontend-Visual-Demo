# 数据模型

Status: Draft  
Version: v0.1-draft

## 1. 当前实现范围

本文件中的核心前端领域类型已在 `@tennis/shared-types` 编码，但这不代表 Backend、CV、
Data Processing、Mock Service 或 Real API 已实现。未确认的契约和计算规则仍为 Draft。

- 所有 ID 使用 `EntityId`，当前等同于 `string`。
- 所有业务日期时间使用 `IsoDateTimeString`，当前等同于 ISO 8601 `string`。
- 视频时间轴使用 `startedAtMs`、`endedAtMs` 等毫秒数，不与 ISO 日期时间混用。
- 字段使用 camelCase；未来后端 snake_case DTO 由 Adapter 转换。
- 数值单位体现在字段名中；接口注释不等同于运行时校验。
- `uploadStatus`、分析任务 `status` 和分析任务 `stage` 是不同概念。

## 2. 实体关系

```text
User 1 ── * Video 1 ── * AnalysisTask
                  ├── 0..* CvOutput
                  └── 0..* AnalysisResult
AnalysisResult ── * PointRecord ── 0..1 RallyRecord ── * ShotRecord
```

一个 Rally 是连续击球过程并包含多个 Shot；一个 Point 是计分单位，通常关联一个 Rally，
但两者不可互换。关联完整性和索引连续性是运行时业务规则，TypeScript 接口不负责校验。

## 3. 公共基础类型

| 类型 | 当前定义 | 说明 |
| --- | --- | --- |
| `EntityId` | `string` | 不假定 UUID 格式。 |
| `IsoDateTimeString` | `string` | 约定为 ISO 8601；无运行时格式验证。 |
| `ConfidenceScore` | `number` | 预期 0-1；无运行时范围验证。 |

脚手架阶段类型 `ProjectStage` 已覆盖 `stage-0 | stage-1 | stage-2`；`AppSurface` 保持
`mobile | web-dashboard`。

## 4. 用户与视频

### User

`User` 包含 `id`、`displayName`、可选 `email`/`phone`、`role`、可选 `avatarUrl`、
`createdAt` 和 `updatedAt`。`UserRole` 为 `user | admin | developer`。模型不包含密码、验证码、
Token 或其他认证凭据。

### Video

`Video` 包含标识与归属、标题和原始文件名、可选存储/播放/缩略图地址、MIME 类型、
`fileSizeBytes`、可选 `durationSeconds`、比赛属性、上传状态与时间戳。

| 类型 | 联合值 |
| --- | --- |
| `MatchType` | `training | match` |
| `PlayMode` | `singles | doubles` |
| `CourtType` | `hard | clay | grass | other` |
| `UploadStatus` | `idle | uploading | uploaded | failed | canceled` |

`uploadProgress` 预期为 0-100，但类型本身不执行范围校验。`queued`、`processing` 和
`succeeded` 不属于上传生命周期。

## 5. 分析任务

`AnalysisTask` 使用 `status` 表示总体生命周期，使用 `stage` 表示当前处理步骤；对外变量和
术语仍分别称 `analysisStatus` 与 `analysisStage`，不得合并。

```text
AnalysisStatus = queued | processing | succeeded | failed | canceled

AnalysisStage = queued | court_detection | player_detection | ball_tracking
              | trajectory_processing | event_extraction
              | statistics_generation | completed
```

任务还包含 `progress`（预期 0-100）、独立 `errorCode`/`errorMessage`、`retryCount`、创建与
更新时间以及可选开始/完成时间。状态迁移、失败重试与阶段回退仍为 Draft。

## 6. 球场坐标与结构化记录

`CourtPoint` 使用 `x`、`y` 和可选 `confidence`。它表示球场坐标而非页面像素；归一化、
图像像素或真实球场坐标系的最终语义及范围仍需与 CV 团队确认，不在类型中预设范围。

### ShotRecord

一次击球记录包含 `videoId`、`rallyId`、`shotIndex`、可选球员、开始/结束毫秒时间、起止
球场点、可选落地点、速度、击球类型、战术类型和置信度。

- `ShotType`：`serve | forehand | backhand | volley | unknown`
- `TacticalType`：`attack | defense | neutral | error | unknown`

### RallyRecord

连续击球过程包含视频/可选 Point 关联、索引、起止时间、`shotIds`、`shotCount`、可选获胜
球员、结果和置信度。`RallyResult` 为
`winner | forced_error | unforced_error | unknown`。`shotCount` 与 `shotIds.length` 一致性由
运行时业务逻辑保证。

### PointRecord

计分单位包含视频/可选 Rally 关联、索引、起止时间、可选获胜球员、`scoringResult` 和置信度。
完整网球计分状态机不在 v0.1 shared-types 范围内，`scoringResult` 暂为 Draft 字符串。

## 7. CV 输出与分析结果

`CvOutput<TPayload = unknown>` 保存 `id`、`videoId`、`version`、原始或近原始 `payload` 和
`createdAt`。payload 的结构由未来 CV 契约决定，默认 `unknown`，不使用 `any`。

`AnalysisResult` 是处理后的消费模型，包含 `id`、`videoId`、`version`、`summary`、可选
`playerProfile`、`shots`、`rallies`、可选 `points`、`heatmapPoints` 和 `createdAt`。它不内嵌
CV payload，也不承载 AnalysisTask 状态。

`AnalysisSummary` 包含时长、击球/Rally/可选 Point 总数、平均每 Rally 击球数、最长 Rally，
以及可选速度、移动距离和非受迫性失误指标。`PlayerProfile` 的 consistency、attack、defense、
movement 是 Draft 展示分，范围和计算方式未确认，不构成医学、职业资格或官方评级。

## 8. API 与前端错误

`ApiResponse<T>` 是以 `success` 为判别字段的传输层联合类型。成功分支
`ApiSuccessResponse<T>` 保证 `data` 为 `T` 且 `error` 不可存在；失败分支
`ApiFailureResponse` 保证 `data` 为 `null` 且必须包含 `ApiErrorPayload`。两者均可包含
`message` 和 `requestId`。`ApiErrorPayload` 包含 `code`、`message` 和可选 `details`。

`AppError` 是前端归一化错误，包含 `code`、`userMessage`、可选 `technicalMessage`、
`retryable`、可选 `requestId` 和 `details`。页面只应向用户展示 `userMessage`。

上述字段已与当前 shared-types 代码一致，但仍只是前端/接口 Draft。HTTP 状态码、分页、错误码
枚举和 DTO Adapter 仍待 Backend 契约确认，不能据此声称 Backend 已实现。
