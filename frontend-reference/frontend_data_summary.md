# 前端页面与数据统计总览

本文档总结 `src` 前端代码的页面结构、数据来源、数据加工逻辑，以及所有主要页面展示的数据项。

## 1. 前端整体结构

前端入口：

- `src/main.jsx`
- `src/router.jsx`
- `src/App.jsx`

主要路由：

| 路由 | 页面 | 是否需要登录 | 作用 |
|---|---|---|---|
| `/analyze/` | `HomePage` | 否 | 首页、登录状态、上传入口、历史记录入口 |
| `/analyze/login` | `LoginPage` | 否 | 登录页 |
| `/analyze/register` | `RegisterPage` | 否 | 注册页 |
| `/analyze/profile` | `ProfilePage` | 是 | 账号信息页 |
| `/analyze/analyze` | `App` | 是 | 主分析工作台 |

登录态：

- 文件：`src/auth/auth-context.jsx`
- 本地存储：`src/auth/auth-storage.js`
- storage key：`tennis:auth-session`
- 首次访问会自动写入默认 demo 用户：
  - `user_id = demo_coach`
  - `email = coach@tennislab.io`
  - `display_name = Demo Coach`
  - `status = active`

## 2. API 数据来源

API 封装文件：

- `src/api/index.js`

默认 API 地址：

```js
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/analyze/api').replace(/\/$/, '')
```

主要请求：

| 函数 | 后端接口 | 用途 |
|---|---|---|
| `getAnalysisResult()` | `/analysis/latest` | 获取默认/最新分析结果 |
| `getAnalysisDetail(uploadId)` | `/analysis/detail/{uploadId}` | 获取某次上传的完整分析详情 |
| `uploadAndAnalyze(file)` | `/upload` | 上传视频并创建分析任务 |
| `getUploadProgress(uploadId)` | `/upload/{uploadId}/progress` | 查询上传和 CV 处理进度 |
| `getUploadHistory(userId)` | `/analysis/history/{userId}` | 查询用户历史上传记录 |
| `loginUser(credentials)` | `/auth/login` | 登录 |
| `registerUser(payload)` | `/auth/register` | 注册 |

数据兜底：

1. 如果 `VITE_USE_REAL_API=true`，`getAnalysisResult()` 调后端 `/analysis/latest`。
2. 否则优先读 `/test/match_data.json`。
3. 再读 `localStorage` 中的 `tennis:last-analysis`。
4. 最后使用 `src/mock/data.js` 的 `mockMatchData`。

所有分析结果都会经过：

```js
enrichAnalysisResult(raw)
```

文件：

- `src/utils/analysis.js`

作用：

- 兼容后端直接返回的详情数据。
- 兼容帧级 `frames` 协议。
- 缺字段时补全前端展示所需的统计数据。

## 3. 主分析数据对象

`App.jsx` 中核心状态：

```js
const [data, setData] = useState(null)
```

`data` 是整个分析台的统一数据源，主要字段如下。

### 3.1 视频信息

字段：

- `videoUrl`: 视频访问地址。
- `videoMeta.filename`: 文件名。
- `videoMeta.fps`: 帧率。
- `videoMeta.width`: 视频宽。
- `videoMeta.height`: 视频高。
- `videoMeta.duration`: 视频时长。
- `duration`: 时长兜底字段。

展示位置：

- 主分析页顶部信息条。
- `VideoArea` 视频播放区域。
- `OverallStats` 运动时长。
- 详情页右侧和时间轴同步。

### 3.2 帧级叠加数据

字段：

- `overlayFrames`

每帧结构大致包括：

- `frameIndex`
- `t`
- `ballNormalized`
- `playersNormalized`
- `speed`
- `events`
- `raw`

来源：

- 后端可直接返回。
- 如果返回的是帧级 `frames`，`adaptFrameProtocol()` 会转换出 `overlayFrames`。

展示位置：

- `VideoArea`

用途：

- 在视频上叠加球员框。
- 绘制最近 5 个球点轨迹。
- 跟随播放时间同步当前帧。

### 3.3 事件数据

字段：

- `events`

事件结构：

