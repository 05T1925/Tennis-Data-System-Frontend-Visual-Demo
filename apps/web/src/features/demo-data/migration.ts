import { createInitialTaskLogs, createWebAnalysisAssets } from './analysisFixtures';
import type { WebDemoDataSnapshot, WebDemoDataSnapshotV1 } from './types';
import { WEB_DEMO_DATA_VERSION } from './types';

export function migrateWebDemoDataV1(snapshot: WebDemoDataSnapshotV1): WebDemoDataSnapshot {
  const succeededAssets = snapshot.analysisTasks.flatMap((task) => {
    if (task.status !== 'succeeded') return [];
    const video = snapshot.videos.find(({ id }) => id === task.videoId);
    return video ? [createWebAnalysisAssets(video, task)] : [];
  });
  return {
    version: WEB_DEMO_DATA_VERSION,
    videos: snapshot.videos,
    analysisTasks: snapshot.analysisTasks,
    analysisResults: succeededAssets.map(({ result }) => result),
    cvDemoOutputs: succeededAssets.map(({ cv }) => cv),
    analysisLogs: snapshot.analysisTasks.flatMap(createInitialTaskLogs),
    analysisRuntimes: {},
  };
}
