# Mobile Upload 模块

本模块完成相册视频选择到阶段 6 Mock 上传的页面闭环。上传页只组合权限、选择、表单、workflow
和导航；所有视频记录、上传状态、持久化及 AnalysisTask 自动创建继续由既有 VideoService 和统一
DemoDataRepository 负责。

## 选择、权限与元数据

`useVideoPicker` 只在用户点击时打开系统相册，Native 覆盖 granted、limited、denied、canAskAgain
和系统设置分支；Web 保持直接用户手势。Picker 固定为 videos、单选、不可编辑且不请求 base64。
Android mount 后只读取一次 pending result，不自动打开 Picker，取消选择不会清空已有草稿。

Asset Adapter 只接受 `video/mp4` 和 `video/quicktime`。文件名优先使用 Picker 字段，再从 URI 安全
提取，最后回退“未命名视频”。大小优先使用 Picker/Web File，再用 Expo FileSystem `File.size`
读取元数据；不读取完整文件。大小必须为正整数且不超过 `500 * 1024 * 1024` bytes。Picker 时长从
毫秒除以 1000 转为 seconds；缺失允许继续，存在时必须有限且非负。本阶段不设置时长上限。

本地 URI 只存在于页面内存的 `SelectedVideoAsset`。它不会进入 CreateVideoInput、Repository、
AsyncStorage、storagePath、playbackUrl、日志或错误文案。

## 表单与上传 workflow

表单使用 React Hook Form、Zod 和 zodResolver，字段为 title、matchType、playMode、courtType 和
note。标题首次从文件名预填，用户修改后更换视频不覆盖；标题最多 80 字，备注最多 500 字且纯
空白转为 undefined。

`useVideoUploadWorkflow` 使用 create/start Mutation 和 video detail Query：create 成功保存 videoId
后启动上传；500ms Query 调用 `getVideoById` 读取阶段 6 的真实 Mock 进度，terminal 状态停止轮询。
失败重试只复用已有 videoId 调用 startUpload，不重新 create。Query 卸载透传 AbortSignal，Mutation
卸载也会请求取消；Repository 的持久化提交边界仍以阶段 6实现为准。

上传场景由公开配置 `EXPO_PUBLIC_UPLOAD_MOCK_SCENARIO=success|fail-once` 控制。fail-once 只让
新建 idle 视频首次 outcome 失败，持久化为 failed 后再次 start 必然成功；不使用随机数、文件名
暗号或内存 Set。

## 缓存、导航与离开

创建后失效视频列表、首页最近视频和首页统计；上传完成后再集中失效 detail、list、home recent、
home overview 和 analysis task。进度轮询不会刷新整个首页，也不会清空 QueryClient 或 Auth。

有草稿、已创建 Video、上传中或失败时，页面通过 Expo Router 对应入口的 `usePreventRemove` 提示
用户。离开不会取消已持久化上传，只停止页面轮询；强制关闭 App 后由阶段 6在下次查询时追赶。
成功使用 replace 进入现有 `/videos/[videoId]` 骨架，并绕过离开提示且只导航一次。

当前没有相机、麦克风、真实文件上传、对象存储、压缩、播放器、完整视频列表、详情业务、Real
API、Backend 或 CV。未来 Real Service 应保持页面依赖的 Service 接口，在传输边界增加 DTO 和
Adapter。
