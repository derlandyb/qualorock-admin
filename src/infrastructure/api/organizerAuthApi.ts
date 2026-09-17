import { apiFetch, ensureCsrfCookie } from './apiClient'
import type { OrganizerLoginResult } from '@domain/types/organizer'

export type LoginOrganizerResponse =
  | { ok: true; result: OrganizerLoginResult }
  | { ok: false; message: string }

export async function loginOrganizer(email: string, password: string): Promise<LoginOrganizerResponse> {
  await ensureCsrfCookie()

  const { ok, data } = await apiFetch<OrganizerLoginResult & { message?: string }>(
    '/api/admin/v1/organizer/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
  )

  if (!ok) return { ok: false, message: data?.message ?? 'Login failed.' }
  return { ok: true, result: data }
}
