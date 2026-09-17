import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ApprovalBanner } from '../ApprovalBanner'

// Spec anchor: ADMIN-04 — a pending or rejected organizer must be shown
// their account's current state, and the rejection reason when present.
describe('ApprovalBanner', () => {
  it('GIVEN a pending approval state WHEN the banner renders THEN it uses the QOR warning color', () => {
    render(<ApprovalBanner state="pending" rejectionReason={null} />)

    const banner = screen.getByTestId('approval-banner')
    expect(banner.className).toContain('bg-qor-warning')
    expect(banner).toHaveTextContent(/pending/i)
  })

  it('GIVEN a rejected approval state with a reason WHEN the banner renders THEN it uses the QOR danger color and shows the reason', () => {
    render(<ApprovalBanner state="rejected" rejectionReason="Incomplete documentation" />)

    const banner = screen.getByTestId('approval-banner')
    expect(banner.className).toContain('bg-qor-danger')
    expect(banner).toHaveTextContent('Incomplete documentation')
  })

  it('GIVEN a rejected approval state with no reason WHEN the banner renders THEN it shows exactly the base message', () => {
    render(<ApprovalBanner state="rejected" rejectionReason={null} />)

    const banner = screen.getByTestId('approval-banner')
    expect(banner).toHaveTextContent('Your account was rejected.')
    expect(banner.textContent).toBe('Your account was rejected.')
  })

  it('GIVEN an approved approval state WHEN the banner renders THEN it renders nothing', () => {
    const { container } = render(<ApprovalBanner state="approved" rejectionReason={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
