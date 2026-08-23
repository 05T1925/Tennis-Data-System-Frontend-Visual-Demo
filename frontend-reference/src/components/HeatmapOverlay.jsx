import { useEffect, useMemo, useRef } from 'react'
import { FaTimes } from 'react-icons/fa'
import * as echarts from 'echarts'

/**
 * HeatmapOverlay：热力图弹层
 * - 使用 ECharts heatmap 渲染落点密度
 * - 生命周期内负责初始化与销毁图表实例
 */
export default function HeatmapOverlay({ open, points = [], onClose, embedded = false }) {
  const elRef = useRef(null)
  const chartRef = useRef(null)
  const data = useMemo(
    () =>
      points
        .map((p) => [Number(p?.[0] ?? 0), Number(p?.[1] ?? 0), Number(p?.[2] ?? 1)])
        .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Number.isFinite(p[2])),
    [points],
  )
  const hasData = data.length > 0

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const el = elRef.current
    if (!el) return

    if (chartRef.current) {
      chartRef.current.dispose()
      chartRef.current = null
    }

    const chart = echarts.init(el, null, { renderer: 'canvas' })
    chartRef.current = chart

    const render = () => {
      chart.resize()
      chart.setOption(
        {
          backgroundColor: 'transparent',
          animation: true,
          grid: { left: 18, right: 18, top: 18, bottom: 18 },
          xAxis: {
            type: 'value',
            min: 0,
            max: 1,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: 1,
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
          },
          visualMap: {
            show: false,
            min: 0,
            max: 10,
            dimension: 2,
            inRange: {
              color: ['#1D4FA3', '#00F5FF', '#66FFB8', '#FFF56B', '#FFAA4D', '#FF4B8A'],
            },
          },
          series: [
            {
              type: 'heatmap',
              data,
              blurSize: 34,
              pointSize: 20,
              itemStyle: { opacity: 0.95 },
              emphasis: { disabled: true },
            },
          ],
        },
        { notMerge: true },
      )
    }

    const raf = requestAnimationFrame(render)

    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      chart.dispose()
      chartRef.current = null
    }
  }, [open, data])

  if (!open) return null

  if (embedded) {
    return (
      <div className="px-4 pb-4">
        <div className="relative h-[320px] w-full overflow-hidden rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)]">
          <div ref={elRef} className="h-full w-full" />
          {!hasData && (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/55">
              暂无热力图数据
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/55" onMouseDown={() => onClose?.()} />

      <div className="absolute left-1/2 top-1/2 w-[960px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur-[12px] shadow-[0_24px_46px_-28px_rgba(0,0,0,0.85)]">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
          <div className="text-[12px] font-semibold tracking-[0.10em] text-white/75">热力图</div>
          <button
            className="rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-2 text-white/70 hover:border-[rgba(16,255,176,0.30)] hover:text-white"
            onClick={() => onClose?.()}
            aria-label="关闭热力图"
          >
            <FaTimes />
          </button>
        </div>
        <div className="relative h-[520px] max-h-[70vh] overflow-hidden rounded-[8px] border border-white/10 bg-[rgba(0,0,0,0.18)]">
          <div ref={elRef} className="h-full w-full" />
          {!hasData && (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/55">
              暂无热力图数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

