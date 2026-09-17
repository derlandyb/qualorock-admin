import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '../apiClient'

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('apiClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'XSRF-TOKEN=abc123'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  // Spec anchor: Sanctum's stateful cookie auth requires the XSRF-TOKEN
  // cookie echoed back as X-XSRF-TOKEN on mutating requests.
  it('GIVEN an XSRF-TOKEN cookie WHEN a POST request is made THEN it echoes the token as X-XSRF-TOKEN', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: 'ok' }))

    await apiFetch('/api/admin/v1/organizer/login', { method: 'POST', body: '{}' })

    const [, init] = fetchMock.mock.calls[0]
    const headers = init.headers as Headers
    expect(headers.get('X-XSRF-TOKEN')).toBe('abc123')
  })

  it('GIVEN an XSRF-TOKEN cookie WHEN a GET request is made THEN it does not attach X-XSRF-TOKEN', async () => {
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
})
