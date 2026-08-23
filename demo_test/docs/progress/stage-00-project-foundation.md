# 阶段 0：项目文档基线与开发约束

## 1. 阶段信息

- 阶段编号：0-B
- 当前分支：`docs/stage-00-project-foundation`
- 阶段目标：建立仓库级文档基线，使新成员和 AI 能理解项目、真实进度、产品边界、计划技术方案、术语、数据模型与 API 草案。
- 用户场景：新成员进入仓库时，能够不依赖源码理解 v0.1 的产品闭环与下一步工作边界。

## 2. 本阶段不包含的内容

- App、Web Dashboard、Backend、CV 或 Data Processing 代码：无。
- 前端脚手架、TypeScript、Mock Service、API 实现：无。
- 依赖安装、`package.json`、环境变量、构建配置、测试框架：无。
- Git 暂存、提交、推送、合并或历史修改：无。

## 3. 修改前仓库状态

- Git 已初始化，原始分支为 `main`，仓库无提交。
- 当前工作分支为 `docs/stage-00-project-foundation`。
- 存在 3 个未跟踪 Word 原始文档：`数据系统阶段目标.docx`、`团队开发规范.docx`、`AI coding原则.docx`。
- 没有 App、Web、Backend、CV、数据处理代码、依赖、锁文件或可运行命令。

## 4. 阶段 0-A 探索结论

- 当前仓库是文档起点，不是已有前端脚手架。
- 三份 Word 文档可保留为原始需求与规范材料，但缺少可持续维护的仓库 Markdown 文档。
- “新成员能通过 README 启动项目”不能在阶段 0 如实满足；阶段 0 的验收应是理解项目和文档入口，阶段 1 才负责真实启动命令。

## 5. 实际完成内容

- 新建 README、AI 协作规则、需求、架构、数据模型、API 草案、术语、项目状态与本阶段记录。
- 明确 App 面向普通用户，Web Dashboard 仅面向内部团队。
- 统一 `uploadStatus`、`analysisStatus`、`analysisTask`、`cvOutput`、`analysisResult`、`shot`、`rally`、`point` 等术语。
- 明确所有 API 和数据字段为 Draft，计划技术栈尚未初始化。

## 6. 未完成内容

无代码实现。App、Web Dashboard、Backend、CV、Data Processing、Mock Service 与 Real API 均尚未创建。

## 7. 文件变更

### 新增文件

| 文件 | 作用 |
| --- | --- |
| `README.md` | 仓库入口、当前真实状态和文档导航。 |
| `AGENTS.md` | 长期 AI 协作、范围、分层、验证和安全约束。 |
| `docs/PRODUCT_REQUIREMENTS.md` | v0.1 产品范围、需求、非目标与验收草案。 |
| `docs/ARCHITECTURE.md` | 当前真实架构与计划架构边界。 |
| `docs/DATA_MODEL.md` | 核心实体、关系、状态机和 JSON 草案。 |
| `docs/API_CONTRACT.md` | 前端视角 Draft 接口约定。 |
| `docs/GLOSSARY.md` | 中文、英文与代码命名统一。 |
| `docs/PROJECT_STATUS.md` | 当前真实状态和阶段 1 前置条件。 |
| `docs/progress/stage-00-project-foundation.md` | 阶段 0-B 变更与验证记录。 |

### 修改文件

无。

### 删除文件

无。

## 8. 核心决定

### 术语决定

- `Shot` 是一次击球；`Rally` 是从发球开始的连续击球过程；`Point` 是比赛计分单位。一个 Rally 包含多个 Shot，一个 Point 通常包含一个 Rally。
- 上传和分析分别使用 `uploadStatus`、`analysisStatus`，不得合并为泛用 `status`。

### 技术方案决定

- 计划采用 Expo/React Native 构建 App，React/Vite 构建 Web Dashboard。
- 计划使用 pnpm workspace 和共享核心 TypeScript 类型。
- 计划先以 Mock Service 验证前端，再通过相同 Service 接口接入 Real API。
- Supabase 仅为候选过渡方案，未决定采用。

### 数据模型决定

- 所有 ID 使用 string，时间使用 ISO 8601 string，前端字段使用 camelCase。
- API DTO 与 Domain Model 分离，后端 snake_case 计划由 Adapter 转换。
- `AnalysisResult` 必须携带数据或算法版本；CV Output 不与业务结果混用。

### API 草案决定

- API Contract 标记为 Draft，仅定义前端协作预期。
- 上传方式不锁死；直传、后端中转、分片和预签名 URL 均待确认。

## 9. 与原计划不同的地方及原因

无。

## 10. 非文档变更

- 新增依赖：无。
- 环境变量变化：无。
- 路由变化：无。
- 页面变化：无。
- Mock 变化：无。

## 11. 执行命令与真实结果

| 命令 | 真实结果 |
| --- | --- |
| `git status --short` | 发现 3 个原有未跟踪 Word 文档；未覆盖或暂存。 |
| `git branch --show-current` | 输出 `docs/stage-00-project-foundation`，符合本阶段分支要求。 |
| `Get-ChildItem -Force` | 确认开始前仅有 `.git` 与 3 个 Word 文档。 |
| `Get-Date -Format 'yyyy-MM-dd'` | 输出 `2026-07-13`，用于文档状态日期。 |
| `git diff --stat` | 无输出；新增文件均未跟踪，属于预期。 |
| `git diff` | 无输出；新增文件均未跟踪，属于预期。 |
| `git diff --check` | 无输出，未发现已跟踪差异中的空白错误。 |
| Markdown 文件与链接校验脚本 | 9 份文档均非空且含标题；相对链接无断链。首次脚本对根目录相对路径基准处理不正确，已修正后复验通过。 |
| 术语与敏感信息校验脚本 | `ShotRecord`、`RallyRecord`、`PointRecord`、`uploadStatus`、`analysisStatus` 均存在；敏感赋值模式匹配为 0。 |
| 配置文件存在性校验 | `package.json`、锁文件、TypeScript、Vite、Expo、`.env` 与 `.gitignore` 均未创建。 |

## 12. 人工验证步骤

1. 查看 README，确认没有虚构安装、启动或验证命令。
2. 打开术语表与数据模型，确认 Shot、Rally、Point 边界一致。
3. 对照 API 草案与数据模型，确认接口均为 Draft 且术语一致。
4. 使用 Git 状态确认只新增允许范围内的 Markdown 文件，Word 原始文件未修改。

## 13. 已知问题与潜在风险

### 高风险

- 后端、上传与 CV 数据契约尚未确认；阶段 1 不应将 Draft 字段当作正式契约。

### 中风险

- App 与 Web Dashboard 的目录和共享类型边界尚未决定，初始化前需要确认。

### 低风险

- Word 原始材料与 Markdown 基线可能有重复；后续应以仓库 Markdown 作为执行基线，并保留 Word 原件。

## 14. 对后续阶段的影响

阶段 1 的实现必须遵循本阶段的术语、状态分离、分层和 Mock/Real Service 接口一致性规则；如有重大变更，必须先更新相关文档。

## 15. 阶段 1 前置条件

- 确认 App 与 Web Dashboard 的初始化范围、目录和包管理方式。
- 确认第一批页面或最小可验证链路。
- 明确允许创建的脚手架、配置、依赖和验证命令。

## 16. 建议下一阶段任务

在明确目录结构后，初始化前端工程并建立最小页面骨架、Mock Service 接口与真实验证命令。
