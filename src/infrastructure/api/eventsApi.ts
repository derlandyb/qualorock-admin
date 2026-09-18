import { apiFetch, ensureCsrfCookie } from './apiClient'
import type { Event } from '@domain/types/event'
import type { EventStatusValue } from '@domain/constants/adminPanelConstants'

interface EventsListBody {
  data: Event[]
}

interface EventBody {
  data: Event
}

export async function listEvents(): Promise<Event[]> {
  const response = await apiFetch<EventsListBody>('/api/admin/v1/organizer/events')
  return response.data?.data ?? []
}

export type CreateEventPayload = Omit<Event, 'id' | 'organizerId' | 'status' | 'publishedAt'>

export async function createEvent(payload: CreateEventPayload): Promise<Event | null> {
  await ensureCsrfCookie()
  const response = await apiFetch<EventBody>('/api/admin/v1/organizer/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return response.data?.data ?? null
}

export async function updateEvent(id: number, payload: Partial<CreateEventPayload>): Promise<Event | null> {
  await ensureCsrfCookie()
  const response = await apiFetch<EventBody>(`/api/admin/v1/organizer/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return response.data?.data ?? null
}

export async function duplicateEvent(id: number): Promise<Event | null> {
  await ensureCsrfCookie()
  const response = await apiFetch<EventBody>(`/api/admin/v1/organizer/events/${id}/duplicate`, {
    method: 'POST',
  })
  return response.data?.data ?? null
}

export type TransitionEventStatusErrorCode = 'invalid_transition' | 'missing_required_fields' | 'upgrade_required'

export type TransitionEventStatusResult =
  | { ok: true; event: Event }
  | { ok: false; errorCode: TransitionEventStatusErrorCode; missingFields?: string[] }

interface TransitionEventStatusErrorBody {
  error?: TransitionEventStatusErrorCode
  missingFields?: string[]
}

export async function transitionEventStatus(
  id: number,
  status: EventStatusValue,
): Promise<TransitionEventStatusResult> {
  await ensureCsrfCookie()
  const response = await apiFetch<EventBody & TransitionEventStatusErrorBody>(
    `/api/admin/v1/organizer/events/${id}/status`,
    { method: 'POST', body: JSON.stringify({ status }) },
  )

  if (!response.ok || !response.data) {
    return {
      ok: false,
      errorCode: response.data?.error ?? 'invalid_transition',
      missingFields: response.data?.missingFields,
    }
  }

  return { ok: true, event: response.data.data }
}
