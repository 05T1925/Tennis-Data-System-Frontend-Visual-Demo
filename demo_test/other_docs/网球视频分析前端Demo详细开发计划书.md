# 网球视频分析系统 v0.1 前端 Demo 详细开发计划书

> 适用对象：只学过少量 React、暂不了解 Vue / React Native / Expo 的前端初学者  
> 项目定位：做出一个“能演示、能跑通、能继续迭代”的产品级原型，而不是一次性代码 Demo  
> 核心闭环：用户登录 → 上传网球视频 → 查看分析状态 → 查看分析结果 → Web 端调试和统计

---

## 1. 项目目标

### 1.1 App 端目标

App 是最终面向普通网球用户的主要产品形态，需要完成：

1. 登录或简单用户身份识别
2. 从手机相册选择视频并上传
3. 查看自己上传的视频列表
4. 查看视频上传进度与分析状态
5. 查看单条视频的分析结果
6. 查看训练或比赛的基础数据统计
7. 对失败任务进行重试
8. 对空状态、加载状态、错误状态提供清楚反馈

### 1.2 Web 数据看板目标

Web 端是内部开发、调试和演示工具，不是正式用户产品。需要完成：

1. 查看所有上传视频
2. 筛选不同分析状态的视频
3. 查看视频基础信息和播放视频
4. 查看 CV 原始输出
5. 查看结构化分析结果
6. 查看汇总统计和图表
7. 查看分析任务日志与错误信息
8. 方便团队演示完整数据链路

### 1.3 v0.1 不做的内容

为了控制范围，第一版暂不实现：

- 正式短信验证码计费服务
- App Store / 应用商店上架
- 复杂会员、支付、社交、评论系统
- 真正高精度的 CV 算法
- 实时视频直播分析
- 多人同时编辑
- 完整后台权限系统
- 大规模视频转码和 CDN 优化
- 复杂推送通知
- 过早的微服务或复杂工程架构

---

## 2. 推荐技术方案

## 2.1 为什么不建议先学 Vue

你已经接触过 React，而 React Native 也使用 React 的组件、状态、Props、Hooks 等思维。为了降低学习成本，App 和 Web 都继续使用 React 体系，不需要同时学习 Vue。

## 2.2 技术栈

### App

- Expo
- React Native
- Expo Router
- TypeScript
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Expo Image Picker
- Expo File System
- React Native Safe Area Context
- React Native SVG
- 可选：EAS Build

### Web

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Ant Design
- Recharts

### 数据与后端

第一阶段：

- Mock Service
- 本地 JSON 数据
- 模拟上传进度
- 模拟分析状态变化
- 模拟分析结果

第二阶段：

- 优先接团队后端 REST API
- 团队后端未完成时，可使用 Supabase：
  - Auth：用户身份
  - Database：用户、视频、任务和结果
  - Storage：视频文件
  - Realtime 或轮询：状态更新

### 工程工具

- Node.js 当前 LTS
- pnpm
- ESLint
- Prettier
- Git
- Vitest
- React Testing Library
- MSW（可选，用于 Mock API）
- Husky / lint-staged 放到后期，不在第一天引入

---

## 3. 总体架构

```text
                    ┌───────────────────────┐
                    │   Expo React Native   │
                    │      用户 App         │
                    └───────────┬───────────┘
                                │
                                │ API Client
                                │
┌───────────────────────┐       │       ┌───────────────────────┐
│ React + Vite Web 看板 │───────┼──────▶│   REST API / Mock API │
└───────────────────────┘       │       └───────────┬───────────┘
                                │                   │
                                │                   ├─ 用户数据
                                │                   ├─ 视频元数据
                                │                   ├─ 分析任务
                                │                   ├─ 分析结果
                                │                   └─ CV 原始输出
                                │
                                ▼
                     ┌──────────────────────┐
                     │ 视频存储 / Supabase │
                     └──────────────────────┘
```

### 核心原则

