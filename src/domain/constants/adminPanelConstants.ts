export const QOR_COLORS = {
  sidebarSurface: '#191c24',
  border: '#2c2e33',
  primary: '#0090e7',
  warning: '#ffab00',
  danger: '#fc424a',
  canvas: '#000000',
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
