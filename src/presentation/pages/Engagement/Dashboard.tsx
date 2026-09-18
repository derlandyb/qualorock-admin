import { useEffect, useState } from 'react'
import { getEngagementSummary } from '@infrastructure/api/engagementApi'
import type { EventEngagement } from '@domain/types/engagement'

interface StatCard {
  label: string
  value: number
}

function totals(events: EventEngagement[]): StatCard[] {
  return [
    { label: 'Views', value: events.reduce((sum, event) => sum + event.viewsCount, 0) },
    { label: 'Favorites', value: events.reduce((sum, event) => sum + event.favoritesCount, 0) },
    { label: 'Ticket-link clicks', value: events.reduce((sum, event) => sum + event.ticketLinkClicksCount, 0) },
    { label: 'Interest', value: events.reduce((sum, event) => sum + event.interestCount, 0) },
  ]
}

export function Dashboard() {
  const [events, setEvents] = useState<EventEngagement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEngagementSummary()
      .then(setEvents)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-white">Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-white">Engagement</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {totals(events).map((card) => (
          <div key={card.label} data-testid="engagement-stat-card" className="rounded-[6px] bg-qor-sidebar p-4">
            <p className="text-sm text-qor-table-header">{card.label}</p>
            <p className="text-2xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div data-testid="engagement-breakdown-card" className="rounded-[6px] bg-qor-sidebar">
        <table className="w-full text-left">
          <thead>
            <tr>
              {['Event', 'Views', 'Favorites', 'Clicks', 'Interest'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-sm font-bold text-qor-table-header">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.eventId} data-testid="engagement-breakdown-row">
                <td className="px-4 py-3 text-white">{event.eventId}</td>
                <td className="px-4 py-3 text-white">{event.viewsCount}</td>
                <td className="px-4 py-3 text-white">{event.favoritesCount}</td>
                <td className="px-4 py-3 text-white">{event.ticketLinkClicksCount}</td>
                <td className="px-4 py-3 text-white">{event.interestCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
