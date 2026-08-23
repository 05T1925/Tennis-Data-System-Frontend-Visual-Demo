import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom'
import App from './App.jsx'
import { useAuth } from './auth/auth-context.jsx'
import HomePage from './pages/home-page.jsx'
import LoginPage from './pages/login-page.jsx'
import ProfilePage from './pages/profile-page.jsx'
import RegisterPage from './pages/register-page.jsx'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return children
  }

  return <Navigate to="/analyze/login" replace state={{ from: `${location.pathname}${location.search}` }} />
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-6 text-center">
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="mt-3 text-sm text-white/70">Page not found.</p>
        <a
          href="/analyze/"
          className="mt-5 inline-flex rounded-md border border-emerald-300/30 px-4 py-2 text-sm text-emerald-300"
        >
          Back home
        </a>
      </div>
    </div>
  )
}

export const appRouter = createBrowserRouter([
  { path: '/analyze/', element: <HomePage /> },
  { path: '/analyze/login', element: <LoginPage /> },
  { path: '/analyze/register', element: <RegisterPage /> },
  {
    path: '/analyze/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/analyze/analyze',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
])