- `pointIndex`: 第几分。
- `rallyId`: 回合 ID。
- `t`: 时间秒。
- `x`: 归一化落点 x。
- `y`: 归一化落点 y。
- `inOut`: `IN` 或 `OUT`。
- `winner`: `left` 或 `right`。
- `speed`: 球速。
- `type`: `bounce` 或 `hit`。

来源：

- 后端 `analysis_detail_service.py` 的 `_build_events()`。
- 或前端 `adaptFrameProtocol()` 从帧级事件派生。
- 或 mock 数据。

用途：

- 生成比分时间线。
- 生成回合数据。
- 生成落点热力图。
- 派生总拍数、失误率、得分率等基础统计。

### 3.4 比分时间线

字段：

- `scoreTimeline`

结构：

- `pointIndex`
- `t`
- `inOut`
- `winner`
- `leftSets`
- `rightSets`
- `leftGames`
- `rightGames`
- `leftPoints`
- `rightPoints`
- `leftScore`
- `rightScore`
- `server`

来源：

- 后端 `_build_score_timeline()`。
- 或前端 `buildScoreTimeline(events)`。

前端计分逻辑：

- 点分按 `0 -> 15 -> 30 -> 40 -> AD`。
- 双方都到 40 后处理平分和 AD。
- 一方至少 4 分且领先 2 分赢下一局。
- 一方至少 6 局且领先 2 局赢下一盘。
- 每局结束后发球方切换。

展示位置：

- `ScoreTimeline`: 底部分数进度轴。
- `RightPanel`: 比分时间轴。
- `App`: 根据当前视频时间找当前比分。

### 3.5 当前击球时间线

字段：

- `shotTimeline`

常用字段：

- `t`
- `hitterId`
- `hitterSide`
- `strokeType`
- `strokeSide`
- `shotPhase`
- `speed`
- `outcome`
- `endingReason`
- `depthZone`
- `direction`

来源：

- 后端 `_build_shot_timeline()`。

展示位置：

- `RightPanel` 当前逐拍信息。
- `AdvancedAnalysis` 击球类型统计。

### 3.6 每分详情

字段：

- `pointDetails`

常用字段：

- `pointIndex`
- `start`
- `end`
- `duration`
- `shots`
- `winner`
- `endReason`
- `maxSpeed`
- `avgSpeed`
- `leftDistance`
- `rightDistance`
- `depth`
- `coverageRate`
- `aiText`
- `heatmapPoints`
- `landingX`
- `landingY`

来源：

- 后端 `_build_point_details()`。

展示位置：

- `PointByPointStats`
- `RightPanel`

### 3.7 回合数据

字段：

- `rallies`

常用字段：

- `id`
- `start`
- `end`
- `shots`
- `winner`
- `distance`

来源：

- 后端 `_build_rallies()`。
- 或前端 `buildRallies(events)`。

用途：

- 计算总回合数。
- 计算最长回合。
- 计算平均回合拍数。
- 生成精彩回合。
- 估算跑动距离。

### 3.8 精彩回合

字段：

- `highlights`

结构：

- `id`
- `label`
- `start`
- `end`
- `reason`

来源：

- 后端 `_build_highlights()`。
- 或前端 `buildHighlights(rallies)`。

前端兜底规则：

- 只取 `shots >= 3` 的回合。
- 最多取前 8 个。
- `shots >= 5` 标记为长回合，否则标记为高跑动。

展示位置：

- `HighlightsList`
- 主页面“导出精彩片段”按钮使用视频前 10 秒做浏览器端录制导出。

## 4. 前端派生统计

文件：

- `src/utils/analysis.js`

核心函数：

```js
deriveStats(events, rallies)
```

派生字段：

| 字段 | 含义 | 计算方式 |
|---|---|---|
| `totalShots` | 总击球/事件数 | `events.length` |
| `totalRallies` | 总回合数 | `rallies.length` |
| `longestRally` | 最长回合拍数 | `max(rally.shots)` |
| `avgRallyLength` | 平均回合长度 | `totalShots / totalRallies` |
| `distanceCovered` | 总移动距离 | `sum(rally.distance)` |
| `speedEstimate` | 平均球速 | `avg(event.speed)` |
| `errorRate` | 失误率 | `OUT 事件数 / totalShots` |
| `scoreRate` | A 方得分率 | `winner === left 的事件数 / totalShots` |

