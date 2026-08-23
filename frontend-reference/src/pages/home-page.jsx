import { FaRegUserCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/auth-context.jsx'
import HistoryRecords from '../components/HistoryRecords.jsx'

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0A0E17] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_520px_at_15%_10%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(900px_520px_at_85%_25%,rgba(255,255,255,0.04),transparent_55%),radial-gradient(700px_420px_at_55%_90%,rgba(255,255,255,0.03),transparent_55%)]" />

      <section className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 md:px-8 md:py-8">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-wide text-white/90 md:text-2xl">Tennis Data Master</h1>
            <p className="text-sm text-white/45">比赛视频上传、分析和历史记录演示</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/analyze/profile"
                  className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-[#10FFB0]/45 hover:text-white"
                >
                  <FaRegUserCircle size={18} />
                  <span>{user?.display_name || 'Demo Coach'}</span>
                </Link>
                <Link
                  to="/analyze/login"
                  className="rounded-[8px] border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/75 transition hover:border-[#10FFB0]/45 hover:text-white"
                >
                  切换账号
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/analyze/login"
                  className="rounded-[8px] border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:border-[#10FFB0]/45 hover:text-white"
                >
                  登录
                </Link>
                <Link
                  to="/analyze/register"
                  className="rounded-[8px] border border-[#10FFB0]/35 bg-[#10FFB0]/10 px-4 py-2 text-sm text-[#8BFFD9] transition hover:border-[#10FFB0]/60 hover:bg-[#10FFB0]/15"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center pb-10 pt-10 text-center md:pb-16">
          <h2 className="max-w-4xl text-4xl font-semibold leading-tight text-white md:text-6xl">
            AI tennis match analysis dashboard
          </h2>
          <p className="mt-5 max-w-4xl text-sm leading-7 text-white/55 md:text-lg md:leading-8">
            首页现在会直接展示当前登录状态、上传入口和历史上传记录，适合比赛演示时快速进入流程。
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/65">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
              当前状态：{isAuthenticated ? `已登录 ${user?.display_name || 'Demo Coach'}` : '未登录'}
            </span>
            {isAuthenticated ? (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                登录邮箱：{user?.email || 'coach@tennislab.io'}
              </span>
            ) : null}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/analyze/analyze?autoupload=1' : '/analyze/login'}
              className="inline-flex items-center justify-center rounded-2xl border border-[#10FFB0]/35 bg-white/[0.03] px-8 py-4 text-base font-medium tracking-[0.08em] text-[#B9FFE8] backdrop-blur-md transition duration-200 hover:border-[#10FFB0]/65 hover:bg-[#10FFB0]/10 hover:text-white hover:shadow-[0_0_35px_rgba(16,255,176,0.22)] md:px-12 md:py-5 md:text-xl"
            >
              {isAuthenticated ? '上传视频并开始分析' : '先登录再开始演示'}
            </Link>

            {!isAuthenticated ? (
              <Link
                to="/analyze/register"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-white/80 transition hover:border-white/20 hover:text-white md:px-10 md:py-5"
              >
                新用户注册
              </Link>
            ) : (
              <Link
                to="/analyze/profile"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-base font-medium text-white/80 transition hover:border-white/20 hover:text-white md:px-10 md:py-5"
              >
                查看登录信息
              </Link>
            )}
          </div>
        </div>

        {isAuthenticated ? (
          <div className="mx-auto w-full max-w-5xl pb-12">
            <HistoryRecords compact />
          </div>
        ) : null}
      </section>
    </main>
  )
}
