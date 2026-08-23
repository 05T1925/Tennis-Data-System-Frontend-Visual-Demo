import { useMemo, useState } from 'react'

const FALLBACK = {
  A: {
    errors: { unforced: 8, touches: 62, rate: 12.9 },
    depth: { avg: 0.66, std: 0.08, index: 72, trend: [0.58, 0.62, 0.64, 0.67, 0.69, 0.68, 0.71, 0.72] },
    zone: { entropy: 1.22, focus: '68%', repeat: '61%' },
    rally: { longRate: '38%', avgShots: 4.8, stamina: 58 },
  },
  B: {
    errors: { unforced: 6, touches: 59, rate: 10.2 },
    depth: { avg: 0.71, std: 0.07, index: 79, trend: [0.62, 0.64, 0.69, 0.71, 0.72, 0.74, 0.76, 0.77] },
    zone: { entropy: 1.05, focus: '74%', repeat: '69%' },
    rally: { longRate: '44%', avgShots: 5.6, stamina: 67 },
  },
}

function Card({ title, children }) {
  return (
    <section className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
      <div className="mb-3 text-[14px] font-semibold tracking-[0.08em] text-white/70">{title}</div>
      {children}
    </section>
  )
}

function Ring({ percent }) {
  const safe = Math.max(0, Math.min(100, Number(percent || 0)))
  return (
    <div className="relative h-24 w-24">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgba(16,255,176,0.9) ${safe * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
        }}
      />
      <div className="absolute inset-[8px] grid place-items-center rounded-full bg-[#0A0E17] text-sm font-semibold text-white">
        {safe.toFixed(1)}%
      </div>
    </div>
  )
}

function DepthTrend({ values }) {
  const safeValues = values?.length ? values : [0.5, 0.55, 0.6]
  const min = Math.min(...safeValues)
  const max = Math.max(...safeValues)
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(1, safeValues.length - 1)) * 100
      const y = 100 - ((value - min) / Math.max(1e-6, max - min || 1)) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-28 w-full">
        <polyline fill="none" stroke="rgba(16,255,176,0.92)" strokeWidth="2.2" points={points} />
      </svg>
    </div>
  )
}

function ZoneHeat({ focusPercent = 50, repeatPercent = 50 }) {
  const focus = Math.max(0, Math.min(100, Number(String(focusPercent).replace('%', '')) || 0))
  const repeat = Math.max(0, Math.min(100, Number(String(repeatPercent).replace('%', '')) || 0))
  const rows = [
    [0.2, 0.3, Math.max(0.25, focus / 120), 0.26, 0.18],
    [0.22, 0.35, Math.max(0.35, focus / 100), Math.max(0.28, repeat / 120), 0.2],
    [0.18, 0.24, Math.max(0.22, repeat / 130), 0.21, 0.16],
  ]

  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <div className="grid grid-cols-5 gap-2">
        {rows.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => (
            <div key={`${rowIndex}-${columnIndex}`} className="h-12 rounded-[6px]" style={{ background: `rgba(16,255,176,${value})` }} />
          )),
        )}
      </div>
      <div className="mt-2 text-[12px] text-white/45">高亮区域=更稳定的常用区域，暗色区域=偶发区域</div>
    </div>
  )
}

export default function Stability({ stabilityStats = null }) {
  const [player, setPlayer] = useState('A')
  const players = stabilityStats?.players ?? FALLBACK
  const data = useMemo(() => players[player] ?? FALLBACK[player], [player, players])

  return (
    <section className="grid gap-5">
      <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-2">
        <div className="inline-flex rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-1">
          {['A', 'B'].map((key) => (
            <button
              key={key}
              onClick={() => setPlayer(key)}
              className={[
                'rounded-[8px] px-5 py-2 text-sm transition',
                player === key ? 'bg-[rgba(16,255,176,0.14)] text-[#B9FFE8]' : 'text-white/65 hover:text-white',
              ].join(' ')}
            >
              球员{key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="非受迫性失误率">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <Ring percent={data.errors.rate} />
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-xl font-bold text-white">{data.errors.unforced}</div>
                <div className="text-[12px] text-white/45">失误总数</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-xl font-bold text-white">{data.errors.touches}</div>
                <div className="text-[12px] text-white/45">总触球次数</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-xl font-bold text-[#10FFB0]">{data.errors.rate}%</div>
                <div className="text-[12px] text-white/45">最终失误率</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="击球深度稳定性">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-xl font-bold text-white">{Number(data.depth.avg || 0).toFixed(2)}</div>
                <div className="text-[12px] text-white/45">平均深度</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className={['text-xl font-bold', Number(data.depth.std || 0) <= 0.1 ? 'text-[#10FFB0]' : 'text-white'].join(' ')}>
                  {Number(data.depth.std || 0).toFixed(2)}
                </div>
                <div className="text-[12px] text-white/45">深度标准差</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-xl font-bold text-[#10FFB0]">{data.depth.index}</div>
                <div className="text-[12px] text-white/45">深度指数</div>
              </div>
            </div>
            <DepthTrend values={data.depth.trend} />
          </div>
        </Card>

        <Card title="击球落点区域一致性">
          <div className="grid gap-3">
            <ZoneHeat focusPercent={data.zone.focus} repeatPercent={data.zone.repeat} />
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-lg font-bold text-white">{Number(data.zone.entropy || 0).toFixed(2)}</div>
                <div className="text-[12px] text-white/45">熵值</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-lg font-bold text-[#10FFB0]">{data.zone.focus}</div>
                <div className="text-[12px] text-white/45">区域集中度</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-lg font-bold text-white">{data.zone.repeat}</div>
                <div className="text-[12px] text-white/45">动作重复稳定性</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="连续多拍不掉球能力">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-2xl font-bold text-[#10FFB0]">{data.rally.longRate}</div>
                <div className="text-[12px] text-white/45">长回合率（≥9拍）</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-2xl font-bold text-white">{data.rally.avgShots}</div>
                <div className="text-[12px] text-white/45">每得分平均拍数</div>
              </div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
              <div className="mb-2 flex items-center justify-between text-[13px] text-white/65">
                <span>相持能力进度</span>
                <span>{data.rally.stamina}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-[#10FFB0]" style={{ width: `${data.rally.stamina}%` }} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
