# Tennis Video UI Prototypes

First、Second、Third 均已冻结。Third-C 完成“MONO PERFORMANCE LAB / 黑白运动性能实验室”最终数据图形与视觉收口，包含视频详情、数据总览、击球与相持、发球分析四页。全部内容来自 `@tennis-ui/core` 的确定性 Fixture；本地视频仅使用浏览器 Object URL，不上传、不持久化。

路由：`/video/demo-upload-001`、`/overview`、`/rally?player=A|B`、`/serve?player=A|B`。统计截图使用 `snapshot=1`；视频页还使用 `time=<分析毫秒>`。Player 非法值固定回退为 A。

共享 Core 提供领域模型、指标注册表、Fixture、Validator、Formatter，以及速度、回合、落点、发球方向和 Overview 结论的纯 Selector。Evidence 统一定位到 `/video/demo-upload-001?time=<clipStartMs>`；零事件只展示同球员样本。

启动 First：`pnpm dev:first`；启动 Second：`pnpm dev:second`；启动 Third：`pnpm dev:third`（端口 5183、strictPort）。确定性地址为 `/video/demo-upload-001?snapshot=1&time=35000`、`/overview?snapshot=1`、`/rally?snapshot=1&player=A`、`/serve?snapshot=1&player=A`。Third-C 截图位于 `review-assets/third-final`。质量门禁：`pnpm format`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、`pnpm check:second-colors`、`pnpm check:third-colors`。`demo_test` 与 `frontend-reference` 为只读参考。
