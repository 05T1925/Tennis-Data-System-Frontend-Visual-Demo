import { mockMatchData } from '../mock/data'
import { enrichAnalysisResult } from '../utils/analysis'

const STORAGE_KEY = 'tennis:last-analysis'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/analyze/api').replace(/\/$/, '')
const USE_REAL_API = String(import.meta.env.VITE_USE_REAL_API || '').toLowerCase() === 'true'
const DEMO_HISTORY = [
  {
    upload_id: 'test_upload_001',
    user_id: 'demo_coach',
    display_name: 'Demo Coach',
    original_filename: 'Qinwen Zheng vs. Elena Rybakina 2026 Doha Round of 16 WTA Match.mp4',
    stored_path: 'cv\\scripts\\VideoOutput\\Qinwen Zheng vs. Elena Rybakina 2026 Doha Round of 16 WTA Match.mp4',
    file_size_bytes: 62614430,
    duration_sec: 308.28,
    fps: 25,
    width: 1920,
    height: 1080,
    status: 'completed',
    created_at: '2026-04-30 03:20:42',
    point_count: 16,
    longest_rally: 14,
  },
]

let sampleCache = null

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function getBackendOrigin() {
  try {
    return new URL(API_BASE_URL).origin
  } catch {
    return ''
  }
}

function normalizeBackendMediaUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (/^https?:\/\//i.test(url)) return url
  if (!url.startsWith('/')) return url
  return `${getBackendOrigin()}${url}`
}

function saveResult(result) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  } catch {
    // ignore storage failures
  }
}

function loadResult() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function loadBackendSample() {
  if (sampleCache) return clone(sampleCache)
  try {
    const response = await fetch('/test/match_data.json')
    if (!response.ok) return null
    const data = await response.json()
    sampleCache = data
    return clone(data)
  } catch {
    return null
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  let body = options.body

  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.json)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || '请求失败')
  }

  return data
}

export async function getAnalysisResult() {
  if (USE_REAL_API) {
    const payload = await request('/analysis/latest')
    payload.videoUrl = normalizeBackendMediaUrl(payload.videoUrl)
    const data = enrichAnalysisResult(payload)
    saveResult(data)
    return data
  }

  await new Promise((resolve) => setTimeout(resolve, 150))
  const backendSample = await loadBackendSample()
  if (backendSample) return enrichAnalysisResult(backendSample)
  const local = loadResult()
  if (local) return enrichAnalysisResult(local)
  return enrichAnalysisResult(clone(mockMatchData))
}

export async function getAnalysisDetail(uploadId) {
  if (uploadId) {
    const payload = await request(`/analysis/detail/${uploadId}`)
    payload.videoUrl = normalizeBackendMediaUrl(payload.videoUrl)
    return enrichAnalysisResult(payload)
  }
  return getAnalysisResult()
}

export async function getUploadProgress(uploadId) {
  return request(`/upload/${uploadId}/progress`)
}

export async function uploadAndAnalyze(file, { onUploadProgress } = {}) {
  if (file) {
    return new Promise((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)
      try {
        const session = JSON.parse(localStorage.getItem('tennis:auth-session') || 'null')
        if (session?.user?.user_id) {
          form.append('user_id', session.user.user_id)
        }
      } catch {
        // ignore auth storage parsing failures
      }

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE_URL}/upload`)
      xhr.responseType = 'json'

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        const percent = Math.round((event.loaded / event.total) * 100)
        onUploadProgress?.(percent)
      }

      xhr.onerror = () => reject(new Error('上传失败'))
      xhr.onload = () => {
        const payload = xhr.response || JSON.parse(xhr.responseText || 'null')
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(payload?.detail || '上传失败'))
          return
        }
        resolve(payload)
      }

      xhr.send(form)
    })
  }

  await new Promise((resolve) => setTimeout(resolve, 600))
  const result = enrichAnalysisResult(clone(mockMatchData))
  result.videoMeta = {
    ...(result.videoMeta ?? {}),
    filename: file?.name ?? 'uploaded-video.mp4',
  }
  saveResult(result)
  return result
}

export function loginUser(credentials) {
  return request('/auth/login', {
    method: 'POST',
    json: credentials,
  })
}

export function registerUser(payload) {
  return request('/auth/register', {
    method: 'POST',
    json: payload,
  })
}

export function getUploadHistory(userId) {
  return request(`/analysis/history/${userId}`).catch((error) => {
    if (userId === 'demo_coach') {
      return DEMO_HISTORY
    }
    throw error
  })
}
