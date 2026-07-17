import { describe, expect, it } from 'vitest';

import {
  areSearchParamsEqual,
  clampWebVideoPage,
  clearWebVideoFilters,
  parseWebVideoSearchParams,
  updateWebVideoSearchParams,
} from '../urlParams';

describe('video URL parameters', () => {
  it('uses defaults without serializing them', () => {
    const parsed = parseWebVideoSearchParams(new URLSearchParams());
    expect(parsed.params).toMatchObject({
      keyword: '',
      uploadStatus: 'all',
      analysisStatus: 'all',
      page: 1,
      pageSize: 10,
    });
    expect(parsed.normalizedSearchParams.toString()).toBe('');
  });

  it('parses and serializes valid values while preserving unknown parameters', () => {
    const parsed = parseWebVideoSearchParams(
      new URLSearchParams(
        'q=%20serve%20&uploadStatus=uploaded&analysisStatus=queued&from=2026-06-01&to=2026-06-30&page=2&pageSize=20&source=review',
      ),
    );
    expect(parsed.params).toMatchObject({
      keyword: 'serve',
      uploadStatus: 'uploaded',
      analysisStatus: 'queued',
      from: '2026-06-01',
      to: '2026-06-30',
      page: 2,
      pageSize: 20,
    });
    expect(parsed.normalizedSearchParams.get('source')).toBe('review');
  });

  it.each([
    ['uploadStatus=invalid', 'uploadStatus'],
    ['analysisStatus=invalid', 'analysisStatus'],
    ['page=0', 'page'],
    ['pageSize=30', 'pageSize'],
    ['from=2026-02-31', 'from'],
    ['to=not-date', 'to'],
  ])('normalizes invalid %s', (query, key) => {
    const parsed = parseWebVideoSearchParams(new URLSearchParams(query));
    expect(parsed.normalizedSearchParams.has(key)).toBe(false);
  });

  it('retains a reversed valid range and marks it invalid', () => {
    const parsed = parseWebVideoSearchParams(new URLSearchParams('from=2026-06-20&to=2026-06-10'));
    expect(parsed.dateRangeValid).toBe(false);
    expect(parsed.normalizedSearchParams.toString()).toContain('from=2026-06-20');
  });

  it('resets page for search, filter and page-size changes', () => {
    const current = new URLSearchParams('page=3');
    expect(updateWebVideoSearchParams(current, { keyword: 'serve' }).get('page')).toBeNull();
    expect(updateWebVideoSearchParams(current, { uploadStatus: 'failed' }).get('page')).toBeNull();
    expect(updateWebVideoSearchParams(current, { pageSize: 20 }).get('page')).toBeNull();
  });

  it('updates and clamps page without resetting other parameters', () => {
    const current = new URLSearchParams('q=serve&page=3&source=x');
    const next = clampWebVideoPage(current, 2);
    expect(next.get('q')).toBe('serve');
    expect(next.get('page')).toBe('2');
    expect(next.get('source')).toBe('x');
  });

  it('clears owned filters and keeps unknown values', () => {
    const cleared = clearWebVideoFilters(new URLSearchParams('q=x&page=2&source=review'));
    expect(cleared.toString()).toBe('source=review');
  });

  it('compares normalized search strings to prevent replace loops', () => {
    expect(areSearchParamsEqual(new URLSearchParams('q=x'), new URLSearchParams('q=x'))).toBe(true);
    expect(areSearchParamsEqual(new URLSearchParams('q=x'), new URLSearchParams('q=y'))).toBe(
      false,
    );
  });
});
