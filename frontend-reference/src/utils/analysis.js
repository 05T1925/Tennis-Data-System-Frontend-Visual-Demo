const DEFAULT_COURT_BOUNDS = {
  minX: 0.22,
  maxX: 0.82,
  minY: 0.34,
  maxY: 0.90,
}

const DEFAULT_HISTORY_MATCHES = [
  { date: '2025-03-01', stability: 0.72, distance: 380, winRate: 0.5 },
  { date: '2025-03-15', stability: 0.78, distance: 412, winRate: 0.6 },
  { date: '2025-03-29', stability: 0.74, distance: 398, winRate: 0.55 },
  { date: '2025-04-12', stability: 0.81, distance: 445, winRate: 0.7 },
  { date: '2025-04-26', stability: 0.85, distance: 426, winRate: 0.68 },
]

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function pointLabel(pointsLeft, pointsRight, side) {
  const me = side === 'left' ? pointsLeft : pointsRight
  const op = side === 'left' ? pointsRight : pointsLeft
  if (pointsLeft >= 3 && pointsRight >= 3) {
    if (pointsLeft === pointsRight) return '40'
    if (me === op + 1) return 'AD'
    if (op === me + 1) return '40'
  }
  return ['0', '15', '30', '40'][Math.min(me, 3)]
}

function buildRallies(events) {
  const map = new Map()
  for (const e of events) {
    if (!map.has(e.rallyId)) {
      map.set(e.rallyId, {
        id: e.rallyId,
        start: e.t,
        end: e.t,
        shots: 0,
        winner: e.winner,
      })
    }
    const r = map.get(e.rallyId)
    r.end = e.t
    r.shots += 1
    r.winner = e.winner
  }
  return Array.from(map.values()).map((r) => ({
    ...r,
    distance: 16 + r.shots * 4,
  }))
}

function buildHighlights(rallies) {
  return rallies
    .filter((r) => r.shots >= 3)
    .slice(0, 8)
    .map((r) => ({
      id: `hl-${r.id}`,
      label: `回合 #${r.id}（${r.shots}拍）`,
      start: Math.max(0, r.start - 1.2),
      end: r.end + 1.2,
      reason: r.shots >= 5 ? '长回合' : '高跑动',
    }))
}

export function judgeInOut(x, y, bounds = DEFAULT_COURT_BOUNDS) {
  if (x == null || y == null) return 'OUT'
  const inX = x >= bounds.minX && x <= bounds.maxX
  const inY = y >= bounds.minY && y <= bounds.maxY
  return inX && inY ? 'IN' : 'OUT'
}

export function buildScoreTimeline(events) {
  const state = {
    leftSets: 0,
    rightSets: 0,
    leftGames: 0,
    rightGames: 0,
    pointsLeft: 0,
    pointsRight: 0,
    server: 'right',
  }

  return events.map((e) => {
    if (e.winner === 'left') state.pointsLeft += 1
    else state.pointsRight += 1

    const diff = Math.abs(state.pointsLeft - state.pointsRight)
    const maxPoint = Math.max(state.pointsLeft, state.pointsRight)
    if (maxPoint >= 4 && diff >= 2) {
      if (state.pointsLeft > state.pointsRight) state.leftGames += 1
      else state.rightGames += 1
      state.pointsLeft = 0
      state.pointsRight = 0
      state.server = state.server === 'left' ? 'right' : 'left'
    }

    const gameDiff = Math.abs(state.leftGames - state.rightGames)
    const maxGame = Math.max(state.leftGames, state.rightGames)
    if (maxGame >= 6 && gameDiff >= 2) {
      if (state.leftGames > state.rightGames) state.leftSets += 1
      else state.rightSets += 1
      state.leftGames = 0
      state.rightGames = 0
      state.pointsLeft = 0
      state.pointsRight = 0
    }

    return {
      pointIndex: e.pointIndex,
      t: e.t,
      inOut: e.inOut,
      winner: e.winner,
      leftSets: state.leftSets,
      rightSets: state.rightSets,
      leftGames: state.leftGames,
      rightGames: state.rightGames,
      leftPoints: pointLabel(state.pointsLeft, state.pointsRight, 'left'),
      rightPoints: pointLabel(state.pointsLeft, state.pointsRight, 'right'),
      server: state.server,
    }
  })
}

