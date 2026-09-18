import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteEvent, duplicateEvent, listEvents, transitionEventStatus } from '@infrastructure/api/eventsApi'
import { allowedEventStatusTransitions } from '@domain/types/event'
import type { Event } from '@domain/types/event'
import type { EventStatusValue } from '@domain/constants/adminPanelConstants'
import { EventStatusBadge } from '@presentation/components/EventStatusBadge'

// Keyed by the TARGET status of a transition (never a status that is only
// ever a starting point, like 'draft').
const TRANSITION_ACTION_LABEL: Record<EventStatusValue, string> = {
  draft: '',
  published: 'Publish',
  cancelled: 'Cancel',
  closed: 'Close',
}

export function EventList() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    listEvents()
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [])

  async function handleTransition(event: Event, target: EventStatusValue): Promise<void> {
    const result = await transitionEventStatus(event.id, target)
    if (result.ok) {
      setEvents((current) => current.map((item) => (item.id === event.id ? result.event : item)))
    }
  }

  async function handleDuplicate(event: Event): Promise<void> {
    const duplicate = await duplicateEvent(event.id)
    if (duplicate) {
      setEvents((current) => [duplicate, ...current])
    }
  }

  async function handleDelete(event: Event): Promise<void> {
    if (!window.confirm(`Delete "${event.title}"? This can't be undone.`)) return

    setDeleteError(null)
    const deleted = await deleteEvent(event.id)
    if (deleted) {
      setEvents((current) => current.filter((item) => item.id !== event.id))
    } else {
      setDeleteError('Could not delete this event. Please try again.')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Events</h1>
        <button
          type="button"
          onClick={() => navigate('/events/new')}
          className="rounded-[6px] bg-qor-primary px-4 py-2 text-sm text-white"
        >
          New event
        </button>
      </div>

      {deleteError ? (
        <p role="alert" className="mb-4 text-sm text-qor-danger">
          {deleteError}
        </p>
      ) : null}

      {loading ? (
        <p className="text-white">Loading…</p>
      ) : (
        <div data-testid="event-list-card" className="rounded-[6px] bg-qor-sidebar">
          <table className="w-full text-left">
            <thead>
              <tr>
                {['Title', 'Date', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-sm font-bold text-qor-table-header">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} data-testid="event-row">
                  <td className="px-4 py-3 text-white">{event.title}</td>
                  <td className="px-4 py-3 text-white">{new Date(event.dateTime).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <EventStatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${event.id}/edit`, { state: { event } })}
                        className="text-sm text-qor-primary"
                      >
                        Edit
                      </button>
                      {allowedEventStatusTransitions(event.status).map((target) => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => handleTransition(event, target)}
                          className="text-sm text-qor-primary"
                        >
                          {TRANSITION_ACTION_LABEL[target] || target}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleDuplicate(event)}
                        className="text-sm text-qor-primary"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(event)}
                        className="text-sm text-qor-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
