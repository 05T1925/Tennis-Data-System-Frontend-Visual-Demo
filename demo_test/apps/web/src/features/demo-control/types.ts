import type { WebDemoDataSnapshot, WebDemoScenarioBundle, WebDemoScenarioKind } from '../demo-data';

export type WebDemoControlRequest = { actorUserId: string; signal?: AbortSignal };
export type WebCreateScenarioRequest = WebDemoControlRequest & { kind: WebDemoScenarioKind };
export type WebForceCompleteRequest = WebDemoControlRequest & { videoId: string };

export interface WebDemoControlService {
  resetDemoData(params: WebDemoControlRequest): Promise<WebDemoDataSnapshot>;
  createScenario(params: WebCreateScenarioRequest): Promise<WebDemoScenarioBundle>;
  forceComplete(params: WebForceCompleteRequest): Promise<WebDemoScenarioBundle>;
}
