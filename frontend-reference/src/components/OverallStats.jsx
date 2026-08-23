import CourtCanvas from './CourtCanvas'

function Card({ title, children, className = '' }) {
  return (
    <section
      className={[
        'rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 text-center shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]',
        className,
      ].join(' ')}
    >
      <div className="mb-3 text-[15px] font-semibold tracking-[0.08em] text-white/65">{title}</div>
      {children}
    </section>
  )
}

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds || 0)))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function formatDistance(value) {
  const safe = Number(value || 0)
  if (safe >= 1000) return `${(safe / 1000).toFixed(2)} km`
  return `${safe.toFixed(0)} m`
}

function TrendChart({ pointsA = [], pointsB = [] }) {
  const safeA = pointsA.length ? pointsA : [0, 1]
  const safeB = pointsB.length ? pointsB : [0, 1]
  const all = [...safeA, ...safeB]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const toPolyline = (values) =>
    values.map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100
      const y = 100 - ((value - min) / Math.max(1, max - min || 1)) * 100
      return `${x},${y}`
    })

  return (
    <div className="relative h-[280px] rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <polyline fill="none" stroke="rgba(16,255,176,0.95)" strokeWidth="2.2" points={toPolyline(safeA).join(' ')} />
        <polyline fill="none" stroke="rgba(96,170,255,0.92)" strokeWidth="2.2" points={toPolyline(safeB).join(' ')} />
      </svg>
      <div className="mt-2 flex items-center gap-4 text-[13px] text-white/55">
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-[#10FFB0]" /> 球员A
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="h-2 w-2 rounded-full bg-[#60AAFF]" /> 球员B
        </span>
      </div>
    </div>
  )
}

export default function OverallStats({ data = null }) {
  const duration = formatDuration(data?.videoMeta?.duration ?? data?.duration ?? 0)
  const calories = Math.round(Number(data?.caloriesEstimate ?? 0))
  const scoreText = `${data?.score?.leftGames ?? 0} : ${data?.score?.rightGames ?? 0}`
  const pointTrendA = Array.isArray(data?.pointTrendA) ? data.pointTrendA : []
  const pointTrendB = Array.isArray(data?.pointTrendB) ? data.pointTrendB : []
  const heatmapPoints = Array.isArray(data?.heatmapPoints) ? data.heatmapPoints : []

  const resultStats = [
    { value: data?.outCount ?? 0, label: '出界次数' },
    { value: data?.inCount ?? 0, label: 'In球次数' },
    { value: data?.highlightCount ?? 0, label: '精彩回合数' },
  ]

  const core = [
    { value: data?.avgRallyLength ?? 0, label: '平均每分拍数' },
    { value: `${Number(data?.avgPointDuration ?? 0).toFixed(1)}s`, label: '平均每分时长' },
    { value: `${data?.speedEstimate ?? 0} km/h`, label: '平均球速' },
    { value: data?.longestRally ?? 0, label: '最长每分拍数' },
    { value: `${Number(data?.longestPointDuration ?? 0).toFixed(1)}s`, label: '最长每分时长' },
    { value: `${data?.maxSpeed ?? 0} km/h`, label: '最高球速' },
    { value: formatDistance(data?.totalDistance ?? (Number(data?.totalDistanceA ?? 0) + Number(data?.totalDistanceB ?? 0))), label: '总移动距离' },
    { value: formatDistance(data?.totalDistanceA ?? 0), label: '球员A移动距离' },
    { value: formatDistance(data?.totalDistanceB ?? 0), label: '球员B移动距离' },
  ]

  return (
    <section className="grid gap-5 xl:grid-cols-[480px_minmax(0,1fr)]">
      <div className="grid gap-5">
        <Card title="运动数据概览">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-center">
              <div className="text-[13px] text-white/45">运动时长</div>
              <div className="mt-1 text-2xl font-bold text-[#10FFB0]">{duration}</div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-center">
              <div className="text-[13px] text-white/45">卡路里消耗</div>
              <div className="mt-1 text-2xl font-bold text-white">{calories} kcal</div>
            </div>
          </div>
        </Card>

        <Card title="比赛结果统计">
          <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-5 text-center">
            <div className="text-3xl font-semibold text-white/85">球员A : 球员B</div>
            <div className="mt-2 text-5xl font-extrabold tracking-wide text-[#10FFB0]">{scoreText}</div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {resultStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[10px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-3 text-center"
                >
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="mt-1 text-[13px] text-white/45">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="得分分布图表">
          <TrendChart pointsA={pointTrendA} pointsB={pointTrendB} />
        </Card>
      </div>

      <div className="grid gap-5">
        <Card title="整体技术统计">
          <div className="grid grid-cols-3 gap-3">
            {core.map((item) => (
              <div
                key={item.label}
                className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-3 py-3 text-center"
              >
                <div className="truncate text-lg font-bold text-white">{item.value}</div>
                <div className="mt-1 text-[13px] text-white/45">{item.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="整段视频落点热力图">
          <CourtCanvas points={heatmapPoints} height={280} showEmptyText="暂无整段视频落点数据" />
        </Card>
      </div>
    </section>
  )
}
