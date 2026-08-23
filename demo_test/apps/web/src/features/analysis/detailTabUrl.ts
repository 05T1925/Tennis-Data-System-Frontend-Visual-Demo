import type { WebDetailTab } from './types';

const DETAIL_TAB_KEY = 'detailTab';
const validTabs = new Set<WebDetailTab>(['basic', 'result', 'shots', 'cv', 'logs']);

export function parseWebDetailTab(searchParams: URLSearchParams): {
  tab: WebDetailTab;
  normalizedSearchParams: URLSearchParams;
} {
  const raw = searchParams.get(DETAIL_TAB_KEY) as WebDetailTab | null;
  const tab = raw !== null && validTabs.has(raw) ? raw : 'basic';
  const normalizedSearchParams = new URLSearchParams(searchParams);
  if (tab === 'basic') normalizedSearchParams.delete(DETAIL_TAB_KEY);
  else normalizedSearchParams.set(DETAIL_TAB_KEY, tab);
  return { tab, normalizedSearchParams };
}

export function updateWebDetailTab(
  searchParams: URLSearchParams,
  tab: WebDetailTab,
): URLSearchParams {
  const result = new URLSearchParams(searchParams);
  if (tab === 'basic') result.delete(DETAIL_TAB_KEY);
  else result.set(DETAIL_TAB_KEY, tab);
  return result;
}

export function removeWebDetailTab(searchParams: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams(searchParams);
  result.delete(DETAIL_TAB_KEY);
  return result;
}

export function areWebDetailSearchParamsEqual(left: URLSearchParams, right: URLSearchParams) {
  return left.toString() === right.toString();
}
