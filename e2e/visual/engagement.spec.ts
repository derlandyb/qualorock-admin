import { test, expect } from '@playwright/test'

// Assertions target the fixed values documented in
// docs/admin-panel/qor-design-tokens.md (dashboard-card/table/button tokens
// already verified for Phase 9) — this suite never navigates to the external
// BootstrapDash reference site. All API routes are mocked (same pattern as
// events.spec.ts) because real cross-origin fetches fail in the `playwright`
// container (documented CORS bug).

const ENGAGEMENT_SUMMARY_FIXTURE = [
  { eventId: 1, viewsCount: 100, favoritesCount: 20, ticketLinkClicksCount: 5, interestCount: 30 },
  { eventId: 2, viewsCount: 0, favoritesCount: 0, ticketLinkClicksCount: 0, interestCount: 0 },
]

const INFO_REQUESTS_FIXTURE = [
  { id: 1, eventId: 2, consumerUserId: 42, message: 'What time does it start?', organizerResponse: null, respondedAt: null },
]

test.describe('admin-panel engagement dashboard and info-request screens', () => {
  test('renders the engagement stat cards and breakdown table matching the QOR design tokens', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/engagement', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: ENGAGEMENT_SUMMARY_FIXTURE }) }),
    )

    await page.goto('/engagement')

    const cards = page.getByTestId('engagement-stat-card');
    await expect(cards).toHaveCount(4)
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('background-color', 'rgb(25, 28, 36)')
      await expect(card).toHaveCSS('border-radius', '6px')
      await expect(card).toHaveCSS('box-shadow', 'none')
    }

    const breakdownCard = page.getByTestId('engagement-breakdown-card')
    await expect(breakdownCard).toHaveCSS('background-color', 'rgb(25, 28, 36)')
    await expect(breakdownCard).toHaveCSS('border-radius', '6px')

    const header = page.getByRole('columnheader', { name: 'Views' })
    await expect(header).toHaveCSS('color', 'rgb(108, 114, 147)')
    await expect(header).toHaveCSS('font-size', '14px')
    await expect(header).toHaveCSS('font-weight', '700')

    await expect(page.getByTestId('engagement-breakdown-row')).toHaveCount(2)

    await page.screenshot({ path: 'screenshots/engagement-dashboard.png' })
  })

  test('renders the info-request reply button matching the Default Primary button spec', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/events/2/info-requests', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: INFO_REQUESTS_FIXTURE }) }),
    )

    await page.goto('/events/2/info-requests')

    const replyButton = page.getByRole('button', { name: 'Reply' })
    await expect(replyButton).toHaveCSS('background-color', 'rgb(0, 144, 231)')
    await expect(replyButton).toHaveCSS('border-radius', '6px')

    await page.screenshot({ path: 'screenshots/info-requests.png' })
  })
})
