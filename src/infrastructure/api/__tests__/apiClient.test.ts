import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, ensureCsrfCookie } from '../apiClient'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

function clearXsrfCookie() {
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

describe('apiClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    clearXsrfCookie()
  })

  // Spec anchor: Sanctum's stateful cookie auth requires the XSRF-TOKEN
  // cookie echoed back as X-XSRF-TOKEN on mutating requests.
  it('GIVEN an XSRF-TOKEN cookie WHEN a POST request is made THEN it echoes the token as X-XSRF-TOKEN', async () => {
    document.cookie = 'XSRF-TOKEN=abc123'
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/organizer/login', { method: 'POST', body: '{}' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('X-XSRF-TOKEN')).toBe('abc123')
  })

  it('GIVEN no XSRF-TOKEN cookie WHEN a POST request is made THEN it sends no X-XSRF-TOKEN header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/organizer/login', { method: 'POST', body: '{}' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.has('X-XSRF-TOKEN')).toBe(false)
  })

  it('GIVEN an XSRF-TOKEN cookie WHEN a GET request is made THEN it does not attach X-XSRF-TOKEN', async () => {
    document.cookie = 'XSRF-TOKEN=abc123'
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/super-admin/organizers')

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('X-XSRF-TOKEN')).toBeNull()
  })

  it('GIVEN any request WHEN it is sent THEN credentials are always set to include', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/organizer/login')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.credentials).toBe('include')
  })

  it('GIVEN a path WHEN apiFetch is called THEN it requests VITE_API_URL joined with the path', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/organizer/login')

    const [url] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:8000/api/admin/v1/organizer/login')
  })

  it('GIVEN a response with no JSON body WHEN apiFetch is called THEN data resolves to null instead of throwing', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    } as Response)

    const result = await apiFetch('/api/admin/v1/organizer/login')

    expect(result.data).toBeNull()
    expect(result.ok).toBe(true)
  })

  it('GIVEN ensureCsrfCookie WHEN called THEN it requests the Sanctum csrf-cookie endpoint with credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve(null) } as Response)

    await ensureCsrfCookie()

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/sanctum/csrf-cookie',
      expect.objectContaining({ credentials: 'include' }),
    )
  })
})
