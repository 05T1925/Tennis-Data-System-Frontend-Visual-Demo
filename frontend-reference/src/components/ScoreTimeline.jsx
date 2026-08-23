import { useMemo } from 'react'

function getActivePointIndex(scoreTimeline, currentTime) {
  let active = -1
  for (let i = 0; i < scoreTimeline.length; i += 1) {
    if ((scoreTimeline[i]?.t ?? 0) <= currentTime) active = i
    else break
  }
  return Math.max(0, active)
}

export default function ScoreTimeline({ scoreTimeline = [], currentTime = 0, onJump }) {
  const activeIndex = useMemo(
    () => getActivePointIndex(scoreTimeline, currentTime),
    [scoreTimeline, currentTime],
  )

  return (
    <section className="mt-4 rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_30px_-20px_rgba(0,0,0,0.75)]">
      <div className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-white/65">得分进度轴</div>
      <div className="relative overflow-x-auto pb-2">
        <div className="relative min-w-max px-2 pb-8 pt-6">
          <div className="absolute left-2 right-2 top-[28px] h-[2px] bg-white/12" />

          <div className="flex gap-4 pr-4">
            {scoreTimeline.map((item, idx) => {
              const active = idx === activeIndex
              const winnerClass =
                item.winner === 'left'
                  ? 'border-sky-300/45 bg-sky-300/15 text-sky-200'
                  : 'border-[#10FFB0]/45 bg-[#10FFB0]/12 text-[#B9FFE8]'
              return (
                <button
                  key={`${item.pointIndex}-${item.t}`}
                  onClick={() => onJump?.(item)}
                  className={[
                    'w-[140px] shrink-0 rounded-[8px] border px-3 py-2 text-left text-xs transition',
                    winnerClass,
                    active ? 'scale-[1.02] shadow-[0_0_24px_rgba(16,255,176,0.22)]' : 'opacity-85 hover:opacity-100',
                  ].join(' ')}
                >
                  <div className="font-semibold">球员 {item.winner === 'left' ? 'A' : 'B'} 第 {item.pointIndex} 分</div>
                  <div className="mt-1 text-[11px] text-white/65">{item.inOut} · {item.t.toFixed(1)}s</div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
