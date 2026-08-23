import { useEffect, useMemo, useRef, useState } from 'react'
import { FaBars, FaSpinner, FaUserCircle } from 'react-icons/fa'
import { Link, useLocation } from 'react-router-dom'
import AdvancedAnalysis from './components/AdvancedAnalysis'
import { getAnalysisDetail, getAnalysisResult, getUploadProgress, uploadAndAnalyze } from './api'
import HistoryRecords from './components/HistoryRecords'
import MyAchievements from './components/MyAchievements'
import OverallStats from './components/OverallStats'
import PointByPointStats from './components/PointByPointStats'
import UserGrowthTrend from './components/UserGrowthTrend'
import RightPanel from './components/RightPanel'
import ScoreTimeline from './components/ScoreTimeline'
import Sidebar from './components/Sidebar'
import VideoArea from './components/VideoArea'

const INITIAL_LIVE_SCORE = {
  leftSets: 0,
  rightSets: 0,
  leftGames: 0,
  rightGames: 0,
  leftScore: 0,
  rightScore: 0,
  leftPoints: '0',
  rightPoints: '0',
  server: 'right',
}

const ACTIVE_PROCESSING_STAGES = new Set(['uploading', 'queued', 'pass1', 'postprocess', 'build', 'save'])

function formatStageLabel(stage) {
  switch (stage) {
    case 'uploading':
      return '正在上传视频'
    case 'queued':
      return '等待开始处理'
    case 'pass1':
      return '正在逐帧分析'
    case 'postprocess':
      return '正在后处理'
    case 'build':
      return '正在生成结果'
    case 'save':
      return '正在保存结果'
    case 'completed':
      return '处理完成'
    case 'failed':
      return '处理失败'
    default:
      return '正在处理'
  }
}

