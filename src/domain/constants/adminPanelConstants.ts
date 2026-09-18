export const QOR_COLORS = {
  sidebarSurface: '#191c24',
  border: '#2c2e33',
  primary: '#0090e7',
  warning: '#ffab00',
  danger: '#fc424a',
  canvas: '#000000',
  success: '#00d25b',
  purple: '#8f5fe8',
  lightGray: '#e4eaec',
  tableHeaderText: 'rgb(108, 114, 147)',
} as const

export const QOR_LAYOUT = {
  sidebarExpandedWidth: 244, // px — body wrapper: calc(100% - 244px)
  sidebarCollapseTransition: 'all .25s ease-out',
  mobileBreakpoint: 992, // px — below this, body wrapper is 100%
  bannerRadius: 6, // px
  bannerPaddingY: 4, // px
  bannerPaddingX: 8, // px
  inputBorderRadius: 2, // px
  buttonBorderRadius: 6, // px
} as const

// Mirrors the backend's App\Domain\Enums\OrganizerApprovalState values —
// never hardcode these strings at call sites.
export const ORGANIZER_APPROVAL_STATE = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const

export type OrganizerApprovalStateValue =
  (typeof ORGANIZER_APPROVAL_STATE)[keyof typeof ORGANIZER_APPROVAL_STATE]

// Mirrors the backend's App\Domain\Enums\EventStatus values — never
// hardcode these strings at call sites.
export const EVENT_STATUS = {
  draft: 'draft',
  published: 'published',
  cancelled: 'cancelled',
  closed: 'closed',
} as const

export type EventStatusValue = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS]

export const EVENT_STATUS_BADGE_COLOR: Record<EventStatusValue, string> = {
  [EVENT_STATUS.draft]: QOR_COLORS.purple,
  [EVENT_STATUS.published]: QOR_COLORS.success,
  [EVENT_STATUS.cancelled]: QOR_COLORS.danger,
  [EVENT_STATUS.closed]: QOR_COLORS.lightGray,
}
