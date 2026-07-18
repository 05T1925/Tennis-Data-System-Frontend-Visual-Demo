export const JSON_TREE_DEFAULT_DEPTH = 2;
export const JSON_TREE_MAX_DEPTH = 20;
export const JSON_TREE_ARRAY_BATCH = 50;
export const JSON_TREE_STRING_PREVIEW = 240;
export const JSON_TREE_MAX_VISIBLE_NODES = 1_000;

export type JsonValueKind =
  'null' | 'string' | 'number' | 'boolean' | 'object' | 'array' | 'unsupported' | 'circular';

export type JsonValueSummary = {
  kind: JsonValueKind;
  preview: string;
  expandable: boolean;
  childCount: number;
  limited: boolean;
};

export type JsonTreeExpansionState = {
  expandedPaths: ReadonlySet<string>;
  arrayVisibleCounts: ReadonlyMap<string, number>;
};

export type JsonVisibleRow = {
  path: string;
  label: string;
  depth: number;
  value: unknown;
  summary: JsonValueSummary;
  expanded: boolean;
  hasMoreArrayItems: boolean;
  blockedByGlobalLimit: boolean;
  arrayLength: number | null;
  nextBatchAfterPath: string | null;
};

export type JsonVisibleTreePlan = {
  rows: JsonVisibleRow[];
  truncatedByGlobalLimit: boolean;
};

type BuildVisibleJsonTreeRowsOptions = JsonTreeExpansionState & {
  value: unknown;
  maxVisibleNodes?: number;
  maxDepth?: number;
  arrayBatchSize?: number;
};

export function getJsonValueSummary(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
  maxDepth = JSON_TREE_MAX_DEPTH,
): JsonValueSummary {
  if (value === null)
    return { kind: 'null', preview: 'null', expandable: false, childCount: 0, limited: false };
  if (typeof value === 'string') {
    const limited = value.length > JSON_TREE_STRING_PREVIEW;
    return {
      kind: 'string',
      preview: JSON.stringify(limited ? `${value.slice(0, JSON_TREE_STRING_PREVIEW)}...` : value),
      expandable: false,
      childCount: 0,
      limited,
    };
  }
  if (typeof value === 'number') {
    return {
      kind: 'number',
      preview: Number.isFinite(value) ? String(value) : '不支持的值',
      expandable: false,
      childCount: 0,
      limited: !Number.isFinite(value),
    };
  }
  if (typeof value === 'boolean')
    return {
      kind: 'boolean',
      preview: String(value),
      expandable: false,
      childCount: 0,
      limited: false,
    };
  if (typeof value !== 'object')
    return {
      kind: 'unsupported',
      preview: '不支持的值',
      expandable: false,
      childCount: 0,
      limited: true,
    };
  if (seen.has(value))
    return {
      kind: 'circular',
      preview: '循环引用',
      expandable: false,
      childCount: 0,
      limited: true,
    };
  seen.add(value);
  const isArray = Array.isArray(value);
  const childCount = isArray ? value.length : Object.keys(value).length;
  const depthLimited = depth >= maxDepth;
  return {
    kind: isArray ? 'array' : 'object',
    preview: isArray ? `Array(${childCount})` : `Object(${childCount})`,
    expandable: childCount > 0 && !depthLimited,
    childCount,
    limited: depthLimited,
  };
}

export function getDefaultExpandedJsonPaths(
  value: unknown,
  defaultDepth = JSON_TREE_DEFAULT_DEPTH,
): Set<string> {
  const expandedPaths = new Set<string>();

  function visit(current: unknown, path: string, depth: number, ancestors: object[]): void {
    const seen = new WeakSet<object>(ancestors);
    const summary = getJsonValueSummary(current, depth, seen);
    if (!summary.expandable || depth >= defaultDepth) return;
    expandedPaths.add(path);
    const nextAncestors =
      typeof current === 'object' && current !== null ? [...ancestors, current] : ancestors;
    for (const [key, child] of getJsonChildEntries(current, JSON_TREE_ARRAY_BATCH)) {
      visit(child, createJsonPointerPath(path, key), depth + 1, nextAncestors);
    }
  }

  visit(value, '', 0, []);
  return expandedPaths;
}

export function buildVisibleJsonTreeRows({
  value,
  expandedPaths,
  arrayVisibleCounts,
  maxVisibleNodes = JSON_TREE_MAX_VISIBLE_NODES,
  maxDepth = JSON_TREE_MAX_DEPTH,
  arrayBatchSize = JSON_TREE_ARRAY_BATCH,
}: BuildVisibleJsonTreeRowsOptions): JsonVisibleTreePlan {
  const rows: JsonVisibleRow[] = [];
  const nodeLimit = Math.max(1, Math.floor(maxVisibleNodes));
  const batchSize = Math.max(1, Math.floor(arrayBatchSize));
  let truncatedByGlobalLimit = false;

  function visit(
    current: unknown,
    label: string,
    path: string,
    depth: number,
    ancestors: object[],
  ): boolean {
    if (rows.length >= nodeLimit) {
      truncatedByGlobalLimit = true;
      return false;
    }

    const seen = new WeakSet<object>(ancestors);
    const summary = getJsonValueSummary(current, depth, seen, maxDepth);
    const expanded = summary.expandable && expandedPaths.has(path);
    const row: JsonVisibleRow = {
      path,
      label,
      depth,
      value: current,
      summary,
      expanded,
      hasMoreArrayItems: false,
      blockedByGlobalLimit: false,
      arrayLength: Array.isArray(current) ? current.length : null,
      nextBatchAfterPath: null,
    };
    rows.push(row);
    if (!expanded) return true;

    const nextAncestors =
      typeof current === 'object' && current !== null ? [...ancestors, current] : ancestors;
    const requestedArrayCount = Array.isArray(current)
      ? Math.min(
          current.length,
          Math.max(batchSize, Math.floor(arrayVisibleCounts.get(path) ?? batchSize)),
        )
      : batchSize;
    const entries = getJsonChildEntries(current, requestedArrayCount);

    for (const [key, child] of entries) {
      if (!visit(child, key, createJsonPointerPath(path, key), depth + 1, nextAncestors)) {
        if (Array.isArray(current)) row.blockedByGlobalLimit = true;
        return false;
      }
    }

    if (Array.isArray(current) && requestedArrayCount < current.length) {
      if (rows.length >= nodeLimit) {
        row.blockedByGlobalLimit = true;
        truncatedByGlobalLimit = true;
      } else {
        row.hasMoreArrayItems = true;
        row.nextBatchAfterPath = rows.at(-1)?.path ?? path;
      }
    }
    return true;
  }

  visit(value, 'root', '', 0, []);
  if (truncatedByGlobalLimit) {
    for (const row of rows) {
      if (!row.hasMoreArrayItems) continue;
      row.hasMoreArrayItems = false;
      row.blockedByGlobalLimit = true;
      row.nextBatchAfterPath = null;
    }
  }
  return { rows, truncatedByGlobalLimit };
}

export function createJsonPointerPath(parentPath: string, key: string): string {
  const escapedKey = key.replace(/~/g, '~0').replace(/\//g, '~1');
  return `${parentPath}/${escapedKey}`;
}

export function getJsonChildEntries(
  value: unknown,
  visibleCount = JSON_TREE_ARRAY_BATCH,
): [string, unknown][] {
  if (Array.isArray(value))
    return value.slice(0, visibleCount).map((item, index) => [String(index), item]);
  if (typeof value === 'object' && value !== null) return Object.entries(value);
  return [];
}
