import { ORGANIZER_APPROVAL_STATE, type OrganizerApprovalStateValue } from '@domain/constants/adminPanelConstants'

interface ApprovalBannerProps {
  state: OrganizerApprovalStateValue
  rejectionReason: string | null
}

const VARIANT_CLASSES: Record<'pending' | 'rejected', string> = {
  pending: 'bg-qor-warning',
  rejected: 'bg-qor-danger',
}

export function ApprovalBanner({ state, rejectionReason }: ApprovalBannerProps) {
  if (state !== ORGANIZER_APPROVAL_STATE.pending && state !== ORGANIZER_APPROVAL_STATE.rejected) {
    return null
  }

  return (
    <div
      data-testid="approval-banner"
      className={`rounded-md py-1 px-2 text-xs font-medium text-white ${VARIANT_CLASSES[state]}`}
    >
      {state === ORGANIZER_APPROVAL_STATE.pending
        ? 'Your account is pending Super Admin approval.'
        : 'Your account was rejected.'}
      {rejectionReason ? <span> {rejectionReason}</span> : null}
    </div>
  )
}
