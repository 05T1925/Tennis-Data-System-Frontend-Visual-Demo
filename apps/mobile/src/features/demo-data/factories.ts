import type { AnalysisResult, AnalysisTask, Video } from '@tennis/shared-types';

import type { Clock, DemoDataSnapshot, IdGenerator } from './types';
import { DEMO_DATA_VERSION, DEMO_USER_ID } from './types';

type VideoOverrides = Partial<Video> & Pick<Video, 'id'>;
type TaskOverrides = Partial<AnalysisTask> & Pick<AnalysisTask, 'id' | 'videoId'>;

export function createVideo(overrides: VideoOverrides): Video {
  return {
    userId: DEMO_USER_ID,
    title: '网球训练',
    originalFileName: 'tennis-training.mp4',
    mimeType: 'video/mp4',
    fileSizeBytes: 120_000_000,
    durationSeconds: 900,
    matchType: 'training',
    playMode: 'singles',
    courtType: 'hard',
    uploadStatus: 'uploaded',
    uploadProgress: 100,
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-07-10T08:05:00.000Z',
    ...overrides,
  };
}

export function createAnalysisTask(overrides: TaskOverrides): AnalysisTask {
  return {
    status: 'queued',
    stage: 'queued',
    progress: 0,
    retryCount: 0,
    createdAt: '2026-07-10T08:05:00.000Z',
    updatedAt: '2026-07-10T08:05:00.000Z',
    ...overrides,
  };
}

export function createAnalysisResult(options: {
  video: Video;
  createdAt: string;
  idGenerator: IdGenerator;
  resultId?: string;
}): AnalysisResult {
  const { video, createdAt, idGenerator } = options;
  const stablePrefix = options.resultId;
  const rallyId = stablePrefix ? `${stablePrefix}-rally-1` : idGenerator.next('rally');
  const pointId = stablePrefix ? `${stablePrefix}-point-1` : idGenerator.next('point');
  const shotIds = stablePrefix
    ? [1, 2, 3].map((index) => `${stablePrefix}-shot-${index}`)
    : [idGenerator.next('shot'), idGenerator.next('shot'), idGenerator.next('shot')];
  const shots = shotIds.map((id, shotIndex) => ({
    id,
    videoId: video.id,
    rallyId,
    shotIndex,
    startedAtMs: shotIndex * 1_200,
    endedAtMs: shotIndex * 1_200 + 500,
    startPoint: { x: 0.2 + shotIndex * 0.1, y: 0.8 - shotIndex * 0.1 },
    endPoint: { x: 0.7 - shotIndex * 0.1, y: 0.3 + shotIndex * 0.1 },
    speedKmh: 82 + shotIndex * 6,
    shotType: shotIndex === 0 ? ('serve' as const) : ('forehand' as const),
  }));

  return {
    id: options.resultId ?? idGenerator.next('result'),
    videoId: video.id,
    version: 'demo-result-v1',
    summary: {
      durationSeconds: video.durationSeconds ?? 0,
      totalShots: shots.length,
      totalRallies: 1,
      totalPoints: 1,
      averageShotsPerRally: shots.length,
      longestRallyShots: shots.length,
      averageBallSpeedKmh: 88,
      maxBallSpeedKmh: 94,
      playerDistanceMeters: 238,
      unforcedErrors: 1,
    },
    playerProfile: { consistency: 72, attack: 76, defense: 68, movement: 74 },
    shots,
    rallies: [
      {
        id: rallyId,
        videoId: video.id,
        pointId,
        rallyIndex: 0,
        startedAtMs: 0,
        endedAtMs: 3_000,
        shotIds,
        shotCount: shotIds.length,
        result: 'winner',
      },
    ],
    points: [
      {
        id: pointId,
        videoId: video.id,
        rallyId,
        pointIndex: 0,
        startedAtMs: 0,
        endedAtMs: 3_000,
        scoringResult: '15-0',
      },
    ],
    heatmapPoints: [
      { x: 0.35, y: 0.72 },
      { x: 0.62, y: 0.45 },
    ],
    createdAt,
  };
}

export function createDemoSeed(clock: Clock, idGenerator: IdGenerator): DemoDataSnapshot {
  const processingStartedAt = clock.now().toISOString();
  const succeededVideo = createVideo({ id: 'video-demo-succeeded', title: '周二上午底线训练' });
  const processingVideo = createVideo({
    id: 'video-demo-processing',
    title: '发球与接发球专项训练',
    createdAt: '2026-07-11T08:00:00.000Z',
    updatedAt: processingStartedAt,
  });
  const failedVideo = createVideo({
    id: 'video-demo-failed',
    title: '室内多球训练',
    createdAt: '2026-07-12T08:00:00.000Z',
  });
  const uploadFailedVideo = createVideo({
    id: 'video-demo-upload-failed',
    title: '待重试上传片段',
    uploadStatus: 'failed',
    uploadProgress: 58,
    durationSeconds: 180,
    createdAt: '2026-07-13T08:00:00.000Z',
  });
  const succeededTask = createAnalysisTask({
    id: 'task-demo-succeeded',
    videoId: succeededVideo.id,
    status: 'succeeded',
    stage: 'completed',
    progress: 100,
    startedAt: '2026-07-10T08:05:00.000Z',
    completedAt: '2026-07-10T08:12:00.000Z',
    updatedAt: '2026-07-10T08:12:00.000Z',
  });
  const processingTask = createAnalysisTask({
    id: 'task-demo-processing',
    videoId: processingVideo.id,
    createdAt: processingStartedAt,
    updatedAt: processingStartedAt,
  });
  const failedTask = createAnalysisTask({
    id: 'task-demo-failed',
    videoId: failedVideo.id,
    status: 'failed',
    stage: 'ball_tracking',
    progress: 45,
    errorCode: 'BALL_TRACKING_UNSTABLE',
    errorMessage: '网球轨迹不稳定，无法生成可靠结果',
    startedAt: '2026-07-12T08:05:00.000Z',
    completedAt: '2026-07-12T08:08:00.000Z',
    updatedAt: '2026-07-12T08:08:00.000Z',
  });

  return {
    version: DEMO_DATA_VERSION,
    videos: [succeededVideo, processingVideo, failedVideo, uploadFailedVideo],
    analysisTasks: [succeededTask, processingTask, failedTask],
    analysisResults: [
      createAnalysisResult({
        video: succeededVideo,
        createdAt: '2026-07-10T08:12:00.000Z',
        idGenerator,
        resultId: 'result-demo-succeeded',
      }),
    ],
    runtime: {
      uploads: {},
      analyses: {
        [processingTask.id]: {
          startedAt: processingStartedAt,
          stageDurationMs: 1_000,
          outcome: 'succeeded',
        },
      },
    },
  };
}
