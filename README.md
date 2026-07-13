# 网球视频分析系统 v0.1

这是一个用于演示网球视频分析闭环的前端 Demo 项目。v0.1 的重点是建立可运行、可演示、可验证并能继续迭代的原型，而不是直接交付可上架的正式产品。

## 当前真实状态

> 当前处于阶段 0：项目文档与开发约束建设。
>
> App、Web、Backend 和 CV 尚未初始化。
>
> 当前不存在安装、启动、测试、lint 或 typecheck 命令。

## 核心业务链路

```text
上传视频
→ 创建分析任务
→ CV 生成原始输出
→ 数据处理生成结构化数据
→ App 展示结果
```

## 产品组成

| 模块 | 面向对象 | 计划职责 |
| --- | --- | --- |
| App | 普通网球用户 | 身份、视频上传、视频列表、分析状态、分析结果和统计展示。 |
| Web Dashboard | 团队内部 | 查看视频、任务、CV 输出、结构化结果、统计与失败原因，辅助调试和演示。 |
| Backend | 系统服务 | 用户、视频、任务、接口与权限管理。 |
| CV Module | 系统服务 | 输出球场、球员、网球与轨迹等原始识别数据。 |
| Data Processing | 系统服务 | 提取 Shot、Rally、Point 与统计数据。 |

## v0.1 范围

App 需要具备基本产品形态；Web Dashboard 仅服务内部开发、调试和演示。完整范围、非目标和验收标准见 [产品需求](docs/PRODUCT_REQUIREMENTS.md)。

## 计划技术栈

以下为**计划采用，尚未初始化**的方案：

| 端 | 计划技术栈 |
| --- | --- |
| App | Expo、React Native、Expo Router、TypeScript、TanStack Query、Zustand、React Hook Form、Zod |
| Web Dashboard | React、Vite、TypeScript、React Router、Ant Design、TanStack Query、Zustand、React Hook Form、Zod、Recharts |
| 工程 | pnpm workspace、共享核心 TypeScript 类型、先 Mock Service 后 Real API；Supabase 仅为候选过渡方案。 |

## 当前仓库结构

```text
.
├── AI coding原则.docx
├── 数据系统阶段目标.docx
├── 团队开发规范.docx
├── README.md
├── AGENTS.md
└── docs/
    └── progress/
```

## 计划结构

阶段 1 才会根据已确认方案初始化 App、Web Dashboard 与共享类型目录；这些目录当前不存在。

## 安装和启动

当前尚未创建 App 和 Web 脚手架，因此没有可执行的安装和启动命令。阶段 1 将负责项目初始化。

## 文档导航

- [AI 协作规则](AGENTS.md)
- [产品需求](docs/PRODUCT_REQUIREMENTS.md)
- [架构说明](docs/ARCHITECTURE.md)
- [数据模型](docs/DATA_MODEL.md)
- [API 草案](docs/API_CONTRACT.md)
- [术语表](docs/GLOSSARY.md)
- [项目状态](docs/PROJECT_STATUS.md)
- [阶段 0 记录](docs/progress/stage-00-project-foundation.md)

## 开发流程

```text
需求
→ SPEC
→ 只读探索
→ PLAN
→ 实现
→ 自动验证
→ 人工验证
→ 只读审查
→ 人工决定是否提交
```

## 安全提醒

不得提交 `.env`、密钥、密码、Token、大视频、模型权重、数据集或构建产物。
