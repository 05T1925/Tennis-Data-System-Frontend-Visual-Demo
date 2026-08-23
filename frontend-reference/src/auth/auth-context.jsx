import { createContext, useContext, useMemo, useState } from 'react'
import { loginUser, registerUser } from '../api'
import { clearAuthSession, loadAuthSession, saveAuthSession } from './auth-storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadAuthSession())

  async function login(credentials) {
    const nextSession = await loginUser(credentials)
    saveAuthSession(nextSession)
    setSession(nextSession)
    return nextSession
  }

  async function register(payload) {
    const nextSession = await registerUser(payload)
    saveAuthSession(nextSession)
    setSession(nextSession)
    return nextSession
  }

  function logout() {
    clearAuthSession()
    setSession(null)
  }

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session?.user),
      login,
      register,
      logout,
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
