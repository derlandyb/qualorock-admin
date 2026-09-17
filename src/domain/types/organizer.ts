import type { OrganizerApprovalStateValue } from '@domain/constants/adminPanelConstants'

// Backend login success shape: { data: { approvalState, rejectionReason } }
export interface OrganizerLoginResult {
  approvalState: OrganizerApprovalStateValue
  rejectionReason: string | null
}

// Backend EnsureOrganizerApproved 403 shape: { state, rejectionReason }
// Deliberately a separate type from OrganizerLoginResult: the backend uses a
// different field name here (`state`, not `approvalState`) — do not merge
// these into one type.
export interface ApprovalGateError {
  state: OrganizerApprovalStateValue | null
  rejectionReason: string | null
}
