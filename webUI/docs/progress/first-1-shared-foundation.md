# First-1 Shared Foundation

## 阶段名称与目标

First-1：建立独立 Web UI workspace、共享领域模型、统一 Mock 数据和 First 应用页面骨架。本阶段明确停止在骨架，不实现正式视频详情或统计视觉设计。

## 修改前状态

`webUI` 存在但不是 Git 仓库，根目录无 package.json 或锁文件；`first`、`second`、`third` 为空。`demo_test` 存在并处于 `feature/stage-16-quality-release-closure` 分支，HEAD 为 `8f3230d docs: complete quality and release readiness closure`，已有未跟踪压缩包和审查材料。参考项目均未修改。

## 参考读取与复用

读取了 `demo_test` 的 package/workspace、shared-types、Web DTO/Adapter、demo-data 类型/schema/seed/analysis fixture、视频类型/presentation 和统计类型；读取了 `frontend-reference` 的 package、mock data、analysis utility、ScoreTimeline、HighlightsList、OverallStats、PointByPointStats；读取了 `docs/网球数据方案简明版.pdf` 的字段、单位、P0/P1/P2、页面指标和时间规则。实际复用的是领域边界、snake_case 到 camelCase 分层、确定性时间轴和证据关联思想；没有直接复制源码、旧锁文件、旧 App 或 CSS。

## 文件与变更

新建 workspace 配置、`packages/core`、`first` 和三份阶段文档。新增 `pnpm-lock.yaml`。删除文件：无。允许范围之外修改：无。

## 依赖

新增 React 19、React DOM 19、React Router DOM、TypeScript、Vite、Vitest、jsdom、React Testing Library、ESLint、Prettier 及其类型/插件依赖；没有加入 Ant Design、Tailwind、图表库、Query、Zod、动画或 E2E 框架。安装命令为 `pnpm install`，pnpm 版本为 11.7.0。

## Workspace 结构

`packages/core` 暴露公开入口，包含 Domain、DTO、Adapter、Fixture、Selector、Formatter、Validation 和测试；`first` 包含 Vite、路由、骨架页面、基础 CSS 和测试；`second`、`third` 保持为空。

## Domain / DTO / Adapter

定义了 Video、PlayerSlot、Shot、Rally、Point、Metric、Evidence、Clip 与 DemoMatchBundle。DTO 使用 snake_case，Domain 使用 camelCase；`adaptMetricDto(s)` 不修改输入，拒绝非法枚举、数值、比例和 ISO 时间。

## Fixture

唯一 Fixture 为 `demoMatchFixture`：1 个视频、Player A/B、12 Point、12 Rally、75 Shot、2 Evidence、4 Clip，以及 55 个 overview/rally/serve 指标（49 个 P0、6 个 P1）。时间统一 ms，速度统一 m/s，比例统一 0-1；覆盖发球、正反手、制胜分、Ace、双误、受迫/非受迫失误、下网、过长、过宽及短中长回合。P0 为直接统计，少量 P1 带 confidence 与 evidence，不包含 P2 能力评分。

## Selector / Formatter / Validation

实现了时间选择、指标筛选、证据查找、片段起点、Point/Rally/Shot 关联和短中长分类；时间区间采用 `[startTimeMs, endTimeMs)`，负时间和超出视频时长返回 null。Formatter 处理时长、百分比、m/s、km/h、距离、可信度、数据层级和样本量。`validateDemoMatchBundle` 检查 ID、双向引用、时间、坐标、confidence、Metric/Evidence、Clip、数值和核心 P0 一致性。

## First 骨架

`/` 重定向至 `/video/demo-upload-001`；页面包括视频详情、数据总览、击球与相持、发球分析和 404。页面只显示标题、阶段说明、导航和少量 Fixture 数据；没有播放器、上传、seek、时间轴、图表、球场、动画或视觉精修。

## 测试与验证

`pnpm lint` 通过；`pnpm typecheck` 通过；`pnpm test` 通过，2 个测试文件共 12 个用例通过；`pnpm build` 通过，产物仅位于 `first/dist`，未纳入提交；`pnpm format:check` 通过。Fixture 校验通过且无警告。

## Dev Server

使用 `pnpm dev:first` 在 `127.0.0.1:5181` 启动并检查根路由、视频详情、overview、rally、serve 和 404 的 HTTP 响应；验证后停止进程链并确认 5181 端口释放。未进行浏览器截图验收，因为本阶段明确不要求截图。

## 未完成内容与已知问题

正式视频详情、三个统计页、播放器、真实视频、后端、API、移动端和生产部署均未开始。当前 Fixture 的部分 P1 值是确定性演示值，不代表算法事实；视频没有真实播放地址是有意设计。低风险问题是 ESLint/工具链可能提示上游依赖更新。

## First-2 前置条件

需要确认可播放的本地 MP4、视频控件交互范围和最终视频详情信息层级；First-2 应继续消费本 Fixture，不新增页面内 Mock。

## second / third 与 Git

`second`、`third` 保持未修改。`demo_test`、`frontend-reference` 保持未修改。未执行 Git add、commit、push、merge、rebase、reset、clean、checkout、switch、stash 或 init；webUI 不是 Git 仓库。

## 下一阶段建议

先进行 First-2 只读审查和视频资产确认，再实现视频详情交互；完成后才进入 First-3 统计页。不要在 First-1 骨架上提前叠加正式视觉设计。