其他前端兜底字段：

- `historyMatches`: 没有后端历史数据时使用默认历史趋势。
- `radarData`: 没有后端雷达数据时使用默认五维能力。
- `shotTypeRatio`: 没有后端正反手比例时使用默认比例。
- `insights`: 没有后端洞察时使用默认标签和建议。
- `heatmapPoints`: 没有后端热力点时由 `events` 转换。

## 5. 主分析工作台 App

文件：

- `src/App.jsx`

主分析页默认布局：

1. 顶部栏。
2. 左侧菜单。
3. 中间视频区。
4. 底部分数时间线。
5. 右侧实时数据面板。

顶部显示数据：

- 当前视频文件名。
- 时长。
- FPS。
- 回合数。
- 击球数。
- 当前比分。

上传状态显示：

- 上传进度。
- 后端处理进度。
- 当前阶段文案。

当前时间同步：

- `currentTime` 从视频播放进度更新。
- 当前比分通过 `scoreTimeline` 中最后一个 `t <= currentTime` 的点得到。
- 当前分通过 `pointDetails` 的 `start/end` 范围匹配。
- 当前击球通过 `shotTimeline` 中最后一个 `t <= currentTime` 的击球得到。

## 6. 侧边栏模块

文件：

- `src/components/Sidebar.jsx`

菜单项：

| key | 页面模块 | 组件 |
|---|---|---|
| `nav` | 首页/默认分析台 | `VideoArea` + `RightPanel` |
| `overview` | 总体数据 | `OverallStats` |
| `point` | 每分数据 | `PointByPointStats` |
| `advanced` | 高级分析 | `AdvancedAnalysis` |
| `history` | 历史记录 | `HistoryRecords` |
| `achievement` | 我的成就 | `MyAchievements` |
| `user` | 用户中心/成长趋势 | `UserGrowthTrend` |

## 7. 默认分析台展示数据

### 7.1 视频区域

组件：

- `VideoArea`

展示：

- 视频本体。
- 球员检测框。
- 最近球点轨迹。
- 如果没有真实 `overlayFrames`，使用 `events` 近 3.2 秒内落点绘制。
- 如果仍没有数据，使用模拟球点轨迹。

使用字段：

- `videoUrl`
- `videoMeta.fps`
- `events`
- `overlayFrames`

### 7.2 得分进度轴

组件：

- `ScoreTimeline`

展示：

- 每分节点。
- 得分球员 A/B。
- 第几分。
- `IN/OUT`。
- 时间秒。
- 当前视频时间对应的高亮分。

使用字段：

- `scoreTimeline[].pointIndex`
- `scoreTimeline[].t`
- `scoreTimeline[].winner`
- `scoreTimeline[].inOut`

### 7.3 右侧实时面板

组件：

- `RightPanel`

#### 实时比分

展示：

- 数字比分：`leftScore : rightScore`
- 网球计分：`leftPoints : rightPoints`
- 局分：`leftGames : rightGames`
- 盘分：`leftSets : rightSets`
- 当前发球方。
- 当前视频时间。
- 手动改分模式：
  - A 加分。
  - A 回退。
  - B 加分。
  - B 回退。
  - 恢复跟随视频。

字段：

- `currentScore.leftScore`
- `currentScore.rightScore`
- `currentScore.leftPoints`
- `currentScore.rightPoints`
- `currentScore.leftGames`
- `currentScore.rightGames`
- `currentScore.leftSets`
- `currentScore.rightSets`
- `currentScore.server`

#### 当前逐拍信息

展示：

- 当前击球人。
- 当前拍类型。
- 当前球速。
- 当前拍结果。
- 落点深度。
- 落点方向。

字段：

- `currentShot.hitterSide`
- `currentShot.hitterId`
- `currentShot.strokeType`
- `currentShot.strokeSide`
- `currentShot.shotPhase`
- `currentShot.speed`
- `currentShot.outcome`
- `currentShot.endingReason`
- `currentShot.depthZone`
- `currentShot.direction`

#### 当前分数据

展示：