function ProgressBar({ label, value, tone = 'emerald' }) {
  const width = `${Math.max(0, Math.min(100, Math.round(value || 0)))}%`
  const barClass =
    tone === 'cyan'
      ? 'bg-gradient-to-r from-cyan-400 to-sky-500'
      : 'bg-gradient-to-r from-emerald-400 to-[#10FFB0]'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-white/72">
        <span>{label}</span>
        <span>{Math.max(0, Math.min(100, Math.round(value || 0)))}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-300 ${barClass}`} style={{ width }} />
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('nav')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState('')
  const [processingMessage, setProcessingMessage] = useState('')
  const [localVideoUrl, setLocalVideoUrl] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [highlightBusy, setHighlightBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const videoElRef = useRef(null)
  const uploadInputRef = useRef(null)
  const autoUploadTriggeredRef = useRef(false)
  const uploadPollTimerRef = useRef(null)
  const uploadPollBusyRef = useRef(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    const uploadId = new URLSearchParams(location.search).get('upload_id')
    const loader = uploadId ? getAnalysisDetail(uploadId) : getAnalysisResult()

    loader
      .then((nextData) => {
        if (!alive) return
        setData(nextData)
        setCurrentTime(0)
      })
      .finally(() => {
        if (!alive) return
        setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [location.search])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const shouldAutoUpload = new URLSearchParams(location.search).get('autoupload') === '1'
    if (!shouldAutoUpload) {
      autoUploadTriggeredRef.current = false
      return
    }
    if (autoUploadTriggeredRef.current) return
    autoUploadTriggeredRef.current = true
    setTimeout(() => uploadInputRef.current?.click?.(), 0)
  }, [location.search])

  useEffect(() => {
    return () => {
      if (localVideoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(localVideoUrl)
      }
    }
  }, [localVideoUrl])

  useEffect(() => {
    return () => {
      if (uploadPollTimerRef.current) {
        clearInterval(uploadPollTimerRef.current)
      }
    }
  }, [])

  const scoreTimeline = useMemo(() => data?.scoreTimeline ?? [], [data])
  const shotTimeline = useMemo(() => data?.shotTimeline ?? [], [data])
  const pointDetails = useMemo(() => data?.pointDetails ?? [], [data])
  const videoUrl = localVideoUrl || data?.videoUrl
  const videoFilename = selectedFile?.name || data?.videoMeta?.filename || 'uploaded-video.mp4'

  const currentDecision = useMemo(() => {
    for (let i = scoreTimeline.length - 1; i >= 0; i -= 1) {
      if ((scoreTimeline[i].t ?? 0) <= currentTime) {
        return scoreTimeline[i]
      }
    }
    return null
  }, [currentTime, scoreTimeline])

  const currentScore = currentDecision ?? INITIAL_LIVE_SCORE

  const currentPointDetail = useMemo(() => {
    const byRange = pointDetails.find((item) => (item.start ?? 0) <= currentTime && (item.end ?? 0) >= currentTime)
    if (byRange) return byRange
    if (!currentDecision) return null
    return pointDetails.find((item) => Number(item.pointIndex) === Number(currentDecision.pointIndex)) ?? null
  }, [currentDecision, currentTime, pointDetails])

  const currentShot = useMemo(() => {
    for (let i = shotTimeline.length - 1; i >= 0; i -= 1) {
      if ((shotTimeline[i].t ?? 0) <= currentTime) {
        return shotTimeline[i]
      }
    }
    return null
  }, [currentTime, shotTimeline])

  const infoItems = useMemo(
    () => [
      `时长: ${Number(data?.videoMeta?.duration ?? 0).toFixed(1)}s`,
      `FPS: ${data?.videoMeta?.fps ?? 30}`,
      `回合数: ${scoreTimeline.length || 0}`,
      `击球数: ${data?.totalShots ?? 0}`,
      `比分: ${data?.score?.leftScore ?? 0}:${data?.score?.rightScore ?? 0}`,
    ],
    [data?.score?.leftScore, data?.score?.rightScore, data?.totalShots, data?.videoMeta?.duration, data?.videoMeta?.fps, scoreTimeline.length],
  )

  const hasActiveUploadTask = uploading || ACTIVE_PROCESSING_STAGES.has(processingStage)

  function stopUploadPolling() {
    if (uploadPollTimerRef.current) {
      clearInterval(uploadPollTimerRef.current)
      uploadPollTimerRef.current = null
    }
    uploadPollBusyRef.current = false
  }

  function resetProgressState() {
    setUploadProgress(0)
    setProcessingProgress(0)
    setProcessingStage('')
    setProcessingMessage('')
  }

  function startUploadPolling(uploadId) {
    stopUploadPolling()

    const pollOnce = async () => {
      if (uploadPollBusyRef.current) return
      uploadPollBusyRef.current = true
      try {
        const progress = await getUploadProgress(uploadId)
        setProcessingStage(progress.stage || progress.status || '')
        setProcessingProgress(progress.progress || 0)
        setProcessingMessage(progress.message || '')

        if (progress.status === 'completed') {
          stopUploadPolling()
          setLoading(true)
          try {
            const result = await getAnalysisDetail(uploadId)
            setData(result)
            setActiveMenu('nav')
            setCurrentTime(0)
            setProcessingStage('completed')
            setProcessingProgress(100)
            setProcessingMessage('分析已完成')
            setToast({ type: 'ok', text: '视频分析已完成' })
          } finally {
            setUploading(false)
            setLoading(false)
          }
          return
        }

        if (progress.status === 'failed') {
          stopUploadPolling()
          setUploading(false)
          setProcessingStage('failed')
          setProcessingMessage(progress.error_message || progress.message || '分析失败')
          setToast({ type: 'err', text: progress.error_message || '视频分析失败' })
        }
      } catch (error) {
        stopUploadPolling()
        setUploading(false)
        setProcessingStage('failed')
        setProcessingMessage(error?.message || '获取进度失败')
        setToast({ type: 'err', text: error?.message || '获取进度失败' })
      } finally {
        uploadPollBusyRef.current = false
      }
    }

    pollOnce()
    uploadPollTimerRef.current = window.setInterval(pollOnce, 1200)
  }

  async function onAnalyzeUpload(fileOverride) {
    const fileToAnalyze = fileOverride || selectedFile
    if (!fileToAnalyze) return

    stopUploadPolling()
    resetProgressState()
    setUploading(true)
    setProcessingStage('uploading')
    setProcessingMessage('正在上传视频')
    setToast({ type: 'info', text: `开始上传：${fileToAnalyze.name}` })

    try {
      const task = await uploadAndAnalyze(fileToAnalyze, {
        onUploadProgress: (percent) => {
          setUploadProgress(percent)
        },
      })
      setUploadProgress(100)
      setProcessingStage(task.stage || task.status || 'queued')
      setProcessingProgress(task.progress || 0)
      setProcessingMessage(task.message || '等待开始分析')
      startUploadPolling(task.upload_id)
    } catch (error) {
      stopUploadPolling()
      setUploading(false)
      setProcessingStage('failed')
      setProcessingMessage(error?.message || '上传失败')
      setToast({ type: 'err', text: error?.message || '视频上传失败' })
    }
  }

  async function onHighlightClick() {
    if (highlightBusy) return
    const video = videoElRef.current
    if (!video) return

    setHighlightBusy(true)
    setToast({ type: 'info', text: '正在生成 10 秒精彩片段...' })

    const prevTime = video.currentTime || 0
    const prevMuted = video.muted
    const prevVolume = video.volume

    try {
      const stream = video.captureStream?.()
      if (!stream) throw new Error('当前浏览器不支持 captureStream')

      const mimeCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ]
      const mimeType = mimeCandidates.find((item) => window.MediaRecorder?.isTypeSupported?.(item))
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data)
      }

      const targetEnd = Math.min(10, video.duration || 10)
      video.muted = true
      video.volume = 0
      video.currentTime = 0

      await video.play()
      recorder.start(250)

      await new Promise((resolve, reject) => {
        const startedAt = performance.now()
        const tick = () => {
          if (video.currentTime >= targetEnd) return resolve()
          if (performance.now() - startedAt > (targetEnd + 3) * 1000) {
            return reject(new Error('生成精彩片段超时'))
          }
          requestAnimationFrame(tick)
        }
        tick()
      })

      await new Promise((resolve) => {
        recorder.onstop = resolve
        recorder.stop()
      })

      video.pause()

      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'highlights-10s.webm'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)

      setToast({ type: 'ok', text: '精彩片段已导出' })
    } catch (error) {
      setToast({ type: 'err', text: error?.message || '导出精彩片段失败' })
    } finally {
      try {
        video.muted = prevMuted
        video.volume = prevVolume
        video.currentTime = prevTime
      } catch {
        // ignore restore errors
      }
      setHighlightBusy(false)
    }
  }

  function jumpToPoint(item) {
    const video = videoElRef.current
    if (!video) return
    const pointIndex = Number(item?.pointIndex)
    const detail = pointDetails.find((point) => Number(point?.pointIndex) === pointIndex)
    const targetTime = detail?.start ?? item?.start ?? item?.t ?? 0
    video.currentTime = Math.max(0, targetTime - 0.2)
    video.play?.()
  }

  function renderOverlay() {
    if (hasActiveUploadTask) {
      return (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/55 px-5">
          <div className="w-full max-w-[520px] rounded-3xl border border-white/10 bg-black/45 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <FaSpinner className="animate-spin text-[#10FFB0]" />
              <div>
                <div className="text-base font-semibold text-white">{formatStageLabel(processingStage)}</div>
                <div className="text-sm text-white/60">{processingMessage || '正在处理你上传的比赛视频'}</div>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <ProgressBar label="上传进度" value={uploadProgress} tone="cyan" />
              <ProgressBar label="处理进度" value={processingProgress} tone="emerald" />
            </div>
          </div>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/40">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 backdrop-blur-xl">
            <FaSpinner className="animate-spin text-white/80" />
            <div className="text-base text-white/80">正在加载分析结果...</div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-[#0A0E17] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_520px_at_15%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_85%_25%,rgba(255,255,255,0.04),transparent_55%),radial-gradient(700px_420px_at_55%_90%,rgba(255,255,255,0.03),transparent_55%)]" />

      <header className="mx-auto flex w-full max-w-[1760px] items-center justify-between gap-3 px-6 py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 text-white/75 transition hover:border-[rgba(16,255,176,0.35)] hover:text-white"
            aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
          >
            <FaBars size={14} />
            <span className="text-sm">菜单</span>
          </button>
          <div className="h-10 w-10 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] shadow-[0_12px_26px_-18px_rgba(0,0,0,0.85)]" />
          <div className="text-base font-semibold tracking-wide text-white/90">网球比赛分析</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="cursor-pointer rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-white/70 hover:border-[rgba(16,255,176,0.3)]">
            {hasActiveUploadTask ? '上传中 / 处理中...' : '上传视频'}
            <input
              ref={uploadInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setSelectedFile(file)
                if (localVideoUrl?.startsWith('blob:')) {
                  URL.revokeObjectURL(localVideoUrl)
                }
                const url = URL.createObjectURL(file)
                setLocalVideoUrl(url)
                onAnalyzeUpload(file)
              }}
            />
          </label>
          <button
            onClick={onHighlightClick}
            disabled={highlightBusy}
            className="rounded-[8px] border border-[rgba(16,255,176,0.20)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-white/80 disabled:opacity-60"
          >
            {highlightBusy ? '生成中...' : '导出精彩片段'}
          </button>
          <Link
            to="/analyze/profile"
            className="ml-2 rounded-full border border-white/10 p-2 text-white/70 transition hover:border-[rgba(16,255,176,0.35)] hover:text-white"
            aria-label="打开个人主页"
          >
            <FaUserCircle size={18} />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1760px] px-4 pb-8 md:px-6">
        <div
          className={[
            'fixed bottom-0 left-0 top-[72px] z-40 transition-all duration-300',
            sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[118%] pointer-events-none opacity-0',
          ].join(' ')}
        >
          <Sidebar activeMenu={activeMenu} onChange={setActiveMenu} />
        </div>

        <div
          className={[
            'grid items-start gap-5 transition-all duration-300 xl:grid-cols-[minmax(0,1fr)_360px]',
            sidebarOpen ? 'xl:pl-[236px]' : '',
          ].join(' ')}
        >
          {activeMenu === 'overview' ? (
            <div className="xl:col-span-2">
              <OverallStats data={data} />
            </div>
          ) : activeMenu === 'point' ? (
            <div className="xl:col-span-2">
              <PointByPointStats scoreTimeline={scoreTimeline} pointDetails={pointDetails} />
            </div>
          ) : activeMenu === 'history' ? (
            <div className="xl:col-span-2">
              <HistoryRecords />
            </div>
          ) : activeMenu === 'achievement' ? (
            <div className="xl:col-span-2">
              <MyAchievements items={data?.achievements ?? []} />
            </div>
          ) : activeMenu === 'user' ? (
            <div className="xl:col-span-2">
              <UserGrowthTrend historyMatches={data?.historyMatches ?? []} />
            </div>
          ) : activeMenu === 'advanced' ? (
            <div className="xl:col-span-2">
              <AdvancedAnalysis data={data} />
            </div>
          ) : (
            <>
              <section className="min-w-0">
                <div className="mb-3 rounded-[10px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <div className="truncate text-[16px] font-semibold text-[#10FFB0]">{videoFilename}</div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-6 text-[12px] text-white/55">
                      {infoItems.map((item) => (
                        <span key={item} className="truncate">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <VideoArea
                  videoUrl={videoUrl}
                  videoMeta={data?.videoMeta}
                  onTime={setCurrentTime}
                  videoElRef={videoElRef}
                  events={data?.events ?? []}
                  overlayFrames={data?.overlayFrames ?? []}
                >
                  {renderOverlay()}
                </VideoArea>

                <ScoreTimeline scoreTimeline={scoreTimeline} currentTime={currentTime} onJump={jumpToPoint} />
              </section>

              <div className="min-w-0 self-start">
                <RightPanel
                  data={data}
                  currentDecision={currentDecision}
                  currentScore={currentScore}
                  currentPointDetail={currentPointDetail}
                  currentShot={currentShot}
                  currentTime={currentTime}
                  scoreTimeline={scoreTimeline}
                  onJumpToPoint={jumpToPoint}
                  activeMenu={activeMenu}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {toast ? (
        <div className="fixed left-1/2 top-5 z-[60] -translate-x-1/2">
          <div className="rounded-2xl border border-white/10 bg-gray-900/50 px-4 py-3 text-sm text-white/85 shadow-[0_0_30px_rgba(0,160,255,0.10)] backdrop-blur-xl">
            {toast.text}
          </div>
        </div>
      ) : null}
    </div>
  )
}
