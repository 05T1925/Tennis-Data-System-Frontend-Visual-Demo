import { useEffect, useMemo, useState } from 'react'
import { FaChevronDown, FaChevronUp, FaPen, FaSyncAlt } from 'react-icons/fa'

const POINT_LABELS = ['0', '15', '30', '40', 'AD']

function clampInt(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function toPointIndex(v) {
  const s = String(v)
  return Math.max(0, POINT_LABELS.indexOf(s))
}

function addPointByRule(side, score) {
  const next = { ...score }
  const me = side === 'left' ? 'leftPoints' : 'rightPoints'
  const op = side === 'left' ? 'rightPoints' : 'leftPoints'
  const meIdx = toPointIndex(next[me])
  const opIdx = toPointIndex(next[op])

  if (side === 'left') next.leftScore = Number(next.leftScore || 0) + 1
  else next.rightScore = Number(next.rightScore || 0) + 1

  if (meIdx === 4) {
    next[side === 'left' ? 'leftGames' : 'rightGames'] += 1
    next.leftPoints = '0'
    next.rightPoints = '0'
    next.server = next.server === 'left' ? 'right' : 'left'
    return next
  }

  if (opIdx === 4) {
    next.leftPoints = '40'
    next.rightPoints = '40'
    return next
  }

  if (meIdx === 3 && opIdx === 3) {
    next[me] = 'AD'
    return next
  }

  if (meIdx === 3 && opIdx < 3) {
    next[side === 'left' ? 'leftGames' : 'rightGames'] += 1
    next.leftPoints = '0'
    next.rightPoints = '0'
    next.server = next.server === 'left' ? 'right' : 'left'
    return next
  }

  const idx = Math.min(3, meIdx + 1)
  next[me] = POINT_LABELS[idx]
  return next
}

function prevPointByRule(side, score) {
  const next = { ...score }
  const me = side === 'left' ? 'leftPoints' : 'rightPoints'
  const idx = toPointIndex(next[me])
  next[me] = POINT_LABELS[Math.max(0, Math.min(3, idx - 1))]
  return next
}

function StatChip({ label, value, accent = false }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-3">
      <div className="text-[11px] text-white/45">{label}</div>
      <div className={['mt-1 text-sm font-semibold', accent ? 'text-[#10FFB0]' : 'text-white/85'].join(' ')}>
        {value}
      </div>
    </div>
  )
}

function formatShotLabel(shot) {
  if (!shot) return '等待视频播放'
  const side = shot.strokeSide === 'backhand' ? '反手' : shot.strokeType === 'serve' ? '发球' : '正手'
  const phase = shot.shotPhase ? ` / ${shot.shotPhase}` : ''
  return `${side}${phase}`
}

function formatShotOwner(shot) {
  if (!shot) return '-'
  return shot.hitterSide === 'left' ? '球员 A' : shot.hitterSide === 'right' ? '球员 B' : String(shot.hitterId || '-')
}

function formatShotResult(shot) {
  if (!shot) return '-'

  const raw = String(shot.outcome || shot.endingReason || '').toLowerCase()
  if (!raw) return '-'

  if (raw === 'error') return '终结失分'
  if (raw === 'fault') return '失误丢分'
  if (raw === 'winner') return '直接得分'
  if (raw === 'ace') return '发球直得'
  if (raw === 'net') return '下网终结'
  if (raw === 'out') return '出界终结'

  return String(shot.outcome || shot.endingReason)
}

