import type {
  WebAnalysisStatusFilter,
  WebUploadStatusFilter,
  WebVideoListParams,
  WebVideoPageSize,
} from './types';

export const DEFAULT_WEB_VIDEO_LIST_PARAMS: WebVideoListParams = {
  keyword: '',
  uploadStatus: 'all',
  analysisStatus: 'all',
  from: null,
  to: null,
  page: 1,
  pageSize: 10,
};

const uploadStatuses = new Set<WebUploadStatusFilter>([
  'all',
  'idle',
  'uploading',
  'uploaded',
  'failed',
  'canceled',
]);
const analysisStatuses = new Set<WebAnalysisStatusFilter>([
  'all',
  'not_ready',
  'not_created',
  'queued',
  'processing',
  'succeeded',
  'failed',
  'canceled',
]);
const pageSizes = new Set<WebVideoPageSize>([10, 20, 50]);
const ownedKeys = [
  'q',
  'uploadStatus',
  'analysisStatus',
  'from',
  'to',
  'page',
  'pageSize',
] as const;

function isCalendarDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export type ParsedWebVideoSearch = {
  params: WebVideoListParams;
  dateRangeValid: boolean;
  normalizedSearchParams: URLSearchParams;
};

export function serializeWebVideoListParams(
  params: WebVideoListParams,
  source: URLSearchParams = new URLSearchParams(),
): URLSearchParams {
  const result = new URLSearchParams(source);
  for (const key of ownedKeys) result.delete(key);
  if (params.keyword) result.set('q', params.keyword);
  if (params.uploadStatus !== 'all') result.set('uploadStatus', params.uploadStatus);
  if (params.analysisStatus !== 'all') result.set('analysisStatus', params.analysisStatus);
  if (params.from !== null) result.set('from', params.from);
  if (params.to !== null) result.set('to', params.to);
  if (params.page !== 1) result.set('page', String(params.page));
  if (params.pageSize !== 10) result.set('pageSize', String(params.pageSize));
  return result;
}

export function parseWebVideoSearchParams(searchParams: URLSearchParams): ParsedWebVideoSearch {
  const rawUploadStatus = searchParams.get('uploadStatus') as WebUploadStatusFilter | null;
  const rawAnalysisStatus = searchParams.get('analysisStatus') as WebAnalysisStatusFilter | null;
  const rawPageSize = parsePositiveInteger(searchParams.get('pageSize'), 10);
  const fromValue = searchParams.get('from');
  const toValue = searchParams.get('to');
  const params: WebVideoListParams = {
    keyword: searchParams.get('q')?.trim() ?? '',
    uploadStatus:
      rawUploadStatus !== null && uploadStatuses.has(rawUploadStatus) ? rawUploadStatus : 'all',
    analysisStatus:
      rawAnalysisStatus !== null && analysisStatuses.has(rawAnalysisStatus)
        ? rawAnalysisStatus
        : 'all',
    from: isCalendarDate(fromValue) ? fromValue : null,
    to: isCalendarDate(toValue) ? toValue : null,
    page: parsePositiveInteger(searchParams.get('page'), 1),
    pageSize: pageSizes.has(rawPageSize as WebVideoPageSize)
      ? (rawPageSize as WebVideoPageSize)
      : 10,
  };
  return {
    params,
    dateRangeValid: params.from === null || params.to === null || params.from <= params.to,
    normalizedSearchParams: serializeWebVideoListParams(params, searchParams),
  };
}

export function areSearchParamsEqual(left: URLSearchParams, right: URLSearchParams): boolean {
  return left.toString() === right.toString();
}

export function updateWebVideoSearchParams(
  current: URLSearchParams,
  patch: Partial<WebVideoListParams>,
  options: { resetPage?: boolean } = {},
): URLSearchParams {
  const parsed = parseWebVideoSearchParams(current);
  const params = {
    ...parsed.params,
    ...patch,
    page: options.resetPage === false ? (patch.page ?? parsed.params.page) : 1,
  };
  return serializeWebVideoListParams(params, current);
}

export function clearWebVideoFilters(current: URLSearchParams): URLSearchParams {
  return serializeWebVideoListParams(DEFAULT_WEB_VIDEO_LIST_PARAMS, current);
}

export function clampWebVideoPage(current: URLSearchParams, page: number): URLSearchParams {
  return updateWebVideoSearchParams(current, { page }, { resetPage: false });
}

export function hasActiveWebVideoFilters(params: WebVideoListParams): boolean {
  return (
    params.keyword.length > 0 ||
    params.uploadStatus !== 'all' ||
    params.analysisStatus !== 'all' ||
    params.from !== null ||
    params.to !== null
  );
}

export function getLocalDateBounds(params: Pick<WebVideoListParams, 'from' | 'to'>): {
  fromMs: number | null;
  toExclusiveMs: number | null;
} {
  const toDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const fromMs = params.from === null ? null : toDate(params.from).getTime();
  if (params.to === null) return { fromMs, toExclusiveMs: null };
  const toExclusive = toDate(params.to);
  toExclusive.setDate(toExclusive.getDate() + 1);
  return { fromMs, toExclusiveMs: toExclusive.getTime() };
}
