import { apiFetch } from './apiClient'
import type { EventEngagement } from '@domain/types/engagement'

interface EventEngagementBody {
  data: EventEngagement
}

interface EngagementSummaryBody {
  data: EventEngagement[]
}

export async function getEventEngagement(eventId: number): Promise<EventEngagement | null> {
  const response = await apiFetch<EventEngagementBody>(`/api/admin/v1/organizer/events/${eventId}/engagement`)
  return response.data?.data ?? null
}

export async function getEngagementSummary(): Promise<EventEngagement[]> {
  const response = await apiFetch<EngagementSummaryBody>('/api/admin/v1/organizer/engagement')
  return response.data?.data ?? []
}