export default function RightPanel({
  data,
  currentDecision,
  currentScore,
  currentPointDetail,
  currentShot,
  currentTime = 0,
  scoreTimeline = [],
  onJumpToPoint,
  activeMenu = 'overview',
}) {
  const [statsOpen, setStatsOpen] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [manualScore, setManualScore] = useState(null)

  const live = useMemo(
    () => ({
      leftSets: currentScore?.leftSets ?? 0,
      rightSets: currentScore?.rightSets ?? 0,
      leftGames: currentScore?.leftGames ?? 0,
      rightGames: currentScore?.rightGames ?? 0,
      leftScore: currentScore?.leftScore ?? 0,
      rightScore: currentScore?.rightScore ?? 0,
      leftPoints: String(currentScore?.leftPoints ?? '0'),
      rightPoints: String(currentScore?.rightPoints ?? '0'),
      server: currentScore?.server ?? 'right',
    }),
    [currentScore],
  )

  const display = manualMode && manualScore ? manualScore : live

  useEffect(() => {
    if (!manualMode) {
      setManualScore(null)
    }
  }, [manualMode, live])

  function enterManual() {
    if (manualMode && manualScore) return
    setManualMode(true)
    setManualScore({ ...live })
  }

  function resetFollow() {
    setManualMode(false)
    setManualScore(null)
  }

  function incGames(side, delta) {
    enterManual()
    setManualScore((s) => {
      const base = s ?? { ...live }
      return {
        ...base,
        [side === 'left' ? 'leftGames' : 'rightGames']: clampInt(
          (base[side === 'left' ? 'leftGames' : 'rightGames'] ?? 0) + delta,
          0,
          7,
        ),
      }
    })
  }

  function addPoint(side) {
    enterManual()
    setManualScore((s) => addPointByRule(side, s ?? { ...live }))
  }

  function prevPoint(side) {
    enterManual()
    setManualScore((s) => prevPointByRule(side, s ?? { ...live }))
  }

  const replayText = useMemo(() => {
    if (!currentDecision) return '等待视频播放到得分节点后展示回合说明。'
    const winnerText = currentDecision.winner === 'left' ? '球员 A 得分' : '球员 B 得分'
    const way = currentDecision.inOut === 'OUT' ? '通过对手失误得分' : '通过主动压制得分'
    return `${winnerText}，本分${way}。数字比分和网球计分都会跟着视频时间同步更新。`
  }, [currentDecision])

  const aiInsight = useMemo(() => {
    if (currentPointDetail?.aiText) return currentPointDetail.aiText
    if (activeMenu === 'advanced') {
      return '建议结合逐拍序列观察发球后前两拍的压迫质量。'
    }
    return '当前右侧面板会跟随视频时间同步刷新数字比分、网球计分和逐拍数据。'
  }, [activeMenu, currentPointDetail?.aiText])

  return (
    <div className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)] backdrop-blur-[12px]">
      <div className="grid gap-4">
        <section className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.25)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">实时比分</div>
            <div className="text-xs text-white/55">视频时间 {currentTime.toFixed(1)}s</div>
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] text-white/45">数字比分</div>
                <div className="mt-2 text-3xl font-extrabold text-[#10FFB0]">
                  {display.leftScore} : {display.rightScore}
                </div>
              </div>
              <div className="rounded-[10px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <div className="text-[11px] text-white/45">网球计分</div>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  {display.leftPoints} : {display.rightPoints}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatChip label="局分" value={`${display.leftGames} : ${display.rightGames}`} accent />
              <StatChip label="盘分" value={`${display.leftSets} : ${display.rightSets}`} />
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className={manualMode ? 'text-[#10FFB0]' : 'text-white/45'}>
                {manualMode ? '手动模式' : '跟随视频'}
              </span>
              <div className="text-white/55">发球方：{display.server === 'left' ? '球员 A' : '球员 B'}</div>
            </div>

            <div className="grid grid-cols-[1fr_28px_1fr] items-start gap-2">
              <div>
                <div className="text-[12px] font-semibold tracking-[0.08em] text-white/65">Player A</div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="text-[38px] font-extrabold leading-none text-white">{display.leftGames}</div>
                  <div className="flex flex-col gap-1 pb-1">
                    <button
                      className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] text-white/70 hover:border-[rgba(16,255,176,0.30)]"
                      onClick={() => incGames('left', +1)}
                    >
                      +1
                    </button>
                    <button
                      className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] text-white/70 hover:border-[rgba(16,255,176,0.30)]"
                      onClick={() => incGames('left', -1)}
                    >
                      -1
                    </button>
                  </div>
                  <FaPen className="mb-2 text-white/35" size={14} />
                </div>
              </div>

              <div className="pt-4 text-center text-2xl font-bold text-white/50">:</div>

              <div className="text-right">
                <div className="text-[12px] font-semibold tracking-[0.08em] text-white/65">Player B</div>
                <div className="mt-2 flex items-end justify-end gap-2">
                  <FaPen className="mb-2 text-white/35" size={14} />
                  <div className="flex flex-col gap-1 pb-1">
                    <button
                      className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] text-white/70 hover:border-[rgba(16,255,176,0.30)]"
                      onClick={() => incGames('right', +1)}
                    >
                      +1
                    </button>
                    <button
                      className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-2 py-1 text-[11px] text-white/70 hover:border-[rgba(16,255,176,0.30)]"
                      onClick={() => incGames('right', -1)}
                    >
                      -1
                    </button>
                  </div>
                  <div className="text-[38px] font-extrabold leading-none text-white">{display.rightGames}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => addPoint('left')}
                  className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-semibold text-white/80 hover:border-[rgba(16,255,176,0.30)]"
                >
                  左得分
                </button>
                <button
                  onClick={() => prevPoint('left')}
                  className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-semibold text-white/55 hover:border-[rgba(16,255,176,0.30)]"
                >
                  左回退
                </button>
              </div>

              <button
                onClick={resetFollow}
                disabled={!manualMode}
                className="rounded-[8px] border border-white/10 px-3 py-2 text-[12px] text-white/60 disabled:opacity-50"
              >
                恢复跟随
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => prevPoint('right')}
                  className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-semibold text-white/55 hover:border-[rgba(16,255,176,0.30)]"
                >
                  右回退
                </button>
                <button
                  onClick={() => addPoint('right')}
                  className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[12px] font-semibold text-white/80 hover:border-[rgba(16,255,176,0.30)]"
                >
                  右得分
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-4">
          <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">当前逐拍信息</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatChip label="当前击球人" value={formatShotOwner(currentShot)} accent />
            <StatChip label="当前拍类型" value={formatShotLabel(currentShot)} />
            <StatChip label="当前球速" value={currentShot?.speed != null ? `${currentShot.speed} km/h` : '-'} accent />
            <StatChip label="当前拍结果" value={formatShotResult(currentShot)} />
            <StatChip label="落点深度" value={currentShot?.depthZone || '-'} />
            <StatChip label="落点方向" value={currentShot?.direction || '-'} />
          </div>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-4">
          <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">当前分数据</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <StatChip label="当前分序号" value={currentPointDetail?.pointIndex ?? '-'} accent />
            <StatChip label="总拍数" value={currentPointDetail?.shots ?? '-'} />
            <StatChip
              label="本分时长"
              value={currentPointDetail?.duration != null ? `${Number(currentPointDetail.duration).toFixed(1)} s` : '-'}
            />
            <StatChip
              label="最大球速"
              value={currentPointDetail?.maxSpeed != null ? `${currentPointDetail.maxSpeed} km/h` : '-'}
              accent
            />
            <StatChip label="结束原因" value={currentPointDetail?.endReason ?? '-'} />
            <StatChip label="到位率" value={currentPointDetail?.coverageRate != null ? `${Math.round(currentPointDetail.coverageRate * 100)}%` : '-'} />
          </div>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-4">
          <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">回合复盘</div>
          <div className="mt-3 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.02)] p-3">
            <div className="text-[11px] text-white/45">当前回合说明</div>
            <div className="mt-2 text-[13px] leading-6 text-white/78">{replayText}</div>
          </div>
          <div className="mt-3 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-[#8BFFD9]">AI 洞察</div>
              <button
                className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-2 text-white/55 hover:border-[rgba(16,255,176,0.30)]"
                onClick={() => {
                  alert('演示版：当前 AI 文案按逐分结果动态切换。')
                }}
                aria-label="刷新 AI 建议"
              >
                <FaSyncAlt />
              </button>
            </div>
            <div className="mt-2 text-[13px] leading-6 text-[#C9FFE6]">{aiInsight}</div>
          </div>
        </section>

        <section className="rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.14)] p-4">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">比分时间轴</div>
            <button
              className="rounded-[8px] border border-white/10 px-2 py-1 text-white/60"
              onClick={() => setStatsOpen((v) => !v)}
              aria-label="展开或收起回合记录"
            >
              {statsOpen ? <FaChevronUp className="text-white/45" /> : <FaChevronDown className="text-white/45" />}
            </button>
          </div>

          {statsOpen ? (
            <div className="mt-3 max-h-[170px] overflow-y-auto pr-1">
              <div className="relative">
                {scoreTimeline.map((row) => {
                  const active = Number(currentPointDetail?.pointIndex) === Number(row.pointIndex)
                  return (
                    <button
                      key={`${row.pointIndex}-${row.t}`}
                      onClick={() => onJumpToPoint?.(row)}
                      className={[
                        'relative mb-3 block w-full rounded-[8px] border px-3 py-2 text-left',
                        active
                          ? 'border-[rgba(16,255,176,0.35)] bg-[rgba(16,255,176,0.08)]'
                          : 'border-white/10 bg-[rgba(255,255,255,0.02)] hover:border-[rgba(16,255,176,0.28)]',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-semibold text-white/85">
                          第 {row.pointIndex} 分 · {row.winner === 'left' ? '球员 A' : '球员 B'} 得分
                        </span>
                        <span className={row.inOut === 'OUT' ? 'text-[#E05A67]' : 'text-[#10FFB0]'}>{row.inOut}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-white/50">
                        时间 {Number(row.t).toFixed(1)}s · 数字比分 {row.leftScore ?? 0}:{row.rightScore ?? 0}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