export function deriveStats(events, rallies) {
  const totalShots = events.length
  const totalRallies = rallies.length
  const longestRally = rallies.reduce((acc, r) => Math.max(acc, r.shots), 0)
  const avgRallyLength = totalRallies > 0 ? Number((totalShots / totalRallies).toFixed(1)) : 0
  const distanceCovered = Math.round(rallies.reduce((acc, r) => acc + (r.distance || 0), 0))
  const speedEstimate = Math.round(
    events.reduce((acc, e) => acc + Number(e.speed || 0), 0) / Math.max(1, totalShots),
  )
  const outCount = events.filter((e) => e.inOut === 'OUT').length
  const leftWins = events.filter((e) => e.winner === 'left').length
  return {
    totalShots,
    totalRallies,
    longestRally,
    avgRallyLength,
    distanceCovered,
    speedEstimate,
    errorRate: Number((outCount / Math.max(1, totalShots)).toFixed(2)),
    scoreRate: Number((leftWins / Math.max(1, totalShots)).toFixed(2)),
  }
}

function pickWinnerByHitter(hitterId, sideByPlayerId, fallbackWinner) {
  const side = sideByPlayerId.get(String(hitterId))
  if (side === 'left' || side === 'right') return side
  return fallbackWinner
}

function normalizeCourtPoint(point, range) {
  if (!Array.isArray(point) || point.length < 2) return null
  if (!range) return null
  const nx = (Number(point[0]) - range.minX) / Math.max(1e-6, range.maxX - range.minX)
  const ny = (Number(point[1]) - range.minY) / Math.max(1e-6, range.maxY - range.minY)
  return { x: clamp(nx, 0, 1), y: clamp(ny, 0, 1) }
}

