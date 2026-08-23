export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height)
}

export function drawPlayerBox(ctx, width, height, box) {
  if (!box) return
  const x = (box.x ?? 0) * width
  const y = (box.y ?? 0) * height
  const w = (box.w ?? 0.1) * width
  const h = (box.h ?? 0.2) * height

  ctx.save()
  ctx.strokeStyle = 'rgba(16, 255, 176, 0.95)'
  ctx.lineWidth = 2
  ctx.shadowColor = 'rgba(16, 255, 176, 0.25)'
  ctx.shadowBlur = 12
  ctx.strokeRect(x, y, w, h)
  ctx.restore()
}

export function drawBallPoint(ctx, width, height, point, isMain = false, index = 0, total = 1) {
  if (!point) return
  const x = (point.x ?? 0.5) * width
  const y = (point.y ?? 0.5) * height
  const alpha = total <= 1 ? 1 : 0.3 + (index / total) * 0.7
  const radius = isMain ? 5 : 3

  ctx.save()
  ctx.fillStyle = isMain ? `rgba(255, 209, 102, ${alpha})` : `rgba(96, 170, 255, ${alpha})`
  ctx.shadowColor = isMain ? 'rgba(255, 209, 102, 0.45)' : 'rgba(96, 170, 255, 0.25)'
  ctx.shadowBlur = isMain ? 12 : 8
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function getBallPointForBucket(bucket) {
  const normalized = Math.max(0, bucket)
  return {
    x: 0.22 + ((normalized * 37) % 56) / 100,
    y: 0.24 + ((normalized * 19) % 48) / 100,
  }
}