1. 页面只负责展示和交互。
2. API 请求统一放在 `services` 或 `api` 目录。
3. 数据转换统一放在 `adapters`。
4. 类型定义统一放在共享包。
5. Mock 数据和真实 API 使用同一套接口。
6. 页面不能直接写死大量假数据。
7. 分析状态和上传状态必须分开建模。
8. App 与 Web 共用数据类型，但不强行共用 UI 组件。
9. 每个开发任务只改一个小范围。
10. 每完成一个阶段，项目必须仍能启动和演示。

---

## 4. 推荐项目结构

```text
tennis-video-platform/
├─ apps/
│  ├─ mobile/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ _layout.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ (auth)/
│  │  │  │  │  └─ login.tsx
│  │  │  │  ├─ (tabs)/
│  │  │  │  │  ├─ _layout.tsx
│  │  │  │  │  ├─ home.tsx
│  │  │  │  │  ├─ videos.tsx
│  │  │  │  │  ├─ statistics.tsx
│  │  │  │  │  └─ profile.tsx
│  │  │  │  ├─ upload/
│  │  │  │  │  ├─ index.tsx
│  │  │  │  │  └─ confirm.tsx
│  │  │  │  └─ videos/
│  │  │  │     └─ [videoId].tsx
│  │  │  ├─ components/
│  │  │  │  ├─ common/
│  │  │  │  ├─ video/
│  │  │  │  ├─ analysis/
│  │  │  │  └─ charts/
│  │  │  ├─ features/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ upload/
│  │  │  │  ├─ videos/
│  │  │  │  └─ analysis/
│  │  │  ├─ services/
│  │  │  ├─ stores/
│  │  │  ├─ hooks/
│  │  │  ├─ adapters/
│  │  │  ├─ constants/
│  │  │  ├─ theme/
│  │  │  └─ mocks/
│  │  ├─ app.json
│  │  └─ package.json
│  │
│  └─ web/
│     ├─ src/
│     │  ├─ pages/
│     │  ├─ components/
│     │  ├─ features/
│     │  ├─ services/
│     │  ├─ stores/
│     │  ├─ hooks/
│     │  ├─ adapters/
│     │  ├─ layouts/
│     │  ├─ router/
│     │  ├─ theme/
│     │  └─ mocks/
│     └─ package.json
│
├─ packages/
│  ├─ shared-types/
│  ├─ api-client/
│  └─ shared-utils/
│
├─ docs/
│  ├─ product-requirements.md
│  ├─ architecture.md
│  ├─ data-model.md
│  ├─ api-contract.md
│  ├─ demo-script.md
│  └─ troubleshooting.md
│
├─ .env.example
├─ .gitignore
├─ pnpm-workspace.yaml
├─ package.json
└─ README.md
```

### 初学者简化方案

如果 Codex 一次创建 monorepo 出错，可以先拆成两个独立项目：

```text
tennis-mobile/
tennis-web-dashboard/
```

等两个项目均能运行后，再统一到 monorepo。不要为了目录“高级”而让项目无法启动。

---

## 5. 产品信息架构

## 5.1 App 导航

```text
启动页
└─ 登录页
   └─ 主应用
      ├─ 首页
      │  ├─ 上传入口
      │  ├─ 最近视频
      │  └─ 最近一次分析摘要
      ├─ 视频
      │  ├─ 视频列表
      │  └─ 视频详情
      │     ├─ 视频信息
      │     ├─ 分析进度
      │     ├─ 分析结果
      │     └─ 失败重试
      ├─ 统计
      │  ├─ 训练次数
      │  ├─ 击球次数
      │  ├─ 回合统计
      │  ├─ 落点分布
      │  └─ 能力画像
      └─ 我的
         ├─ 用户信息
         ├─ Demo 数据重置
         ├─ 开发环境信息
         └─ 退出登录
```

## 5.2 Web 导航

```text
登录
└─ 管理后台
   ├─ 总览
   ├─ 视频管理
   │  └─ 视频详情
   ├─ 分析任务
   ├─ CV 数据查看
   ├─ 统计看板
   └─ 系统信息
```

---

## 6. App 页面详细规划

## 6.1 登录页

### 页面目标

