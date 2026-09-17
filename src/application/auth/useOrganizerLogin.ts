import { useState } from 'react'
import { loginOrganizer } from '@infrastructure/api/organizerAuthApi'
import type { OrganizerLoginResult } from '@domain/types/organizer'

type LoginStatus = 'idle' | 'submitting' | 'success' | 'error'

interface UseOrganizerLoginState {
  status: LoginStatus
  error: string | null
  result: OrganizerLoginResult | null
}

export function useOrganizerLogin() {
  const [state, setState] = useState<UseOrganizerLoginState>({
    status: 'idle',
    error: null,
    result: null,
  })

  async function submit(email: string, password: string): Promise<void> {
    setState({ status: 'submitting', error: null, result: null })

    try {
      const response = await loginOrganizer(email, password)

      if (!response.ok) {
        setState({ status: 'error', error: response.message, result: null })
        return
      }

      setState({ status: 'success', error: null, result: response.result })
    } catch {
      // fetch rejects (rather than resolving with ok:false) on network
      // failure, DNS failure, or a CORS preflight rejection.
      setState({ status: 'error', error: 'Could not reach the server. Please try again.', result: null })
    }
  }

  return { ...state, submit }
}
