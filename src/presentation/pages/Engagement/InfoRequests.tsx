import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { listEventInfoRequests, respondToEventInfoRequest } from '@infrastructure/api/eventInfoRequestApi'
import type { EventInfoRequest } from '@domain/types/eventInfoRequest'
import { formInputClassName } from '@presentation/components/formFieldStyles'

export function InfoRequests() {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)
  const [requests, setRequests] = useState<EventInfoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<number, string>>({})

  useEffect(() => {
    listEventInfoRequests(eventId)
      .then(setRequests)
      .finally(() => setLoading(false))
  }, [eventId])

  async function handleRespond(event: FormEvent<HTMLFormElement>, requestId: number): Promise<void> {
    event.preventDefault()
    const response = drafts[requestId]?.trim()
    if (!response) return

    const updated = await respondToEventInfoRequest(requestId, response)
    if (updated) {
      setRequests((current) => current.map((item) => (item.id === requestId ? updated : item)))
      setDrafts((current) => ({ ...current, [requestId]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-white">Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-white">Info requests</h1>

      <div className="flex flex-col gap-4">
        {requests.map((request) => (
          <div key={request.id} data-testid="info-request-card" className="rounded-[6px] bg-qor-sidebar p-4">
            <p className="text-white">{request.message}</p>

            {request.organizerResponse ? (
              <p className="mt-2 text-sm text-qor-table-header">Response: {request.organizerResponse}</p>
            ) : (
              <form className="mt-3 flex gap-2" onSubmit={(event) => handleRespond(event, request.id)}>
                <label className="sr-only" htmlFor={`response-${request.id}`}>
                  Reply
                </label>
                <input
                  id={`response-${request.id}`}
                  type="text"
                  value={drafts[request.id] ?? ''}
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                  }
                  className={`flex-1 ${formInputClassName}`}
                />
                <button type="submit" className="rounded-[6px] bg-qor-primary px-4 py-2 text-white">
                  Reply
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
