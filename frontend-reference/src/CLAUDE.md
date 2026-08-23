# 前端 (React)

## 路由

- `/analyze/` - 首页 (home-page.jsx)
- `/analyze/login` - 登录页
- `/analyze/register` - 注册页
- `/analyze/profile` - 用户信息页
- `/analyze/analyze` - 视频分析详情页 (App.jsx)

## 核心页面: /analyze/analyze

App.jsx 是整个分析系统的核心页面，包含:
- VideoArea: 视频播放和叠加层
- RightPanel: 右侧计分板和统计信息
- Sidebar: 导航菜单
- OverallStats: 总览统计
- PointByPointStats: 逐分详细数据
- ScoreTimeline: 比分时间线

## API 调用

frontend/src/api/index.js - 所有后端 API 调用:
- `uploadAndAnalyze(file)` - 上传视频并分析
- `getAnalysisDetail(uploadId)` - 获取指定上传的分析结果
- `getAnalysisResult()` - 获取默认分析结果

## 认证

使用 React Context: `frontend/src/auth/auth-context.jsx`
