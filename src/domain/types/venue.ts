// Backend VenueController::show/update's response shape - one venue per organizer.
export interface Venue {
  id: number
  organizerId: number
  name: string
  description: string
  address: string
  contactInfo: string
  imageUrl: string | null
}
