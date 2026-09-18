import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InfoRequests } from '../InfoRequests'
import type { EventInfoRequest } from '@domain/types/eventInfoRequest'

const listEventInfoRequestsMock = vi.fn()
const respondToEventInfoRequestMock = vi.fn()

vi.mock('@infrastructure/api/eventInfoRequestApi', () => ({
  listEventInfoRequests: (...args: unknown[]) => listEventInfoRequestsMock(...args),
  respondToEventInfoRequest: (...args: unknown[]) => respondToEventInfoRequestMock(...args),
}))

function makeRequest(overrides: Partial<EventInfoRequest> = {}): EventInfoRequest {
  return {
    id: 1,
    eventId: 5,
    consumerUserId: 42,
    message: 'What time does it start?',
    organizerResponse: null,
    respondedAt: null,
    ...overrides,
  }
}

function renderInfoRequests() {
  render(
    <MemoryRouter initialEntries={['/events/5/info-requests']}>
      <Routes>
        <Route path="/events/:id/info-requests" element={<InfoRequests />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InfoRequests', () => {
  afterEach(() => {
    listEventInfoRequestsMock.mockReset()
    respondToEventInfoRequestMock.mockReset()
  })

  it('GIVEN info requests for an event WHEN the screen loads THEN each request\'s message is shown', async () => {
    listEventInfoRequestsMock.mockResolvedValue([makeRequest({ message: 'Is there parking?' })])

    renderInfoRequests()

    await waitFor(() => {
      expect(listEventInfoRequestsMock).toHaveBeenCalledWith(5)
    })
    expect(await screen.findByText('Is there parking?')).toBeInTheDocument()
  })

  it('GIVEN an unanswered request WHEN the organizer submits a reply THEN the response replaces the reply form', async () => {
    const request = makeRequest({ id: 3 })
    listEventInfoRequestsMock.mockResolvedValue([request])
    respondToEventInfoRequestMock.mockResolvedValue({ ...request, organizerResponse: 'Doors open at 8pm.', respondedAt: '2026-09-18T00:00:00Z' })

    renderInfoRequests()

    const input = await screen.findByLabelText('Reply')
    fireEvent.change(input, { target: { value: 'Doors open at 8pm.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))

    await waitFor(() => {
      expect(respondToEventInfoRequestMock).toHaveBeenCalledWith(3, 'Doors open at 8pm.')
    })
    expect(await screen.findByText(/Doors open at 8pm\./)).toBeInTheDocument()
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument()
  })

  it('GIVEN a reply submission fails WHEN the organizer submits a reply THEN it shows an error and keeps the reply form', async () => {
    const request = makeRequest({ id: 4 })
    listEventInfoRequestsMock.mockResolvedValue([request])
    respondToEventInfoRequestMock.mockResolvedValue(null)

    renderInfoRequests()

    const input = await screen.findByLabelText('Reply')
    fireEvent.change(input, { target: { value: 'Doors open at 8pm.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not send this reply/i)
    })
    expect(screen.getByLabelText('Reply')).toBeInTheDocument()
  })

  it('GIVEN a request already answered WHEN the screen loads THEN it shows the stored response instead of a reply form', async () => {
    listEventInfoRequestsMock.mockResolvedValue([
      makeRequest({ organizerResponse: 'Already answered.', respondedAt: '2026-09-17T00:00:00Z' }),
    ])

    renderInfoRequests()

    expect(await screen.findByText(/Already answered\./)).toBeInTheDocument()
    expect(screen.queryByLabelText('Reply')).not.toBeInTheDocument()
  })
})
