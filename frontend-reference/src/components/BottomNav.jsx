import { FaChartBar, FaChartLine, FaFireAlt, FaBook, FaBrain, FaStar } from 'react-icons/fa'

/**
 * BottomNav：底部五个功能导航栏
 * 作用：提供训练数据、热力图、高级分析、成长曲线、AI 教练等功能入口
 * 设计原则：纯 UI 展示组件，不处理业务逻辑，所有行为通过外部回调实现
 */

/**
 * NavButton：导航按钮通用组件
 * @param icon 按钮图标
 * @param label 按钮文字
 * @param onClick 点击回调
 * @param compact 是否紧凑模式
 * @param active 是否激活状态
 */
function NavButton({ icon: Icon, label, onClick, compact, active = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        'group flex items-center gap-2 rounded-[8px] border text-[13px] font-medium transition-all duration-150',
        active
          ? 'border-[rgba(16,255,176,0.42)] bg-[rgba(16,255,176,0.12)] text-white'
          : 'border-white/10 bg-[rgba(255,255,255,0.04)] text-white/80',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        'hover:border-[rgba(16,255,176,0.30)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
      ].join(' ')}
    >
      <Icon className="text-current/90" size={16} />
      <span>{label}</span>
    </button>
  )
}

/**
 * HighlightButton：精彩集锦按钮
 * @param busy 是否正在处理中
 * @param onClick 点击事件
 */
function HighlightButton({ busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={[
        'relative flex items-center justify-center gap-2 rounded-[8px] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[13px] font-medium text-white/85',
        'transition-all duration-150 hover:border-[rgba(16,255,176,0.35)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white',
        'border border-[rgba(16,255,176,0.20)]',
        busy ? 'opacity-80' : '',
      ].join(' ')}
    >
      <span>导出</span>
      <span>集锦</span>
    </button>
  )
}

/**
 * 底部导航主组件
 * @param activePanel 当前激活面板
 * @param onOpenBasic 打开基础数据面板
 * @param onOpenHeatmap 打开热力图面板
 * @param onOpenAdvanced 打开高级分析面板
 * @param onOpenGrowth 打开成长曲线面板
 * @param onOpenAICoach 打开AI教练面板
 * @param onHighlight 打开精彩集锦
 * @param highlightBusy 集锦生成中状态
 * @param compact 是否紧凑布局模式
 */
export default function BottomNav({
  activePanel = null,
  onOpenBasic,
  onOpenHeatmap,
  onOpenAdvanced,
  onOpenGrowth,
  onOpenHighlights,
  onOpenAICoach,
  onHighlight,
  highlightBusy,
  compact = false,
}) {
  return (
    // 外层容器仅负责布局和视觉风格；真正行为由父组件传入回调决定
    <div
      className={
        compact
          ? 'grid gap-2'
          : 'w-full rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.02)] px-4 py-3 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]'
      }
    >
      <div className={compact ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap items-center justify-center gap-3'}>
        <NavButton
          icon={FaChartBar}
          label="基础数据"
          onClick={onOpenBasic}
          compact={compact}
          active={activePanel === 'basic'}
        />
        <NavButton
          icon={FaFireAlt}
          label="热力图"
          onClick={onOpenHeatmap}
          compact={compact}
          active={activePanel === 'heatmap'}
        />
        <NavButton
          icon={FaChartLine}
          label="高级分析"
          onClick={onOpenAdvanced}
          compact={compact}
          active={activePanel === 'advanced'}
        />
        <NavButton
          icon={FaBook}
          label="成长曲线"
          onClick={onOpenGrowth}
          compact={compact}
          active={activePanel === 'growth'}
        />
        <NavButton
          icon={FaStar}
          label="精彩回合"
          onClick={onOpenHighlights}
          compact={compact}
          active={activePanel === 'highlights'}
        />
        <NavButton
          icon={FaBrain}
          label="AI 教练"
          onClick={onOpenAICoach}
          compact={compact}
          active={activePanel === 'ai'}
        />
        {!compact && <HighlightButton busy={highlightBusy} onClick={onHighlight} />}
      </div>
      {compact && <HighlightButton busy={highlightBusy} onClick={onHighlight} />}
    </div>
  )
}
