import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RequireSuperAdmin } from '../RequireSuperAdmin'

const checkSuperAdminAccessMock = vi.fn()

vi.mock('@infrastructure/api/superAdminApi', () => ({
  checkSuperAdminAccess: () => checkSuperAdminAccessMock(),
}))

function renderGuardedRoute() {
  render(
    <MemoryRouter initialEntries={['/super-admin/organizers']}>
      <Routes>
        <Route element={<RequireSuperAdmin />}>
          <Route path="/super-admin/organizers" element={<div data-testid="protected-content">secret</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireSuperAdmin', () => {
  afterEach(() => {
    checkSuperAdminAccessMock.mockReset()
  })

  // Spec anchor: T23 Done-when - "Super-admin-only pending-organizers list
  // route is unreachable for the organizer guard (403 surfaces as an
  // in-app message, not a raw error page)".
  it('GIVEN the backend denies super-admin access WHEN the guard checks THEN it renders the in-app forbidden message, not the protected content', async () => {
    checkSuperAdminAccessMock.mockResolvedValue({ authorized: false })

    renderGuardedRoute()

    await waitFor(() => {
      expect(screen.getByTestId('forbidden-message')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('GIVEN the backend grants super-admin access WHEN the guard checks THEN it renders the protected content', async () => {
    checkSuperAdminAccessMock.mockResolvedValue({ authorized: true })

    renderGuardedRoute()

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('forbidden-message')).not.toBeInTheDocument()
  })

  // Fail-closed: a rejected check (network/CORS failure) must not be
  // mistaken for "authorized".
  it('GIVEN the access check rejects WHEN the guard checks THEN it renders the in-app forbidden message, not the protected content', async () => {
    checkSuperAdminAccessMock.mockRejectedValue(new TypeError('Failed to fetch'))

    renderGuardedRoute()

    await waitFor(() => {
      expect(screen.getByTestId('forbidden-message')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('GIVEN the access check has not resolved yet WHEN the guard renders THEN it shows a checking state, not the protected content or the forbidden message', async () => {
    let resolveCheck: (value: { authorized: boolean }) => void
    checkSuperAdminAccessMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve
      }),
    )

    renderGuardedRoute()

    expect(screen.getByRole('status')).toHaveTextContent(/checking access/i)
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forbidden-message')).not.toBeInTheDocument()

    resolveCheck!({ authorized: true })
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })
})
