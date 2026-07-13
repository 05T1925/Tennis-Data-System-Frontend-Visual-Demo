# 数据模型

Status: Draft  
Version: v0.1-draft

## 1. 通用约定

- 所有 ID 使用 `string`。
- 所有时间使用 ISO 8601 string。
- 字段使用 camelCase；后端 snake_case 必须经 Adapter 转换。
- `uploadStatus` 与 `analysisStatus` 是独立状态。
- API DTO 与前端 Domain Model 分开；以下字段为前端视角 Draft。
- 单位在字段名中体现，或在字段说明中明确。可选字段必须由前端安全处理。

## 2. 实体关系

```text
User 1 ── * Video 1 ── * AnalysisTask
                  ├── 0..1 CvOutput
                  └── 0..1 AnalysisResult
AnalysisResult ── * PointRecord ── 1 RallyRecord ── * ShotRecord
```

一个 Point 通常关联一个 Rally；一个 Rally 包含多个 Shot。关系与索引规则均待 Backend 和 CV 团队确认。

## 3. 核心实体

### 3.1 User

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 用户 ID | `user_001` | Draft |
| displayName | string | 是 | 展示名 | `Alex` | Draft |
| createdAt | ISO 8601 string | 是 | 创建时间 | `2026-07-13T00:00:00Z` | Draft |

### 3.2 Video

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 视频 ID | `video_001` | Draft |
| userId | string | 是 | 所属用户 | `user_001` | Draft |
| fileName | string | 是 | 原始文件名 | `match.mp4` | Draft |
| durationSeconds | number | 否 | 时长，秒 | `180` | 待确认 |
| uploadStatus | UploadStatus | 是 | 上传生命周期 | `uploaded` | Draft |
| createdAt | ISO 8601 string | 是 | 创建时间 | `2026-07-13T00:00:00Z` | Draft |

### 3.3 UploadStatus

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| value | `pending|uploading|uploaded|failed` | 是 | 上传状态 | `uploading` | Draft |
| progressPercent | number | 否 | 上传进度，0-100 | `64` | Draft |
| errorMessage | string | 否 | 可展示失败原因 | `网络连接中断` | Draft |

### 3.4 AnalysisTask

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 任务 ID | `task_001` | Draft |
| videoId | string | 是 | 视频 ID | `video_001` | Draft |
| analysisStatus | AnalysisStatus | 是 | 整体分析状态 | `processing` | Draft |
| analysisStage | AnalysisStage | 否 | 当前处理阶段 | `cvProcessing` | Draft |
| failureReason | string | 否 | 可展示失败原因 | `未检测到球场` | Draft |
| createdAt | ISO 8601 string | 是 | 创建时间 | `2026-07-13T00:01:00Z` | Draft |

### 3.5 AnalysisStatus 与 AnalysisStage

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| analysisStatus | `queued|processing|succeeded|failed` | 是 | 分析任务状态 | `queued` | Draft |
| analysisStage | `queued|cvProcessing|dataProcessing|resultReady` | 否 | 任务执行阶段 | `dataProcessing` | Draft |

### 3.6 CvOutput

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| videoId | string | 是 | 视频 ID | `video_001` | Draft |
| algorithmVersion | string | 是 | CV 算法版本 | `cv-v0.1` | Draft |
| courtPoints | CourtPoint[] | 否 | 球场关键点 | `[]` | 待确认 |
| rawPayloadRef | string | 否 | 原始输出引用 | `cv-output-001` | 待确认 |
| generatedAt | ISO 8601 string | 是 | 生成时间 | `2026-07-13T00:02:00Z` | Draft |

### 3.7 CourtPoint

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| name | string | 是 | 关键点名称 | `baselineLeft` | 待确认 |
| xNormalized | number | 是 | 归一化横坐标，0-1 | `0.12` | Draft |
| yNormalized | number | 是 | 归一化纵坐标，0-1 | `0.83` | Draft |
| confidence | number | 否 | 置信度，0-1 | `0.91` | 待确认 |

### 3.8 ShotRecord

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 击球 ID | `shot_001` | Draft |
| rallyId | string | 是 | 所属回合 | `rally_001` | Draft |
| timestampMs | number | 是 | 视频时间点，毫秒 | `12500` | Draft |
| playerId | string | 否 | 击球球员 | `player_a` | 待确认 |
| shotType | string | 否 | 击球类型 | `forehand` | 待确认 |
| confidence | number | 否 | 识别置信度 | `0.82` | 待确认 |

### 3.9 RallyRecord

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 回合 ID | `rally_001` | Draft |
| pointId | string | 否 | 所属得分点 | `point_001` | Draft |
| startedAtMs | number | 是 | 开始时间，毫秒 | `10000` | Draft |
| endedAtMs | number | 否 | 结束时间，毫秒 | `18000` | Draft |
| shotCount | number | 否 | 击球数量 | `4` | Draft |

### 3.10 PointRecord

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| id | string | 是 | 得分点 ID | `point_001` | Draft |
| rallyId | string | 否 | 对应回合 | `rally_001` | Draft |
| winnerPlayerId | string | 否 | 得分方 | `player_a` | 待确认 |
| confidence | number | 否 | 推断置信度 | `0.63` | 待确认 |

### 3.11 AnalysisResult

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| videoId | string | 是 | 视频 ID | `video_001` | Draft |
| dataVersion | string | 是 | 数据处理版本 | `result-v0.1` | Draft |
| shots | ShotRecord[] | 是 | 击球记录 | `[]` | Draft |
| rallies | RallyRecord[] | 是 | 回合记录 | `[]` | Draft |
| points | PointRecord[] | 是 | 得分点记录 | `[]` | Draft |
| generatedAt | ISO 8601 string | 是 | 生成时间 | `2026-07-13T00:03:00Z` | Draft |

### 3.12 UserStatistics

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| userId | string | 是 | 用户 ID | `user_001` | Draft |
| analyzedVideoCount | number | 是 | 已分析视频数 | `3` | Draft |
| totalShotCount | number | 否 | 总击球数 | `86` | 待确认 |
| updatedAt | ISO 8601 string | 是 | 更新时间 | `2026-07-13T00:03:00Z` | Draft |

### 3.13 ApiResponse 与 AppError

| 字段 | 类型草案 | 必填 | 含义 | 示例 | 状态 |
| --- | --- | --- | --- | --- | --- |
| ApiResponse.data | unknown | 否 | 成功数据 | `{}` | Draft |
| ApiResponse.requestId | string | 否 | 请求追踪 ID | `req_001` | Draft |
| AppError.code | string | 是 | 稳定错误码 | `ANALYSIS_FAILED` | Draft |
| AppError.message | string | 是 | 可展示错误信息 | `分析失败，请重试` | Draft |
| AppError.retryable | boolean | 是 | 是否可重试 | `true` | Draft |

## 4. 状态机

```text
UploadStatus: pending → uploading → uploaded
                         └──────→ failed

AnalysisStatus: queued → processing → succeeded
                                └──→ failed
```

失败后的重试条件和状态回退规则待确认。

## 5. 最小示例 JSON

```json
{
  "video": {
    "id": "video_001",
    "userId": "user_001",
    "fileName": "match.mp4",
    "uploadStatus": "uploaded"
  },
  "analysisTask": {
    "id": "task_001",
    "videoId": "video_001",
    "analysisStatus": "succeeded",
    "analysisStage": "resultReady"
  },
  "analysisResult": {
    "videoId": "video_001",
    "dataVersion": "result-v0.1",
    "shots": [],
    "rallies": [],
    "points": []
  }
}
```
