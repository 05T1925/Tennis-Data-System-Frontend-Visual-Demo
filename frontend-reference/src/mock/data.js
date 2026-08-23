import { buildScoreTimeline, enrichAnalysisResult } from '../utils/analysis'

function createMockEvents() {
  const events = []
  const total = 42
  for (let i = 0; i < total; i++) {
    const t = 2 + i * 2.7
    const x = 0.25 + ((i * 37) % 50) / 100
    const y = 0.35 + ((i * 23) % 55) / 100
    const inOut = i % 6 === 0 ? 'OUT' : 'IN'
    events.push({
      pointIndex: i + 1,
      rallyId: Math.floor(i / 3) + 1,
      t,
      x,
      y,
      inOut,
      winner: i % 2 === 0 ? 'left' : 'right',
      speed: 65 + (i % 8) * 3,
      type: 'bounce',
    })
  }
  return events
}

function createRallies(events) {
  const map = new Map()
  for (const e of events) {
    if (!map.has(e.rallyId)) {
      map.set(e.rallyId, { id: e.rallyId, start: e.t, end: e.t, shots: 0, winner: e.winner })
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

const events = createMockEvents()
const rallies = createRallies(events)
const scoreTimeline = buildScoreTimeline(events)
const highlights = rallies
  .filter((r) => r.shots >= 3)
  .slice(0, 6)
  .map((r) => ({
    id: `hl-${r.id}`,
    label: `回合 #${r.id}（${r.shots}拍）`,
    start: Math.max(0, r.start - 1.2),
    end: r.end + 1.2,
    reason: r.shots >= 5 ? '长回合' : '高跑动',
  }))

const baseData = {
  videoUrl: '/ball.mp4',
  videoMeta: {
    duration: 135.2,
    fps: 30,
    width: 1280,
    height: 720,
    filename: 'ball.mp4',
  },
  duration: 135.2,
  totalShots: 78,
  totalRallies: 14,
  avgRallyLength: 5.6,
  longestRally: 12,
  distanceCovered: 426,
  speedEstimate: 72,
  errorRate: 0.18,
  scoreRate: 0.68,
  score: {
    leftGames: 3,
    rightGames: 2,
    leftPoints: 30,
    rightPoints: 40,
    server: 'right',
  },
  shotTypeRatio: { forehand: 54, backhand: 46 },
  heatmapPoints: events.map((e) => [e.x, e.y, e.inOut === 'IN' ? 8 : 3]),
  radarData: { attack: 86, defense: 74, stamina: 91, mentality: 68, tactic: 79 },
  historyMatches: [
    { date: '2025-03-01', stability: 0.72, distance: 380, winRate: 0.5 },
    { date: '2025-03-15', stability: 0.78, distance: 412, winRate: 0.6 },
    { date: '2025-03-29', stability: 0.74, distance: 398, winRate: 0.55 },
    { date: '2025-04-12', stability: 0.81, distance: 445, winRate: 0.7 },
    { date: '2025-04-26', stability: 0.85, distance: 426, winRate: 0.68 },
  ],
  events,
  rallies,
  highlights,
  scoreTimeline,
  insights: {
    labels: ['进攻型', '反手稳定性待提升'],
    aiTips: ['建议增加左侧防守训练', '建议提升二发后的前三拍衔接'],
  },
}

export const mockMatchData = enrichAnalysisResult(baseData)