- 当前分序号。
- 总拍数。
- 本分时长。
- 最大球速。
- 结束原因。
- 到位率。

字段：

- `currentPointDetail.pointIndex`
- `currentPointDetail.shots`
- `currentPointDetail.duration`
- `currentPointDetail.maxSpeed`
- `currentPointDetail.endReason`
- `currentPointDetail.coverageRate`

#### 回合复盘

展示：

- 当前回合说明。
- AI 洞察。

来源：

- `currentDecision.winner`
- `currentDecision.inOut`
- `currentPointDetail.aiText`

#### 比分时间轴

展示：

- 每一分得分方。
- `IN/OUT`。
- 时间。
- 数字比分。
- 点击后跳转视频。

字段：

- `scoreTimeline`

## 8. 总体数据页

组件：

- `OverallStats`

入口：

- 侧边栏 `总体数据`

### 8.1 运动数据概览

展示：

- 运动时长。
- 卡路里消耗。

字段：

- `videoMeta.duration` 或 `duration`
- `caloriesEstimate`

### 8.2 比赛结果统计

展示：

- 球员 A : 球员 B。
- 局分比分：`score.leftGames : score.rightGames`。
- 出界次数。
- In 球次数。
- 精彩回合数。

字段：

- `score.leftGames`
- `score.rightGames`
- `outCount`
- `inCount`
- `highlightCount`

### 8.3 得分分布图表

展示：

- 球员 A 得分趋势折线。
- 球员 B 得分趋势折线。

字段：

- `pointTrendA`
- `pointTrendB`

### 8.4 整体技术统计

展示：

- 平均每分拍数。
- 平均每分时长。
- 平均球速。
- 最长每分拍数。
- 最长每分时长。
- 最高球速。
- 总移动距离。
- 球员 A 移动距离。
- 球员 B 移动距离。

字段：

- `avgRallyLength`
- `avgPointDuration`
- `speedEstimate`
- `longestRally`
- `longestPointDuration`
- `maxSpeed`
- `totalDistance`
- `totalDistanceA`
- `totalDistanceB`

### 8.5 整段视频落点热力图

展示：

- 标准网球场。
- 全场落点散点/热度点。

字段：

- `heatmapPoints`

## 9. 每分数据页

组件：

- `PointByPointStats`

入口：

- 侧边栏 `每分数据`

### 9.1 逐分列表

展示：

- 第几分。
- 开始时间。
- 结束时间。
- 分持续时长。
- 得分方 A/B。

来源：

- 优先 `scoreTimeline`。
- 若为空，生成 12 条 mock 分数据。

字段：

- `scoreTimeline[].pointIndex`
- `scoreTimeline[].t`
- `scoreTimeline[].winner`

### 9.2 当前分统计卡片

展示：

- 总拍数。
- 结束原因。
- 最大球速。
- 平均球速。
- A 移动距离。
- B 移动距离。
- 落点区域深度。
- 到位率。

字段：

- `pointDetails[].shots`
- `pointDetails[].endReason`
- `pointDetails[].maxSpeed`
- `pointDetails[].avgSpeed`
- `pointDetails[].leftDistance`
- `pointDetails[].rightDistance`
- `pointDetails[].depth`
- `pointDetails[].coverageRate`

### 9.3 AI 点评

展示：

- 本分结论：球员 A/B 得分。
- AI 文本说明。

字段：

- `scoreTimeline[].winner`
- `pointDetails[].aiText`

### 9.4 每一分落点图

展示：

- 当前分落点。
- 当前分最后落点高亮。

字段：

- `pointDetails[].heatmapPoints`
- `pointDetails[].landingX`
- `pointDetails[].landingY`

### 9.5 精彩回合标记按钮

当前只是 UI 按钮，没有持久化逻辑。

## 10. 高级分析页

组件：

- `AdvancedAnalysis`

入口：

- 侧边栏 `高级分析`

内部 tabs：

- 总览。
- 击球类型分析。
- 跑动轨迹。
- 能力雷达。
- 稳定性。
- 画像与技术分析。

### 10.1 击球类型分析

组件：

- `ShotTypeBars`

统计来源：

- `data.shotTimeline`

统计项：

- 正手数量。
- 反手数量。
- 发球数量。
- 其他数量。

