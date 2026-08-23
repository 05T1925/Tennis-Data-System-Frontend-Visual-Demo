const MENU_ITEMS = [
  { key: 'nav', label: '首页' },
  { key: 'overview', label: '总体数据' },
  { key: 'point', label: '每分数据' },
  { key: 'advanced', label: '高级分析' },
  { key: 'history', label: '历史记录' },
  { key: 'achievement', label: '我的成就' },
  { key: 'user', label: '用户中心' },
]

export default function Sidebar({ activeMenu, onChange }) {
  return (
    <aside className="h-full w-[220px] shrink-0 border-r border-white/10 bg-[rgba(9,13,22,0.96)] p-4">
      <div className="text-xs font-semibold tracking-[0.12em] text-white/45">菜单</div>
      <div className="mt-3 grid gap-2">
        {MENU_ITEMS.map((item) => {
          const active = activeMenu === item.key
          return (
            <button
              key={item.key}
              onClick={() => onChange?.(item.key)}
              className={[
                'rounded-[8px] border px-3 py-2 text-left text-sm transition',
                active
                  ? 'border-[rgba(16,255,176,0.45)] bg-[rgba(16,255,176,0.12)] text-[#B9FFE8]'
                  : 'border-white/10 bg-[rgba(255,255,255,0.02)] text-white/75 hover:border-[rgba(16,255,176,0.25)] hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
