import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EventForm } from '../EventForm'
import type { Event } from '@domain/types/event'

const createEventMock = vi.fn()
const updateEventMock = vi.fn()
const transitionEventStatusMock = vi.fn()
const getVenueMock = vi.fn()

vi.mock('@infrastructure/api/eventsApi', () => ({
  createEvent: (...args: unknown[]) => createEventMock(...args),
  updateEvent: (...args: unknown[]) => updateEventMock(...args),
  transitionEventStatus: (...args: unknown[]) => transitionEventStatusMock(...args),
}))

vi.mock('@infrastructure/api/venueApi', () => ({
  getVenue: (...args: unknown[]) => getVenueMock(...args),
}))

const event: Event = {
  id: 1,
  organizerId: 1,
  venueId: 7,
  title: 'Rock Night',
  description: 'A great night',
  dateTime: '2026-10-01T20:00',
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
}

function renderNewForm() {
  render(
    <MemoryRouter initialEntries={['/events/new']}>
      <Routes>
        <Route path="/events/new" element={<EventForm />} />
        <Route path="/events" element={<div data-testid="event-list">list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderEditForm(state: { event?: Event } | null = { event }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/events/1/edit', state }]}>
      <Routes>
        <Route path="/events/:id/edit" element={<EventForm />} />
        <Route path="/events" element={<div data-testid="event-list">list</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EventForm', () => {
  afterEach(() => {
    createEventMock.mockReset()
    updateEventMock.mockReset()
    transitionEventStatusMock.mockReset()
    getVenueMock.mockReset()
  })

  it('GIVEN a direct navigation to the edit route with no event in state WHEN it renders THEN it redirects to the event list', async () => {
    renderEditForm(null)

    await waitFor(() => {
      expect(screen.getByTestId('event-list')).toBeInTheDocument()
    })
  })

  it('GIVEN the organizer has a venue WHEN creating a new event THEN saving calls createEvent with that venueId', async () => {
    getVenueMock.mockResolvedValue({ id: 42 })
    createEventMock.mockResolvedValue({ ...event, id: 99 })

    renderNewForm()
    await waitFor(() => expect(getVenueMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Event' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByLabelText('Date & time'), { target: { value: '2026-10-01T20:00' } })
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Downtown' } })
    fireEvent.change(screen.getByLabelText('Full address'), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText('Featured image URL'), {
      target: { value: 'https://example.com/image.jpg' },
    })
    fireEvent.change(screen.getByLabelText('External ticket link'), {
      target: { value: 'https://example.com/tickets' },
    })
    fireEvent.change(screen.getByLabelText('Music category'), { target: { value: 'Rock' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(createEventMock).toHaveBeenCalledWith(expect.objectContaining({ venueId: 42, title: 'New Event' }))
    })
    await waitFor(() => {
      expect(screen.getByTestId('event-list')).toBeInTheDocument()
    })
  })

  it('GIVEN an existing event being edited WHEN the organizer saves a changed field THEN it calls updateEvent with that event\'s id, not createEvent', async () => {
    updateEventMock.mockResolvedValue({ ...event, title: 'Updated Title' })

    renderEditForm()

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Title' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(updateEventMock).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Updated Title', venueId: 7 }))
    })
    expect(createEventMock).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByTestId('event-list')).toBeInTheDocument()
    })
  })

  it('GIVEN a draft event being edited WHEN Publish hits the Basic-tier cap THEN it shows the upgrade message instead of a raw error', async () => {
    transitionEventStatusMock.mockResolvedValue({ ok: false, errorCode: 'upgrade_required' })

    renderEditForm()

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-required-message')).toHaveTextContent(/upgrade to Plus/i)
    })
  })

  it('GIVEN a published event being edited WHEN it renders THEN no Publish button is offered', () => {
    renderEditForm({ event: { ...event, status: 'published' } })

    expect(screen.queryByRole('button', { name: 'Publish' })).not.toBeInTheDocument()
  })

  it('GIVEN a draft event being edited WHEN Publish is rejected for missing fields THEN it lists the missing fields', async () => {
    transitionEventStatusMock.mockResolvedValue({
      ok: false,
      errorCode: 'missing_required_fields',
      missingFields: ['location', 'featuredImageUrl'],
    })

    renderEditForm()
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('location, featuredImageUrl')
    })
  })

  it('GIVEN a draft event being edited WHEN Publish hits an invalid transition THEN it shows a generic status-change message', async () => {
    transitionEventStatusMock.mockResolvedValue({ ok: false, errorCode: 'invalid_transition' })

    renderEditForm()
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent("This status change isn't allowed.")
    })
  })

  it('GIVEN the organizer has no venue set up WHEN the new-event form loads THEN it shows an explanatory message and disables Save', async () => {
    getVenueMock.mockResolvedValue(null)

    renderNewForm()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no venue found/i)
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('GIVEN the venue fetch fails WHEN the new-event form loads THEN it shows an error instead of leaving Save silently disabled', async () => {
    getVenueMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderNewForm()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not load your venue/i)
    })
  })

  it('GIVEN saving fails WHEN the organizer submits the form THEN it shows an error instead of navigating silently', async () => {
    getVenueMock.mockResolvedValue({ id: 42 })
    createEventMock.mockResolvedValue(null)

    renderNewForm()
    await waitFor(() => expect(getVenueMock).toHaveBeenCalled())

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Event' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Desc' } })
    fireEvent.change(screen.getByLabelText('Date & time'), { target: { value: '2026-10-01T20:00' } })
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Downtown' } })
    fireEvent.change(screen.getByLabelText('Full address'), { target: { value: '123 Main St' } })
    fireEvent.change(screen.getByLabelText('Featured image URL'), {
      target: { value: 'https://example.com/image.jpg' },
    })
    fireEvent.change(screen.getByLabelText('External ticket link'), {
      target: { value: 'https://example.com/tickets' },
    })
    fireEvent.change(screen.getByLabelText('Music category'), { target: { value: 'Rock' } })

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not save this event/i)
    })
    expect(screen.queryByTestId('event-list')).not.toBeInTheDocument()
  })
})
