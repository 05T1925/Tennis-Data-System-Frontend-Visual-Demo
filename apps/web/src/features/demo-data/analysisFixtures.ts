import type { AnalysisResult, AnalysisTask, Video } from '@tennis/shared-types';

import type { WebAnalysisTaskLogEntry, WebCvDemoOutput, WebCvDemoPayload } from './types';
import { getSafeAnalysisFailureMessage } from './safety';
import { WEB_CV_DEMO_DISCLAIMER, WEB_CV_DEMO_SCHEMA } from './types';

type AssetOptions = {
  attempt?: number;
  partial?: boolean;
  large?: boolean;
  createdAt?: string;
};

export function createWebAnalysisAssets(
  video: Video,
  task: AnalysisTask,
  options: AssetOptions = {},
): { result: AnalysisResult; cv: WebCvDemoOutput } {
  const attempt = options.attempt ?? task.retryCount;
  const prefix = `${task.id}-attempt-${attempt}`;
  const createdAt = options.createdAt ?? task.completedAt ?? task.updatedAt;
  const rallyId = `${prefix}-rally-1`;
  const pointId = `${prefix}-point-1`;
  const shots = [0, 1, 2].map((shotIndex) => ({
    id: `${prefix}-shot-${shotIndex + 1}`,
    videoId: video.id,
    rallyId,
    shotIndex,
    playerId: shotIndex % 2 === 0 ? 'demo-player-near' : 'demo-player-far',
    startedAtMs: 1_000 + shotIndex * 1_250,
    endedAtMs: 1_520 + shotIndex * 1_250,
    startPoint: { x: 0.18 + shotIndex * 0.08, y: 0.82 - shotIndex * 0.12, confidence: 0.91 },
    endPoint: { x: 0.74 - shotIndex * 0.07, y: 0.28 + shotIndex * 0.11, confidence: 0.89 },
    bouncePoint: shotIndex === 1 ? undefined : { x: 0.62, y: 0.35, confidence: 0.86 },
    speedKmh: options.partial && shotIndex === 2 ? undefined : 88 + shotIndex * 7,
    shotType:
      shotIndex === 0
        ? ('serve' as const)
        : shotIndex === 1
          ? ('forehand' as const)
          : ('backhand' as const),
    tacticalType: shotIndex === 2 ? ('defense' as const) : ('attack' as const),
    confidence: options.partial && shotIndex === 2 ? undefined : 0.9 - shotIndex * 0.03,
  }));
  const points = options.partial
    ? undefined
    : [
        {
          id: pointId,
          videoId: video.id,
          rallyId,
          pointIndex: 0,
          startedAtMs: 900,
          endedAtMs: 4_100,
          winnerPlayerId: 'demo-player-near',
          scoringResult: '15-0',
          confidence: 0.88,
        },
      ];
  const rallies = [
    {
      id: rallyId,
      videoId: video.id,
      pointId: points?.[0].id,
      rallyIndex: 0,
      startedAtMs: 900,
      endedAtMs: 4_100,
      shotIds: shots.map(({ id }) => id),
      shotCount: shots.length,
      winnerPlayerId: 'demo-player-near',
      result: 'winner' as const,
      confidence: options.partial ? undefined : 0.89,
    },
  ];
  const result: AnalysisResult = {
    id: `${prefix}-result`,
    videoId: video.id,
    version: 'web-demo-result-v1',
    summary: {
      durationSeconds: video.durationSeconds ?? 0,
      totalShots: shots.length,
      totalRallies: rallies.length,
      totalPoints: points?.length,
      averageShotsPerRally: shots.length / rallies.length,
      longestRallyShots: shots.length,
      averageBallSpeedKmh: options.partial ? undefined : 95,
      maxBallSpeedKmh: 102,
      playerDistanceMeters: options.partial ? undefined : 86.4,
      unforcedErrors: options.partial ? undefined : 1,
    },
    playerProfile: options.partial
      ? undefined
      : { consistency: 72, attack: 78, defense: 66, movement: 74 },
    shots,
    rallies,
    points,
    heatmapPoints: [
      { x: 0.24, y: 0.78, confidence: 0.9 },
      { x: 0.68, y: 0.32, confidence: 0.87 },
    ],
    createdAt,
  };

  const sampleCount = options.large ? 180 : 12;
  const ballTrack = Array.from({ length: sampleCount }, (_, frameIndex) => ({
    frameIndex,
    timestampMs: frameIndex * 40,
    x: Number((0.12 + (frameIndex % 20) * 0.038).toFixed(3)),
    y: Number((0.82 - (frameIndex % 15) * 0.043).toFixed(3)),
    visible: frameIndex % 11 !== 0,
    confidence: Number((0.74 + (frameIndex % 10) * 0.02).toFixed(2)),
  }));
  const payload: WebCvDemoPayload = {
    disclaimer: WEB_CV_DEMO_DISCLAIMER,
    generatedAt: createdAt,
    frameCount: options.large ? 3_600 : 300,
    courtKeypoints: options.partial
      ? undefined
      : [
          { id: 'near-left', label: 'Near baseline left', x: 0.08, y: 0.92, confidence: 0.94 },
          { id: 'near-right', label: 'Near baseline right', x: 0.92, y: 0.92, confidence: 0.95 },
          { id: 'far-left', label: 'Far baseline left', x: 0.18, y: 0.08, confidence: 0.92 },
          { id: 'far-right', label: 'Far baseline right', x: 0.82, y: 0.08, confidence: 0.93 },
        ],
    playerTracks: options.partial
      ? undefined
      : ['demo-player-near', 'demo-player-far'].map((playerId, playerIndex) => ({
          playerId,
          samples: Array.from({ length: options.large ? 80 : 8 }, (_, frameIndex) => ({
            frameIndex: frameIndex * 5,
            timestampMs: frameIndex * 200,
            x: Number((0.28 + playerIndex * 0.35 + (frameIndex % 4) * 0.02).toFixed(3)),
            y: Number((0.76 - playerIndex * 0.52 - (frameIndex % 3) * 0.015).toFixed(3)),
            confidence: 0.9,
          })),
        })),
    ballTrack,
    frameConfidences: Array.from({ length: options.large ? 120 : 10 }, (_, frameIndex) => ({
      frameIndex: frameIndex * 3,
      court: 0.94,
      players: 0.9,
      ball: Number((0.76 + (frameIndex % 8) * 0.02).toFixed(2)),
      overall: 0.88,
    })),
    metadata: {
      coordinateSpace: 'normalized-demo-0-to-1',
      source: 'deterministic-web-fixture',
      attempt,
    },
  };
  const cv: WebCvDemoOutput = {
    id: `${prefix}-cv`,
    taskId: task.id,
    demoSchema: WEB_CV_DEMO_SCHEMA,
    output: {
      id: `${prefix}-cv-output`,
      videoId: video.id,
      version: 'web-cv-demo-payload-v1',
      payload,
      createdAt,
    },
  };
  return { result, cv };
}

