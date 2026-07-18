import { Button, Typography } from 'antd';
import { Fragment, useMemo, useState } from 'react';

import {
  buildVisibleJsonTreeRows,
  getDefaultExpandedJsonPaths,
  JSON_TREE_ARRAY_BATCH,
  JSON_TREE_MAX_VISIBLE_NODES,
  type JsonVisibleRow,
} from '../jsonTree';

export function JsonTreeViewer({ value }: { value: unknown }) {
  const [expandedPaths, setExpandedPaths] = useState(() => getDefaultExpandedJsonPaths(value));
  const [arrayVisibleCounts, setArrayVisibleCounts] = useState<ReadonlyMap<string, number>>(
    () => new Map(),
  );

  const plan = useMemo(
    () =>
      buildVisibleJsonTreeRows({
        value,
        expandedPaths,
        arrayVisibleCounts,
        maxVisibleNodes: JSON_TREE_MAX_VISIBLE_NODES,
      }),
    [arrayVisibleCounts, expandedPaths, value],
  );
  const controlsAfterPath = useMemo(() => {
    const controls = new Map<string, JsonVisibleRow[]>();
    for (const row of plan.rows) {
      if (!row.hasMoreArrayItems || row.nextBatchAfterPath === null) continue;
      const current = controls.get(row.nextBatchAfterPath) ?? [];
      current.push(row);
      controls.set(row.nextBatchAfterPath, current);
    }
    return controls;
  }, [plan.rows]);

  function togglePath(path: string): void {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function showNextBatch(row: JsonVisibleRow): void {
    const arrayLength = row.arrayLength;
    if (arrayLength === null) return;
    setArrayVisibleCounts((current) => {
      const next = new Map(current);
      const visibleCount = current.get(row.path) ?? JSON_TREE_ARRAY_BATCH;
      next.set(row.path, Math.min(arrayLength, visibleCount + JSON_TREE_ARRAY_BATCH));
      return next;
    });
  }

  return (
    <div>
      {plan.rows.map((row) => (
        <Fragment key={row.path || 'root'}>
          <div className="json-tree-node" data-kind={row.summary.kind} data-path={row.path}>
            <div className="json-tree-row" style={{ paddingInlineStart: row.depth * 18 }}>
              {row.summary.expandable ? (
                <Button
                  type="text"
                  size="small"
                  className="json-tree-toggle"
                  aria-label={`${row.expanded ? '折叠' : '展开'} ${row.label}`}
                  onClick={() => togglePath(row.path)}
                >
                  {row.expanded ? '−' : '+'}
                </Button>
              ) : (
                <span className="json-tree-spacer" />
              )}
              <Typography.Text code>{row.label}</Typography.Text>
              <span className="json-tree-value">{row.summary.preview}</span>
              {row.summary.limited && <span className="json-tree-limit">已应用显示限制</span>}
            </div>
          </div>
          {controlsAfterPath.get(row.path)?.map((arrayRow) => (
            <div
              key={`${arrayRow.path}-next-batch`}
              className="json-tree-row"
              style={{ paddingInlineStart: (arrayRow.depth + 1) * 18 }}
            >
              <Button size="small" onClick={() => showNextBatch(arrayRow)}>
                显示下一批
              </Button>
            </div>
          ))}
        </Fragment>
      ))}
      {plan.truncatedByGlobalLimit && (
        <div className="json-tree-limit">已达到 1000 个可见节点限制。</div>
      )}
    </div>
  );
}
