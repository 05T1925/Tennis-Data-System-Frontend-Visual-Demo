import { useMemo, useState } from 'react'

const FALLBACK_ACHIEVEMENTS = [
  { id: 'a1', name: '初次登场', category: '基础记录类', unlocked: true, condition: '完成第 1 场比赛分析' },
  { id: 'a2', name: '百场老将', category: '基础记录类', unlocked: false, condition: '累计完成 100 场比赛分析' },
]

function HexBadge({ item }) {
  const unlocked = item.unlocked
  return (
    <div className="group relative">
      <div
        className={[
          'relative mx-auto h-28 w-24 transition duration-200 group-hover:scale-105',
          unlocked ? 'drop-shadow-[0_0_14px_rgba(16,255,176,0.25)]' : '',
          'clip-achievement-hex',
        ].join(' ')}
        style={{
          background: unlocked
            ? 'linear-gradient(140deg, rgba(16,255,176,0.30), rgba(96,170,255,0.24))'
            : 'linear-gradient(140deg, rgba(140,140,140,0.26), rgba(110,110,110,0.18))',
          border: unlocked ? '1px solid rgba(16,255,176,0.40)' : '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <div className="absolute inset-[6px] grid place-items-center clip-achievement-hex rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.25)]">
          <div className={['text-center text-sm font-bold', unlocked ? 'text-[#B9FFE8]' : 'text-white/45'].join(' ')}>
            {String(item.name || '').slice(0, 2)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className={['text-sm font-semibold', unlocked ? 'text-white/90' : 'text-white/45'].join(' ')}>{item.name}</div>
        <div className="mt-1 text-[12px] text-white/40">{item.category}</div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-0 z-20 w-52 -translate-x-1/2 -translate-y-[110%] rounded-[8px] border border-white/10 bg-[rgba(12,18,30,0.96)] px-3 py-2 text-[12px] text-white/75 opacity-0 shadow-[0_12px_28px_-20px_rgba(0,0,0,0.95)] transition group-hover:opacity-100">
        解锁条件：{item.condition}
      </div>
    </div>
  )
}

export default function MyAchievements({ items = [] }) {
  const [filter, setFilter] = useState('all')
  const achievements = items.length ? items : FALLBACK_ACHIEVEMENTS

  const list = useMemo(() => {
    if (filter === 'unlocked') return achievements.filter((item) => item.unlocked)
    if (filter === 'locked') return achievements.filter((item) => !item.unlocked)
    return achievements
  }, [achievements, filter])

  const unlockedCount = achievements.filter((item) => item.unlocked).length

  return (
    <section className="grid gap-5">
      <style>{`
        .clip-achievement-hex {
          clip-path: polygon(25% 5%, 75% 5%, 98% 50%, 75% 95%, 25% 95%, 2% 50%);
        }
      `}</style>

      <div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <h2 className="text-xl font-semibold tracking-wide text-white/90">我的成就</h2>
        <div className="flex items-center gap-2">
          {[
            ['all', '全部'],
            ['unlocked', '已解锁'],
            ['locked', '未解锁'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                'rounded-[8px] border px-3 py-1.5 text-sm transition',
                filter === key
                  ? 'border-[rgba(16,255,176,0.45)] bg-[rgba(16,255,176,0.12)] text-[#B9FFE8]'
                  : 'border-white/10 bg-[rgba(255,255,255,0.02)] text-white/65 hover:text-white',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <div className="grid grid-cols-3 gap-x-8 gap-y-6">
          {list.map((item) => (
            <HexBadge key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-center shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <span className="text-sm text-white/60">已解锁 </span>
        <span className="text-2xl font-bold text-[#10FFB0]">{unlockedCount}</span>
        <span className="text-sm text-white/60"> / {achievements.length} 个成就</span>
      </div>
    </section>
  )
}
