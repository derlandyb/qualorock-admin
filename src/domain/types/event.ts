import { EVENT_STATUS, type EventStatusValue } from '@domain/constants/adminPanelConstants'

// Mirrors EventController::toResponse's exact field set.
export interface Event {
  id: number
  organizerId: number
  venueId: number
  title: string
  description: string
  dateTime: string
  location: string
  fullAddress: string
  featuredImageUrl: string
  externalTicketLink: string
  priceType: 'free' | 'paid'
  musicCategory: string
  capacity: number | null
  ageRange: string | null
  additionalInfo: string | null
  accessibilityInfo: string | null
  eventRules: string | null
  status: EventStatusValue
  publishedAt: string | null
}

// Mirrors backend App\Domain\Entities\Event::canTransitionTo's whitelist -
// the UI must never offer a transition the backend would reject with 422.
const EVENT_STATUS_TRANSITIONS: Record<EventStatusValue, readonly EventStatusValue[]> = {
  [EVENT_STATUS.draft]: [EVENT_STATUS.published, EVENT_STATUS.cancelled],
  [EVENT_STATUS.published]: [EVENT_STATUS.cancelled, EVENT_STATUS.closed],
  [EVENT_STATUS.cancelled]: [],
  [EVENT_STATUS.closed]: [],
}

export function allowedEventStatusTransitions(current: EventStatusValue): readonly EventStatusValue[] {
  return EVENT_STATUS_TRANSITIONS[current]
}