规则：

- `shot.shotPhase === 'serve'` 计入发球。
- `shot.strokeSide === 'forehand'` 计入正手。
- `shot.strokeSide === 'backhand'` 计入反手。
- 其他计入其他。

### 10.2 跑动轨迹

组件：

- `MovementPaths`

展示：

- 标准球场。
- 球员 A 跑动轨迹。
- 球员 B 跑动轨迹。
- 轨迹终点高亮。

字段：

- `movementPaths.A`
- `movementPaths.B`

每个点：

- `x`
- `y`

### 10.3 能力雷达

组件：

- `RadarChart`

展示五维能力：

- 进攻。
- 防守。
- 耐力。
- 心态。
- 战术。

字段：

- `radarData.attack`
- `radarData.defense`
- `radarData.stamina`
- `radarData.mentality`
- `radarData.tactic`

### 10.4 高级分析总览中的稳定性摘要

展示：

- 连续稳定得分率。
- 非受迫失误率。
- 关键分成功率。

字段：

- `stabilityStats.consecutiveScoreRate`
- `stabilityStats.unforcedErrorRate`
- `stabilityStats.criticalPointRate`

### 10.5 高级分析总览中的画像摘要

展示：

- 技术标签。
- 球员 A 风格。
- 进攻效率。
- 相持耐力。
- 稳定性评分。
- 训练建议。

字段：

- `insights.labels`
- `insights.aiTips`
- `profileStats.players.A.attack.style`
- `profileStats.attackEfficiency`
- `profileStats.rallyStamina`
- `stabilityStats.stabilityScore`

## 11. 稳定性页

组件：

- `Stability`

入口：

- 高级分析 tab：`稳定性`

可切换：

- 球员 A。
- 球员 B。

数据字段：

```js
stabilityStats.players.A
stabilityStats.players.B
```

### 11.1 非受迫性失误率

展示：

- 环形百分比。
- 失误总数。
- 总触球次数。
- 最终失误率。

字段：

- `errors.unforced`
- `errors.touches`
- `errors.rate`

### 11.2 击球深度稳定性

展示：

- 平均深度。
- 深度标准差。
- 深度指数。
- 深度趋势折线。

字段：

- `depth.avg`
- `depth.std`
- `depth.index`
- `depth.trend`

### 11.3 击球落点区域一致性

展示：

- 区域热度格子。
- 熵值。
- 区域集中度。
- 动作重复稳定性。

字段：

- `zone.entropy`
- `zone.focus`
- `zone.repeat`

### 11.4 连续多拍不掉球能力

展示：

- 长回合率，定义为 9 拍以上。
- 每得分平均拍数。
- 相持能力进度百分比。

字段：

- `rally.longRate`
- `rally.avgShots`
- `rally.stamina`

## 12. 球员画像与技术分析页

组件：

- `PlayerProfile`

入口：

- 高级分析 tab：`画像与技术分析`

可切换：

- 球员 A。
- 球员 B。

数据字段：

```js
profileStats.players.A
profileStats.players.B
```

### 12.1 站位偏好与击球热点

展示：

- 自动识别类型。
- 正手偏好区域。
- 反手偏好区域。
- 热区格子图。

字段：

- `stance`
- `forehandZone`
- `backhandZone`

### 12.2 发球局统治力

展示：

- 一发得分率。
- 二发得分率。
- 发球直得率。
- 发球平均球速。

字段：

- `serve.firstWin`
- `serve.secondWin`
- `serve.aceRate`
- `serve.avgSpeed`

### 12.3 制胜分与失误比

展示：

- 制胜分 - 非受迫失误差值。
- 每得 1 分平均拍数。
- 节奏类型。
- 攻击效率评分。

字段：

- `attack.diff`
- `attack.shotsPerPoint`
- `attack.style`
- `attack.efficiency`

### 12.4 回合长度分布

展示：

- 回合拍数直方图。
- 平滑线。
- 比赛节奏。

字段：

- `rally.histogram`
- `rally.fit`
- `rally.rhythm`

## 13. 历史记录页

组件：

- `HistoryRecords`

入口：

- 首页登录后展示 compact 版。
- 侧边栏 `历史记录` 展示完整页。

