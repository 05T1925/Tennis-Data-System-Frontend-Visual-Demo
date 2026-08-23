# Third-1 Performance Lab

## 阶段目标与开始状态

目标是建立第三套独立 Web UI 原型“MONO PERFORMANCE LAB / 黑白运动性能实验室”。开始前 First 与 Second 已冻结；Third 目录为空；Core 的 Fixture、Metric、Evidence、Clip、时间映射和 Selector 已冻结。

## 工程与复用边界

新增 `third` Vite workspace、端口 5183 与 strictPort。Third 直接复用 `@tennis-ui/core` 的 Fixture、Formatter、Playback Context、Overview Insight、回合分布、速度汇总、落点、发球方向与查询参数解析。未复制或导入 First/Second 的组件、CSS 或页面结构；未创建页面 Mock；未修改 Core、First、Second 或参考工程。

## 视觉与页面

颜色 Token 仅为 `#050505`、`#0c0c0c`、`#141414`、`#1c1c1c`、灰阶线条与白色文字。`check-monochrome.mjs` 检查 CSS 的非灰阶颜色、渐变和 First/Second 路径。顶部为紧凑 Lab Bar；视频页实现视频舞台、Object URL、遥测带、Point 时间轴、分间导航、Point/Shot 双域遥测和 Clip 索引。Overview 为 Session、A/B、Rally、Insight、速度移动与 Clip 矩阵。Rally 为深色落点球场、手型、速度、P0/P1。Serve 为一二发遥测、中央深色球场、方向刻度、速度与结果。

## 可靠性与验收

本地视频 URL 在替换与卸载时回收。URL `time` 同步外部导航；Snapshot 固定时间；Point 间隙前后分与片段结束边界使用 Core Playback Context。Court/Serve Court 以形状显示 error、fault、winner、Ace、service winner 和 endPoint 降级，所有速度以 km/h 为主、m/s 为次。页面均有单一 h1、键盘可用导航/切换/筛选、SVG title/aria-label 和高对比 focus。

Third 专属 Vitest 共 30 项，覆盖路由、Lab Bar、Object URL、时间、Snapshot、Point 边界、视频遥测、Overview、Rally、Serve、Player B 零 Ace、单 h1 和非法值。format、lint、typecheck、test、build、monochrome、1920/1440/1024 浏览器与 12 张截图为本阶段交付门禁。根锁文件仅登记 Third workspace importer，无依赖升级或新增第三方依赖。无 Git 写操作。已知问题：无；下一步为三套原型最终盲评。
