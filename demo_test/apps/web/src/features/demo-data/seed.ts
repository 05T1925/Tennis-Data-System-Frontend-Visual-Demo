import type { AnalysisStage, AnalysisStatus, UploadStatus, Video } from '@tennis/shared-types';

import { createInitialTaskLogs, createWebAnalysisAssets } from './analysisFixtures';
import { webDemoDataSnapshotSchema } from './schemas';
import type { WebDemoDataSnapshot } from './types';
import { WEB_DEMO_DATA_VERSION } from './types';

type SeedSpec = {
  uploadStatus: UploadStatus;
  uploadProgress: number;
  task?: { status: AnalysisStatus; stage: AnalysisStage; progress: number };
};

const specs: readonly SeedSpec[] = [
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'succeeded', stage: 'completed', progress: 100 },
  },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'processing', stage: 'ball_tracking', progress: 45 },
  },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'queued', stage: 'queued', progress: 0 },
  },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'failed', stage: 'ball_tracking', progress: 45 },
  },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'canceled', stage: 'player_detection', progress: 25 },
  },
  { uploadStatus: 'uploaded', uploadProgress: 100 },
  { uploadStatus: 'idle', uploadProgress: 0 },
  { uploadStatus: 'uploading', uploadProgress: 38 },
  { uploadStatus: 'failed', uploadProgress: 61 },
  { uploadStatus: 'canceled', uploadProgress: 18 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'succeeded', stage: 'completed', progress: 100 },
  },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'processing', stage: 'statistics_generation', progress: 92 },
  },
  { uploadStatus: 'uploaded', uploadProgress: 100 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'failed', stage: 'trajectory_processing', progress: 65 },
  },
  { uploadStatus: 'uploading', uploadProgress: 72 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'queued', stage: 'queued', progress: 0 },
  },
  { uploadStatus: 'idle', uploadProgress: 0 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'canceled', stage: 'court_detection', progress: 10 },
  },
  { uploadStatus: 'failed', uploadProgress: 9 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'succeeded', stage: 'completed', progress: 100 },
  },
  { uploadStatus: 'canceled', uploadProgress: 44 },
  { uploadStatus: 'uploaded', uploadProgress: 100 },
  { uploadStatus: 'uploading', uploadProgress: 4 },
  {
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    task: { status: 'processing', stage: 'event_extraction', progress: 80 },
  },
];

const titles = [
  '周末底线稳定性训练',
  '发球与接发球专项',
  '双打网前配合',
  '室内多球训练',
  '比赛录像片段',
  '',
  '等待上传的训练记录',
  '正在上传的长视频',
  '上传失败片段',
  '用户取消的上传',
  '红土移动训练',
  '连续回合处理样例',
  '无任务的视频',
  '轨迹处理失败样例',
  '大文件上传中',
  '等待分析队列样例',
  '零大小元数据样例',
  '已取消分析任务',
  '网络中断上传失败',
  '草地比赛分析完成',
  '取消上传的比赛录像',
  '这是一个用于验证表格在窄屏下截断与 Tooltip 行为的非常长的视频标题示例',
  '刚刚开始上传',
  '事件提取处理中',
] as const;

export function createWebDemoSeed(): WebDemoDataSnapshot {
  const videos: Video[] = specs.map((spec, index) => {
    const number = index + 1;
    const day = String(number).padStart(2, '0');
    return {
      id: `video-web-demo-${day}`,
      userId: `demo-user-${(index % 4) + 1}`,
      title: titles[index],
      originalFileName: `tennis-session-${day}.mp4`,
      mimeType: number % 3 === 0 ? 'video/quicktime' : 'video/mp4',
      fileSizeBytes: number === 17 ? 0 : number * 8_750_000,
      durationSeconds: number === 6 ? 0 : number * 37,
      matchType: number % 3 === 0 ? 'match' : 'training',
      playMode: number % 4 === 0 ? 'doubles' : 'singles',
      courtType: (['hard', 'clay', 'grass', 'other'] as const)[index % 4],
      note: number % 5 === 0 ? undefined : `固定 Web Demo 记录 ${day}`,
      uploadStatus: spec.uploadStatus,
      uploadProgress: spec.uploadProgress,
      createdAt: `2026-06-${day}T${String(8 + (index % 8)).padStart(2, '0')}:00:00.000Z`,
      updatedAt: `2026-06-${day}T${String(9 + (index % 8)).padStart(2, '0')}:00:00.000Z`,
    };
  });

  const analysisTasks = specs.flatMap((spec, index) => {
    if (!spec.task) return [];
    const day = String(index + 1).padStart(2, '0');
    const isFailed = spec.task.status === 'failed';
    const isTerminal = ['succeeded', 'failed', 'canceled'].includes(spec.task.status);
    return [
      {
        id: `task-web-demo-${day}`,
        videoId: `video-web-demo-${day}`,
        ...spec.task,
        retryCount: isFailed ? 1 : 0,
        errorCode: isFailed ? 'DEMO_ANALYSIS_FAILED' : undefined,
        errorMessage: isFailed ? '演示分析任务未能完成。' : undefined,
        createdAt: `2026-06-${day}T10:00:00.000Z`,
        startedAt: spec.task.status === 'queued' ? undefined : `2026-06-${day}T10:01:00.000Z`,
        completedAt: isTerminal ? `2026-06-${day}T10:08:00.000Z` : undefined,
        updatedAt: `2026-06-${day}T10:08:00.000Z`,
      },
    ];
  });

  const succeededAssets = analysisTasks.flatMap((task) => {
    if (task.status !== 'succeeded') return [];
    const video = videos.find(({ id }) => id === task.videoId);
    if (!video) return [];
    return [
      createWebAnalysisAssets(video, task, {
        partial: video.id === 'video-web-demo-11',
        large: video.id === 'video-web-demo-20',
      }),
    ];
  });

  return webDemoDataSnapshotSchema.parse({
    version: WEB_DEMO_DATA_VERSION,
    videos,
    analysisTasks,
    analysisResults: succeededAssets.map(({ result }) => result),
    cvDemoOutputs: succeededAssets.map(({ cv }) => cv),
    analysisLogs: analysisTasks.flatMap(createInitialTaskLogs),
    analysisRuntimes: {},
  });
}
