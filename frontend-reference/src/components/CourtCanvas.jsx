import { useEffect, useRef } from 'react'

const COURT_LENGTH = 23.77
const COURT_WIDTH_DOUBLES = 10.97
const COURT_WIDTH_SINGLES = 8.23
const SERVICE_LINE_DISTANCE = 6.4
const COURT_ASPECT_RATIO = COURT_WIDTH_DOUBLES / COURT_LENGTH

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizePoint(point) {
  if (!Array.isArray(point) || point.length < 2) return null
  const x = Number(point[0])
  const y = Number(point[1])
  const weight = Number(point[2] ?? 1)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
    weight: Number.isFinite(weight) ? Math.max(1, weight) : 1,
  }
}

export function fitCourtRect(width, height) {
  const padX = 28
  const padY = 22
  const maxWidth = width - padX * 2
  const maxHeight = height - padY * 2

  let courtWidth = maxWidth
  let courtHeight = courtWidth / COURT_ASPECT_RATIO

  if (courtHeight > maxHeight) {
    courtHeight = maxHeight
    courtWidth = courtHeight * COURT_ASPECT_RATIO
  }

  const left = (width - courtWidth) / 2
  const top = (height - courtHeight) / 2
  return { left, top, courtWidth, courtHeight }
}

export function drawCourtBackground(ctx, width, height) {
  ctx.clearRect(0, 0, width, height)

  const pageGradient = ctx.createLinearGradient(0, 0, width, height)
  pageGradient.addColorStop(0, '#091220')
  pageGradient.addColorStop(1, '#13263f')
  ctx.fillStyle = pageGradient
  ctx.fillRect(0, 0, width, height)

  const bounds = fitCourtRect(width, height)
  const { left, top, courtWidth, courtHeight } = bounds

  const courtGradient = ctx.createLinearGradient(left, top, left + courtWidth, top + courtHeight)
  courtGradient.addColorStop(0, '#365f3c')
  courtGradient.addColorStop(0.5, '#2f6c47')
  courtGradient.addColorStop(1, '#274f35')
  ctx.fillStyle = courtGradient
  ctx.fillRect(left, top, courtWidth, courtHeight)

  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 2
  ctx.strokeRect(left, top, courtWidth, courtHeight)

  const singlesInset = ((COURT_WIDTH_DOUBLES - COURT_WIDTH_SINGLES) / 2 / COURT_WIDTH_DOUBLES) * courtWidth
  const singlesLeft = left + singlesInset
  const singlesRight = left + courtWidth - singlesInset
  const serviceOffset = (SERVICE_LINE_DISTANCE / COURT_LENGTH) * courtHeight
  const serviceTop = top + serviceOffset
  const serviceBottom = top + courtHeight - serviceOffset
  const netY = top + courtHeight / 2
  const centerX = left + courtWidth / 2
  const centerServiceTop = top + courtHeight / 2 - serviceOffset
  const centerServiceBottom = top + courtHeight / 2 + serviceOffset

  ctx.beginPath()
  ctx.moveTo(singlesLeft, top)
  ctx.lineTo(singlesLeft, top + courtHeight)
  ctx.moveTo(singlesRight, top)
  ctx.lineTo(singlesRight, top + courtHeight)

  ctx.moveTo(singlesLeft, serviceTop)
  ctx.lineTo(singlesRight, serviceTop)
  ctx.moveTo(singlesLeft, serviceBottom)
  ctx.lineTo(singlesRight, serviceBottom)

  ctx.moveTo(left, netY)
  ctx.lineTo(left + courtWidth, netY)

  ctx.moveTo(centerX, serviceTop)
  ctx.lineTo(centerX, netY)
  ctx.moveTo(centerX, netY)
  ctx.lineTo(centerX, serviceBottom)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1
  ctx.strokeRect(left - 10, top - 10, courtWidth + 20, courtHeight + 20)

  return bounds
}

function drawPoints(ctx, bounds, points, landingPoint) {
  points.forEach((point, index) => {
    const px = bounds.left + point.x * bounds.courtWidth
    const py = bounds.top + point.y * bounds.courtHeight
    const isLanding =
      landingPoint &&
      Math.abs(point.x - landingPoint.x) < 0.0001 &&
      Math.abs(point.y - landingPoint.y) < 0.0001

    const radius = isLanding ? 5.5 : 4
    ctx.beginPath()
    ctx.arc(px, py, radius, 0, Math.PI * 2)
    ctx.fillStyle = isLanding ? '#10FFB0' : index % 2 === 0 ? '#7DD3FC' : '#FDE68A'
    ctx.fill()
    ctx.lineWidth = isLanding ? 2 : 1.5
    ctx.strokeStyle = isLanding ? 'rgba(255,255,255,0.95)' : 'rgba(8,14,24,0.95)'
    ctx.stroke()
  })

  if (landingPoint && !points.length) {
    const px = bounds.left + landingPoint.x * bounds.courtWidth
    const py = bounds.top + landingPoint.y * bounds.courtHeight
    ctx.beginPath()
    ctx.arc(px, py, 5.5, 0, Math.PI * 2)
    ctx.fillStyle = '#10FFB0'
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.stroke()
  }
}

export default function CourtCanvas({
  points = [],
  landingPoint = null,
  height = 320,
  showEmptyText = '暂无落点数据',
}) {
  const canvasRef = useRef(null)
  const normalizedPoints = points.map(normalizePoint).filter(Boolean)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.clientWidth || 420
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    const bounds = drawCourtBackground(ctx, width, height)
    const normalizedLanding = landingPoint
      ? {
          x: clamp(Number(landingPoint.x ?? 0.5), 0, 1),
          y: clamp(Number(landingPoint.y ?? 0.5), 0, 1),
        }
      : null
    drawPoints(ctx, bounds, normalizedPoints, normalizedLanding)
  }, [height, landingPoint, normalizedPoints])

  const hasData = normalizedPoints.length > 0 || landingPoint

  return (
    <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] p-3">
      <canvas
        ref={canvasRef}
        className="block w-full rounded-[8px] border border-white/10"
        style={{ height }}
      />
      <div className="mt-3 text-center text-[13px] text-white/45">
        {hasData ? '标准网球场落点图' : showEmptyText}
      </div>
    </div>
  )
}
