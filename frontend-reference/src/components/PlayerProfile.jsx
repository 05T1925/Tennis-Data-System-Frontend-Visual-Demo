import { useMemo, useState } from 'react'

const FALLBACK = {
  A: {
    stance: '底线型',
    forehandZone: '中路深区',
    backhandZone: '左侧中区',
    serve: { firstWin: 61, secondWin: 43, aceRate: 8, avgSpeed: 135 },
    attack: { diff: '+4', efficiency: 72, shotsPerPoint: 4.8, style: '均衡型' },
    rally: { histogram: [4, 8, 12, 10, 7, 5], fit: [6, 8, 10, 10, 7, 6], rhythm: '均衡' },
  },
  B: {
    stance: '上网型',
    forehandZone: '右侧深区',
    backhandZone: '中路中区',
    serve: { firstWin: 58, secondWin: 40, aceRate: 6, avgSpeed: 128 },
    attack: { diff: '+2', efficiency: 66, shotsPerPoint: 4.2, style: '快攻型' },
    rally: { histogram: [5, 9, 10, 8, 6, 4], fit: [7, 8, 9, 8, 6, 5], rhythm: '快攻' },
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

function Ring({ percent, label }) {
  const safe = Math.max(0, Math.min(100, Number(percent || 0)))
  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
      <div className="relative mx-auto h-20 w-20">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(rgba(16,255,176,0.9) ${safe * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}
        />
        <div className="absolute inset-[7px] grid place-items-center rounded-full bg-[#0A0E17] text-sm font-bold text-white">
          {safe}%
        </div>
      </div>
      <div className="mt-2 text-[12px] text-white/45">{label}</div>
    </div>
  )
}

function HeatCourt({ forehandZone, backhandZone }) {
  const cells = [
    [0.12, 0.22, 0.35, 0.25, 0.15],
    [0.2, 0.36, 0.48, 0.38, 0.22],
    [0.18, 0.32, 0.62, 0.34, 0.18],
  ]
  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <div className="grid grid-cols-5 gap-2">
        {cells.flatMap((row, rowIndex) =>
          row.map((value, columnIndex) => (
            <div key={`${rowIndex}-${columnIndex}`} className="h-12 rounded-[6px]" style={{ background: `rgba(16,255,176,${value})` }} />
          )),
        )}
      </div>
      <div className="mt-2 text-[12px] text-white/45">正手偏好区：{forehandZone} · 反手偏好区：{backhandZone}</div>
    </div>
  )
}

function AttackBars({ efficiency }) {
  const safe = Math.max(0, Math.min(100, Number(efficiency || 0)))
  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <div className="mb-2 flex items-center justify-between text-[13px] text-white/65">
        <span>攻击效率评分</span>
        <span>{safe}</span>
      </div>
      <div className="h-3 rounded-full bg-white/10">
        <div className="h-3 rounded-full bg-[#10FFB0]" style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

function RallyHistogram({ bars, fit }) {
  const safeBars = bars?.length ? bars : [1, 2, 3, 3, 2, 1]
  const safeFit = fit?.length ? fit : safeBars
  const maxValue = Math.max(...safeBars, ...safeFit, 1)

  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <div className="grid h-40 grid-cols-6 items-end gap-2">
        {safeBars.map((value, index) => (
          <div key={index} className="relative h-full">
            <div className="absolute bottom-0 w-full rounded-t-[4px] bg-[#10FFB0]/70" style={{ height: `${(value / maxValue) * 100}%` }} />
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#60AAFF]"
              style={{ bottom: `${(safeFit[index] / maxValue) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[12px] text-white/45">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#10FFB0]" /> 直方图</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#60AAFF]" /> 平滑线</span>
      </div>
    </div>
  )
}

export default function PlayerProfile({ profileStats = null }) {
  const [player, setPlayer] = useState('A')
  const players = profileStats?.players ?? FALLBACK
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
        <Card title="站位偏好与击球热点">
          <HeatCourt forehandZone={data.forehandZone} backhandZone={data.backhandZone} />
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
              <div className="text-lg font-bold text-[#10FFB0]">{data.stance}</div>
              <div className="text-[12px] text-white/45">自动识别类型</div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
              <div className="text-sm font-semibold text-white">{data.forehandZone}</div>
              <div className="text-[12px] text-white/45">正手偏好区域</div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
              <div className="text-sm font-semibold text-white">{data.backhandZone}</div>
              <div className="text-[12px] text-white/45">反手偏好区域</div>
            </div>
          </div>
        </Card>

        <Card title="发球局统治力">
          <div className="grid grid-cols-2 gap-3">
            <Ring percent={data.serve.firstWin} label="一发得分率" />
            <Ring percent={data.serve.secondWin} label="二发得分率" />
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
              <div className="text-2xl font-bold text-[#10FFB0]">{data.serve.aceRate}%</div>
              <div className="text-[12px] text-white/45">发球直得率</div>
            </div>
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
              <div className="text-2xl font-bold text-white">{data.serve.avgSpeed}</div>
              <div className="text-[12px] text-white/45">发球平均球速 km/h</div>
            </div>
          </div>
        </Card>

        <Card title="制胜分与失误比">
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-2xl font-bold text-[#10FFB0]">{data.attack.diff}</div>
                <div className="text-[12px] text-white/45">制胜分-非受迫失误</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-2xl font-bold text-white">{data.attack.shotsPerPoint}</div>
                <div className="text-[12px] text-white/45">每得1分平均拍数</div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
                <div className="text-2xl font-bold text-white">{data.attack.style}</div>
                <div className="text-[12px] text-white/45">节奏类型</div>
              </div>
            </div>
            <AttackBars efficiency={data.attack.efficiency} />
          </div>
        </Card>

        <Card title="回合长度分布">
          <RallyHistogram bars={data.rally.histogram} fit={data.rally.fit} />
          <div className="mt-3 rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3 text-center">
            <div className="text-xl font-bold text-[#10FFB0]">{data.rally.rhythm}</div>
            <div className="text-[12px] text-white/45">比赛节奏</div>
          </div>
        </Card>
      </div>
    </section>
  )
}
