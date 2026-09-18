import { apiFetch } from './apiClient'

export async function checkSuperAdminAccess(): Promise<{ authorized: boolean }> {
  const { ok } = await apiFetch('/api/admin/v1/super-admin/organizers')
  return { authorized: ok }
}
