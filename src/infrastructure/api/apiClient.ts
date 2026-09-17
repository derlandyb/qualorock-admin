const API_URL = import.meta.env.VITE_API_URL

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Laravel Sanctum's SPA cookie-session flow requires an XSRF-TOKEN cookie
// before any mutating request; there is no axios here to fetch it
// automatically, so this must be called before the first POST/PUT/DELETE.
export async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' })
}

export interface ApiResponse<T> {
  ok: boolean
  status: number
  data: T
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')

  if (method !== 'GET') {
    const xsrf = readCookie('XSRF-TOKEN')
    if (xsrf) headers.set('X-XSRF-TOKEN', xsrf)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  })

  const data = (await response.json().catch(() => null)) as T
  return { ok: response.ok, status: response.status, data }
}
