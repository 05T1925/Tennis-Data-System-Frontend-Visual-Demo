export const GENERIC_ANALYSIS_FAILURE_MESSAGE = '分析任务未能完成，请稍后重试。';

const unsafeAnalysisFailurePatterns = [
  /technicalMessage/i,
  /\bstack\b/i,
  /\btoken\b/i,
  /https?:\/\//i,
  /(?:^|[\s("'`])(?:[a-z]:\\|\\\\)\S+/i,
  /(?:^|[\s("'`])(?:\/(?:app|home|tmp|usr|users|var)\/|\.{1,2}[\\/]|(?:dist|node_modules|src)[\\/])\S+/i,
  /\b[\w.-]+\.(?:[cm]?[jt]sx?|json|log|map|mp4|mov|avi)(?::\d+(?::\d+)?)?\b/i,
  /(?:^|\n)\s*at\s+(?:async\s+)?\S+/im,
  /\n.*(?:error|exception|\bat\s+\S+)/i,
] as const;

export function getSafeAnalysisFailureMessage(value: unknown): string {
  if (typeof value !== 'string') return GENERIC_ANALYSIS_FAILURE_MESSAGE;
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > 160 ||
    unsafeAnalysisFailurePatterns.some((pattern) => pattern.test(normalized))
  ) {
    return GENERIC_ANALYSIS_FAILURE_MESSAGE;
  }
  return normalized;
}
