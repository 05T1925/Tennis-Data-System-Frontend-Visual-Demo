import { useEffect, useState } from 'react'
import { FaChevronRight, FaClock, FaHistory, FaVideo } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { getUploadHistory } from '../api'
import { useAuth } from '../auth/auth-context.jsx'

function formatDate(value) {
  if (!value) return '-'
  return String(value).replace('T', ' ').slice(0, 16)
}

function formatDuration(seconds) {
  const value = Number(seconds)
  if (!Number.isFinite(value)) return '-'
  const total = Math.max(0, Math.round(value))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return [hours, minutes, secs].map((item) => String(item).padStart(2, '0')).join(':')
}

function formatFileSize(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return '-'
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

function TopBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-3 text-sm text-white/75">
      <Icon size={12} />
      <span>{label}</span>
    </div>
  )
}

export default function HistoryRecords({ compact = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function load() {
      if (!user?.user_id) {
        if (alive) {
          setItems([])
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const data = await getUploadHistory(user.user_id)
        if (!alive) return
        setItems(Array.isArray(data) ? data : [])
      } catch (nextError) {
        if (!alive) return
        setError(nextError.message || '加载历史记录失败')
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [user?.user_id])

  const contentHeight = compact ? 'max-h-[280px]' : 'max-h-[calc(100vh-330px)]'

  return (
    <section className="grid gap-5">
      <div className="flex items-center justify-between rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 py-3 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <div className="flex items-center gap-2">
          <TopBadge icon={FaHistory} label="历史上传" />
        </div>
        <h2 className="text-xl font-semibold tracking-wide text-white/90">历史记录</h2>
        <div className="flex items-center gap-2">
          <TopBadge icon={FaVideo} label={`${items.length} 条`} />
        </div>
      </div>

      <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-5 shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <div className="text-[13px] text-white/50">当前账号历史上传数</div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-5xl font-extrabold text-[#10FFB0]">{items.length}</span>
          <span className="pb-1 text-lg text-white/70">条</span>
        </div>
      </div>

      <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] shadow-[0_16px_32px_-20px_rgba(0,0,0,0.75)]">
        <div className={`${contentHeight} overflow-y-auto p-3`}>
          {loading ? (
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-sm text-white/65">
              正在加载历史记录...
            </div>
          ) : error ? (
            <div className="rounded-[10px] border border-red-400/20 bg-red-500/10 px-4 py-4 text-sm text-red-200">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-4 py-4 text-sm text-white/65">
              还没有历史上传记录。
            </div>
          ) : (
            items.map((item, idx) => (
              <button
                key={item.upload_id}
                type="button"
                onClick={() => navigate(`/analyze/analyze?upload_id=${encodeURIComponent(item.upload_id)}`)}
                className="mb-2 rounded-[10px] border border-white/10 bg-[rgba(0,0,0,0.18)] px-3 py-3 transition hover:border-[rgba(16,255,176,0.35)] hover:bg-[rgba(16,255,176,0.07)]"
              >
                <div className="grid grid-cols-[92px_minmax(0,1fr)_24px] items-center gap-3">
                  <div className="h-20 rounded-[8px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,255,176,0.15),rgba(96,170,255,0.12))] p-2">
                    <div className="text-[11px] text-white/45">比赛视频</div>
                    <div className="mt-3 text-xs text-white/70">{item.status}</div>
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white/90">{item.original_filename}</div>
                    <div className="mt-1 text-xs text-white/50">上传人：{item.display_name}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[12px] text-white/65">
                        {formatDate(item.created_at)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[12px] text-white/65">
                        时长 {formatDuration(item.duration_sec)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[12px] text-white/65">
                        {item.point_count} 分
                      </span>
                      <span className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[12px] text-white/65">
                        最长回合 {item.longest_rally} 拍
                      </span>
                      <span className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-2.5 py-1 text-[12px] text-white/65">
                        {formatFileSize(item.file_size_bytes)}
                      </span>
                    </div>
                  </div>

                  <div className="grid place-items-center text-white/40">
                    {compact ? <FaClock /> : <FaChevronRight />}
                  </div>
                </div>

                {idx !== items.length - 1 ? <div className="mt-3 border-b border-white/8" /> : null}
              </button>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
