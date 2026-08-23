# First-3 Statistics and Visual Closure

## 阶段目标

完成 First 的 Overview、Rally、Serve，收口四页视觉，并保留 First-2 视频详情能力。

## 开始前状态

First-1、First-1R、First-1R2、First-2 已完成；Overview/Rally/Serve 仅有路由骨架。Second、Third、两个参考工程均未改动。

## First-2 小修

有效本地视频替换时清空媒体时长并进入 loading；`loadedmetadata` 后进入 ready。URL `time` 外部变化同步分析时间，普通 `timeupdate` 不写 URL。当前 Point/Shot 显示毫秒级时间范围。零事件样本使用“查看样本”。导航字母替换为统一内联 SVG 图标。

## 文件与依赖

修改 `packages/core/src/selectors/match.ts`、`packages/core/tests/core.test.ts`、First 路由、导航、视频页、样式、测试与文档。新建 `StatsShared.tsx`、Overview/Rally/Serve、视觉比较标准和本记录。删除文件：无。新增依赖：无。锁文件变更：无。

## 共享 Selector

`parsePlayerSlotParam` 解析 A/B；`getShotSpeedSummary` 输出有限非发球速度摘要；`getRallyDistribution` 输出短中长回合数量/得分率；`getLandingPointsByPlayer` 与 `getServeLandingPoints` 输出 SVG 点；`getServeDirectionSummary` 排除 unknown；`getOverviewInsights` 输出可追溯优势和问题。全部为无 React、无 CSS 的纯函数，由 Core 测试覆盖。

## 页面内容

Overview 提供规模摘要、A/B 得分结构、回合分布、可追溯结论、移动/速度次级说明和 Clip。Rally 提供 A/B URL 切换、正反手结构、P1 稳定性、非发球速度、回合表现、落点 SVG/筛选与 Evidence。Serve 提供 A/B URL 切换、一二发、结果率、速度、方向、半场 SVG/筛选与同球员 Evidence；Player B Ace 为零时仅链接样本。

## 视觉、响应式与可访问性

First 保持暖白、近黑、低饱和绿、轻边框和小圆角。Overview、Rally、Serve 分别服务结论、击球结构、发球结构，不是同模板。SVG 有 title 和 aria-label；筛选和 Player 切换使用 button/aria-pressed；链接和导航可键盘操作。1920 限制内容宽度，1440 首屏保留核心结论，1024 断为单列且不应横向溢出。

## 验证

`format`、`format:check`、`lint`、`typecheck`、`test`、`build` 全部退出码 0。Core 19 项、First 14 项，共 33 项测试全部通过。Vite 5181 验证根路由、视频、Overview、Rally A/B、Serve A/B 与 404 均正常，控制台无 error，A/B 切换保留 snapshot。1024 下三个统计页 `scrollWidth=1009`、`innerWidth=1024`，无横向滚动；页面无 undefined、NaN、Infinity 或 `[object Object]`。

已生成 10 张截图：`first-video-final-1440x900.png`，以及 Overview、Rally、Serve 各自的 1440x900、1920x1080、1024x768。输出目录为 `C:/Users/28641/.codex/visualizations/2026/07/23/019f8f6c-758a-7a41-b5b0-4c43babcc420`。浏览器验收后释放标签并停止 Vite，5181 已释放。

## 未验证项与已知问题

没有真实视频/CV/后端验证；本地视频媒体元数据依赖浏览器文件能力。移动、接发独立页、战术、长期趋势、导出均不在范围。

## 后续边界

First-C 只读审查可开始；Second、Third 均未开始。`demo_test` 和 `frontend-reference` 保持只读未改。没有 Git 写操作。
