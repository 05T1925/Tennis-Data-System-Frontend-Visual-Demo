import type { WebDemoScenarioKind } from '../demo-data';

export const webDemoControlMutationKeys = {
  all: ['web-demo-control'] as const,
  reset: (actorUserId: string) =>
    [...webDemoControlMutationKeys.all, 'reset', actorUserId] as const,
  create: (actorUserId: string, kind: WebDemoScenarioKind) =>
    [...webDemoControlMutationKeys.all, 'create', actorUserId, kind] as const,
  forceComplete: (actorUserId: string, videoId: string) =>
    [...webDemoControlMutationKeys.all, 'force-complete', actorUserId, videoId] as const,
};