让用户明确知道这是一个真实产品入口，而不是测试表单。

### v0.1 方案

支持两种入口：

1. 邮箱和密码登录
2. “使用 Demo 账号进入”按钮

### 页面元素

- Logo 和产品名称
- 简短产品说明
- 邮箱输入框
- 密码输入框
- 显示/隐藏密码
- 登录按钮
- Demo 登录按钮
- 用户协议和隐私政策勾选
- 网络错误提示
- 版本号

### 状态

- 默认
- 输入错误
- 未勾选协议
- 提交中
- 登录失败
- 登录成功

### 验收标准

- 邮箱格式错误时显示提示
- 密码为空不能提交
- 未勾选协议不能登录
- 登录中防止重复点击
- 错误提示清楚
- 登录成功进入首页
- 已登录用户再次启动时直接进入主应用

---

## 6.2 首页

### 页面目标

让用户在 5 秒内理解下一步该做什么。

### 页面元素

- 用户问候
- 大号“上传网球视频”按钮
- 上传拍摄建议
- 最近一次分析卡片
- 最近上传视频列表
- 核心累计数据：
  - 视频数量
  - 总击球次数
  - 总回合数
  - 总训练时长

### 验收标准

- 无数据时显示引导空状态
- 有数据时显示最近 3 条
- 点击上传进入上传页
- 点击视频进入详情页
- 数据加载时显示骨架屏

---

## 6.3 视频上传页

### 页面目标

完成“选视频 → 校验 → 确认 → 上传”的完整体验。

### 页面元素

- 从相册选择视频
- 拍摄视频入口可作为后续功能
- 文件预览
- 视频名称
- 文件大小
- 视频时长
- 拍摄类型：
  - 训练
  - 比赛
- 单打/双打
- 场地类型
- 备注
- 上传按钮

### 前端校验

- 只允许视频文件
- 限制最大文件大小
- 限制最长视频时长
- 文件读取失败提示
- 权限被拒绝时提供设置说明

### 上传状态

- 等待上传
- 上传中
- 上传成功
- 上传失败
- 已取消

### 验收标准

- 可选择本地视频
- 显示基础文件信息
- 上传时显示 0–100% 进度
- 上传中不能重复提交
- 失败后可重试
- 上传成功后自动创建分析任务
- 成功后跳转到视频详情页

---

## 6.4 视频列表页

### 页面目标

让用户快速找到上传记录和当前状态。

### 卡片内容

- 视频缩略图
- 视频名称
- 上传时间
- 时长
- 分析状态标签
- 关键结果摘要
- 失败原因摘要

### 筛选条件

- 全部
- 等待分析
- 分析中
- 已完成
- 失败

### 交互

- 下拉刷新
- 加载更多
- 点击进入详情
- 失败任务快速重试
- 删除视频二次确认

### 验收标准

- 状态颜色和文字统一
- 空列表有引导
- 网络失败有重试按钮
- 不因单条数据异常导致整页崩溃

---

## 6.5 视频详情页

### 页面区域

1. 视频播放区域
2. 视频基础信息
3. 上传状态
4. 分析任务状态
5. 分析进度步骤
6. 分析结果摘要
7. 详细统计
8. 错误和重试

### 分析进度步骤

```text
视频已上传
→ 等待分析
→ 识别球场
→ 识别球员
→ 追踪网球
→ 提取击球事件
→ 生成统计结果
→ 分析完成
```

### 验收标准

- 不同状态展示不同内容
- 分析中自动刷新状态
- 页面离开后停止无意义轮询
- 完成后停止轮询
- 失败时显示错误原因和重试按钮
- 结果字段缺失时显示“暂无数据”，不能显示 `undefined`

---

## 6.6 分析结果页或详情页结果区域

### 第一层：普通用户最关心的数据

- 视频时长
- 击球次数
- 有效回合数
- 平均每回合拍数
- 最长回合
- 平均球速
- 最高球速
- 跑动距离
- 简单失误数

### 第二层：图表

- 落点分布
- 球速变化
- 每回合拍数
- 击球类型占比
- 跑动趋势

