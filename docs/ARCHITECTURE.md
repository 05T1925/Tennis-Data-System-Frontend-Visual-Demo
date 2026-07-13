# 架构说明

## 1. 当前真实架构

当前仓库只有文档，没有 App、Web Dashboard、Backend、CV Module、Data Processing、依赖配置或可运行命令。不存在当前前端目录或共享类型代码。

## 2. v0.1 计划架构

以下为计划架构，尚未实现：

```text
App / Web Dashboard
        ↓
Mock Service 或 Real Service
        ↓
Backend → CV Module → Data Processing
        ↓
CV Output / Analysis Result / Statistics
```

| 模块 | 计划职责 |
| --- | --- |
| App | 面向用户的上传、列表、状态、结果和统计体验。 |
| Web Dashboard | 内部调试、数据查看、任务排障和演示。 |
| Backend | 身份、视频、任务、权限、API 与存储协作。 |
| CV Module | 输出球场、球员、球、轨迹等原始识别数据。 |
| Data Processing | 生成 Shot、Rally、Point、Analysis Result 和 Statistics。 |

## 3. 计划数据流

### 3.1 视频上传

App 上传视频，前端展示 `uploadStatus` 和进度；Backend 保存元数据和文件位置。二进制上传方式尚未确定。

### 3.2 分析任务

上传完成后由 Backend 创建 `analysisTask`；任务依次调用 CV Module 和 Data Processing，并通过 `analysisStatus`、`analysisStage` 与失败信息反馈。

### 3.3 分析结果

CV Module 产生 `cvOutput`，Data Processing 将其转换为业务可用的 `analysisResult` 和 `statistics`。App 默认显示业务结果；Web Dashboard 可以查看两层数据。

## 4. Mock 与 Real API

- Mock 模式是阶段 1 的计划，用于在后端未完成时验证前端流程。
- Real API 模式是后续计划，使用相同 Service 接口替换 Mock 实现。
- Supabase 仅是后端未完成时的候选过渡方案，尚未决定采用。

## 5. 前端边界与分层原则

- App 与 Web Dashboard 可计划共享核心 TypeScript 类型，但不应强行共享页面和业务组件。
- 页面组织展示和交互；Service 处理请求；Adapter 转换 DTO；领域逻辑独立于页面。
- API DTO 与前端 Domain Model 分离。后端 snake_case 由 Adapter 转换为 camelCase。
- 服务端数据计划由 TanStack Query 管理，轻量客户端状态计划由 Zustand 管理；表单计划使用 React Hook Form 与 Zod。

## 6. 错误与安全边界

- 前端展示可理解的错误，Web Dashboard 可展示必要的调试上下文。
- 不向用户端暴露内部堆栈、密钥、Token 或隐私数据。
- 可选数据必须可安全缺失，尤其是低置信度 Point 信息。

## 7. 待确认架构事项

- App 与 Web 的实际仓库目录和共享包边界。
- 认证、对象存储、上传方式和任务轮询/推送策略。
- Backend、CV 与 Data Processing 的部署和版本契约。
- API 分页、权限和错误码的最终规则。
