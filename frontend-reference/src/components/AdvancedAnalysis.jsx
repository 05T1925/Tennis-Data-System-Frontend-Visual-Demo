import { useEffect, useMemo, useRef, useState } from 'react'
import { clamp, drawCourtBackground } from './CourtCanvas'
import PlayerProfile from './PlayerProfile'
import Stability from './Stability'

const TABS = [
  { key: 'overview', label: '总览' },
  { key: 'shotType', label: '击球类型分析' },
  { key: 'movement', label: '跑动轨迹' },
  { key: 'radar', label: '能力雷达' },
  { key: 'stability', label: '稳定性' },
  { key: 'profile', label: '画像与技术分析' },
]

function Card({ title, children, className = '' }) {
  return (
    <section
      className={[
        'rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]',
        className,
      ].join(' ')}
    >
      <div className="mb-3 text-[14px] font-semibold tracking-[0.08em] text-white/70">{title}</div>
      {children}
    </section>
  )
}

function buildShotTypeRows(data) {
  const timeline = Array.isArray(data?.shotTimeline) ? data.shotTimeline : []
  const counts = {
    forehand: 0,
    backhand: 0,
    serve: 0,
    other: 0,
  }

  timeline.forEach((shot) => {
    const phase = String(shot.shotPhase || '').toLowerCase()
    const side = String(shot.strokeSide || '').toLowerCase()
    if (phase === 'serve') counts.serve += 1
    if (side === 'forehand') counts.forehand += 1
    else if (side === 'backhand') counts.backhand += 1
    else counts.other += 1
  })

  return [
    { label: '正手', value: counts.forehand, color: 'bg-[#10FFB0]' },
    { label: '反手', value: counts.backhand, color: 'bg-[#60AAFF]' },
    { label: '发球', value: counts.serve, color: 'bg-[#F6C64A]' },
    { label: '其他', value: counts.other, color: 'bg-[#4FD27F]' },
  ]
}