### 第三层：能力画像

- 稳定性
- 进攻倾向
- 防守能力
- 移动能力

### 展示原则

- 优先用普通用户能理解的语言
- 每项指标有简短解释
- 不伪装成医学或职业级评估
- 模拟数据明确标注为 Demo 数据
- 低置信度结果显示提示

---

## 6.7 统计页

### v0.1 统计

- 累计视频数
- 累计训练时长
- 累计击球数
- 累计回合数
- 最近 7 次训练趋势
- 平均每回合拍数趋势
- 球速趋势
- 能力画像雷达图

### 空状态

没有已完成分析的视频时，显示：

> 完成一次视频分析后，这里会出现你的训练趋势。

---

## 7. Web 数据看板详细规划

## 7.1 Web 登录页

第一版可使用固定管理员账号或环境变量配置的 Demo 账号。

必须具备：

- 登录状态保持
- 路由保护
- 错误提示
- 退出登录
- 禁止未登录直接访问后台页面

---

## 7.2 总览页

### 顶部指标

- 总视频数
- 今日上传数
- 等待分析数
- 分析中数量
- 成功数量
- 失败数量
- 平均分析时长

### 图表

- 最近 7 天上传量
- 分析成功率
- 状态分布
- 视频时长分布

### 快捷区域

- 最近上传
- 最近失败任务
- 分析中任务

---

## 7.3 视频管理页

### 表格字段

- 视频 ID
- 用户
- 视频名称
- 上传时间
- 文件大小
- 视频时长
- 上传状态
- 分析状态
- 分析进度
- 操作

### 筛选

- 关键词
- 用户
- 上传时间
- 分析状态
- 是否失败
- 视频类型

### 操作

- 查看详情
- 查看视频
- 查看原始数据
- 重试分析
- 复制视频 ID
- 删除 Demo 数据

---

## 7.4 视频详情页

分成多个 Tab：

### 基础信息

- 视频播放器
- 文件信息
- 用户信息
- 上传信息
- 分析任务信息

### 结构化结果

- 核心统计卡片
- 每一拍数据表格
- 每一分数据表格
- 结果图表

### CV 原始输出

- 球场关键点
- 球员轨迹
- 网球轨迹
- 帧级对象识别数据
- 置信度
- 原始 JSON 查看器

### 任务日志

- 任务创建时间
- 开始时间
- 完成时间
- 当前阶段
- 错误码
- 错误信息
- 重试次数

---

## 7.5 分析任务页

### 列表字段

- 任务 ID
- 视频 ID
- 状态
- 当前阶段
- 进度
- 创建时间
- 开始时间
- 完成时间
- 耗时
- 重试次数
- 错误信息

### 主要用途

- 判断后端或 CV 是否卡住
- 验证状态更新
- 快速定位失败原因
- 演示系统内部工作流程

---

## 8. 核心数据模型

## 8.1 用户

```ts
export interface User {
  id: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'developer';
  createdAt: string;
  updatedAt: string;
}
```

## 8.2 视频

```ts
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'failed'
  | 'canceled';

export interface Video {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  storagePath: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  matchType: 'training' | 'match';
  playMode: 'singles' | 'doubles';
  courtType?: 'hard' | 'clay' | 'grass' | 'other';
  note?: string;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  createdAt: string;
  updatedAt: string;
}
```

## 8.3 分析任务

```ts
export type AnalysisStatus =
  | 'queued'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type AnalysisStage =
  | 'queued'
  | 'court_detection'
  | 'player_detection'
  | 'ball_tracking'
  | 'trajectory_processing'
  | 'event_extraction'
  | 'statistics_generation'
  | 'completed';

export interface AnalysisTask {
  id: string;
  videoId: string;
  status: AnalysisStatus;
  stage: AnalysisStage;
  progress: number;
  errorCode?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}
```

## 8.4 每一拍数据

