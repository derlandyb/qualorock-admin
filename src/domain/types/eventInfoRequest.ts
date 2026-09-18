// Mirrors EventInfoRequestController::toResponse's exact field set.
export interface EventInfoRequest {
  id: number
  eventId: number
  consumerUserId: number
  message: string
  organizerResponse: string | null
  respondedAt: string | null
}
