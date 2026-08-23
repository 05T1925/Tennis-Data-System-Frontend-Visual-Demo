# Content Contract

Overview Insight 先比较非受迫失误，再比较受迫失误；两类指标均持平时返回中性结论，绝不虚构较差球员。短、中、长回合的数量为双方共享的同一组回合样本，A/B 只比较各自得分率。

Rally 的失误同时由 `result in {net,long,wide}` 与 `errorClassification in {forced,unforced}` 识别。非发球和 Serve 位置优先使用 `bouncePoint`；失误或 fault 缺少 bouncePoint 时才以 `endPoint` 作为示意位置，明确不代表真实落点。Serve fault 不得因 bouncePoint 缺失被过滤。

`/rally` 与 `/serve` 的 `player` 仅接受 A/B，非法或缺失值回退 A；切换使用 replace 并保留其他合法查询参数。统计页使用共享纯 Selector 派生非发球速度、回合分布、落点、发球方向和 Overview 结论，不新增 Metric Record，也不在页面内复制数据。

Court SVG 只展示归一化 `bouncePoint`：Rally 图以拍型、制胜分和失误形状区分，Serve 图以一二发、fault、Ace 和 service winner 的形状区分，颜色不是唯一信息。Evidence 与 Clip 均跳转 `/video/demo-upload-001?time=<clipStartMs>`；`metricValue=0` 且 Evidence 是样本时显示“查看样本”，不会声称有事件录像。

`Video` 使用毫秒时长，`PlayerSlot` 固定为 A/B，且显示为 Player A/Player B。`Shot` 归属于一个 `Rally` 和一个 `Point`；`Rally` 与 `Point` 是一对一双向关联，绝不合并概念。球场坐标归一化为 0 至 1。`Evidence` 连接指标与 Point/Rally/Shot/视频时间；`Clip` 提供时间片段并必须关联合法 Point/Rally。

Serve Shot 必须有 `ServeMetadata`：`serveNumber` 为 first/second，`direction` 为 wide/body/t/unknown，`courtSide` 为 deuce/ad，`outcome` 为 in/fault/ace/service_winner。非 Serve Shot 的 serve 必须为 null。普通击球的 `errorClassification` 为 null；forced_error 和 unforced_error 的终结 Shot 分别使用 forced 和 unforced，不能把 OUT 自动解释为非受迫失误。Ace 和 service winner 使用一个 Serve Shot；double fault 使用同一发球方的 first fault + second fault 两个 Serve Shot，当前 Point/Rally 一对一模型允许该 Rally 表示两次发球尝试。

Metric DTO 是 snake_case，Domain 是 camelCase。公共字段包括 upload、球员、metric、单位、样本量、范围、维度、confidence、算法版本、创建时间、P0/P1/P2 和证据 ID。视频级 Metric 使用 `playerSlot=ALL`，球员级 Metric 必须分别生成 A 和 B；名称、单位、维度、层级和范围来自 `metricDefinitions.ts` 注册表。原始时间为 ms、速度为 m/s、距离为 m、比例与 confidence 为 0 至 1、评分为 0 至 100；展示格式只由 Formatter 处理。

`winner_count` 只统计 `endReason=winner` 的普通制胜分；Ace 与 service winner 分别由各自发球指标表达，绝不重复计入。`ace_rate` 与 `service_winner_rate` 的分母为 `outcome !== fault` 的有效 Serve Shot。`max_shot_speed_mps` 只使用速度有限且非负的非 Serve Shot，发球速度只进入发球指标。

`sampleSize` 必须是对应真实分母：视频时长为 1，视频时长均值/Point 相关指标使用 Point 数，Rally 均值/最大值使用 Rally 数；击球率使用非发球 Shot 数，正手/反手细分率使用对应正手/反手 Shot 数；一发/二发成功率使用对应尝试数，双误率使用发球 Point 数，Ace/发球直接得分率使用有效 Serve Shot 数，发球得分率使用成功进入比赛的对应发球 Point 数，发球速度使用带有效速度的有效发球数，方向率使用方向非 unknown 的 Serve Shot 数，最大击球速度使用有效非发球速度样本数。分母为零时 `metricValue=null`、`sampleSize=0`。

Fixture 具备 1 个视频、2 名球员、12 Points、12 Rallies、至少 48 个语义正确的 Shots、55 个 Metric 定义生成的 A/B/ALL 记录、9 个以上 Evidence 和 5 个 Clip，覆盖 overview/rally/serve 指标和 P0/P1。Evidence 应围绕具体 Point/Rally/Shot，所引用 Shot 必须属于同一 Point/Rally；P1 指标必须有具体 Evidence，且球员级 Evidence 不得串到另一名球员。时间区间采用 `[startTimeMs, endTimeMs)`，末实体可包含视频终点；短回合为 1-4 拍，中回合为 5-8 拍，长回合为 9 拍以上。三套原型必须共享此内容。

页面的分析时间始终使用 Fixture 毫秒时间。若用户选择本地视频，媒体秒数与分析时间通过线性归一化映射，非法媒体时长返回 `null`，两端均 clamp；本地视频不属于共享 Fixture，不上传、不保存。`time` URL 参数为分析毫秒，非法值为 0，超范围值 clamp 并四舍五入。Point 内展示该 Point/Rally/Shot；Point 间隙展示上一分 `scoreAfter` 与“分间间歇”；最后一分后展示最终累计比分。比分是“片段累计比分”，不是正式盘局计分。`snapshot=1` 固定 URL 分析时间，用于确定性视觉比较。
