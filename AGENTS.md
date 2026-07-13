# AI 协作规则

## 项目目标与当前阶段

本项目是网球视频分析系统 v0.1 的前端 Demo。当前处于阶段 0-B：文档基线与开发约束已建立；App、Web Dashboard、Backend、CV 与数据处理代码均尚未创建。

v0.1 的目标是跑通“身份、上传视频、创建分析任务、生成数据、展示结果”的原型闭环。它不追求正式发布能力或高精度算法。

## 产品边界

- App 面向普通网球用户，负责身份、上传、视频列表、分析状态、结果和统计展示。
- Web Dashboard 面向内部团队，负责调试、查看任务、CV 输出、结构化结果、统计和失败原因。
- Backend、CV Module 与 Data Processing 是计划中的服务端模块，不属于当前前端实现。

## 计划技术栈

计划采用 Expo、React Native、Expo Router 与 TypeScript 构建 App；采用 React、Vite、React Router、Ant Design 与 TypeScript 构建 Web Dashboard。服务端数据计划使用 TanStack Query，轻量客户端状态计划使用 Zustand，表单计划使用 React Hook Form 与 Zod。以上均尚未初始化。

## 工作方式

- 一个任务一个会话，一个任务一个分支。
- 中大型任务必须先进行有范围的只读探索，再给出计划并实现。
- 每个任务必须明确允许读取、允许修改和禁止修改的范围。
- 禁止无范围自由搜索、自由改动或大规模重构。
- 每次完成后如实记录验证结果、已知问题和未验证项。

## 代码职责边界

- 页面负责展示与交互编排，不承载复杂业务规则。
- Service 负责接口调用；Mock Service 与 Real Service 必须实现相同接口。
- Adapter 负责 API DTO 与前端 Domain Model 的转换，尤其处理 snake_case 到 camelCase。
- 复杂业务逻辑放在独立的领域逻辑、hooks 或 utilities 中。
- 可复用组件不得绑定单一业务页面。

## 数据与状态命名

- 字段使用英文 camelCase；所有 ID 使用 `string`；时间使用 ISO 8601 string。
- 使用 `uploadStatus` 表示上传生命周期，使用 `analysisStatus` 表示分析生命周期，二者不得混用。
- 使用 `analysisTask`、`cvOutput`、`analysisResult`、`shot`、`rally`、`point` 等统一术语，详情见 [术语表](docs/GLOSSARY.md)。

## 文档与阶段记录

- 需求、接口、数据模型或架构决策变化时，同步更新对应 Markdown 文档。
- 每个阶段结束时更新 [项目状态](docs/PROJECT_STATUS.md) 与对应 `docs/progress/` 阶段记录。
- 计划、Mock、已实现和已验证必须明确区分，禁止将计划写成完成。

## Git 与安全

- 不直接在 `main` 开发；不覆盖、删除或还原不属于当前任务的修改。
- 提交前由人工决定；AI 不自动执行 `git add`、`git commit` 或 `git push`，除非用户明确要求。
- 不使用强制推送、`git reset --hard`、`git clean -fd` 等危险命令。
- 不读取或输出 `.env`、密钥、Token、密码、用户隐私、大视频、模型权重或数据集。

## 验证

当前尚无可运行验证命令。阶段 1 初始化项目后必须更新本文件，补充真实的安装、启动、lint、typecheck 和测试命令。

禁止通过关闭类型检查、lint 或测试来掩盖错误。