function collectCourtRange(frames) {
  const values = []
  for (const frame of frames) {
    if (Array.isArray(frame?.ball?.court) && frame.ball.court.length >= 2) values.push(frame.ball.court)
    if (Array.isArray(frame?.events?.bounce_court) && frame.events.bounce_court.length >= 2) {
      values.push(frame.events.bounce_court)
    }
  }
  if (!values.length) return null
  const xs = values.map((v) => Number(v[0])).filter(Number.isFinite)
  const ys = values.map((v) => Number(v[1])).filter(Number.isFinite)
  if (!xs.length || !ys.length) return null
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

function normalizePlayerBox(bboxPixel, videoWidth, videoHeight) {
  if (!Array.isArray(bboxPixel) || bboxPixel.length < 4 || videoWidth <= 0 || videoHeight <= 0) return null
  const [x1, y1, x2, y2] = bboxPixel.map((v) => Number(v))
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null
  const nx1 = clamp(x1 / videoWidth, 0, 1)
  const ny1 = clamp(y1 / videoHeight, 0, 1)
  const nx2 = clamp(x2 / videoWidth, 0, 1)
  const ny2 = clamp(y2 / videoHeight, 0, 1)
  return {
    x: clamp(Math.min(nx1, nx2), 0, 1),
    y: clamp(Math.min(ny1, ny2), 0, 1),
    w: clamp(Math.abs(nx2 - nx1), 0.02, 1),
    h: clamp(Math.abs(ny2 - ny1), 0.05, 1),
  }
}

function adaptFrameProtocol(base) {
  const metadata = base.metadata ?? {}
  const rawFrames = Array.isArray(base.frames) ? base.frames : []
  if (!rawFrames.length) return null

  const fps = Number(metadata.fps) > 0 ? Number(metadata.fps) : 30
  const videoWidth = Number(metadata.video_width) > 0 ? Number(metadata.video_width) : 1920
  const videoHeight = Number(metadata.video_height) > 0 ? Number(metadata.video_height) : 1080
  const courtRange = collectCourtRange(rawFrames)

  const firstPlayers = rawFrames.find((frame) => Array.isArray(frame?.players) && frame.players.length)?.players ?? []
  const sortedByX = [...firstPlayers].sort((a, b) => {
    const ax = Number(a?.bbox_pixel?.[0] ?? 0)
    const bx = Number(b?.bbox_pixel?.[0] ?? 0)
    return ax - bx
  })
  const sideByPlayerId = new Map()
  if (sortedByX[0]?.id != null) sideByPlayerId.set(String(sortedByX[0].id), 'left')
  if (sortedByX[1]?.id != null) sideByPlayerId.set(String(sortedByX[1].id), 'right')

  const overlayFrames = rawFrames.map((frame, idx) => {
    const t = Number.isFinite(Number(frame?.time_sec)) ? Number(frame.time_sec) : Number(frame?.frame_index ?? idx) / fps
    const ballPixel = frame?.ball?.pixel
    const ballNormalized = Array.isArray(ballPixel) && ballPixel.length >= 2
      ? {
          x: clamp(Number(ballPixel[0]) / videoWidth, 0, 1),
          y: clamp(Number(ballPixel[1]) / videoHeight, 0, 1),
        }
      : null
    const playersNormalized = (Array.isArray(frame?.players) ? frame.players : [])
      .map((player) => ({
        id: player?.id,
        box: normalizePlayerBox(player?.bbox_pixel, videoWidth, videoHeight),
      }))
      .filter((player) => player.box)
    return {
      frameIndex: Number(frame?.frame_index ?? idx),
      t,
      ballNormalized,
      playersNormalized,
      speed: Number(frame?.ball?.speed_kmh ?? 0),
      events: frame?.events ?? {},
      raw: frame,
    }
  })

  const timelineEvents = []
  for (const frame of overlayFrames) {
    const rawEvents = frame.events ?? {}
    const isBounce = Boolean(rawEvents.is_bounce)
    const isHit = Boolean(rawEvents.is_hit)
    if (!isBounce && !isHit) continue

    const pointFromCourt = normalizeCourtPoint(rawEvents.bounce_court ?? frame.raw?.ball?.court, courtRange)
    const point = pointFromCourt ?? frame.ballNormalized ?? { x: 0.5, y: 0.7 }
    const fallbackWinner = timelineEvents.length % 2 === 0 ? 'left' : 'right'
    const winner = pickWinnerByHitter(rawEvents.hitter_id, sideByPlayerId, fallbackWinner)

    timelineEvents.push({
      pointIndex: timelineEvents.length + 1,
      rallyId: Math.floor(timelineEvents.length / 3) + 1,
      t: frame.t,
      x: clamp(Number(point.x), 0, 1),
      y: clamp(Number(point.y), 0, 1),
      inOut: judgeInOut(point.x, point.y),
      winner,
      speed: Number.isFinite(frame.speed) && frame.speed > 0 ? frame.speed : 72,
      type: isBounce ? 'bounce' : 'hit',
      shotType: rawEvents.shot_type ?? null,
      hitterId: rawEvents.hitter_id ?? null,
    })
  }

  if (!timelineEvents.length) {
    for (let idx = 0; idx < overlayFrames.length; idx += Math.max(1, Math.floor(fps / 2))) {
      const frame = overlayFrames[idx]
      const point = frame.ballNormalized ?? { x: 0.5, y: 0.7 }
      timelineEvents.push({
        pointIndex: timelineEvents.length + 1,
        rallyId: Math.floor(timelineEvents.length / 3) + 1,
        t: frame.t,
        x: point.x,
        y: point.y,
        inOut: judgeInOut(point.x, point.y),
        winner: timelineEvents.length % 2 === 0 ? 'left' : 'right',
        speed: Number.isFinite(frame.speed) && frame.speed > 0 ? frame.speed : 72,
        type: 'bounce',
      })
    }
  }

  const durationFromFrames = overlayFrames.length
    ? Number(overlayFrames[overlayFrames.length - 1].t.toFixed(3))
    : Number((Number(metadata.total_frames ?? 0) / fps).toFixed(3))
  const shotTypeRatio = timelineEvents.reduce(
    (acc, event) => {
      const shotType = String(event.shotType || '').toLowerCase()
      if (shotType.includes('backhand')) acc.backhand += 1
      else acc.forehand += 1
      return acc
    },
    { forehand: 0, backhand: 0 },
  )
  const totalShotType = shotTypeRatio.forehand + shotTypeRatio.backhand

  return {
    videoMeta: {
      fps,
      width: videoWidth,
      height: videoHeight,
      duration: durationFromFrames,
      filename: base?.videoMeta?.filename ?? 'backend-sample.mp4',
      version: metadata.version ?? '1.0.0',
    },
    duration: durationFromFrames,
    events: timelineEvents,
    overlayFrames,
    shotTypeRatio: totalShotType
      ? {
          forehand: Math.round((shotTypeRatio.forehand / totalShotType) * 100),
          backhand: Math.round((shotTypeRatio.backhand / totalShotType) * 100),
        }
      : undefined,
  }
}

export function enrichAnalysisResult(raw) {
  const base = raw ? JSON.parse(JSON.stringify(raw)) : {}
  const frameAdapted = adaptFrameProtocol(base)
  const mergedBase = frameAdapted ? { ...base, ...frameAdapted } : base
  const rawEvents = Array.isArray(mergedBase.events) ? mergedBase.events : []

  const events = rawEvents.map((e, idx) => {
    const x = clamp(Number(e.x ?? 0.5), 0, 1)
    const y = clamp(Number(e.y ?? 0.7), 0, 1)
    const winner = e.winner === 'left' || e.winner === 'right' ? e.winner : idx % 2 === 0 ? 'left' : 'right'
    const inOut = e.inOut === 'IN' || e.inOut === 'OUT' ? e.inOut : judgeInOut(x, y)
    return {
      pointIndex: Number(e.pointIndex ?? idx + 1),
      rallyId: Number(e.rallyId ?? Math.floor(idx / 3) + 1),
      t: Number(e.t ?? idx * 2.5),
      x,
      y,
      inOut,
      winner,
      speed: Number(e.speed ?? 72),
      type: e.type ?? 'bounce',
    }
  })

  const rallies = Array.isArray(mergedBase.rallies) && mergedBase.rallies.length ? mergedBase.rallies : buildRallies(events)
  const stats = deriveStats(events, rallies)
  const scoreTimeline =
    Array.isArray(mergedBase.scoreTimeline) && mergedBase.scoreTimeline.length ? mergedBase.scoreTimeline : buildScoreTimeline(events)
  const highlights =
    Array.isArray(mergedBase.highlights) && mergedBase.highlights.length ? mergedBase.highlights : buildHighlights(rallies)
  const latestScore = scoreTimeline[scoreTimeline.length - 1]
  const score =
    mergedBase.score ??
    (latestScore
      ? {
          leftGames: latestScore.leftGames,
          rightGames: latestScore.rightGames,
          leftPoints: latestScore.leftPoints,
          rightPoints: latestScore.rightPoints,
          server: latestScore.server,
        }
      : undefined)

  return {
    ...mergedBase,
    ...stats,
    events,
    rallies,
    highlights,
    scoreTimeline,
    score,
    videoMeta: {
      fps: 30,
      width: 1280,
      height: 720,
      duration: mergedBase.duration ?? 0,
      filename: 'ball.mp4',
      ...(mergedBase.videoMeta ?? {}),
    },
    historyMatches:
      Array.isArray(mergedBase.historyMatches) && mergedBase.historyMatches.length
        ? mergedBase.historyMatches
        : DEFAULT_HISTORY_MATCHES,
    radarData: mergedBase.radarData ?? { attack: 86, defense: 74, stamina: 91, mentality: 68, tactic: 79 },
    shotTypeRatio: mergedBase.shotTypeRatio ?? { forehand: 54, backhand: 46 },
    insights: mergedBase.insights ?? {
      labels: ['进攻型', '反手稳定性待提升'],
      aiTips: ['建议增加左侧防守训练', '建议提升二发后的前三拍衔接'],
    },
    heatmapPoints:
      Array.isArray(mergedBase.heatmapPoints) && mergedBase.heatmapPoints.length
        ? mergedBase.heatmapPoints
        : events.map((e) => [e.x, e.y, e.inOut === 'IN' ? 8 : 3]),
  }
}

