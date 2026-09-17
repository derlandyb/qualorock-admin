const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  // Fails fast instead of silently requesting `undefined/api/...` - a fresh
  // clone (no .env.local) or a Docker image built without VITE_API_URL set
  // would otherwise 404 on every request with no clear signal why.
  throw new Error('VITE_API_URL is not set - see admin/README.md for local setup.')
}

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
  data: T | null
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

  // A 204, or a non-JSON body from a proxy error page, resolves to null -
  // callers must not assume `data` is always present.
  const data = (await response.json().catch(() => null)) as T | null
  return { ok: response.ok, status: response.status, data }
}