function ShotTypeBars({ data }) {
  const rows = useMemo(() => buildShotTypeRows(data), [data])
  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between text-[13px] text-white/75">
            <span>{row.label}</span>
            <span className="text-white/55">{row.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10">
            <div className={`${row.color} h-2.5 rounded-full`} style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function RadarChart({ radarData = {} }) {
  const radar = useMemo(
    () => [
      { label: '进攻', value: Number(radarData.attack || 0), angle: -90 },
      { label: '防守', value: Number(radarData.defense || 0), angle: -18 },
      { label: '耐力', value: Number(radarData.stamina || 0), angle: 54 },
      { label: '心态', value: Number(radarData.mentality || 0), angle: 126 },
      { label: '战术', value: Number(radarData.tactic || 0), angle: 198 },
    ],
    [radarData],
  )
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    const duration = 700
    const tick = (ts) => {
      if (!start) start = ts
      const t = Math.min(1, (ts - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setProgress(eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    setProgress(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [radarData])

  const ringScales = [1, 0.8, 0.6, 0.4, 0.2]
  const polygonPoints = radar
    .map((item) => {
      const r = (item.value / 100) * 38 * progress
      const rad = (item.angle * Math.PI) / 180
      const x = 50 + r * Math.cos(rad)
      const y = 50 + r * Math.sin(rad)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  return (
    <div className="rounded-[12px] border border-white/10 bg-[rgba(0,0,0,0.22)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
      <div className="mb-3 text-center text-[15px] font-semibold tracking-[0.06em] text-white/85">能力雷达</div>
      <svg viewBox="0 0 100 100" className="mx-auto h-[300px] w-[300px]">
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(16,255,176,0.45)" />
            <stop offset="100%" stopColor="rgba(16,255,176,0.12)" />
          </linearGradient>
        </defs>

        {ringScales.map((scale) => {
          const points = radar
            .map((item) => {
              const r = 38 * scale
              const rad = (item.angle * Math.PI) / 180
              const x = 50 + r * Math.cos(rad)
              const y = 50 + r * Math.sin(rad)
              return `${x.toFixed(2)},${y.toFixed(2)}`
            })
            .join(' ')
          return <polygon key={scale} points={points} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.35" strokeDasharray="1.4 1.2" />
        })}

        <polygon points={polygonPoints} fill="url(#radarFill)" stroke="rgba(16,255,176,0.96)" strokeWidth="1.2" />

        {radar.map((item) => {
          const rad = (item.angle * Math.PI) / 180
          const lx = 50 + 45 * Math.cos(rad)
          const ly = 50 + 45 * Math.sin(rad)
          return (
            <g key={item.label}>
              <circle
                cx={50 + ((item.value / 100) * 38 * progress) * Math.cos(rad)}
                cy={50 + ((item.value / 100) * 38 * progress) * Math.sin(rad)}
                r="1.2"
                fill="rgba(16,255,176,0.95)"
              />
              <text x={lx} y={ly} fill="rgba(255,255,255,0.88)" fontSize="3.2" textAnchor="middle" dominantBaseline="middle">
                {item.label}
              </text>
              <text x={lx} y={ly + 4.2} fill="rgba(16,255,176,0.9)" fontSize="3.2" textAnchor="middle" dominantBaseline="middle">
                {Math.round(item.value * progress)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function MovementPaths({ movementPaths = {} }) {
  const canvasRef = useRef(null)
  const players = [
    { key: 'A', label: '球员A', color: '#10FFB0' },
    { key: 'B', label: '球员B', color: '#60AAFF' },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.clientWidth || 640
    const height = 320
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    const bounds = drawCourtBackground(ctx, width, height)

    const drawPath = (points, color) => {
      const safePoints = Array.isArray(points) ? points : []
      if (!safePoints.length) return

      ctx.beginPath()
      safePoints.forEach((point, index) => {
        const x = bounds.left + clamp(Number(point.x || 0.5), 0, 1) * bounds.courtWidth
        const y = bounds.top + clamp(Number(point.y || 0.5), 0, 1) * bounds.courtHeight
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.shadowBlur = 0

      safePoints.forEach((point, index) => {
        const x = bounds.left + clamp(Number(point.x || 0.5), 0, 1) * bounds.courtWidth
        const y = bounds.top + clamp(Number(point.y || 0.5), 0, 1) * bounds.courtHeight
        const radius = index === safePoints.length - 1 ? 5 : 3.5
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.lineWidth = index === safePoints.length - 1 ? 2 : 1.5
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'
        ctx.stroke()
      })
    }

    players.forEach((player) => {
      drawPath(movementPaths[player.key], player.color)
    })
  }, [movementPaths])

  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <canvas
        ref={canvasRef}
        className="block h-[320px] w-full rounded-[8px] border border-white/10"
      />
      <div className="mt-2 flex items-center gap-4 text-[12px] text-white/55">
        {players.map((player) => (
          <span key={player.key} className="inline-flex items-center gap-1">
            <i className="h-2 w-2 rounded-full" style={{ background: player.color }} /> {player.label}
          </span>
        ))}
      </div>
      <div className="mt-2 text-center text-[13px] text-white/45">标准网球场跑动轨迹图</div>
    </div>
  )
}

function OverviewLayout({ data }) {
  const insights = data?.insights ?? { labels: [], aiTips: [] }
  const stabilityStats = data?.stabilityStats ?? {}
  const profileStats = data?.profileStats ?? {}

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)_340px]">
      <div className="grid gap-5">
        <Card title="击球类型分析">
          <ShotTypeBars data={data} />
        </Card>
        <Card title="跑动轨迹">
          <MovementPaths movementPaths={data?.movementPaths ?? {}} />
        </Card>
      </div>

      <div className="grid gap-5">
        <Card title="能力雷达">
          <RadarChart radarData={data?.radarData ?? {}} />
        </Card>
        <Card title="稳定性">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['连续稳定得分率', `${Math.round(Number(stabilityStats.consecutiveScoreRate || 0) * 100)}%`],
              ['非受迫失误率', `${Math.round(Number(stabilityStats.unforcedErrorRate || 0) * 100)}%`],
              ['关键分成功率', `${Math.round(Number(stabilityStats.criticalPointRate || 0) * 100)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-3 py-3 text-center">
                <div className="text-lg font-bold text-[#10FFB0]">{value}</div>
                <div className="mt-1 text-[12px] text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5">
        <Card title="画像与技术分析">
          <div className="space-y-2 text-[13px] text-white/65">
            <p>标签：{insights.labels?.length ? insights.labels.join(' / ') : '比赛数据已就绪'}</p>
            <p>画像：{profileStats.players?.A?.attack?.style || '均衡型'}选手，当前以简化比赛口径生成。</p>
            <div className="mt-3 grid gap-2">
              {[
                ['进攻效率', profileStats.attackEfficiency ?? 0],
                ['相持耐力', profileStats.rallyStamina ?? 0],
                ['稳定性评分', stabilityStats.stabilityScore ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-3 py-2">
                  <span className="text-[12px] text-white/50">{label}</span>
                  <span className="text-sm font-semibold text-[#10FFB0]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="训练建议摘要">
          <div className="space-y-2 text-[13px] text-white/60">
            {(insights.aiTips?.length ? insights.aiTips : ['建议优先减少中低速来球的主动失误。']).map((tip, index) => (
              <p key={`${index}-${tip}`}>{index + 1}. {tip}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function AdvancedAnalysis({ data = null }) {
  const [tab, setTab] = useState('overview')

  return (
    <section className="grid gap-5">
      <div className="overflow-x-auto rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-2">
        <div className="flex min-w-max items-center gap-2">
          {TABS.map((item) => {
            const active = tab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={[
                  'rounded-[10px] border px-4 py-2 text-sm transition',
                  active
                    ? 'border-[rgba(16,255,176,0.45)] bg-[rgba(16,255,176,0.12)] text-[#B9FFE8]'
                    : 'border-white/10 bg-[rgba(255,255,255,0.02)] text-white/70 hover:border-[rgba(16,255,176,0.25)] hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'overview' && <OverviewLayout data={data} />}
      {tab === 'shotType' && (
        <Card title="击球类型分析">
          <ShotTypeBars data={data} />
        </Card>
      )}
      {tab === 'movement' && (
        <Card title="跑动轨迹">
          <MovementPaths movementPaths={data?.movementPaths ?? {}} />
        </Card>
      )}
      {tab === 'radar' && (
        <Card title="能力雷达">
          <RadarChart radarData={data?.radarData ?? {}} />
        </Card>
      )}
      {tab === 'stability' && <Stability stabilityStats={data?.stabilityStats} />}
      {tab === 'profile' && <PlayerProfile profileStats={data?.profileStats} />}
    </section>
  )
}
