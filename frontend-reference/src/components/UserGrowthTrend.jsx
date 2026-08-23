import { useMemo, useState } from 'react'

const FILTERS = [
  { key: 'month', label: '按月' },
  { key: 'match', label: '按比赛' },
]

const FALLBACK_MATCHES = [
  { date: '2026-04-01', distance: 320, stability: 0.62, speed: 122, scoreRate: 0.48, winRate: 0.48 },
  { date: '2026-04-12', distance: 410, stability: 0.71, speed: 128, scoreRate: 0.55, winRate: 0.55 },
  { date: '2026-04-26', distance: 465, stability: 0.83, speed: 136, scoreRate: 0.68, winRate: 0.68 },
]

function createSmoothPath(points) {
  if (points.length < 2) return ''
  const [first, ...rest] = points
  let d = `M ${first.x} ${first.y}`
  for (let i = 0; i < rest.length; i += 1) {
    const p0 = points[Math.max(0, i)]
    const p1 = points[i + 1]
    const p2 = points[i + 2] || p1
    const cp1x = p0.x + (p1.x - p0.x) / 2
    const cp1y = p0.y
    const cp2x = p1.x - (p2.x - p0.x) / 6
    const cp2y = p1.y
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
  }
  return d
}

function TrendCard({ title, unit, labels, values, valueFormatter }) {
  const normalized = useMemo(() => {
    const safeValues = values.length ? values : [0, 1]
    const min = Math.min(...safeValues)
    const max = Math.max(...safeValues)
    return safeValues.map((value, index) => ({
      x: (index / Math.max(1, safeValues.length - 1)) * 100,
      y: 100 - ((value - min) / Math.max(1e-6, max - min || 1)) * 100,
      raw: value,
      label: labels[index] ?? `#${index + 1}`,
    }))
  }, [labels, values])

  const path = useMemo(() => createSmoothPath(normalized), [normalized])
  const areaPath = `${path} L 100 100 L 0 100 Z`

  return (
    <section className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)] transition hover:border-[rgba(16,255,176,0.28)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[14px] font-semibold tracking-[0.08em] text-white/75">{title}</div>
        <div className="text-[12px] text-white/45">{unit}</div>
      </div>

      <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[230px] w-full">
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.4" />
          ))}

          <defs>
            <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,255,176,0.35)" />
              <stop offset="100%" stopColor="rgba(16,255,176,0.02)" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#fill-${title})`} />
          <path d={path} fill="none" stroke="rgba(16,255,176,0.95)" strokeWidth="1.8" />
        </svg>

        <div className="mt-2 flex items-center justify-between text-[12px] text-white/45">
          {normalized.map((item) => (
            <span key={item.label} className="truncate">{item.label}</span>
          ))}
        </div>
        <div className="mt-2 text-right text-[12px] text-[#10FFB0]">
          最新：{valueFormatter(normalized[normalized.length - 1]?.raw ?? 0)}
        </div>
      </div>
    </section>
  )
}

function buildMonthlySeries(matches) {
  const grouped = new Map()
  matches.forEach((match) => {
    const key = String(match.date || '').slice(0, 7)
    const bucket = grouped.get(key) || { labels: key, distance: [], stability: [], speed: [], scoreRate: [] }
    bucket.distance.push(Number(match.distance || 0))
    bucket.stability.push(Number(match.stability || 0))
    bucket.speed.push(Number(match.speed || 0))
    bucket.scoreRate.push(Number(match.scoreRate ?? match.winRate ?? 0))
    grouped.set(key, bucket)
  })

  const items = Array.from(grouped.values()).sort((a, b) => a.labels.localeCompare(b.labels))
  return {
    labels: items.map((item) => `${item.labels.slice(5)}月`),
    distance: items.map((item) => Math.round(item.distance.reduce((sum, value) => sum + value, 0) / Math.max(1, item.distance.length))),
    stability: items.map((item) => Math.round(item.stability.reduce((sum, value) => sum + value, 0) / Math.max(1, item.stability.length) * 100)),
    speed: items.map((item) => Math.round(item.speed.reduce((sum, value) => sum + value, 0) / Math.max(1, item.speed.length))),
    scoreRate: items.map((item) => Math.round(item.scoreRate.reduce((sum, value) => sum + value, 0) / Math.max(1, item.scoreRate.length) * 100)),
  }
}

function buildMatchSeries(matches) {
  return {
    labels: matches.map((match, index) => `M${index + 1}`),
    distance: matches.map((match) => Math.round(Number(match.distance || 0))),
    stability: matches.map((match) => Math.round(Number(match.stability || 0) * 100)),
    speed: matches.map((match) => Math.round(Number(match.speed || 0))),
    scoreRate: matches.map((match) => Math.round(Number(match.scoreRate ?? match.winRate ?? 0) * 100)),
  }
}

export default function UserGrowthTrend({ historyMatches = [] }) {
  const [filter, setFilter] = useState('match')
  const source = historyMatches.length ? historyMatches : FALLBACK_MATCHES

  const data = useMemo(() => {
    if (filter === 'month') return buildMonthlySeries(source)
    return buildMatchSeries(source)
  }, [filter, source])

  return (
    <section className="grid gap-5">
      <div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <h2 className="text-xl font-semibold tracking-wide text-white/90">用户成长趋势</h2>
        <div className="flex items-center gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={[
                'rounded-[8px] border px-3 py-1.5 text-sm transition',
                filter === item.key
                  ? 'border-[rgba(16,255,176,0.45)] bg-[rgba(16,255,176,0.12)] text-[#B9FFE8]'
                  : 'border-white/10 bg-[rgba(255,255,255,0.02)] text-white/65 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <TrendCard title="移动距离" unit="米" labels={data.labels} values={data.distance} valueFormatter={(value) => `${value} m`} />
        <TrendCard title="击球稳定性" unit="评分" labels={data.labels} values={data.stability} valueFormatter={(value) => `${value} / 100`} />
        <TrendCard title="平均球速" unit="km/h" labels={data.labels} values={data.speed} valueFormatter={(value) => `${value} km/h`} />
        <TrendCard title="得分率" unit="%" labels={data.labels} values={data.scoreRate} valueFormatter={(value) => `${value}%`} />
      </div>
    </section>
  )
}