```ts
export interface ShotRecord {
  id: string;
  videoId: string;
  rallyId: string;
  shotIndex: number;
  playerId?: string;
  startedAtMs: number;
  endedAtMs: number;
  startPoint: CourtPoint;
  endPoint: CourtPoint;
  bouncePoint?: CourtPoint;
  speedKmh?: number;
  shotType?: 'serve' | 'forehand' | 'backhand' | 'volley' | 'unknown';
  tacticalType?: 'attack' | 'defense' | 'neutral' | 'error' | 'unknown';
  confidence: number;
}
```

## 8.5 分析结果

```ts
export interface AnalysisResult {
  id: string;
  videoId: string;
  version: string;
  summary: {
    durationSeconds: number;
    totalShots: number;
    totalRallies: number;
    averageShotsPerRally: number;
    longestRallyShots: number;
    averageBallSpeedKmh?: number;
    maxBallSpeedKmh?: number;
    playerDistanceMeters?: number;
    unforcedErrors?: number;
  };
  playerProfile?: {
    consistency: number;
    attack: number;
    defense: number;
    movement: number;
  };
  shots: ShotRecord[];
  rallies: RallyRecord[];
  heatmapPoints: CourtPoint[];
  createdAt: string;
}
```

## 8.6 重要约定

- 所有 ID 使用字符串。
- 所有时间使用 ISO 8601 字符串。
- 所有字段统一使用 camelCase。
- API 原始字段若为 snake_case，必须经过 adapter 转换。
- 前端不直接依赖后端原始响应。
- `uploadStatus` 和 `analysisStatus` 绝不能混为一个字段。
- 结果必须带 `version`，为以后算法版本变化留空间。
- 可选字段必须在 UI 中安全处理。

---

## 9. API 契约建议

## 9.1 认证

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

## 9.2 视频

```text
POST   /videos/upload-init
PUT    /videos/:id/upload
POST   /videos/:id/upload-complete
GET    /videos
GET    /videos/:id
DELETE /videos/:id
```

## 9.3 分析任务

```text
POST /videos/:id/analysis
GET  /videos/:id/analysis
POST /analysis/:taskId/retry
```

## 9.4 分析结果

```text
GET /videos/:id/result
GET /videos/:id/shots
GET /videos/:id/rallies
GET /videos/:id/cv-output
```

## 9.5 统计

```text
GET /statistics/user-summary
GET /statistics/user-trends
GET /admin/statistics/overview
```

## 9.6 推荐统一响应格式

```ts
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}
```

---

## 10. Mock 模式设计

Mock 不是随便写死数据，而是模拟真实后端行为。

## 10.1 Mock 登录

- 正确 Demo 账号返回用户和 token
- 错误账号返回明确错误
- 模拟 500–1000ms 延迟
- token 保存到安全存储或本地存储

## 10.2 Mock 上传

- 每 300ms 增加上传进度
- 随机或指定触发上传失败
- 上传成功后生成视频记录
- 随后自动创建分析任务

## 10.3 Mock 分析流程

建议状态时间线：

```text
0 秒：queued，0%
2 秒：court_detection，10%
4 秒：player_detection，25%
6 秒：ball_tracking，45%
9 秒：trajectory_processing，65%
11 秒：event_extraction，80%
13 秒：statistics_generation，92%
15 秒：succeeded，100%
```

为了演示，也要准备失败样例：

```text
ball_tracking 阶段失败
errorCode: BALL_TRACKING_UNSTABLE
errorMessage: 网球轨迹不稳定，无法生成可靠结果
```

## 10.4 Mock 数据控制面板

在“我的”或 Web 系统信息页提供开发按钮：

- 重置所有 Demo 数据
- 创建成功任务
- 创建分析中任务
- 创建失败任务
- 让指定任务立即完成

这些按钮仅在开发环境显示。

---

## 11. 状态管理策略

### TanStack Query 管理

- 登录用户查询
- 视频列表
- 视频详情
- 分析任务
- 分析结果
- Web 统计数据
- 缓存、重新请求、轮询、错误重试

### Zustand 管理

- 登录 token
- 当前用户轻量信息
- UI 设置
- 当前上传草稿
- Demo 模式开关

### 本地状态管理

