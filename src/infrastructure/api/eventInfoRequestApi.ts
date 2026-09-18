import { apiFetch, ensureCsrfCookie } from './apiClient'
import type { EventInfoRequest } from '@domain/types/eventInfoRequest'

interface EventInfoRequestsListBody {
  data: EventInfoRequest[]
}

interface EventInfoRequestBody {
  data: EventInfoRequest
}

export async function listEventInfoRequests(eventId: number): Promise<EventInfoRequest[]> {
  const response = await apiFetch<EventInfoRequestsListBody>(`/api/admin/v1/organizer/events/${eventId}/info-requests`)
  return response.data?.data ?? []
}

export async function respondToEventInfoRequest(
  infoRequestId: number,
  response: string,
): Promise<EventInfoRequest | null> {
  await ensureCsrfCookie()
  const result = await apiFetch<EventInfoRequestBody>(`/api/admin/v1/organizer/info-requests/${infoRequestId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  })
  return result.data?.data ?? null
}
