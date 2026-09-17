import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganizerLogin } from '@application/auth/useOrganizerLogin'
import { ORGANIZER_APPROVAL_STATE } from '@domain/constants/adminPanelConstants'
import { ApprovalBanner } from '@presentation/components/ApprovalBanner'

const inputClassName =
  'w-full rounded-[2px] border border-qor-border bg-qor-sidebar px-3 py-2 text-white'
const labelClassName = 'text-sm font-medium text-white'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { status, error, result, submit } = useOrganizerLogin()
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    await submit(email, password)
  }

  if (status === 'success' && result?.approvalState === ORGANIZER_APPROVAL_STATE.approved) {
    navigate('/')
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-qor-canvas">
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className={labelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            required
          />
        </div>

        {status === 'error' && error ? <p className="text-sm text-qor-danger">{error}</p> : null}

        {status === 'success' && result && result.approvalState !== ORGANIZER_APPROVAL_STATE.approved ? (
          <ApprovalBanner state={result.approvalState} rejectionReason={result.rejectionReason} />
        ) : null}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-[6px] bg-qor-primary py-2 text-white disabled:opacity-50"
        >
          Login
        </button>
      </form>
    </div>
  )
}
