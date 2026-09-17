import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Login } from '../Login'

const navigateMock = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

const loginOrganizerMock = vi.fn()

vi.mock('@infrastructure/api/organizerAuthApi', () => ({
  loginOrganizer: (...args: unknown[]) => loginOrganizerMock(...args),
}))

async function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'org@example.test' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
  fireEvent.click(screen.getByRole('button', { name: /login/i }))
}

describe('Login', () => {
  afterEach(() => {
    navigateMock.mockReset()
    loginOrganizerMock.mockReset()
  })

  // Spec anchor: 401 credentials failure shows the API's message inline,
  // with no approval banner (it isn't an approval-state issue).
  it('GIVEN invalid credentials WHEN the organizer submits the login form THEN it shows the API error message and does not navigate', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: false,
      message: 'These credentials do not match our records.',
    })

    render(<Login />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('These credentials do not match our records.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('approval-banner')).not.toBeInTheDocument()
    expect(navigateMock).not.toHaveBeenCalled()
  })

  // Spec anchor: ADMIN-04 — a pending/rejected organizer sees their state,
  // not the app shell.
  it('GIVEN a pending organizer WHEN they log in THEN it shows the approval banner and does not navigate', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'pending', rejectionReason: null },
    })

    render(<Login />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByTestId('approval-banner')).toBeInTheDocument()
    })
    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('GIVEN a rejected organizer WHEN they log in THEN it shows the approval banner with the rejection reason', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'rejected', rejectionReason: 'Incomplete documentation' },
    })

    render(<Login />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(screen.getByText('Incomplete documentation')).toBeInTheDocument()
    })
    expect(navigateMock).not.toHaveBeenCalled()
  })

  // Spec anchor: an approved organizer proceeds into the app shell.
  it('GIVEN an approved organizer WHEN they log in THEN it navigates to the app shell', async () => {
    loginOrganizerMock.mockResolvedValue({
      ok: true,
      result: { approvalState: 'approved', rejectionReason: null },
    })

    render(<Login />)
    await fillAndSubmit()

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/')
    })
  })
})
