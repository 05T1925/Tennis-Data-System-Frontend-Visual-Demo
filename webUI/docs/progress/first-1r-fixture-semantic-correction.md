# First-1R Shared Fixture Semantic Correction

## 阶段名称与目标

First-1R：修正共享 Fixture 的网球事件语义、发球元数据、Metric 样本量、Player A/B/ALL 范围和 Evidence/Clip 关联。本阶段不重建 workspace，不开始正式 UI。

## 修改前真实状态

First-1 workspace、Core、First 骨架、路由、依赖和自动门禁已经存在。开始前 `node_modules` 和 `first/dist` 存在；`webUI` 不是 Git 仓库；`second` 与 `third` 为空。独立审查确认原 Fixture 结构可通过校验，但存在 winnerSlot 与 endReason 冲突、Ace/双误/发球直接得分拍数不合理、所有 sampleSize=12、只有 Player A 指标、缺少 ServeMetadata、Evidence 粒度过粗等问题。

## 修改范围与未修改范围

修改了 `packages/core` 的 Domain、Metric 注册表、Fixture、Selector、Validator 和测试，以及 README、内容契约、原型基线和本阶段记录。First 页面只做了因 Selector 公开签名变化所需的最小数据读取适配。未修改依赖、锁文件、路由布局、CSS、视觉、播放器或正式页面；未修改 demo_test、frontend-reference、second、third。

## Domain 变化

新增 `ServeNumber`、`ServeDirection`、`ServeCourtSide`、`ServeOutcome`、`ServeMetadata` 和 `ErrorClassification`。`ShotRecord` 增加 `serve: ServeMetadata | null` 和 `errorClassification`。Serve Shot 必须有 ServeMetadata，非 Serve Shot 必须为 null；普通球 errorClassification 为 null，forced/unforced 终结球分别为 forced/unforced。兼容性影响仅限内部 Fixture 和公开 Selector 的球员歧义处理，First 骨架已最小适配。

## Point 结束语义

Ace 和 service winner 各为一个发球 Shot，并由发球方得分。Double fault 为同一发球方的 first fault 与 second fault 两个发球 Shot，由接发方得分。Winner 的终结球员等于 winnerSlot；net、long、wide、forced_error、unforced_error 的终结球员不等于 winnerSlot。winnerSlot 由场景和终结事件推导，不再使用独立索引公式。比分文本按 winnerSlot 单调递增。

## Fixture 修正

12 个场景明确覆盖 Ace、service winner、double fault、正手制胜分、反手制胜分、forced/unforced error、net、long、wide、短中长回合以及 A/B 得分。Shot 数从旧的 75 调整为当前场景生成的 69；数量不再为保持旧数字牺牲语义。所有 Serve Shot 均有 first/second、方向、deuce/ad 和 outcome。

## Metric 注册表与指标

新增 `domain/metricDefinitions.ts`，集中定义 55 个指标的 code、中文名称、单位、维度、数据层级、视频级/球员级范围和 valueKind。视频级指标使用 ALL；球员级指标同时生成 A 和 B。当前 Metric 总记录为 103：ALL 7、A 48、B 48；P0 91、P1 12、P2 0。P1 记录保留 confidence、算法版本和具体 Evidence。

## sampleSize 口径

sampleSize 不再统一为 Point 数。Point 指标使用参与 Point 数；正手/反手率使用对应击球数；一发/二发成功率使用对应 Serve Shot 数；短中长回合得分率使用对应 Rally 数；最大速度使用有效速度记录数；视频级总数使用对应实体总数。注册表和 Validator 对关键分母进行校验。

## Evidence 与 Clip

Evidence 从 2 个增加为 9 个：全局、Ace、最长回合、最快发球、正手制胜分、A/B 受迫失误、A/B 非受迫失误。Clip 保留并修正为 5 个，分别对应 Ace、最长回合、最快发球、正手制胜分和反手非受迫失误。Validator 检查 Point/Rally/Shot 存在、Point/Rally 一致、时间覆盖和 error clip 球员一致。

## Selector

`getMetricByCode` 的 playerSlot 参数改为可选；未指定且存在 A/B 多个候选时返回 null，不再静默取第一条。First 骨架通过 Metric 注册表显式选择 ALL 或 A。`getMetricsByPlayer`、`getMetricsByDimension`、Evidence 和时间 Selector 保持既有公开能力及 `[startTimeMs, endTimeMs)` 规则。

## Validator

新增 ServeMetadata 必需/禁止、Serve 枚举、Ace、service winner、double fault、winner、error classification、比分方向、Metric 注册表、范围、sampleSize、Evidence 和 Clip 业务校验。Fixture 最终 `valid=true` 且 `issues=[]`。

## 测试

保留原 `core.test.ts` 的 7 个用例并新增 `semantic.test.ts` 的 6 个用例，覆盖特殊发球、错误归因、Validator 反例、A/B/ALL、Selector 歧义、sampleSize、Evidence 和 Clip。First 骨架测试未删除，仍覆盖 5 个用例。

## 质量门禁

本阶段未执行 `pnpm install`，未新增依赖，未升级锁文件。最终运行 `pnpm format`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 和 `pnpm build`。Dev Server 使用 `pnpm dev:first` 验证六个路由后停止，5181 已释放。

## 页面与阶段边界

页面视觉无变化；没有播放器、currentTime、seek、时间轴、图表或球场。First-2 未开始，First-3 未开始，second/third 未开始。

## 参考项目、Git 与剩余风险

demo_test 和 frontend-reference 未修改，second/third 未修改。webUI 不是 Git 仓库，未执行任何 Git 写操作。当前 P1 和移动指标仍是明确标注的确定性 Demo 值，不代表真实 CV 事实；First-2 前置条件仍是确认可播放 MP4 和视频详情信息层级。