- 输入框内容
- 弹窗开关
- 当前 Tab
- 临时筛选条件

### 禁止事项

- 不要把所有数据放进一个全局 store
- 不要在页面中直接写 fetch
- 不要重复保存同一份服务端数据
- 不要使用 Context 承载所有业务数据

---

## 12. 轮询与实时状态策略

v0.1 使用轮询，简单可靠：

- `queued`：每 3 秒查询一次
- `processing`：每 2 秒查询一次
- `succeeded`：停止轮询并拉取结果
- `failed`：停止轮询
- 页面进入后台或离开详情页：暂停轮询

后续可替换为 WebSocket、SSE 或 Supabase Realtime，但不应在第一版增加复杂度。

---

## 13. UI 视觉规范

## 13.1 风格定位

- 现代运动数据产品
- 清爽、可信、轻量
- 不使用过多渐变和动画
- 不做“黑底炫酷大屏”式界面
- 重点数据突出，次要数据弱化

## 13.2 建议颜色

- 主色：网球绿
- 深色文字：接近黑色
- 次级文字：中灰
- 页面背景：浅灰白
- 成功：绿色
- 处理中：蓝色
- 等待：橙色
- 失败：红色

## 13.3 间距和圆角

- 使用 4 / 8 / 12 / 16 / 24 / 32 间距体系
- 卡片圆角统一
- 按钮高度统一
- 状态标签样式统一
- 图表和数据卡片不要过度拥挤

## 13.4 必须实现的页面状态

每个有数据请求的页面都要考虑：

1. 初次加载
2. 加载成功
3. 空数据
4. 加载失败
5. 下拉刷新
6. 局部更新
7. 权限不足
8. 数据字段缺失

---

## 14. 错误处理

## 14.1 用户可理解错误

不显示：

```text
Request failed with status code 500
```

应显示：

```text
视频分析暂时失败，请稍后重试。
```

开发模式下可附加：

```text
错误码：BALL_TRACKING_UNSTABLE
请求 ID：req_xxx
```

## 14.2 统一错误类型

```ts
export interface AppError {
  code: string;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;
  requestId?: string;
}
```

## 14.3 错误边界

- App 根级错误边界
- Web 根级错误边界
- 图表组件局部错误保护
- 单个字段异常不能让整个结果页崩溃

---

## 15. 安全和配置

- 不在前端保存后端管理员密钥。
- 不提交真实账号、密码、Token。
- 使用 `.env.example` 列出所需变量。
- `.env` 加入 `.gitignore`。
- Supabase 使用前端允许公开的 anon key，数据库必须配置 RLS。
- 管理端权限必须由后端验证，不能只靠隐藏按钮。
- 上传文件需要校验类型、大小和归属用户。
- 所有 Demo 数据需明确标识。
- 日志中不要输出登录密码和完整 token。

示例：

```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_USE_MOCK=true
VITE_API_BASE_URL=
VITE_USE_MOCK=true
```

---

## 16. 分阶段开发计划

## 阶段 0：项目说明和约束

### 任务

- 创建 README
- 创建需求文档
- 创建数据模型文档
- 创建 API 契约文档
- 明确 v0.1 范围
- 明确不做内容

### 验收

- 新成员能通过 README 启动项目
- Codex 能通过文档理解边界
- 核心术语统一

---

## 阶段 1：项目脚手架

### 任务

- 创建 Expo App
- 创建 React + Vite Web
- 配置 TypeScript
- 配置 ESLint 和 Prettier
- 配置环境变量
- 创建共享类型包
- 创建基础路由
- 建立主题变量

### 验收

```text
pnpm install
pnpm mobile:start
pnpm web:dev
pnpm lint
pnpm typecheck
```

均可正常执行。

---

## 阶段 2：静态产品原型

### 任务

先不接 API，完成主要页面的静态样式：

- App 登录
- App 首页
- App 视频列表
- App 上传
- App 详情
- App 统计
- Web 登录
- Web 总览
- Web 视频管理
- Web 视频详情

### 验收