API：

```js
getUploadHistory(user.user_id)
```

后端接口：

```text
GET /api/analysis/history/{user_id}
```

展示顶部统计：

- 当前账号历史上传总数：`items.length`

每条历史记录展示：

- `upload_id`
- `status`
- `original_filename`
- `display_name`
- `created_at`
- `duration_sec`
- `point_count`
- `longest_rally`
- `file_size_bytes`

交互：

- 点击某条记录跳转：

```text
/analyze/analyze?upload_id={upload_id}
```

然后主分析页调用 `getAnalysisDetail(uploadId)` 读取该历史分析。

Demo 兜底：

- 如果用户是 `demo_coach` 且接口失败，使用 `DEMO_HISTORY`。

Demo 历史字段：

- `upload_id`
- `user_id`
- `display_name`
- `original_filename`
- `stored_path`
- `file_size_bytes`
- `duration_sec`
- `fps`
- `width`
- `height`
- `status`
- `created_at`
- `point_count`
- `longest_rally`

## 14. 用户成长趋势页

组件：

- `UserGrowthTrend`

入口：

- 侧边栏 `用户中心`

数据来源：

- `data.historyMatches`
- 如果为空，使用 `FALLBACK_MATCHES`

每场历史数据字段：

- `date`
- `distance`
- `stability`
- `speed`
- `scoreRate`
- `winRate`

展示模式：

1. 按比赛。
2. 按月。

### 14.1 按比赛

函数：

```js
buildMatchSeries(matches)
```

展示：

- 标签：`M1`、`M2`、...
- 移动距离。
- 击球稳定性。
- 平均球速。
- 得分率。

计算：

- `distance = round(match.distance)`
- `stability = round(match.stability * 100)`
- `speed = round(match.speed)`
- `scoreRate = round((match.scoreRate ?? match.winRate) * 100)`

### 14.2 按月

函数：

```js
buildMonthlySeries(matches)
```

处理：

1. 取 `date` 的前 7 位作为月份。
2. 同月比赛聚合。
3. 对每个指标求平均。

展示：

- 月份标签。
- 平均移动距离。
- 平均稳定性。
- 平均球速。
- 平均得分率。

### 14.3 四张趋势卡

展示项：

- 移动距离，单位米。
- 击球稳定性，单位评分。
- 平均球速，单位 km/h。
- 得分率，单位百分比。

每张卡展示：

- 平滑折线。
- 面积填充。
- 最新值。

## 15. 我的成就页

组件：

- `MyAchievements`

入口：

- 侧边栏 `我的成就`

数据来源：

- `data.achievements`
- 如果为空，使用 `FALLBACK_ACHIEVEMENTS`

每个成就字段：

- `id`
- `name`
- `category`
- `unlocked`
- `condition`

展示：

- 六边形成就徽章。
- 成就名称。
- 成就分类。
- hover 显示解锁条件。
- 已解锁数量。
- 总成就数量。

筛选：

- 全部。
- 已解锁。
- 未解锁。

后端当前成就列表：

- 初次登场。
- 百场老将。
- 连续打卡。
- 千拍大师。
- 发球机器。
- 重炮发球。
- 制胜分达人。
- 网前杀手。
- 无失误一战。
- 长回合之王。
- 深度掌控者。
- 铁壁防守。
- 全能选手。
- 节奏掌控者。
- 数据之王。
- 赛季 MVP。

解锁口径示例：

- `totalShots >= 1000` 解锁千拍大师。
- `maxSpeed >= 190` 解锁重炮发球。
- `winnerCount >= 15` 解锁制胜分达人。
- `longRallyCount >= 8` 解锁长回合之王。
- `depthStability >= 85` 解锁深度掌控者。
- `rallyStamina >= 90` 解锁节奏掌控者。

## 16. 首页

组件：

- `HomePage`

展示：

- 产品名：Tennis Data Master。
- 当前登录状态。
- 登录用户显示名。
- 登录邮箱。
- 上传并开始分析入口。
- 登录/注册入口。
- 登录后展示历史上传记录 compact 版。

数据来源：

- `useAuth()`
- `HistoryRecords compact`

## 17. 登录页

组件：

- `LoginPage`

