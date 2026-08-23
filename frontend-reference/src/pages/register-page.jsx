import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/auth-context.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    team: '',
    email: '',
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await register(form)
      navigate('/analyze/analyze', { replace: true })
    } catch (nextError) {
      setError(nextError.message || 'Register failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0E17] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_520px_at_15%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_85%_25%,rgba(255,255,255,0.04),transparent_55%),radial-gradient(700px_420px_at_55%_90%,rgba(255,255,255,0.03),transparent_55%)]" />
      <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-10">
        <div className="w-full rounded-[28px] border border-white/10 bg-[rgba(8,14,24,0.84)] p-8 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8BFFD9]">Register</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">创建一个演示账号</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            注册完成后会直接登录，并把登录状态保存在浏览器本地。
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-white/80">
              队伍或昵称
              <input
                type="text"
                value={form.team}
                onChange={(event) => setForm((current) => ({ ...current, team: event.target.value }))}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-[#10FFB0]/45"
                placeholder="Shanghai Tennis Lab"
              />
            </label>

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
              {submitting ? '注册中...' : '注册并直接登录'}
            </button>
          </form>

          <div className="mt-5 text-sm text-white/55">
            已有账号？
            <Link to="/analyze/login" className="ml-2 text-[#8BFFD9] hover:text-white">
              去登录
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