- 页面能完整跳转
- 视觉风格统一
- 手机屏幕适配
- Web 桌面宽度适配
- 不出现明显测试页面感

---

## 阶段 3：Mock 数据层

### 任务

- 建立 `VideoService`
- 建立 `AnalysisService`
- 建立 `AuthService`
- 建立 Mock 实现
- 创建假数据工厂
- 模拟延迟、失败和状态更新
- 页面不再直接读取静态 JSON

### 验收

- 通过切换环境变量启用 Mock
- 页面使用服务层数据
- Mock 和真实 API 接口签名一致

---

## 阶段 4：登录闭环

### 任务

- 表单校验
- Demo 登录
- token 持久化
- 路由保护
- 自动恢复登录
- 退出登录

### 验收

- 未登录不能进入主页面
- 重启后仍能识别登录状态
- 登录中不能重复提交
- 错误提示清楚

---

## 阶段 5：视频上传闭环

### 任务

- 选择本地视频
- 读取元数据
- 填写视频信息
- 显示上传进度
- 支持失败重试
- 上传成功生成视频记录
- 自动进入分析状态

### 验收

- 完整流程无需开发者手动改数据
- 上传失败不丢失已填写信息
- 页面退出前有必要提示
- 上传成功可立即在列表中看到

---

## 阶段 6：视频管理与状态轮询

### 任务

- 视频列表查询
- 状态筛选
- 视频详情
- 分析任务轮询
- 分析完成自动刷新结果
- 失败任务重试

### 验收

- 状态变化无需刷新整个 App
- 轮询可正确停止
- 失败任务可以恢复
- 空、错、加载状态完整

---

## 阶段 7：分析结果与统计

### 任务

- 核心指标卡
- 落点分布
- 球速趋势
- 回合统计
- 能力画像
- 指标说明
- 数据缺失保护

### 验收

- Demo 数据完整展示
- 缺少某一项数据时页面仍能工作
- 图表有标题、单位和空状态
- 普通用户能理解主要结论

---

## 阶段 8：Web 看板

### 任务

- 总览统计
- 视频数据表
- 多条件筛选
- 视频详情
- CV 原始 JSON
- 任务日志
- 失败重试
- 开发数据控制

### 验收

- 团队可用 Web 定位一条视频问题
- 可区分上传失败与分析失败
- 可查看 CV 输出和结构化结果
- 可完成演示

---

## 阶段 9：接真实后端或 Supabase

### 任务

- 新增真实 API 实现
- 不改变页面调用方式
- Adapter 转换后端字段
- 接入真实认证
- 接入视频存储
- 接入数据库
- 保留 Mock 模式

### 验收

- 修改环境变量即可切换 Mock / Real
- 页面不需要大改
- 真实和 Mock 数据结构一致
- 前端无管理员密钥

---

## 阶段 10：测试、演示和文档

### 任务

- 核心单元测试
- 登录流程测试
- 上传流程测试
- 分析状态测试
- Web 筛选测试
- 真机测试
- Demo 演示脚本
- 常见问题文档

### 验收

- 核心流程人工走通
- lint 和 typecheck 通过
- 测试通过
- 无未处理红屏或白屏
- 新电脑能按 README 启动

---

## 17. 优先级

## P0：必须完成

- App 登录
- App 上传
- App 视频列表
- App 分析状态
- App 分析结果
- Web 视频列表
- Web 视频详情
- Web CV 数据
- Mock 完整闭环
- 统一数据类型
- 基本错误处理

## P1：建议完成

- App 累计统计
- Web 总览
- 失败重试
- 任务日志
- Demo 数据控制
- 真机测试
- 基础自动化测试

## P2：后续完成

- 手机验证码
- 相机拍摄
- 推送通知
- 视频分片上传
- 深色模式
- 多角色权限
- 分享分析报告
- 更丰富图表
- 算法版本对比

---

## 18. 测试清单

## 18.1 登录

- 邮箱为空
- 邮箱格式错误
- 密码为空
- 未勾选协议
- 错误账号
- 网络失败
- 重复点击
- 登录成功
- 退出登录
- 重启恢复登录

