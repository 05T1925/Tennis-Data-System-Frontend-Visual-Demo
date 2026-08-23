import { FaArrowLeft } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context.jsx'

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-[rgba(255,255,255,0.03)] px-5 py-4">
      <div className="text-sm text-white/45">{label}</div>
      <div className="mt-2 text-base text-white/88">{value}</div>
    </div>
  )
}

export default function ProfileSettings() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  function handleLogout() {
    logout()
    navigate('/analyze/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-[#0A0E17] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_520px_at_15%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_85%_25%,rgba(255,255,255,0.04),transparent_55%),radial-gradient(700px_420px_at_55%_90%,rgba(255,255,255,0.03),transparent_55%)]" />

      <header className="mx-auto flex w-full max-w-4xl items-center justify-center px-6 py-8">
        <Link
          to="/analyze/"
          className="absolute left-6 inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-white/10 bg-[rgba(255,255,255,0.03)] text-white/75 transition hover:border-[rgba(16,255,176,0.35)] hover:text-white"
          aria-label="Back home"
        >
          <FaArrowLeft size={13} />
        </Link>
        <h1 className="text-3xl font-semibold tracking-wide">账号信息</h1>
      </header>

      <section className="mx-auto w-full max-w-2xl px-6 pb-12">
        <div className="rounded-[20px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)]">
          <div className="text-sm uppercase tracking-[0.22em] text-[#8BFFD9]">Current Session</div>
          <h2 className="mt-4 text-3xl font-semibold text-white">{user?.display_name || 'Demo User'}</h2>
          <p className="mt-3 text-sm text-white/60">当前登录状态保存在浏览器本地，不会自动退出。</p>

          <div className="mt-8 grid gap-4">
            <InfoCard label="用户 ID" value={user?.user_id || '-'} />
            <InfoCard label="邮箱" value={user?.email || '-'} />
            <InfoCard label="状态" value={user?.status || 'active'} />
          </div>

          <button
            onClick={handleLogout}
            className="mt-10 w-full rounded-[12px] border border-[#ff5f6d]/45 bg-[rgba(255,95,109,0.16)] py-3 text-base font-semibold text-[#ff8f99] transition hover:bg-[rgba(255,95,109,0.22)] hover:text-[#ffb5bc]"
          >
            退出登录
          </button>
        </div>
      </section>
    </main>
  )
}
