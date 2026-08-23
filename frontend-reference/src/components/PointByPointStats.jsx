import { useMemo, useState } from 'react'
import CourtCanvas from './CourtCanvas'

function Card({ title, children, className = '' }) {
  return (
    <section
      className={[
        'rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]',
        className,
      ].join(' ')}
    >
      {title ? <div className="mb-3 text-[15px] font-semibold tracking-[0.08em] text-white/65">{title}</div> : null}
      {children}
    </section>
  )
}

function MetricTile({ value, label, accent = false }) {
  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-center">
      <div className={['truncate text-xl font-bold', accent ? 'text-[#10FFB0]' : 'text-white'].join(' ')}>{value}</div>
      <div className="mt-1 text-[13px] text-white/45">{label}</div>
    </div>
  )
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

function buildMockPointDetail(item, idx) {
  const seed = (idx + 1) * 97
  const shots = 4 + (seed % 15)
  const maxSpeed = 160 + (seed % 40)
  const avgSpeed = 105 + (seed % 26)
  const aDist = (10 + (seed % 12)) / 10
  const bDist = (10 + ((seed + 7) % 12)) / 10
  const depth = ['浅区', '中区', '深区'][seed % 3]
  const reach = `${72 + (seed % 18)}%`
  const endReason = item?.inOut === 'OUT' ? '出界' : '制胜分'
  const aiText =
    item?.inOut === 'OUT'
      ? '建议保持击球深度与节奏压迫，重点控制落点到边线附近，逼迫对手出界。'
      : '建议在优势回合持续上步抢点，减少被动相持，注意二发后前三拍的衔接。'
  return {
    shots,
    endReason,
    maxSpeed: `${maxSpeed} km/h`,
    avgSpeed: `${avgSpeed} km/h`,
    aDistance: `${aDist.toFixed(1)} m`,
    bDistance: `${bDist.toFixed(1)} m`,
    depth,
    reach,
    aiText,
    heatmapPoints: [[0.18 + ((idx * 37) % 50) / 100, 0.35 + ((idx * 23) % 55) / 100, 5]],
  }
}

export default function PointByPointStats({ scoreTimeline = [], pointDetails = [] }) {
  const points = useMemo(() => {
    if (scoreTimeline.length) return scoreTimeline
    return Array.from({ length: 12 }).map((_, i) => ({
      pointIndex: i + 1,
      t: 10 + i * 8,
      winner: i % 2 === 0 ? 'left' : 'right',
      inOut: i % 5 === 0 ? 'OUT' : 'IN',
    }))
  }, [scoreTimeline])

  const [selectedIdx, setSelectedIdx] = useState(0)
  const selected = points[Math.max(0, Math.min(points.length - 1, selectedIdx))]

  const detail = useMemo(() => {
    const real = pointDetails.find((item) => Number(item.pointIndex) === Number(selected?.pointIndex))
    if (real) {
      return {
        shots: real.shots ?? '-',
        endReason: real.endReason ?? '-',
        maxSpeed: real.maxSpeed != null ? `${real.maxSpeed} km/h` : '-',
        avgSpeed: real.avgSpeed != null ? `${real.avgSpeed} km/h` : '-',
        aDistance: real.leftDistance != null ? `${Number(real.leftDistance).toFixed(1)} m` : '-',
        bDistance: real.rightDistance != null ? `${Number(real.rightDistance).toFixed(1)} m` : '-',
        depth: real.depth ?? '-',
        reach: real.coverageRate != null ? `${Math.round(Number(real.coverageRate) * 100)}%` : '-',
        aiText: real.aiText ?? '暂无该分 AI 说明。',
        heatmapPoints: Array.isArray(real.heatmapPoints) ? real.heatmapPoints : [],
        landingX: real.landingX,
        landingY: real.landingY,
      }
    }
    return buildMockPointDetail(selected, selectedIdx)
  }, [pointDetails, selected, selectedIdx])

  const landingPoint =
    detail.landingX != null && detail.landingY != null
      ? { x: Number(detail.landingX), y: Number(detail.landingY) }
      : detail.heatmapPoints?.length
        ? { x: Number(detail.heatmapPoints[detail.heatmapPoints.length - 1][0]), y: Number(detail.heatmapPoints[detail.heatmapPoints.length - 1][1]) }
        : null

  const pointTimes = useMemo(() => {
    const start = Math.max(0, (selected?.t ?? 0) - 2.2)
    const end = Math.max(start, (points[selectedIdx + 1]?.t ?? (selected?.t ?? 0) + 6.8))
    const dur = Math.max(0.5, end - start)
    return { start, end, dur }
  }, [points, selected?.t, selectedIdx])

  const winnerLabel = selected?.winner === 'left' ? 'A' : 'B'

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_420px]">
      <Card title="逐分列表" className="min-h-0">
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          <div className="grid gap-2">
            {points.map((point, idx) => {
              const active = idx === selectedIdx
              const start = Math.max(0, (point?.t ?? 0) - 2.2)
              const end = Math.max(start, (points[idx + 1]?.t ?? (point?.t ?? 0) + 6.8))
              const dur = Math.max(0.5, end - start)
              return (
                <button
                  key={`${point.pointIndex}-${point.t}-${idx}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={[
                    'rounded-[10px] border px-4 py-3 text-left transition',
                    active
                      ? 'border-[rgba(16,255,176,0.45)] bg-[rgba(16,255,176,0.10)]'
                      : 'border-white/10 bg-[rgba(0,0,0,0.18)] hover:border-[rgba(16,255,176,0.25)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white/88">第 {point.pointIndex} 分</div>
                      <div className="mt-1 text-[13px] text-white/45">
                        {formatTime(start)} - {formatTime(end)} · {dur.toFixed(1)}s
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[13px] text-white/45">得分方</div>
                      <div className="mt-1 text-lg font-bold text-[#10FFB0]">{point.winner === 'left' ? 'A' : 'B'}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <Card title={`当前分数据（第 ${selected?.pointIndex ?? 1} 分）`}>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile value={`${detail.shots}`} label="总拍数" accent />
          <MetricTile value={detail.endReason} label="结束原因" />
          <MetricTile value={detail.maxSpeed} label="最大球速" accent />
          <MetricTile value={detail.avgSpeed} label="平均球速" />
          <MetricTile value={detail.aDistance} label="A移动距离" accent />
          <MetricTile value={detail.bDistance} label="B移动距离" />
          <MetricTile value={detail.depth} label="落点区域深度" />
          <MetricTile value={detail.reach} label="到位率" accent />
        </div>
      </Card>

      <div className="grid gap-5">
        <Card title="AI点评">
          <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-left">
            <div className="text-[13px] text-white/45">本分结论</div>
            <div className="mt-2 text-base font-semibold text-white/85">球员 {winnerLabel} 得分</div>
            <div className="mt-2 text-[13px] leading-6 text-white/65">{detail.aiText}</div>
          </div>
        </Card>

        <Card title="每一分落点图">
          <CourtCanvas
            points={detail.heatmapPoints ?? []}
            landingPoint={landingPoint}
            height={220}
            showEmptyText="暂无该分落点数据"
          />
        </Card>

        <button className="w-full rounded-[12px] border border-[rgba(16,255,176,0.22)] bg-[rgba(255,255,255,0.03)] py-3 text-base font-semibold text-white/85 transition hover:border-[rgba(16,255,176,0.45)] hover:bg-[rgba(16,255,176,0.08)]">
          是否为精彩回合（点击标记）
        </button>
      </div>
    </section>
  )
}
