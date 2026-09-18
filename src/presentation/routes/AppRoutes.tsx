import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@presentation/layouts/AppShell'
import { Forbidden } from '@presentation/pages/Forbidden'
import { Login } from '@presentation/pages/Login'
import { RequireSuperAdmin } from '@presentation/routes/RequireSuperAdmin'

// SPEC_DEVIATION: the "/" route does not redirect to "/login" for an
// unauthenticated visitor here, because no session-check endpoint exists yet
// (routes/admin-panel.php has no GET /organizer/me). Nested screens added in
// later phases (T25+) are the ones that actually call organizer-guarded
// endpoints and will surface a 401/403 there; this phase only needs the
// shell itself to exist and render.
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="/" element={<AppShell />} />
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
