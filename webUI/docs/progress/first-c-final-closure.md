# First-C Final Closure

## 审查发现与修正

独立审查发现 Overview 在非受迫失误相等时会错误归因 Player B；Rally 将 P0 制胜分混入 P1；Rally 忽略 `errorClassification` 失误；Serve 因缺少 bouncePoint 漏掉 fault。已分别修正为两级真实比较/中性结论、P0/P1 分区、`isError` 统一筛选、以及 endPoint 降级可视化。

## 数据表达

`LandingPoint` 现在携带 `errorClassification`、`isError`、`positionSource`。非发球失误优先 bouncePoint，缺失时使用 endPoint 示意。`ServeLandingPoint` 也携带 `positionSource`，所有 Serve Shot 进入候选，fault 可以用 endPoint 出现在图中。Rally 和 Serve 页面均显示降级位置数量，不将 endPoint 描述为真实落点。

Overview 的回合模块只显示一次共享样本数，A/B 仅显示得分率。Rally 新增 P0 “制胜分产出”，P1 “稳定性与失误”只保留规则推断指标。MetricMeta 改为 span，消除了 small 嵌套；Serve 筛选具有 aria-label。

## 文件、测试与门禁

修改范围仅包括允许的 Core Selector/测试、First 三个统计页、共享统计组件、样式、测试、README 和契约文档。Fixture、Metric 注册表、参考工程、Second、Third 均未改；无新增依赖、无锁文件修改、无 Git 写操作。

新增 Selector 与页面回归覆盖：Insight 平局/A/B 高值、forced error 分类与 endPoint 降级、fault/双误两次发球进入 Selector、Overview 样本表述、Rally P0/P1 分区、Serve fault 文案和筛选可访问性。Core 21 项、First 14 项，共 35 项测试通过；format、format check、lint、typecheck、build 均通过。

浏览器验证了视频、Overview、Rally A/B、Serve A/B，控制台无 error。Overview 不再有错误的 Player B 非受迫失误结论，三个共享回合样本标签各仅出现一次。Rally A/B 分别有 5/2 个失误叉号，Serve A/B 分别有 2/4 个 fault 叉号。1024 下 Serve `scrollWidth=1009`、`innerWidth=1024`。最终截图已输出至 `C:/Users/28641/Desktop/React/webUI/review-assets/first/first-final-{overview,rally,serve}-1440x900.png`。Vite 停止后确认 5181 释放。

## 冻结结论

终检随后发现两个报告与源码不一致点：P0 正反手制胜分仍重复进入 P1 列表，neutral Insight 页面会强制取 Player A Metric。已移除 P1 列表内的两个 P0 代码；neutral 改为独立灰色卡片，同时显示 Player A/Player B 值、sampleSize 和各自 Evidence，且不再显示单方问题文案。

新增页面测试验证制胜分仅在 P0 区出现一次，并以可控 neutral Insight 验证双方值和两个独立 Evidence。最终测试总数为 Core 21、First 16，共 37 项。本终检补丁完成后 First 正式冻结，可进入 Second；本阶段未开始 Second 或 Third。

终检浏览器复核 `/overview?snapshot=1`、`/rally?snapshot=1&player=A|B`：正手与反手制胜分各只出现一次，错误 Player B Insight 不存在，控制台无 error。1024 下 Rally `scrollWidth=1009`、`innerWidth=1024`。已更新 `review-assets/first/first-final-rally-1440x900.png`。
