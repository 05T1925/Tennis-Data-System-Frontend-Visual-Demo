import type { DataTier, MetricRecord } from '../domain/types';
const safe = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
export const formatDurationMs = (value: number | null | undefined): string => {
  const ms = safe(value);
  if (ms === null || ms < 0) return '—';
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};
export const formatPercentage = (value: number | null | undefined): string => {
  const safeValue = safe(value);
  return safeValue === null || safeValue < 0 || safeValue > 1
    ? '—'
    : `${(safeValue * 100).toFixed(1)}%`;
};
export const formatSpeedMps = (value: number | null | undefined): string => {
  const safeValue = safe(value);
  return safeValue === null || safeValue < 0 ? '—' : `${safeValue.toFixed(1)} m/s`;
};
export const formatSpeedKmh = (value: number | null | undefined): string => {
  const safeValue = safe(value);
  return safeValue === null || safeValue < 0 ? '—' : `${(safeValue * 3.6).toFixed(1)} km/h`;
};
export const formatDistanceM = (value: number | null | undefined): string => {
  const safeValue = safe(value);
  return safeValue === null || safeValue < 0 ? '—' : `${safeValue.toFixed(1)} m`;
};
export const formatConfidence = (value: number | null | undefined): string =>
  formatPercentage(value);
export const formatDataTier = (tier: DataTier): string =>
  ({ P0: 'P0 直接统计', P1: 'P1 规则推断', P2: 'P2 模型分析' })[tier];
export const formatSampleSize = (value: number | null | undefined): string => {
  const safeValue = safe(value);
  return safeValue === null || safeValue < 0 || !Number.isInteger(safeValue)
    ? '—'
    : `${safeValue} 个样本`;
};
export const formatMetricValue = (metric: MetricRecord | null): string => {
  if (!metric || metric.metricValue === null) return '—';
  if (metric.metricUnit === 'rate') return formatPercentage(metric.metricValue);
  if (metric.metricUnit === 'ms') return formatDurationMs(metric.metricValue);
  if (metric.metricUnit === 'm/s') return formatSpeedMps(metric.metricValue);
  if (metric.metricUnit === 'm') return formatDistanceM(metric.metricValue);
  return Number.isFinite(metric.metricValue) ? String(metric.metricValue) : '—';
};
