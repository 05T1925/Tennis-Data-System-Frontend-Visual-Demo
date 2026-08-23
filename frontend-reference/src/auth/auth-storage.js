const AUTH_STORAGE_KEY = 'tennis:auth-session'
const DEMO_BOOTSTRAP_KEY = 'tennis:demo-session-bootstrapped'
const DEFAULT_DEMO_SESSION = {
  user: {
    user_id: 'demo_coach',
    email: 'coach@tennislab.io',
    display_name: 'Demo Coach',
    status: 'active',
  },
  message: 'Demo session restored',
}

export function loadAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }

    const hasBootstrapped = localStorage.getItem(DEMO_BOOTSTRAP_KEY)
    if (!hasBootstrapped) {
      localStorage.setItem(DEMO_BOOTSTRAP_KEY, '1')
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SESSION))
      return DEFAULT_DEMO_SESSION
    }

    return null
  } catch {
    return null
  }
}

export function saveAuthSession(session) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // ignore storage failures
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // ignore storage failures
  }
}
