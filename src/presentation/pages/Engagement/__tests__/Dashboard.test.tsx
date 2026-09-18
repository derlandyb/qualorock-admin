import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from '../Dashboard'
import type { EventEngagement } from '@domain/types/engagement'

const getEngagementSummaryMock = vi.fn()

vi.mock('@infrastructure/api/engagementApi', () => ({
  getEngagementSummary: (...args: unknown[]) => getEngagementSummaryMock(...args),
}))

function makeEngagement(overrides: Partial<EventEngagement> = {}): EventEngagement {
  return {
    eventId: 1,
    viewsCount: 10,
    favoritesCount: 2,
    ticketLinkClicksCount: 1,
    interestCount: 3,
    ...overrides,
  }
}

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={['/engagement']}>
      <Dashboard />
    </MemoryRouter>,
  )
}

describe('Dashboard', () => {
  afterEach(() => {
    getEngagementSummaryMock.mockReset()
  })

  it('GIVEN multiple events with recorded activity WHEN the dashboard loads THEN the stat cards show the summed totals', async () => {
    getEngagementSummaryMock.mockResolvedValue([
      makeEngagement({ eventId: 1, viewsCount: 10, favoritesCount: 2, ticketLinkClicksCount: 1, interestCount: 3 }),
      makeEngagement({ eventId: 2, viewsCount: 20, favoritesCount: 4, ticketLinkClicksCount: 2, interestCount: 5 }),
    ])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getAllByTestId('engagement-stat-card')).toHaveLength(4)
    })
    const cards = screen.getAllByTestId('engagement-stat-card')
    expect(cards[0]).toHaveTextContent('Views')
    expect(cards[0]).toHaveTextContent('30')
    expect(cards[1]).toHaveTextContent('Favorites')
    expect(cards[1]).toHaveTextContent('6')
    expect(cards[2]).toHaveTextContent('Ticket-link clicks')
    expect(cards[2]).toHaveTextContent('3')
    expect(cards[3]).toHaveTextContent('Interest')
    expect(cards[3]).toHaveTextContent('8')
  })

  it('GIVEN an event with zero recorded activity WHEN the dashboard loads THEN it appears in the breakdown with explicit zero values', async () => {
    getEngagementSummaryMock.mockResolvedValue([
      makeEngagement({ eventId: 7, viewsCount: 0, favoritesCount: 0, ticketLinkClicksCount: 0, interestCount: 0 }),
    ])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getAllByTestId('engagement-breakdown-row')).toHaveLength(1)
    })
    const row = screen.getByTestId('engagement-breakdown-row')
    expect(row).toHaveTextContent('7')
    expect(row).toHaveTextContent('0')
  })
})
