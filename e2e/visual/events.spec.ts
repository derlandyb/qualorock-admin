import { test, expect } from '@playwright/test'

// Assertions target the fixed values documented in
// docs/admin-panel/qor-design-tokens.md (dashboard-card/table/badge/button
// tokens added for Phase 9) — this suite never navigates to the external
// BootstrapDash reference site. All API routes are mocked (same pattern as
// login-shell.spec.ts) so this suite has no live-backend dependency.

const EVENTS_FIXTURE = [
  { id: 1, organizerId: 1, venueId: 1, title: 'Draft Night', description: 'd', dateTime: '2026-10-01T20:00:00-03:00', location: 'Downtown', fullAddress: '123 Main St', featuredImageUrl: 'https://example.com/a.jpg', externalTicketLink: 'https://example.com/a', priceType: 'paid', musicCategory: 'Rock', capacity: null, ageRange: null, additionalInfo: null, accessibilityInfo: null, eventRules: null, status: 'draft', publishedAt: null },
  { id: 2, organizerId: 1, venueId: 1, title: 'Published Show', description: 'd', dateTime: '2026-10-02T20:00:00-03:00', location: 'Downtown', fullAddress: '123 Main St', featuredImageUrl: 'https://example.com/b.jpg', externalTicketLink: 'https://example.com/b', priceType: 'paid', musicCategory: 'Rock', capacity: null, ageRange: null, additionalInfo: null, accessibilityInfo: null, eventRules: null, status: 'published', publishedAt: '2026-09-01T12:00:00-03:00' },
  { id: 3, organizerId: 1, venueId: 1, title: 'Cancelled Gig', description: 'd', dateTime: '2026-10-03T20:00:00-03:00', location: 'Downtown', fullAddress: '123 Main St', featuredImageUrl: 'https://example.com/c.jpg', externalTicketLink: 'https://example.com/c', priceType: 'free', musicCategory: 'Jazz', capacity: null, ageRange: null, additionalInfo: null, accessibilityInfo: null, eventRules: null, status: 'cancelled', publishedAt: null },
  { id: 4, organizerId: 1, venueId: 1, title: 'Closed Run', description: 'd', dateTime: '2026-09-03T20:00:00-03:00', location: 'Downtown', fullAddress: '123 Main St', featuredImageUrl: 'https://example.com/d.jpg', externalTicketLink: 'https://example.com/d', priceType: 'paid', musicCategory: 'Rock', capacity: null, ageRange: null, additionalInfo: null, accessibilityInfo: null, eventRules: null, status: 'closed', publishedAt: '2026-08-01T12:00:00-03:00' },
]

test.describe('admin-panel event management screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/events', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: EVENTS_FIXTURE }) }),
    )
  })

  test('renders the event list card and table matching the QOR design tokens', async ({ page }) => {
    await page.goto('/events')

    const card = page.getByTestId('event-list-card')
    await expect(card).toHaveCSS('background-color', 'rgb(25, 28, 36)')
    await expect(card).toHaveCSS('border-radius', '6px')
    await expect(card).toHaveCSS('box-shadow', 'none')

    const header = page.getByRole('columnheader', { name: 'Title' })
    await expect(header).toHaveCSS('color', 'rgb(108, 114, 147)')
    await expect(header).toHaveCSS('font-size', '14px')
    await expect(header).toHaveCSS('font-weight', '700')

    await expect(page.getByRole('button', { name: 'New event' })).toHaveCSS('border-radius', '6px')

    await page.screenshot({ path: 'screenshots/event-list.png' })
  })

  test('each status badge uses its mapped QOR color', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByTestId('event-row')).toHaveCount(4)

    const badges = page.getByTestId('event-status-badge')
    await expect(badges.nth(0)).toHaveCSS('background-color', 'rgb(143, 95, 232)') // draft
    await expect(badges.nth(1)).toHaveCSS('background-color', 'rgb(0, 210, 91)') // published
    await expect(badges.nth(2)).toHaveCSS('background-color', 'rgb(252, 66, 74)') // cancelled
    await expect(badges.nth(3)).toHaveCSS('background-color', 'rgb(228, 234, 236)') // closed

    for (const badge of await badges.all()) {
      await expect(badge).toHaveCSS('border-radius', '6px')
      await expect(badge).toHaveCSS('color', 'rgb(255, 255, 255)')
    }
  })

  test('a draft row only offers Publish and Cancel actions', async ({ page }) => {
    await page.goto('/events')

    const draftRow = page.getByTestId('event-row').filter({ hasText: 'Draft Night' })
    await expect(draftRow.getByRole('button', { name: 'Publish' })).toBeVisible()
    await expect(draftRow.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(draftRow.getByRole('button', { name: 'Close' })).toHaveCount(0)
  })

  test('publishing beyond the Basic-tier cap shows the upgrade message, not a raw error', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/events/1/status', (route) =>
      route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'upgrade_required' }) }),
    )
    await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))

    await page.goto('/events')
    const draftRow = page.getByTestId('event-row').filter({ hasText: 'Draft Night' })
    await draftRow.getByRole('button', { name: 'Publish' }).click()

    // The list itself doesn't render the upgrade message (that's the form's
    // job per T25's "Done when" bullet) - this asserts the row's status
    // simply didn't change, i.e. no raw "upgrade_required" string leaked
    // into the UI.
    await expect(draftRow.getByText('upgrade_required')).toHaveCount(0)
    await expect(draftRow.locator('[data-testid="event-status-badge"]')).toHaveText('Draft')
  })

  test('new event form inputs and save button match the QOR design tokens', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/venue', (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto('/events/new')

    const titleInput = page.getByLabel('Title')
    await expect(titleInput).toHaveCSS('background-color', 'rgb(25, 28, 36)')
    await expect(titleInput).toHaveCSS('border-color', 'rgb(44, 46, 51)')
    await expect(titleInput).toHaveCSS('border-radius', '2px')

    const saveButton = page.getByRole('button', { name: 'Save' })
    await expect(saveButton).toHaveCSS('background-color', 'rgb(0, 144, 231)')
    await expect(saveButton).toHaveCSS('border-radius', '6px')

    await page.screenshot({ path: 'screenshots/event-form.png' })
  })
})
