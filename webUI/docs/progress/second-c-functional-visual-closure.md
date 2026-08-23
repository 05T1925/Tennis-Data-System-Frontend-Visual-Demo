# Second-C Functional Visual Closure

## 目标与边界

本轮只修正 Second 的功能完整性和数据表达，不修改 Core、Fixture、First、Third、`demo_test`、`frontend-reference`、依赖或锁文件，不执行 Git 写操作。

## 修正内容

- Serve 复用 `PlayerTabs`，支持 A/B 页面切换并保留 snapshot 参数；Player B 的零 Ace 只展示其自身样本 Evidence。
- 视频页同步后续 URL time 变化；主动 Point、Clip、上一分和下一分定位写入浏览器历史。Snapshot 下媒体 timeupdate 不再改变分析时间。
- 分间间歇导航直接消费 Core Playback Context 的 previousPoint/nextPoint，第一分前、间歇和片段结束均不循环。
- 新增 `useLocalVideoUrl`，文件替换时只回收旧 URL，卸载时回收当前 URL；不上传、不持久化。
- 视频详情只保留一个 h1，并补齐发球方、接发方、得分方、回合拍数、中文结束原因、时间、关键分、Shot 序号、球员、中文拍型、球速、置信度、发球方向和失误分类。
- Overview 增加 A/B 最快发球、最快非发球击球、移动距离、平均/最大移动速度，以及五个共享 Clip 的视频证据目录。
- Rally 增加正反手数量、使用率、界内率、总界内率及对应 sampleSize/P0-P1。
- Serve 删除结果重复渲染，所有发球速度以 km/h 为主单位、m/s 为次级单位。
- Rally 与 Serve SVG 对 `positionSource=end` 增加下方短划，并提供 `data-position-source="end"` 测试语义；fault 叉号和原有形状保持不变。
- 四个正式页面均只有一个 h1。

## 测试与门禁

Second 专属测试由 6 项增加到 23 项，覆盖 Serve A/B、snapshot 保留、Object URL 创建/替换/卸载、URL time 外部同步、Snapshot timeupdate、间歇前后分、结束边界、中文视频上下文、Overview 速度/移动/五 Clip、Rally 拍型结构、Serve 去重/km/h、Player B 零 Ace Evidence、两类 endPoint SVG 标记、单 h1 和非法文本回归。

`pnpm format`、`format:check`、`lint`、`typecheck`、`test`、`build` 与 `check:monochrome` 全部通过。测试总数为 Core 21、First 16、Second 23，共 60 项。lint 仅保留 `EditorialBits.tsx` 的 Fast Refresh 非阻塞 warning。

## 浏览器与截图

使用端口 5182 strictPort 验证四个确定性 URL，并在 1920x1080、1440x900、1024x768 检查渲染；1024 满足无 document 横向滚动，控制台无 error。四张 1440x900 主截图输出至 `review-assets/second-final`。验证后停止 Vite 并释放 5182。

## 状态

Second-C 完成，等待四张主截图的独立最终视觉审查。Third 未开始。
