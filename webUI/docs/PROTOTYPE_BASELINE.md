# Prototype Baseline

三套原型共享 `@tennis-ui/core` 的领域模型、Fixture、A/B/ALL Metric、真实 sampleSize、Evidence、Clip、时间映射与路由语义。视觉布局、导航、字体、图表表达和颜色属于各原型独立代码，不复制页面内 Mock 数据。

First 已最终冻结，包含视频详情、数据总览、击球与相持、发球分析四页。它采用暖白、浅灰、近黑和低饱和深绿的专业数据工作台视觉；视频页以媒体和时间轴为中心，Overview 强调整场结论，Rally 强调拍型/速度/落点，Serve 强调一二发/方向/落点。

技术栈冻结为 React、TypeScript、Vite、React Router、Vitest、CSS Modules、CSS Variables 和原生 SVG；不引入图表库、后端或真实 API。路由冻结为 `/video/demo-upload-001`、`/overview`、`/rally`、`/serve`。

Second 已完成 Second-C 功能与视觉收口，正式视觉定义为 “Monochrome Editorial / 黑白编辑式分析报告”：白底、大留白、少量系统衬线大标题、顶部 Masthead 和水平导航，配合非对称媒体叙事、报告式大数字和黑白 A/B 对照。它不使用 First 的左侧 Rail、卡片工作台、指标矩阵、绿色或 CSS 结构；仅复用冻结后的共享内容契约。Second CSS 只允许黑、白、灰，且由无依赖脚本拒绝彩色、渐变和 First CSS 导入。

Third 已完成 Third-C 并冻结，正式定义为“MONO PERFORMANCE LAB / 黑白运动性能实验室”：黑底、紧凑 Lab Bar、无衬线与等宽数字、精细灰线、视频舞台和遥测带、深色球场轨迹与模块化性能矩阵。A/B 比较条按真实 Metric 值驱动：比例指标直接使用比例，数量指标按行内 A/B 最大值归一化。它使用 `#050505`、`#0c0c0c`、`#141414`、`#1c1c1c`、灰阶线条与白色数据，不使用绿色、其他彩色、渐变、霓虹、First Rail、Second Masthead 或衬线杂志排版。Third 只复用冻结后的 Core 内容契约，并由独立脚本拒绝所有常用颜色函数、渐变和 First/Second 路径导入。
