import type { AnalysisStatus } from '@tennis/shared-types';

export interface LatestAnalysisSummary {
  videoId: string;
  videoTitle: string;
  analyzedAt: string | null;
  analysisStatus: AnalysisStatus;
  totalShots: number;
  totalRallies: number;
}

export interface HomeOverview {
  totalVideos: number;
  totalShots: number;
  totalRallies: number;
  totalTrainingDurationMs: number;
  latestAnalysis: LatestAnalysisSummary | null;
}