展示：

- demo 登录说明。
- 邮箱输入。
- 密码输入。
- 错误信息。
- 登录按钮。
- 注册入口。
- demo 账号提示。

默认表单：

- `email = coach@tennislab.io`
- `password = demo1234`

提交后：

- 调用 `login(form)`。
- 登录成功跳转到上一次来源页或 `/analyze/analyze`。

## 18. 注册页

组件：

- `RegisterPage`

展示字段：

- 队伍或昵称。
- 邮箱。
- 密码。
- 错误信息。
- 注册按钮。
- 登录入口。

提交后：

- 调用 `register(form)`。
- 注册成功跳转 `/analyze/analyze`。

## 19. 账号信息页

组件：

- `ProfileSettings`

入口：

- `/analyze/profile`

展示：

- 当前登录显示名。
- 用户 ID。
- 邮箱。
- 状态。
- 退出登录按钮。

字段：

- `user.user_id`
- `user.email`
- `user.display_name`
- `user.status`

## 20. 热力图和球场可视化

### 20.1 CourtCanvas

组件：

- `CourtCanvas`

用途：

- 绘制标准网球场。
- 绘制落点散点。
- 高亮当前落点。

输入：

- `points`: `[x, y, weight]`
- `landingPoint`: `{ x, y }`
- `height`

坐标：

- x/y 都按 `0-1` 归一化。
- `weight` 用于保留热度权重，但当前散点绘制主要使用位置。

标准球场参数：

- 总长：`23.77m`
- 双打宽：`10.97m`
- 单打宽：`8.23m`
- 发球线距离：`6.4m`

### 20.2 HeatmapOverlay

组件：

- `HeatmapOverlay`

用途：

- 使用 ECharts heatmap 渲染落点密度。

输入：

- `points`: `[x, y, value]`

渲染配置：

- x/y 坐标范围：`0-1`
- `visualMap` 权重范围：`0-10`
- `blurSize = 34`
- `pointSize = 20`

备注：

- 当前主 `App.jsx` 未直接使用 `HeatmapOverlay`，但组件保留可用。

## 21. 前端与后端字段对应关系

后端详情接口返回字段：

```python
{
  videoUrl,
  videoMeta,
  duration,
  events,
  shotTimeline,
  overlayFrames,
  movementPaths,
  rallies,
  highlights,
  scoreTimeline,
  score,
  shotTypeRatio,
  radarData,
  heatmapPoints,
  historyMatches,
  insights,
  pointDetails,
  stabilityStats,
  profileStats,
  achievements,
  totalShots,
  totalRallies,
  avgRallyLength,
  longestRally,
  distanceCovered,
  speedEstimate,
  errorRate,
  scoreRate,
  outCount,
  inCount,
  maxSpeed,
  avgPointDuration,
  longestPointDuration,
  totalDistanceA,
  totalDistanceB,
  totalDistance,
  caloriesEstimate,
  highlightCount,
  pointTrendA,
  pointTrendB
}
```

前端主要消费关系：

| 字段 | 消费组件 |
|---|---|
| `videoUrl` | `VideoArea` |
| `videoMeta` | `App` 顶部信息、`VideoArea`、`OverallStats` |
| `events` | `VideoArea`、`utils/analysis` |
| `overlayFrames` | `VideoArea` |
| `scoreTimeline` | `ScoreTimeline`、`RightPanel`、`PointByPointStats` |
| `shotTimeline` | `RightPanel`、`AdvancedAnalysis` |
| `pointDetails` | `PointByPointStats`、`RightPanel` |
| `rallies` | `utils/analysis`、精彩回合兜底 |
| `highlights` | `HighlightsList` |
| `movementPaths` | `AdvancedAnalysis/MovementPaths` |
| `heatmapPoints` | `OverallStats/CourtCanvas` |
| `radarData` | `AdvancedAnalysis/RadarChart` |
| `stabilityStats` | `AdvancedAnalysis`、`Stability` |
| `profileStats` | `AdvancedAnalysis`、`PlayerProfile` |
| `historyMatches` | `UserGrowthTrend` |
| `achievements` | `MyAchievements` |
| `insights` | `AdvancedAnalysis`、`RightPanel` |
| `outCount/inCount/highlightCount` | `OverallStats` |
| `avgRallyLength/avgPointDuration/speedEstimate/longestRally/longestPointDuration/maxSpeed` | `OverallStats` |
| `totalDistance/totalDistanceA/totalDistanceB` | `OverallStats` |
| `pointTrendA/pointTrendB` | `OverallStats/TrendChart` |

