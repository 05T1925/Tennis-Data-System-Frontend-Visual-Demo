# API 接口草案

Status: Draft  
Version: v0.1-draft  
Consumer: App / Web Dashboard

本文件是前端视角的接口草案，不是正式后端接口，不实现任何接口。

## 1. 通用约定

### 1.1 Draft 响应结构

```json
{
  "success": true,
  "data": {},
  "requestId": "req_001"
}
```

### 1.2 Draft 错误结构

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "分析失败，请重试"
  },
  "requestId": "req_001"
}
```

分页、状态码、错误码枚举和鉴权细节均待确认。列表接口计划支持 `page`、`pageSize`，空数据返回空列表而不是错误。

`@tennis/shared-types` 将 `ApiResponse<T>` 编码为以 `success` 为判别字段的成功/失败联合类型：
成功响应保证 `data` 为 `T` 且不能携带 `error`；失败响应保证 `data` 为 `null` 且必须携带
`ApiErrorPayload`。这是前端和接口的 Draft 约定，不代表 Backend 或任何 API 已实现。

## 2. 接口目录

| 范围 | 方法与路径 | 目的 | 使用方 | 权限 | 重试/幂等 | 当前状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 认证 | `POST /api/v1/auth/login` | 获得身份 | App | 未确认 | 待确认 | Draft |
| 认证 | `POST /api/v1/auth/logout` | 结束会话 | App | 已登录 | 可重试待确认 | Draft |
| 认证 | `GET /api/v1/auth/me` | 获取当前用户 | App/Web Dashboard | 已登录 | 可重试 | Draft |
| 视频 | `POST /api/v1/videos/upload-init` | 初始化上传 | App | 已登录 | 幂等待确认 | Draft |
| 视频 | `POST /api/v1/videos/:videoId/upload-complete` | 确认上传完成 | App | 视频所有者 | 幂等待确认 | Draft |
| 视频 | `GET /api/v1/videos` | 查询视频列表 | App/Web Dashboard | 已登录/内部 | 可重试 | Draft |
| 视频 | `GET /api/v1/videos/:videoId` | 查询视频详情 | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 视频 | `DELETE /api/v1/videos/:videoId` | 删除视频 | App/Web Dashboard | 所有者/内部 | 幂等待确认 | Draft |
| 任务 | `POST /api/v1/videos/:videoId/analysis` | 创建分析任务 | App/Web Dashboard | 视频所有者/内部 | 幂等待确认 | Draft |
| 任务 | `GET /api/v1/videos/:videoId/analysis` | 查询任务与状态 | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 任务 | `POST /api/v1/analysis/:taskId/retry` | 重试失败任务 | App/Web Dashboard | 视频所有者/内部 | 幂等待确认 | Draft |
| 结果 | `GET /api/v1/videos/:videoId/result` | 查询 Analysis Result | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 结果 | `GET /api/v1/videos/:videoId/shots` | 查询 ShotRecord | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 结果 | `GET /api/v1/videos/:videoId/rallies` | 查询 RallyRecord | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 结果 | `GET /api/v1/videos/:videoId/points` | 查询 PointRecord | App/Web Dashboard | 所有者/内部 | 可重试 | Draft |
| 结果 | `GET /api/v1/videos/:videoId/cv-output` | 查询 CV Output | Web Dashboard | 内部 | 可重试 | Draft |
| 统计 | `GET /api/v1/statistics/user-summary` | 用户统计摘要 | App | 已登录 | 可重试 | Draft |
| 统计 | `GET /api/v1/statistics/user-trends` | 用户趋势统计 | App | 已登录 | 可重试 | Draft |
| 统计 | `GET /api/v1/admin/statistics/overview` | 内部统计概览 | Web Dashboard | 内部 | 可重试 | Draft |

## 3. 请求与响应约定

- `:videoId` 和 `:taskId` 是路径参数，类型为 string。
- 列表接口查询参数计划使用 `page`、`pageSize`；筛选、排序参数待确认。
- `upload-init` 请求体至少需要文件名、文件大小和媒体类型；成功响应至少返回 `videoId` 与下一步上传信息。具体二进制方案不锁死。
- `upload-complete` 请求体计划包含上传确认信息；成功后 Video 的 `uploadStatus` 应可查询。
- 创建分析任务成功后返回 `analysisTask`，其 `status` 和 `stage` 初始值计划均为 `queued`。
- 结果接口成功返回与 [数据模型](DATA_MODEL.md) 一致的 Domain Model；数据尚未生成时，应返回可识别的任务状态或空数据行为，具体状态码待确认。
- 错误响应不得包含密钥、Token、内部堆栈或用户隐私。

## 4. 分组接口细节

以下内容补充接口目录中的每一个路径。未明确的字段均为 Draft；所有成功响应使用统一响应结构，所有失败响应使用统一错误结构。

### 4.1 认证

- `POST /api/v1/auth/login`：App 使用；权限为无；请求体为身份凭据，具体字段待确认；成功返回当前 User 或会话信息；失败返回身份错误；无空数据情形；是否可重试待确认，要求避免重复创建会话。
- `POST /api/v1/auth/logout`：App 使用；权限为已登录；无路径或查询参数；请求体待确认；成功返回确认结果；会话不存在时返回可识别结果；可重试和幂等规则待确认。
- `GET /api/v1/auth/me`：App 与 Web Dashboard 使用；权限为已登录；无请求体；成功返回 User；未登录返回身份错误；无空数据情形；可重试。

### 4.2 视频

- `POST /api/v1/videos/upload-init`：App 使用；权限为已登录；请求体至少包含 `fileName`、`fileSizeBytes`、`mimeType`；成功返回 `videoId` 与下一步上传信息；校验失败返回参数错误；无空数据情形；幂等键规则待确认。
- `POST /api/v1/videos/:videoId/upload-complete`：App 使用；权限为视频所有者；路径参数为 `videoId`；请求体为上传确认信息；成功返回更新后的 Video；视频不存在或上传不完整时返回错误；无空数据情形；幂等规则待确认。
- `GET /api/v1/videos`：App 与 Web Dashboard 使用；权限为已登录或内部；查询参数计划为 `page`、`pageSize`，筛选待确认；成功返回分页 Video 列表；空数据返回空列表；可重试。
- `GET /api/v1/videos/:videoId`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`；成功返回 Video；不存在时返回未找到错误；无空数据情形；可重试。
- `DELETE /api/v1/videos/:videoId`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`；请求体无；成功返回确认结果；不存在时的行为待确认；应支持幂等。

### 4.3 分析任务

- `POST /api/v1/videos/:videoId/analysis`：App 与 Web Dashboard 使用；权限为视频所有者或内部；路径参数为 `videoId`；请求体可为空，分析选项待确认；成功返回初始 `analysisTask`，使用 `status` 表示总体状态、`stage` 表示处理步骤；视频未上传完成时返回状态错误；无空数据情形；幂等键规则待确认。
- `GET /api/v1/videos/:videoId/analysis`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`；成功返回 `analysisTask`；尚未创建任务时返回空数据或未找到，待确认；可重试。
- `POST /api/v1/analysis/:taskId/retry`：App 与 Web Dashboard 使用；权限为视频所有者或内部；路径参数为 `taskId`；请求体计划可选重试原因；成功返回新的或更新后的 `analysisTask`；不可重试状态返回状态错误；无空数据情形；幂等规则待确认。当前 Mobile 调用仍是本地 Mock Service，不代表该后端接口已实现。