export function createInitialTaskLogs(task: AnalysisTask): WebAnalysisTaskLogEntry[] {
  const logs: WebAnalysisTaskLogEntry[] = [
    {
      id: `${task.id}-initial-user`,
      taskId: task.id,
      timestamp: task.createdAt,
      level: 'info',
      audience: 'user',
      userMessage: '分析任务已创建。',
      stage: 'queued',
    },
  ];
  if (task.status === 'failed') {
    logs.push(
      {
        id: `${task.id}-failed-user`,
        taskId: task.id,
        timestamp: task.completedAt ?? task.updatedAt,
        level: 'error',
        audience: 'user',
        userMessage: getSafeAnalysisFailureMessage(task.errorMessage),
        stage: task.stage,
      },
      {
        id: `${task.id}-failed-developer`,
        taskId: task.id,
        timestamp: task.completedAt ?? task.updatedAt,
        level: 'warning',
        audience: 'developer',
        developerMessage: `Demo task stopped with code ${task.errorCode ?? 'UNKNOWN'}.`,
        stage: task.stage,
      },
    );
  } else if (task.status === 'succeeded') {
    logs.push({
      id: `${task.id}-completed-user`,
      taskId: task.id,
      timestamp: task.completedAt ?? task.updatedAt,
      level: 'info',
      audience: 'user',
      userMessage: '分析任务已完成，Demo 结果可以查看。',
      stage: 'completed',
    });
  }
  return logs;
}
