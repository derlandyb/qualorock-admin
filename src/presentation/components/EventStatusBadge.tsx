import { EVENT_STATUS_BADGE_COLOR } from '@domain/constants/adminPanelConstants'
import type { EventStatusValue } from '@domain/constants/adminPanelConstants'

const STATUS_LABEL: Record<EventStatusValue, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  closed: 'Closed',
}

interface EventStatusBadgeProps {
  status: EventStatusValue
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <span
      data-testid="event-status-badge"
      className="inline-block rounded-[6px] px-2 py-1 text-xs font-medium text-white"
      style={{ backgroundColor: EVENT_STATUS_BADGE_COLOR[status] }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
