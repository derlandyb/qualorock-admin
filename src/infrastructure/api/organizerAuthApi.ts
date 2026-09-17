import { apiFetch, ensureCsrfCookie } from './apiClient'
import type { OrganizerLoginResult } from '@domain/types/organizer'

export type LoginOrganizerResponse =
  | { ok: true; result: OrganizerLoginResult }
  | { ok: false; message: string }

interface LoginOrganizerSuccessBody {
  data: OrganizerLoginResult
}

interface LoginOrganizerErrorBody {
  message?: string
}

const CSRF_TOKEN_MISMATCH_STATUS = 419

export async function loginOrganizer(email: string, password: string): Promise<LoginOrganizerResponse> {
  await ensureCsrfCookie()

  let response = await apiFetch<LoginOrganizerSuccessBody & LoginOrganizerErrorBody>(
    '/api/admin/v1/organizer/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )

  // A stale/expired XSRF-TOKEN (a login page left open for a while) gets a
  // 419 from Laravel - refetch the cookie and retry once before giving up.
  if (response.status === CSRF_TOKEN_MISMATCH_STATUS) {
    await ensureCsrfCookie()
    response = await apiFetch<LoginOrganizerSuccessBody & LoginOrganizerErrorBody>(
      '/api/admin/v1/organizer/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    )
  }

  const { ok, data } = response
  if (!ok || !data) return { ok: false, message: data?.message ?? 'Login failed.' }
  return { ok: true, result: data.data }
}
