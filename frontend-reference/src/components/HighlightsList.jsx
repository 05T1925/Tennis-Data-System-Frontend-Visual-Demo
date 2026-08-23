import { useMemo, useState } from 'react'

export default function HighlightsList({ items = [], onJump }) {
  const [reasonFilter, setReasonFilter] = useState('ALL')
  const filtered = useMemo(() => {
    if (reasonFilter === 'ALL') return items
    return items.filter((i) => i.reason === reasonFilter)
  }, [items, reasonFilter])

  if (!items.length) {
    return <div className="px-4 py-4 text-sm text-white/55">暂无精彩回合</div>
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex gap-1 text-[11px]">
        {['ALL', '长回合', '高跑动'].map((f) => (
          <button
            key={f}
            onClick={() => setReasonFilter(f)}
            className={[
              'rounded-[8px] border px-2 py-1',
              reasonFilter === f
                ? 'border-[rgba(16,255,176,0.45)] text-[#10FFB0]'
                : 'border-white/10 text-white/55',
            ].join(' ')}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {filtered.map((item) => (
          <button
            key={item.id}
            onClick={() => onJump?.(item.start)}
            className="flex items-center justify-between rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-3 text-left hover:border-[rgba(16,255,176,0.30)]"
          >
            <div>
              <div className="text-sm font-semibold text-white/85">{item.label}</div>
              <div className="mt-1 text-xs text-white/55">{item.reason}</div>
            </div>
            <div className="text-xs text-[#10FFB0]">{item.start.toFixed(1)}s</div>
          </button>
        ))}
      </div>
    </div>
  )
}
