import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventList } from '../EventList'
import type { Event } from '@domain/types/event'

const listEventsMock = vi.fn()
const duplicateEventMock = vi.fn()
const transitionEventStatusMock = vi.fn()
const deleteEventMock = vi.fn()

vi.mock('@infrastructure/api/eventsApi', () => ({
  listEvents: (...args: unknown[]) => listEventsMock(...args),
  duplicateEvent: (...args: unknown[]) => duplicateEventMock(...args),
  transitionEventStatus: (...args: unknown[]) => transitionEventStatusMock(...args),
  deleteEvent: (...args: unknown[]) => deleteEventMock(...args),
}))

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    organizerId: 1,
    venueId: 1,
    title: 'Rock Night',
    description: 'A great night',
    dateTime: '2026-10-01T20:00:00-03:00',
    location: 'Downtown',
    fullAddress: '123 Main St',
    featuredImageUrl: 'https://example.com/image.jpg',
    externalTicketLink: 'https://example.com/tickets',
    priceType: 'paid',
    musicCategory: 'Rock',
    capacity: null,
    ageRange: null,
    additionalInfo: null,
    accessibilityInfo: null,
    eventRules: null,
    status: 'draft',
    publishedAt: null,
    ...overrides,
  }
}

function renderEventList() {
  render(
    <MemoryRouter initialEntries={['/events']}>
      <Routes>
        <Route path="/events" element={<EventList />} />
        <Route path="/events/new" element={<div data-testid="event-form-new">new</div>} />
        <Route path="/events/:id/edit" element={<div data-testid="event-form-edit">edit</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EventList', () => {
  afterEach(() => {
    listEventsMock.mockReset()
    duplicateEventMock.mockReset()
    transitionEventStatusMock.mockReset()
    deleteEventMock.mockReset()
    vi.restoreAllMocks()
  })

  it('GIVEN events of every status WHEN the list renders THEN each row shows its status badge', async () => {
    listEventsMock.mockResolvedValue([
      makeEvent({ id: 1, title: 'Draft event', status: 'draft' }),
      makeEvent({ id: 2, title: 'Published event', status: 'published' }),
      makeEvent({ id: 3, title: 'Cancelled event', status: 'cancelled' }),
      makeEvent({ id: 4, title: 'Closed event', status: 'closed' }),
    ])

    renderEventList()

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(4)
    })
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Cancelled')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
  })

  it('GIVEN a draft event WHEN listed THEN only Publish and Cancel actions are offered', async () => {
    listEventsMock.mockResolvedValue([makeEvent({ status: 'draft' })])

    renderEventList()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('GIVEN a published event WHEN listed THEN only Cancel and Close actions are offered', async () => {
    listEventsMock.mockResolvedValue([makeEvent({ status: 'published' })])

    renderEventList()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
  })

  it('GIVEN a closed event WHEN listed THEN no status-transition actions are offered', async () => {
    listEventsMock.mockResolvedValue([makeEvent({ status: 'closed' })])

    renderEventList()

    await waitFor(() => {
      expect(screen.getByTestId('event-row')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('GIVEN an organizer WHEN clicking Duplicate THEN the new draft is prepended without navigating away', async () => {
    const original = makeEvent({ id: 1, title: 'Original' })
    const duplicate = makeEvent({ id: 2, title: 'Original' })
    listEventsMock.mockResolvedValue([original])
    duplicateEventMock.mockResolvedValue(duplicate)

    renderEventList()

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }))

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(2)
    })
    expect(screen.queryByTestId('event-form-new')).not.toBeInTheDocument()
  })

  it('GIVEN an organizer WHEN clicking Edit THEN it navigates to the edit form carrying the event in navigation state', async () => {
    listEventsMock.mockResolvedValue([makeEvent({ id: 5 })])

    renderEventList()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    await waitFor(() => {
      expect(screen.getByTestId('event-form-edit')).toBeInTheDocument()
    })
  })

  it('GIVEN a publish attempt hits the Basic-tier cap WHEN Publish is clicked THEN the row keeps its draft status', async () => {
    const draft = makeEvent({ id: 9, status: 'draft' })
    listEventsMock.mockResolvedValue([draft])
    transitionEventStatusMock.mockResolvedValue({ ok: false, errorCode: 'upgrade_required' })

    renderEventList()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(transitionEventStatusMock).toHaveBeenCalledWith(9, 'published')
    })
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })

  it('GIVEN the organizer confirms deletion WHEN clicking Delete THEN the event is removed from the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    listEventsMock.mockResolvedValue([makeEvent({ id: 3, title: 'Doomed Event' })])
    deleteEventMock.mockResolvedValue(true)

    renderEventList()

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(deleteEventMock).toHaveBeenCalledWith(3)
    })
    await waitFor(() => {
      expect(screen.queryAllByTestId('event-row')).toHaveLength(0)
    })
  })

  it('GIVEN the organizer cancels the confirmation WHEN clicking Delete THEN nothing is deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    listEventsMock.mockResolvedValue([makeEvent({ id: 4 })])

    renderEventList()

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(deleteEventMock).not.toHaveBeenCalled()
    expect(screen.getAllByTestId('event-row')).toHaveLength(1)
  })

  it('GIVEN deletion fails WHEN the organizer confirms Delete THEN it shows an error and keeps the row', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    listEventsMock.mockResolvedValue([makeEvent({ id: 5 })])
    deleteEventMock.mockResolvedValue(false)

    renderEventList()

    await waitFor(() => {
      expect(screen.getAllByTestId('event-row')).toHaveLength(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not delete this event/i)
    })
    expect(screen.getAllByTestId('event-row')).toHaveLength(1)
  })
})
