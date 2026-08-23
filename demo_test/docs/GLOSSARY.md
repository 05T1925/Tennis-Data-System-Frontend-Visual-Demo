# 术语表

| 中文术语 | 英文术语 | 推荐代码命名 | 定义 | 不推荐别名 |
| --- | --- | --- | --- | --- |
| 用户 | User | `user` | 使用 App 或受管理的系统主体。 | `uid` |
| 用户 App | App | `app` | 面向普通网球用户的主要产品端。 | Mobile、移动端 |
| Web 数据看板 | Web Dashboard | `webDashboard` | 面向内部团队的调试、展示和排障工具。 | Admin、Web |
| 后端系统 | Backend | `backend` | 提供身份、视频、任务和 API 的系统服务。 | Server |
| 计算机视觉模块 | CV Module | `cvModule` | 识别球场、球员、网球与轨迹的模块。 | CV、算法结果 |
| 数据处理模块 | Data Processing | `dataProcessing` | 将 CV Output 转换为结构化业务数据的模块。 | Data Engine |
| 视频 | Video | `video` | 用户上传并被分析的视频业务实体。 | File、Media |
| 上传状态 | Upload Status | `uploadStatus` | 文件上传的独立生命周期状态。 | status |
| 分析任务 | Analysis Task | `analysisTask` | 对视频执行分析的任务实体。 | job、task |
| 分析状态 | Analysis Status | `analysisStatus` | 分析任务整体生命周期状态。 | status |
| 分析阶段 | Analysis Stage | `analysisStage` | 分析运行到的具体步骤。 | step |
| CV 原始输出 | CV Output | `cvOutput` | CV Module 输出的原始或近原始识别数据。 | analysisResult |
| 分析结果 | Analysis Result | `analysisResult` | 经数据处理后的用户或团队可消费结果。 | report |
| 击球 | Shot | `shot` | 球员一次击球动作及对应数据。 | hit、stroke |
| 回合 | Rally | `rally` | 从发球开始到连续击球结束的过程。 | point |
| 得分点 | Point | `point` | 比赛计分中的一个得分单位。 | rally |
| 场地点位 | Court Point | `courtPoint` | 球场坐标系中的点位或关键点。 | courtCoordinate |
| 统计数据 | Statistics | `statistics` | 基于分析结果汇总得到的指标。 | stats |
| Mock 服务 | Mock Service | `mockService` | 用于验证前端流程的模拟 Service。 | fake API |
| 真实服务 | Real Service | `realService` | 对接真实后端 REST API 的 Service。 | live API |
| API 数据传输对象 | API DTO | `apiDto` | API 边界上的原始请求或响应结构。 | response model |
| 领域模型 | Domain Model | `domainModel` | 前端业务逻辑和页面使用的稳定数据模型。 | view model |

## Shot、Rally 与 Point

- 一个 `Rally` 包含多个 `Shot`。
- 一个 `Point` 通常包含一个 `Rally`。
- `Point` 表示比赛计分单位，`Rally` 表示连续击球过程，二者不可互换。
- v0.1 数据准确性不足时，`Point` 的部分字段可为空或标记低置信度。
