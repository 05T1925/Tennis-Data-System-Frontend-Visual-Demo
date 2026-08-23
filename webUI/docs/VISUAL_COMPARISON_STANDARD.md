# Visual Comparison Standard

评审使用 Chrome 100% 缩放与确定性 `snapshot=1` URL。固定尺寸为 1920x1080、1440x900、1024x768；1024 必须满足 `document.documentElement.scrollWidth <= window.innerWidth`。

First 基线截图：`first-video-final-1440x900.png`、`first-overview-{1440x900,1920x1080,1024x768}.png`、`first-rally-{1440x900,1920x1080,1024x768}.png`、`first-serve-{1440x900,1920x1080,1024x768}.png`。Second 基线截图：`review-assets/second/second-{video,overview,rally,serve}-{1440x900,1920x1080,1024x768}.png`；Second-C 最终审查截图为 `review-assets/second-final/second-final-{video,overview,rally,serve}-1440x900.png`。Third-C 最终截图为 `review-assets/third-final/third-final-{video,overview,rally,serve}-{1440x900,1920x1080,1024x768}.png`。地址分别为 `/video/demo-upload-001?snapshot=1&time=35000`、`/overview?snapshot=1`、`/rally?snapshot=1&player=A`、`/serve?snapshot=1&player=A`。

比较时检查：首屏结论是否清晰，数字层级与样本/P0/P1 是否可读，图形是否承载真实共享数据，Evidence 是否能定位视频，1024 是否无横向滚动，以及四页是否保有不同任务重点。盲评时将 First、Second、Third 文件副本匿名命名为 A、B、C，并按页面完整性、内容可信度、视觉独立性、阅读节奏、响应式五项评分。Second/Third 必须保留同一内容和路由语义，但以独立黑白灰视觉完成，不得仅替换 First 色彩。
