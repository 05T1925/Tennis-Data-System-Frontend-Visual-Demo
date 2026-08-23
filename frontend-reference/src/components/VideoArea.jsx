import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearCanvas,
  drawBallPoint,
  drawPlayerBox,
  getBallPointForBucket,
} from '../utils/canvasDraw'

export default function VideoArea({
  videoUrl,
  children,
  onTime,
  videoElRef,
  events = [],
  overlayFrames = [],
  videoMeta,
}) {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const playingRef = useRef(false)

  const [size, setSize] = useState({ w: 0, h: 0 })

  const resize = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) })
  }, [])

  useEffect(() => {
    if (!wrapRef.current) return
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrapRef.current)
    window.addEventListener('resize', resize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [resize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.max(1, Math.floor(size.w * dpr))
    canvas.height = Math.max(1, Math.floor(size.h * dpr))
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [size.w, size.h])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function drawFrame() {
      const v = videoRef.current
      const canvas = canvasRef.current
      if (!v || !canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = size.w
      const h = size.h
      const t = v.currentTime || 0
      onTime?.(t)

      clearCanvas(ctx, w, h)

      const fps = Number(videoMeta?.fps ?? 30) > 0 ? Number(videoMeta?.fps) : 30
      const frameIndex = Math.max(0, Math.floor(t * fps))
      const frame = overlayFrames[frameIndex]

      if (frame?.playersNormalized?.length) {
        for (const player of frame.playersNormalized) {
          drawPlayerBox(ctx, w, h, player.box)
        }
      }

      if (overlayFrames.length > 0) {
        const start = Math.max(0, frameIndex - 12)
        const recentFrames = overlayFrames.slice(start, frameIndex + 1)
        const ballFrames = recentFrames.filter((item) => item?.ballNormalized).slice(-5)
        for (let i = 0; i < ballFrames.length; i += 1) {
          drawBallPoint(
            ctx,
            w,
            h,
            ballFrames[i].ballNormalized,
            i === ballFrames.length - 1,
            i,
            ballFrames.length,
          )
        }
      } else if (events.length > 0) {
        const visible = events.filter((event) => Math.abs((event.t ?? 0) - t) <= 3.2).slice(-5)
        for (let i = 0; i < visible.length; i += 1) {
          const event = visible[i]
          drawBallPoint(ctx, w, h, { x: event.x, y: event.y }, i === visible.length - 1, i, visible.length)
        }
      } else {
        const bucket = Math.max(0, Math.floor(t / 0.5))
        const buckets = [bucket - 4, bucket - 3, bucket - 2, bucket - 1, bucket].filter((x) => x >= 0)
        for (let i = 0; i < buckets.length; i += 1) {
          const bucketIndex = buckets[i]
          const point = getBallPointForBucket(bucketIndex)
          const isMain = bucketIndex === bucket
          drawBallPoint(ctx, w, h, point, isMain, i, buckets.length)
        }
      }
    }

    function tick() {
      if (!playingRef.current) return
      drawFrame()
      rafRef.current = requestAnimationFrame(tick)
    }

    function onPlay() {
      playingRef.current = true
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }

    function onPause() {
      playingRef.current = false
      cancelAnimationFrame(rafRef.current)
      drawFrame()
    }

    function onTimeUpdate() {
      if (!playingRef.current) drawFrame()
    }

    function onLoaded() {
      drawFrame()
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('seeked', onTimeUpdate)
    video.addEventListener('loadedmetadata', onLoaded)

    return () => {
      cancelAnimationFrame(rafRef.current)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('seeked', onTimeUpdate)
      video.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [onTime, events, overlayFrames, videoMeta?.fps, size.w, size.h])

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-black shadow-[0_18px_32px_-16px_rgba(0,0,0,0.75),inset_0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <video
        ref={(el) => {
          if (!el) return
          videoRef.current = el
          if (videoElRef) videoElRef.current = el
        }}
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl}
        controls
        playsInline
      />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      {children}
    </div>
  )
}