### 4.4 分析结果

- `GET /api/v1/videos/:videoId/result`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`；成功返回 `analysisResult`；结果未生成时返回任务状态或空数据，待确认；可重试。
- `GET /api/v1/videos/:videoId/shots`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`，查询参数计划为 `page`、`pageSize`；成功返回 ShotRecord 列表；空数据返回空列表；可重试。
- `GET /api/v1/videos/:videoId/rallies`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`，查询参数计划为 `page`、`pageSize`；成功返回 RallyRecord 列表；空数据返回空列表；可重试。
- `GET /api/v1/videos/:videoId/points`：App 与 Web Dashboard 使用；权限为所有者或内部；路径参数为 `videoId`，查询参数计划为 `page`、`pageSize`；成功返回 PointRecord 列表；空数据返回空列表；可重试。
- `GET /api/v1/videos/:videoId/cv-output`：Web Dashboard 使用；权限为内部；路径参数为 `videoId`；成功返回 `cvOutput`；原始数据不存在时返回空数据或状态错误，待确认；可重试。

### 4.5 统计

- `GET /api/v1/statistics/user-summary`：App 使用；权限为已登录；查询参数无；成功返回 UserStatistics；无分析视频时返回零值或空数据，待确认；可重试。
- `GET /api/v1/statistics/user-trends`：App 使用；权限为已登录；查询参数计划为时间范围；成功返回趋势数据；空数据返回空序列；可重试。
- `GET /api/v1/admin/statistics/overview`：Web Dashboard 使用；权限为内部；查询参数计划为时间范围；成功返回统计概览；空数据返回零值或空结构，待确认；可重试。

## 5. 上传方式待确认

以下方案均未决定：

- 前端直传对象存储。
- 后端中转上传。
- 分片上传。
- 预签名 URL。

无论采用哪种方案，前端都需要统一的上传进度、失败提示与重试能力。

## 6. Mock / Real API 约定

- 阶段 1 计划先实现 Mock Service 来验证 UI 流程。
- Mock Service 与 Real Service 必须暴露相同的前端 Service 接口。
- 切换 Real API 时由 Adapter 承担 DTO 转换，不改变页面对 Domain Model 的依赖。

## 7. 阶段 15 前端 Contract Stub 集成 Profile

Status: Frontend Integration Draft。本节只用于阶段 15 Local Contract Stub 和可注入 fetch 测试，
不代表 Backend 已确认、正式 API 已部署或真实权限已经联调。Base URL 预计包含 `/api/v1`。

成功 envelope 暂为 `{ "data": {}, "request_id": "request-demo-001" }`；失败 envelope 暂为
`{ "error": { "code": "SOME_ERROR", "message": "Safe message" }, "request_id": "..." }`。
客户端只消费安全 code/request_id，不向 UI 暴露原始 body。

Auth login 暂用 `{ email, password }`，成功 data 包含 `access_token`、可选 `expires_at` 和 snake_case
User。Web 暂时复用 `/auth/login`，且 Stub 必须返回 admin；该路径和角色规则仍等待 Backend 确认。

Video list data 暂为
`{ items: [{ video, analysis_task }], page, page_size, total, unfiltered_total }`，detail data 暂为
`{ video, analysis_task }`。`total` 是应用 keyword/status/date 筛选后的总数；`unfiltered_total` 是当前
管理员可见但未应用列表筛选时的全量视频数。两者均为非负整数。Mobile 可忽略后者，但允许同一 Stub
响应通过校验。`analysis_task` 可为 null。列表内嵌 Task 及 Web 的 keyword、upload_status、
analysis_status、from、to、page、page_size 查询参数均是阶段 15 Stub 假设，不是正式分页/筛选契约。

Task data 暂为 `{ task: AnalysisTaskDto | null }`；Result data 暂为
`{ result: AnalysisResultDto | null }`。Result 使用 snake_case，`data_version`/`algorithm_version` 至少
存在一个，并包含 summary、shots、rallies、points、heatmap_points、player_profile 和引用关系。

阶段 15 Level 2 使用 login/me/logout、Video list/detail/delete、Video analysis start/task/result。
upload-init/complete、retry、Statistics、CV 和 Logs 仍因契约不足保持 Level 1，不发虚构请求。
