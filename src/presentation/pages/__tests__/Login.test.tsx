import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Login } from '../Login'

const loginOrganizerMock = vi.fn()

vi.mock('@infrastructure/api/organizerAuthApi', () => ({
  loginOrganizer: (...args: unknown[]) => loginOrganizerMock(...args),
}))

// Renders through a real router (not a mocked useNavigate) so a
// render-phase navigation bug is actually observable by these tests -
// the resulting URL is asserted, not a spy call.
function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div data-testid="app-shell">shell</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'org@example.test' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: /login/i }))
}

describe('Login', () => {
  afterEach(() => {
    loginOrganizerMock.mockReset()
  })

  // Spec anchor: 401 credentials failure shows the API's message inline,
  // with no approval banner (it isn't an approval-state issue).
  it('GIVEN invalid credentials WHEN the organizer submits the login form THEN it shows the API error message and does not navigate', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: false,
      message: 'These credentials do not match our records.',
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('These credentials do not match our records.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('approval-banner')).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
  })

  // Spec anchor: ADMIN-04 — a pending/rejected organizer sees their state,
  // not the app shell.
  it('GIVEN a pending organizer WHEN they log in THEN it shows the approval banner and does not navigate', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'pending', rejectionReason: null },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByTestId('approval-banner')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
  })

  it('GIVEN a rejected organizer WHEN they log in THEN it shows the approval banner with the rejection reason', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'rejected', rejectionReason: 'Incomplete documentation' },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Incomplete documentation')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
  })

  // Spec anchor: an approved organizer proceeds into the app shell.
  it('GIVEN an approved organizer WHEN they log in THEN it navigates to the app shell', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'approved', rejectionReason: null },
    })

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })
  })

  it('GIVEN a network failure WHEN the organizer submits the login form THEN it shows an error instead of leaving the form stuck submitting', async () => {
    loginOrganizerMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderLogin()
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not reach the server/i)
    })
    expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled()
  })
})
