import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({
    email: 'coach@tennislab.io',
    password: 'demo1234',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(form)
      navigate(location.state?.from || '/analyze/analyze', { replace: true })
    } catch (nextError) {
      setError(nextError.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0E17] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_520px_at_15%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_85%_25%,rgba(255,255,255,0.04),transparent_55%),radial-gradient(700px_420px_at_55%_90%,rgba(255,255,255,0.03),transparent_55%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8BFFD9]">
              Tennis Data System
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-6xl">
              Match analysis demo login
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Use the seeded demo account to enter the match analysis dashboard, or register a new account for the presentation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/70">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                Fast demo setup
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                Persistent login
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
                SQLite users
              </span>
            </div>
          </div>

          <section className="rounded-[28px] border border-white/10 bg-[rgba(8,14,24,0.84)] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8BFFD9]">
              Sign in
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-white">登录后默认长期保持状态</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              演示版不做自动过期，浏览器不清缓存就不会自动退出。
            </p>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-white/80">
                邮箱
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#10FFB0]/45"
                />
              </label>

              <label className="grid gap-2 text-sm text-white/80">
                密码
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#10FFB0]/45"
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-2xl border border-[#10FFB0]/35 bg-[#10FFB0]/12 px-5 py-3 text-sm font-semibold text-[#B9FFE8] transition hover:border-[#10FFB0]/65 hover:bg-[#10FFB0]/16 hover:text-white disabled:opacity-60"
              >
                {submitting ? '登录中...' : '登录并进入分析台'}
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              演示账号：`coach@tennislab.io / demo1234`
            </div>

            <div className="mt-5 text-sm text-white/55">
              还没有账号？
              <Link to="/analyze/register" className="ml-2 text-[#8BFFD9] hover:text-white">
                去注册
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
