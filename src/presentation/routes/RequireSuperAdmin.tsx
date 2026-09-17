import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { checkSuperAdminAccess } from '@infrastructure/api/superAdminApi'
import { Forbidden } from '@presentation/pages/Forbidden'

type GuardStatus = 'checking' | 'authorized' | 'forbidden'

// Wraps any super-admin-only route: an organizer session (or no session)
// gets the in-app Forbidden message instead of a raw 403 JSON body or an
// unhandled-error overlay.
export function RequireSuperAdmin() {
  const [status, setStatus] = useState<GuardStatus>('checking')

  useEffect(() => {
    let cancelled = false

    checkSuperAdminAccess()
      .then(({ authorized }) => {
        if (!cancelled) setStatus(authorized ? 'authorized' : 'forbidden')
      })
      .catch(() => {
        // A guard must fail closed: a network/CORS failure is not
        // "authorized", it's "couldn't confirm authorized".
        if (!cancelled) setStatus('forbidden')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-qor-canvas">
        <p role="status" className="text-white">
          Checking access...
        </p>
      </div>
    )
  }

  if (status === 'forbidden') {
    return <Forbidden />
  }

  return <Outlet />
}
