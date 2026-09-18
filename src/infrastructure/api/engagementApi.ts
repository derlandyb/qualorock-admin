import { apiFetch } from './apiClient'
import type { EventEngagement } from '@domain/types/engagement'

interface EngagementSummaryBody {
  data: EventEngagement[]
}

export async function getEngagementSummary(): Promise<EventEngagement[]> {
  const response = await apiFetch<EngagementSummaryBody>('/api/admin/v1/organizer/engagement')
  return response.data?.data ?? []
}
