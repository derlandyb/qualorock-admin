import { test, expect } from '@playwright/test'

const API_URL = process.env.ADMIN_PANEL_API_URL ?? 'http://localhost:8000'

// Assertions target the fixed values documented in
// docs/admin-panel/qor-design-tokens.md — this suite never navigates to the
// external BootstrapDash reference site.
//
// The login-response mocks below reproduce the exact shapes returned by
// api/app/Presentation/Http/Controllers/Organizer/AuthController::login
// (confirmed by reading that file): no AdminPanelSeeder exists yet to seed
// pending/rejected organizer fixtures (flagged as a residual gap — creating
// one is outside this frontend phase's scope), so the approval-state banner
// tests below verify rendering against a controlled response instead of
// depending on backend test data that doesn't exist.

test.describe('admin-panel login screen', () => {
  test('renders a login form matching the QOR design tokens', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toHaveCSS('background-color', 'rgb(25, 28, 36)')
    await expect(emailInput).toHaveCSS('border-color', 'rgb(44, 46, 51)')
    await expect(emailInput).toHaveCSS('border-radius', '2px')

    const submitButton = page.getByRole('button', { name: /login/i })
    await expect(submitButton).toHaveCSS('background-color', 'rgb(0, 144, 231)')
    await expect(submitButton).toHaveCSS('border-radius', '6px')

    await page.screenshot({ path: 'screenshots/login.png' })
  })

  test('shows the exact backend error message on invalid credentials', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'These credentials do not match our records.' }),
      }),
    )
    await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('org@example.test')
    await page.getByLabel(/password/i).fill('wrong-password')
    await page.getByRole('button', { name: /login/i }).click()

    await expect(page.getByText('These credentials do not match our records.')).toBeVisible()
    await expect(page.getByTestId('approval-banner')).toHaveCount(0)
    await expect(page).toHaveURL(/\/login$/)
  })

  test('renders the pending-approval banner with the QOR warning color', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { approvalState: 'pending', rejectionReason: null } }),
      }),
    )
    await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('pending-organizer@example.test')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /login/i }).click()

    const banner = page.getByTestId('approval-banner')
    await expect(banner).toHaveCSS('background-color', 'rgb(255, 171, 0)')
    await expect(banner).toHaveCSS('border-radius', '6px')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('renders the rejected-approval banner with the QOR danger color and reason', async ({ page }) => {
    await page.route('**/api/admin/v1/organizer/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { approvalState: 'rejected', rejectionReason: 'Incomplete documentation' },
        }),
      }),
    )
    await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }))

    await page.goto('/login')
    await page.getByLabel(/email/i).fill('rejected-organizer@example.test')
    await page.getByLabel(/password/i).fill('password')
    await page.getByRole('button', { name: /login/i }).click()

    const banner = page.getByTestId('approval-banner')
    await expect(banner).toHaveCSS('background-color', 'rgb(252, 66, 74)')
    await expect(banner).toContainText('Incomplete documentation')
  })
})

test.describe('admin-panel app shell', () => {
  test('sidebar and body wrapper match the QOR width and collapse tokens', async ({ page }) => {
    await page.goto('/')

    const sidebar = page.locator('aside')
    await expect(sidebar).toHaveCSS('background-color', 'rgb(25, 28, 36)')
    await expect(sidebar).toHaveCSS('transition-duration', '0.25s')

    // getComputedStyle resolves calc() to a final pixel value, so the literal
    // "calc(100% - 244px)" expression is only visible on the element's own
    // inline style, not the computed style.
    const bodyWrapper = page.getByTestId('body-wrapper')
    await expect(bodyWrapper).toHaveJSProperty('style.width', 'calc(100% - 244px)')
    await page.screenshot({ path: 'screenshots/sidebar-expanded.png' })

    await page.getByRole('button', { name: /collapse sidebar/i }).click()
    await expect(bodyWrapper).toHaveJSProperty('style.width', '100%')
    await page.screenshot({ path: 'screenshots/sidebar-collapsed.png' })
  })

  test('body wrapper does not overflow the viewport below the 992px breakpoint', async ({ page }) => {
    // Regression check: the inline style.width assertion above can't see an
    // overflow caused by the *other* inline style (margin-left) surviving
    // below the breakpoint - bounding-box width against the real viewport can.
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')

    const bodyWrapper = page.getByTestId('body-wrapper')
    const box = await bodyWrapper.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBe(0)
    expect(box!.width).toBeLessThanOrEqual(375)
  })
})

test.describe('super-admin route is unreachable for a non-super-admin session', () => {
  test('the pending-organizers endpoint returns 403 without a super-admin session', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/admin/v1/super-admin/organizers`)
    expect(response.status()).toBe(403)
  })

  test('the in-app forbidden message renders instead of a raw error page', async ({ page }) => {
    await page.goto('/forbidden')
    await expect(page.getByTestId('forbidden-message')).toBeVisible()
  })
})
