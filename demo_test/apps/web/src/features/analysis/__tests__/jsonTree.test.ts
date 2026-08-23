import { describe, expect, it } from 'vitest';

import {
  buildVisibleJsonTreeRows,
  createJsonPointerPath,
  getDefaultExpandedJsonPaths,
  getJsonChildEntries,
  getJsonValueSummary,
  JSON_TREE_ARRAY_BATCH,
  JSON_TREE_MAX_DEPTH,
  JSON_TREE_MAX_VISIBLE_NODES,
  JSON_TREE_STRING_PREVIEW,
} from '../jsonTree';

function visibleArrayIndexes(
  value: unknown,
  arrayPath: string,
  visibleCount: number,
  maxVisibleNodes = JSON_TREE_MAX_VISIBLE_NODES,
) {
  const plan = buildVisibleJsonTreeRows({
    value,
    expandedPaths: new Set(['', arrayPath]),
    arrayVisibleCounts: new Map([[arrayPath, visibleCount]]),
    maxVisibleNodes,
  });
  return {
    plan,
    indexes: plan.rows
      .filter(({ path }) => path.startsWith(`${arrayPath}/`))
      .map(({ label }) => Number(label)),
    arrayRow: plan.rows.find(({ path }) => path === arrayPath),
  };
}

describe('JSON Tree utilities', () => {
  it.each([
    [null, 'null'],
    ['text', 'string'],
    [12, 'number'],
    [true, 'boolean'],
    [{ value: 1 }, 'object'],
    [[1, 2], 'array'],
    [undefined, 'unsupported'],
  ])('describes %j as %s', (value, kind) => {
    expect(getJsonValueSummary(value).kind).toBe(kind);
  });

  it('limits long strings, depth and array batches', () => {
    expect(getJsonValueSummary('x'.repeat(JSON_TREE_STRING_PREVIEW + 1)).limited).toBe(true);
    expect(getJsonValueSummary({ nested: true }, JSON_TREE_MAX_DEPTH).expandable).toBe(false);
    expect(getJsonChildEntries(Array.from({ length: 80 }), JSON_TREE_ARRAY_BATCH)).toHaveLength(50);
  });

  it('detects circular references with WeakSet', () => {
    const value: { self?: unknown } = {};
    value.self = value;
    const seen = new WeakSet<object>();
    expect(getJsonValueSummary(value, 0, seen).kind).toBe('object');
    expect(getJsonValueSummary(value.self, 1, seen).kind).toBe('circular');
  });

  it('marks non-finite numbers as unsupported display values', () => {
    expect(getJsonValueSummary(Number.POSITIVE_INFINITY)).toMatchObject({
      limited: true,
      preview: '不支持的值',
    });
  });

  it('plans all four batches of a 180-item array without gaps or duplicates', () => {
    const value = { ballTrack: Array.from({ length: 180 }, (_, index) => index) };
    for (const [visibleCount, expectedCount, hasMore] of [
      [50, 50, true],
      [100, 100, true],
      [150, 150, true],
      [200, 180, false],
    ] as const) {
      const { plan, indexes, arrayRow } = visibleArrayIndexes(value, '/ballTrack', visibleCount);
      expect(indexes).toEqual(Array.from({ length: expectedCount }, (_, index) => index));
      expect(new Set(indexes).size).toBe(expectedCount);
      expect(arrayRow).toMatchObject({
        hasMoreArrayItems: hasMore,
        blockedByGlobalLimit: false,
      });
      expect(plan.truncatedByGlobalLimit).toBe(false);
    }
  });

  it('does not starve a deep array because of preceding object siblings', () => {
    const value = {
      metadata: Object.fromEntries(
        Array.from({ length: 20 }, (_, index) => [`field-${index}`, index]),
      ),
      tracks: { ballTrack: Array.from({ length: 180 }, (_, index) => ({ index })) },
    };
    const plan = buildVisibleJsonTreeRows({
      value,
      expandedPaths: new Set(['', '/metadata', '/tracks', '/tracks/ballTrack']),
      arrayVisibleCounts: new Map([['/tracks/ballTrack', 50]]),
    });
    const indexes = plan.rows
      .filter(({ path }) => /^\/tracks\/ballTrack\/\d+$/.test(path))
      .map(({ label }) => Number(label));
    expect(indexes).toEqual(Array.from({ length: 50 }, (_, index) => index));
    expect(plan.truncatedByGlobalLimit).toBe(false);
    expect(plan.rows.find(({ path }) => path === '/tracks/ballTrack')).toMatchObject({
      hasMoreArrayItems: true,
      blockedByGlobalLimit: false,
    });
  });

  it('enforces one real global 1000-row limit and hides ineffective batch controls', () => {
    const value = { items: Array.from({ length: 1_200 }, (_, index) => index) };
    const { plan, indexes, arrayRow } = visibleArrayIndexes(value, '/items', 1_200);
    expect(plan.rows).toHaveLength(JSON_TREE_MAX_VISIBLE_NODES);
    expect(indexes).toHaveLength(JSON_TREE_MAX_VISIBLE_NODES - 2);
    expect(plan.truncatedByGlobalLimit).toBe(true);
    expect(arrayRow).toMatchObject({
      hasMoreArrayItems: false,
      blockedByGlobalLimit: true,
      nextBatchAfterPath: null,
    });
    expect(plan.rows.filter(({ blockedByGlobalLimit }) => blockedByGlobalLimit)).toHaveLength(1);
  });

  it('uses available global budget and blocks the next batch only when it is exhausted', () => {
    const value = { items: Array.from({ length: 180 }, (_, index) => index) };
    const enough = visibleArrayIndexes(value, '/items', 100, 120);
    expect(enough.indexes).toHaveLength(100);
    expect(enough.plan.truncatedByGlobalLimit).toBe(false);
    expect(enough.arrayRow?.hasMoreArrayItems).toBe(true);

    const limited = visibleArrayIndexes(value, '/items', 100, 60);
    expect(limited.plan.rows).toHaveLength(60);
    expect(limited.indexes).toEqual(Array.from({ length: 58 }, (_, index) => index));
    expect(limited.plan.truncatedByGlobalLimit).toBe(true);
    expect(limited.arrayRow).toMatchObject({
      hasMoreArrayItems: false,
      blockedByGlobalLimit: true,
    });
  });

  it('keeps expansion and batch state isolated by stable JSON Pointer paths', () => {
    const value = {
      left: Array.from({ length: 80 }, (_, index) => index),
      right: Array.from({ length: 80 }, (_, index) => index),
    };
    const expandedPaths = new Set(['', '/left', '/right']);
    const arrayVisibleCounts = new Map([
      ['/left', 80],
      ['/right', 50],
    ]);
    const expanded = buildVisibleJsonTreeRows({ value, expandedPaths, arrayVisibleCounts });
    expect(expanded.rows.filter(({ path }) => /^\/left\/\d+$/.test(path))).toHaveLength(80);
    expect(expanded.rows.filter(({ path }) => /^\/right\/\d+$/.test(path))).toHaveLength(50);

    const collapsed = buildVisibleJsonTreeRows({
      value,
      expandedPaths: new Set(['', '/right']),
      arrayVisibleCounts,
    });
    expect(collapsed.rows.some(({ path }) => path === '/left/0')).toBe(false);
    const reexpanded = buildVisibleJsonTreeRows({ value, expandedPaths, arrayVisibleCounts });
    expect(reexpanded.rows.filter(({ path }) => /^\/left\/\d+$/.test(path))).toHaveLength(80);
    expect(arrayVisibleCounts.get('/right')).toBe(50);
    expect(createJsonPointerPath('/left', 'a/b~c')).toBe('/left/a~1b~0c');
  });

  it('uses current ancestors for cycles and does not reject shared sibling references', () => {
    const shared = { value: 1 };
    const value: { first: typeof shared; second: typeof shared; self?: unknown } = {
      first: shared,
      second: shared,
    };
    value.self = value;
    const plan = buildVisibleJsonTreeRows({
      value,
      expandedPaths: new Set(['', '/first', '/second', '/self']),
      arrayVisibleCounts: new Map(),
    });
    expect(plan.rows.find(({ path }) => path === '/first')?.summary.kind).toBe('object');
    expect(plan.rows.find(({ path }) => path === '/second')?.summary.kind).toBe('object');
    expect(plan.rows.find(({ path }) => path === '/self')?.summary.kind).toBe('circular');
  });

  it('preserves the default depth and maximum-depth behavior in the visible plan', () => {
    const value = { output: { payload: { nested: true } } };
    expect([...getDefaultExpandedJsonPaths(value)]).toEqual(['', '/output']);
    const plan = buildVisibleJsonTreeRows({
      value,
      expandedPaths: new Set(['', '/output', '/output/payload']),
      arrayVisibleCounts: new Map(),
      maxDepth: 2,
    });
    expect(plan.rows.find(({ path }) => path === '/output/payload')).toMatchObject({
      expanded: false,
      summary: { expandable: false, limited: true },
    });
  });
});
