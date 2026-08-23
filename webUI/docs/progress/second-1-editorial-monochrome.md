# Second-1 Editorial Monochrome

## 阶段目标

在不修改冻结的 First、Third、共享 Core 或参考工程的前提下，实现独立的 Second：Monochrome Editorial / 黑白编辑式分析报告。

## 开始前状态

First 已冻结，Core 已提供确定性 Fixture、Metric、Evidence、Clip、时间映射、Snapshot、Player 参数、Overview Insight、落点与发球 Selector。Second 与 Third 均未开始。

## 实现

`second` 是独立 Vite/React 工作区，端口固定为 5182 且使用 strictPort。它只从 `@tennis-ui/core` 读取领域模型与 Selector；没有第二份 Fixture，也没有 First 的运行时导入、页面 JSX、Rail、CSS、变量或卡片布局。

视觉使用 `#000`、`#111`、`#555`、`#777`、`#999`、`#ddd`、`#eee`、`#fff`。顶部 Masthead 与水平导航替代左侧 Rail。无渐变、无彩色、无图标库。`scripts/check-monochrome.mjs` 扫描 Second CSS，拒绝非灰阶颜色、彩色名称、渐变和 First CSS 导入。

视频页实现 16:9 黑色媒体 Hero、本地视频选择、Object URL 生命周期、原生 video 事件、分析/媒体时间映射、URL `time`、Snapshot 禁用定位、12 个 Point 时间轴、上一分/下一分、分间间歇、当前 Point/Shot、核心指标与 Clip 跳转。播放失败通过 aria-live 文本反馈。

Overview 使用大数字、黑白 A/B 对照、引用式 Insight、neutral 的双方 Metric/Evidence 和共享回合样本。Rally 使用文字 Player Tab、大型黑白 Court、筛选、P0/P1 严格分区、速度和 endPoint 说明。Serve 使用一发/二发大字号对照、结果栏目、方向/速度、黑白半场和 fault/endPoint 可视化。四页均保留 Evidence 到视频的链接、sampleSize、P0/P1 和可访问的语义结构。

## 验证与状态

完成格式化、format check、lint、typecheck、Core + First + Second 测试、build 与 monochrome check。测试结果为 Core 21、First 16、Second 6，共 43 项通过；lint 仅保留现有的 Fast Refresh 非阻塞 warning。Chrome 在 1920x1080、1440x900、1024x768 对四个 snapshot 页面生成 12 张截图；检查控制台无 error、Snapshot 定位控制已禁用、A/B URL 正确，且 1024 无页面横向滚动。Vite 随后停止并释放 5182。

根 workspace 仅登记 `second` 与对应脚本；不升级或新增外部依赖。`pnpm-lock.yaml` 已登记 Second workspace importer，并保持现有解析版本。没有 Git 写操作。First、Third、Core、`demo_test` 和 `frontend-reference` 均保持未改动。

## 已知问题与后续

无已知 Core 或 Second 阻塞。Second-1 完成后等待独立视觉审查；不得在本阶段开始 Third。