## 22. 历史总数据口径

历史记录列表来源：

- 接口：`/analysis/history/{user_id}`
- 组件：`HistoryRecords`

历史记录是“上传级别”的总数据，主要用于列出用户所有分析过的视频。

每条历史记录展示：

| 字段 | 含义 |
|---|---|
| `upload_id` | 上传 ID |
| `original_filename` | 原始文件名 |
| `display_name` | 上传人显示名 |
| `status` | 分析状态 |
| `created_at` | 上传/创建时间 |
| `duration_sec` | 视频时长 |
| `point_count` | 该视频切出的分数 |
| `longest_rally` | 该视频最长回合拍数 |
| `file_size_bytes` | 文件大小 |

成长趋势来源：

- `data.historyMatches`
- 后端 `_fetch_history_matches(user_id)` 最近取 8 条 upload。

每条趋势数据：

| 字段 | 含义 | 后端计算 |
|---|---|---|
| `date` | 日期 | upload.created_at 前 10 位 |
| `distance` | 总移动距离 | 根据 shots 估算 hitter/opponent 位移并累加 |
| `stability` | 稳定性 | 由失误率和得分率组合成 0-1 |
| `speed` | 平均球速 | shots 的 outgoing/incoming speed 均值 |
| `scoreRate` | 得分率 | A/left 赢分数 / points |
| `winRate` | 同 scoreRate | 兼容字段 |

前端展示时：

- 按比赛：逐场展示。
- 按月：同月求平均。

## 23. 数据兜底和展示优先级

前端大量组件都有兜底逻辑，保证没有后端数据时也能演示。

主要兜底：

1. `getAnalysisResult()`
   - 后端 latest。
   - `/test/match_data.json`。
   - `localStorage tennis:last-analysis`。
   - `mockMatchData`。

2. `enrichAnalysisResult()`
   - 缺 `rallies` 时用 `events` 构建。
   - 缺 `scoreTimeline` 时用 `events` 构建。
   - 缺 `highlights` 时用 `rallies` 构建。
   - 缺 `heatmapPoints` 时用 `events` 构建。
   - 缺 `historyMatches` 时用默认历史数据。
   - 缺 `radarData`、`shotTypeRatio`、`insights` 时用默认值。

3. `PointByPointStats`
   - 缺 `scoreTimeline` 时生成 12 分 mock。
   - 缺 `pointDetails` 时按 selected point 生成 mock detail。

4. `Stability`
   - 缺 `stabilityStats.players` 时使用 A/B fallback。

5. `PlayerProfile`
   - 缺 `profileStats.players` 时使用 A/B fallback。

6. `MyAchievements`
   - 缺 `achievements` 时使用两个 fallback 成就。

7. `UserGrowthTrend`
   - 缺 `historyMatches` 时使用三条 fallback 比赛趋势。

## 24. 总结：前端展示的数据层级

最外层可以理解为 5 类数据：

1. 任务与视频数据
   - 上传状态、处理进度、视频 URL、视频元信息。

2. 比赛过程数据
   - 事件、比分时间线、击球时间线、每分详情、回合、精彩回合。

3. 单场统计数据
   - 总拍数、总回合数、平均每分拍数、最长回合、球速、移动距离、失误率、得分率、落点热图。

4. 技术分析数据
   - 击球类型、跑动轨迹、能力雷达、稳定性、球员画像、AI 建议。

5. 用户历史数据
   - 历史上传记录、成长趋势、成就系统、账号信息。

整体前端逻辑是：后端返回单个 upload 的详情数据后，`enrichAnalysisResult()` 统一补齐字段，`App.jsx` 根据视频播放时间得到当前分和当前拍，再把同一份 `data` 分发给不同页面模块展示。历史页和成长趋势页则基于用户维度的数据，展示跨视频的总览和长期趋势。
