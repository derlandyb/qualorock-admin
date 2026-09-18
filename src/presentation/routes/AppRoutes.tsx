import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@presentation/layouts/AppShell'
import { EventForm } from '@presentation/pages/Events/EventForm'
import { EventList } from '@presentation/pages/Events/EventList'
import { Forbidden } from '@presentation/pages/Forbidden'
import { Login } from '@presentation/pages/Login'
import { RequireSuperAdmin } from '@presentation/routes/RequireSuperAdmin'

// SPEC_DEVIATION: the "/" route does not redirect to "/login" for an
// unauthenticated visitor here, because no session-check endpoint exists yet
// (routes/admin-panel.php has no GET /organizer/me). The events list below is
// the first nested screen that actually calls an organizer-guarded endpoint
// (listEvents) and surfaces a 401/403 from the API itself rather than a
// route-level guard.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<AppShell />}>
        <Route path="events" element={<EventList />} />
        <Route path="events/new" element={<EventForm />} />
        <Route path="events/:id/edit" element={<EventForm />} />
      </Route>
      <Route element={<RequireSuperAdmin />}>
        {/* Placeholder: the real pending-organizers list UI is a later phase.
            This route exists so T23's guard requirement (an organizer session
            gets Forbidden, not a raw 403) is real and testable now. */}
        <Route path="/super-admin/organizers" element={<div data-testid="super-admin-organizers">Pending organizers</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
