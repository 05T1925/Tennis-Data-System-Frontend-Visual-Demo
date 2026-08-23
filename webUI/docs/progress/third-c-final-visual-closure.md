# Third-C Final Visual Closure

Third 的工程和独立视觉方向在本轮开始前已通过，First 与 Second 均已冻结，Core 与共享 Fixture 保持只读。独立审查发现 Overview 的 A/B 比较条固定为 55%，无法表达真实数据；这是本轮唯一功能性阻塞。

Overview 现为数据驱动双 Track。比例 Metric 宽度等于 `metricValue * 100` 并 clamp；数量 Metric 以同一行 A/B 的最大值为 100%。因此当前 Fixture 的获胜分数 `6/6`、总得分率 `50%/50%`、制胜分 `1/1`、非受迫失误 `1/1` 均为等长，受迫失误 `2/0` 为 A 全宽、B 零宽。零/空值返回 0，不产生 NaN 或 Infinity。A 使用白色实心，B 使用灰色并保留明确 A/B 文字语义。

视频空状态增加本地视频主控件、格式说明、Fixture 的 `02:00 / 12 Points / 69 Shots`、当前分析时间与克制遥测预览，舞台保持 16:9 且限制最大高度，使工具带和遥测带进入 1440 首屏。Rally/Serve Court 线条更细，普通标记缩小，Winner/Error 仍更醒目，endPoint 短划收短。落点使用由 Shot ID 生成的确定性微偏移，不使用随机数。Serve 筛选增加“平分区 / Deuce”“占先区 / Ad”，一发/二发主读数显示成功数/尝试数。

微排版将辅助文本和 Evidence 提升到至少 11px，提高灰阶对比度；Lab Bar 当前导航高度统一。单色检查器现在覆盖三、四、六、八位 Hex、rgb/rgba 的逗号与空格形式、hsl/hsla/hwb/lab/lch/oklab/oklch/color、三类渐变、彩色名称和 First/Second 路径，并带内置允许/拒绝自测。

Third 专属测试扩展为 38 项，覆盖 Track 宽度关系、零值安全、A/B 语义、空状态、Snapshot、确定性偏移、Rally/Serve 标记、发球样本提示与双语筛选。最终执行 format、format:check、lint、typecheck、test、build、Third monochrome；浏览器在 1920、1440、1024 检查并生成 12 张 `review-assets/third-final` 截图。First、Second、Core 和参考工程均未修改；未做 Git 写操作。Third-C 完成后 Third 正式冻结，三套原型全部完成，已知问题为无。