## 18.2 上传

- 未授权相册权限
- 选择非视频
- 文件过大
- 视频过长
- 上传中取消
- 上传失败
- 上传重试
- 上传成功
- 上传成功后列表更新

## 18.3 分析

- 等待状态
- 处理中
- 各阶段进度
- 分析成功
- 分析失败
- 重试成功
- 页面离开停止轮询
- 返回页面恢复查询

## 18.4 结果

- 完整数据
- 部分字段缺失
- 空 shots
- 空 rallies
- 低置信度
- 算法版本变化
- 图表数据异常

## 18.5 Web

- 未登录访问
- 筛选
- 搜索
- 分页
- 视频详情
- 原始 JSON
- 失败任务
- 重试
- 表格空状态

---

## 19. Git 开发流程

### 分支

```text
main
dev
feature/mobile-login
feature/mobile-upload
feature/mobile-video-list
feature/mobile-analysis-result
feature/web-video-dashboard
fix/analysis-polling
```

### 提交示例

```text
feat: 初始化 Expo 移动端项目
feat: 添加 Demo 登录流程
feat: 添加视频选择与上传进度
feat: 添加分析任务状态轮询
feat: 添加 Web 视频管理页面
fix: 修复页面离开后仍持续轮询
docs: 更新视频数据模型
```

### 每次 Codex 修改后检查

```bash
git status
git diff
pnpm lint
pnpm typecheck
pnpm test
```

### 禁止 Codex 默认执行

- 自动提交
- 自动 push
- 自动合并
- 大规模重构
- 删除未知文件
- 修改无关功能
- 引入大量依赖
- 改动项目技术栈

---

## 20. 产品演示脚本

1. 打开 App。
2. 使用 Demo 账号登录。
3. 首页显示空状态和上传引导。
4. 从相册选择一段网球视频。
5. 填写训练类型和备注。
6. 点击上传并展示上传进度。
7. 上传完成后进入详情页。
8. 页面依次显示球场识别、球员识别、网球追踪等状态。
9. 分析完成后展示击球数、回合数、球速、落点和能力画像。
10. 打开 Web 看板。
11. 查看刚上传的视频。
12. 查看分析任务日志。
13. 查看 CV 原始输出 JSON。
14. 查看统计图表。
15. 演示一个失败任务和重试流程。

---

## 21. 完成定义 Definition of Done

一个功能只有同时满足以下条件才算完成：

- 符合需求
- 项目可启动
- TypeScript 无错误
- lint 通过
- 核心流程可操作
- 有加载状态
- 有空状态
- 有错误状态
- 没有改无关文件
- 没有提交密钥
- 有必要文档
- 人工测试通过
- Git diff 可理解

---

## 22. 给初学者的学习顺序

1. React 组件、Props、State
2. TypeScript 基础类型
3. React Hooks
4. React Router 基础
5. React Native 常用组件
6. Expo Router
7. 表单与校验
8. Promise、async/await、HTTP 请求
9. TanStack Query
10. 文件选择和上传
11. 状态轮询
12. 图表和数据展示
13. 测试
14. 真机构建

不需要先完整学完 React Native 再开始项目。应通过小任务边做边学。

---

## 23. 最终交付物

```text
1. 可运行的 Expo App
2. 可运行的 Web 数据看板
3. Mock 完整数据闭环
4. 可切换真实 API 的服务层
5. 共享 TypeScript 数据模型
6. 登录、上传、列表、状态、结果页面
7. CV 原始输出查看页
8. 统计页面
9. README
10. API 契约
11. 数据模型文档
12. 演示脚本
13. 测试清单
14. .env.example
```

---

## 24. 推荐实施结论

对当前能力最合适的方案不是一次性做“完整 App”，而是：

```text
先做页面和路由
→ 再做 Mock 服务
→ 跑通登录和上传
→ 跑通分析状态
→ 展示分析结果
→ 完成 Web 看板
→ 最后替换为真实后端
```

这条路线可以确保每一步都有可见成果，且即使后端和 CV 尚未完成，也能独立演示完整产品流程。
