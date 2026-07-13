# 项目状态

最近更新时间：2026-07-13

## 当前阶段

阶段 0-B：建立项目文档基线与开发约束。

当前分支：`docs/stage-00-project-foundation`

## 仓库状态摘要

Git 已初始化。当前存在 3 个原始且未跟踪的 Word 文档；本阶段新增仓库 Markdown 文档。没有提交历史中的项目代码、配置或依赖文件。

## 已完成内容

- ✅ 已完成并验证：阶段 0-A 项目只读探索。
- ✅ 已完成并验证：阶段 0-B 文档基线，包括需求、架构、数据模型、API 草案、术语和协作约束。

## 模块状态

| 模块 | 状态 | 真实说明 |
| --- | --- | --- |
| App | ⏳ 尚未实现 | 代码尚未创建。 |
| Web Dashboard | ⏳ 尚未实现 | 代码尚未创建。 |
| Backend | ⏳ 尚未实现 | 代码尚未创建。 |
| CV Module | ⏳ 尚未实现 | 代码尚未创建。 |
| Data Processing | ⏳ 尚未实现 | 代码尚未创建。 |
| Mock Service | ⏳ 尚未实现 | 仅为阶段 1 计划。 |
| Real API | ⏳ 尚未实现 | 仅有 Draft 接口草案。 |

App、Web、Backend、CV 和数据处理代码均尚未创建。

## 技术方案状态

📋 已确定计划，尚未实现：App 计划采用 Expo/React Native；Web Dashboard 计划采用 React/Vite；计划使用 pnpm workspace、共享类型、TanStack Query、Zustand、React Hook Form 和 Zod。Supabase 为候选过渡方案，❓ 待确认。

## 当前可用命令

当前没有可运行命令。不存在安装、启动、测试、lint 或 typecheck 命令。

## 核心文档

- [README](../README.md)
- [AI 协作规则](../AGENTS.md)
- [产品需求](PRODUCT_REQUIREMENTS.md)
- [架构说明](ARCHITECTURE.md)
- [数据模型](DATA_MODEL.md)
- [API 草案](API_CONTRACT.md)
- [术语表](GLOSSARY.md)
- [阶段记录](progress/stage-00-project-foundation.md)

## 已知问题与待确认事项

- ❓ App 与 Web 的实际目录、共享包边界和初始化顺序未确定。
- ❓ 认证、视频上传、存储、任务轮询、API 权限和错误码未确认。
- ❓ CV 输出字段、算法版本、置信度与统计定义未确认。

## 下一阶段目标

阶段 1 应在确认目录结构和初始化范围后创建前端脚手架，并补充真实可运行命令与验证流程。
