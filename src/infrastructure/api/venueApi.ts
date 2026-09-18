import { apiFetch } from './apiClient'
import type { Venue } from '@domain/types/venue'

interface VenueBody {
  data: Venue
}

export async function getVenue(): Promise<Venue | null> {
  const response = await apiFetch<VenueBody>('/api/admin/v1/organizer/venue')
  return response.data?.data ?? null
}
