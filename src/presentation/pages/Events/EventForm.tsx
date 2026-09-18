import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { createEvent, transitionEventStatus, updateEvent } from '@infrastructure/api/eventsApi'
import { getVenue } from '@infrastructure/api/venueApi'
import type { Event } from '@domain/types/event'
import { EVENT_STATUS } from '@domain/constants/adminPanelConstants'

const inputClassName = 'w-full rounded-[2px] border border-qor-border bg-qor-sidebar px-3 py-2 text-white'
const labelClassName = 'text-sm font-medium text-white'

interface EventFormFields {
  title: string
  description: string
  dateTime: string
  location: string
  fullAddress: string
  featuredImageUrl: string
  externalTicketLink: string
  priceType: 'free' | 'paid'
  musicCategory: string
  capacity: string
  ageRange: string
  additionalInfo: string
  accessibilityInfo: string
  eventRules: string
}

const EMPTY_FIELDS: EventFormFields = {
  title: '',
  description: '',
  dateTime: '',
  location: '',
  fullAddress: '',
  featuredImageUrl: '',
  externalTicketLink: '',
  priceType: 'paid',
  musicCategory: '',
  capacity: '',
  ageRange: '',
  additionalInfo: '',
  accessibilityInfo: '',
  eventRules: '',
}

function toFields(event: Event): EventFormFields {
  return {
    title: event.title,
    description: event.description,
    dateTime: event.dateTime,
    location: event.location,
    fullAddress: event.fullAddress,
    featuredImageUrl: event.featuredImageUrl,
    externalTicketLink: event.externalTicketLink,
    priceType: event.priceType,
    musicCategory: event.musicCategory,
    capacity: event.capacity?.toString() ?? '',
    ageRange: event.ageRange ?? '',
    additionalInfo: event.additionalInfo ?? '',
    accessibilityInfo: event.accessibilityInfo ?? '',
    eventRules: event.eventRules ?? '',
  }
}

export function EventForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const editingEvent = (location.state as { event?: Event } | null)?.event ?? null
  const isEditMode = id !== undefined

  const [fields, setFields] = useState<EventFormFields>(editingEvent ? toFields(editingEvent) : EMPTY_FIELDS)
  const [venueId, setVenueId] = useState<number | null>(editingEvent?.venueId ?? null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Skip the fetch entirely when this render is about to redirect away
    // (edit mode with no event in navigation state) - there is nothing to
    // show a venue for.
    if (venueId === null && !(isEditMode && !editingEvent)) {
      getVenue().then((venue) => {
        if (venue) setVenueId(venue.id)
      })
    }
  }, [venueId, isEditMode, editingEvent])

  function updateField<K extends keyof EventFormFields>(key: K, value: EventFormFields[K]): void {
    setFields((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (venueId === null) return

    setSaving(true)
    setUpgradeRequired(false)

    const payload = {
      venueId,
      title: fields.title,
      description: fields.description,
      dateTime: fields.dateTime,
      location: fields.location,
      fullAddress: fields.fullAddress,
      featuredImageUrl: fields.featuredImageUrl,
      externalTicketLink: fields.externalTicketLink,
      priceType: fields.priceType,
      musicCategory: fields.musicCategory,
      capacity: fields.capacity ? Number(fields.capacity) : null,
      ageRange: fields.ageRange || null,
      additionalInfo: fields.additionalInfo || null,
      accessibilityInfo: fields.accessibilityInfo || null,
      eventRules: fields.eventRules || null,
    }

    const saved = editingEvent ? await updateEvent(editingEvent.id, payload) : await createEvent(payload)
    setSaving(false)
    if (saved) navigate('/events')
  }

  async function handlePublish(): Promise<void> {
    if (!editingEvent) return
    const result = await transitionEventStatus(editingEvent.id, EVENT_STATUS.published)
    if (!result.ok && result.errorCode === 'upgrade_required') {
      setUpgradeRequired(true)
      return
    }
    if (result.ok) navigate('/events')
  }

  // Edit mode with no event in navigation state means the organizer landed
  // here directly (refresh/deep link) - there is no GET /events/{id} show
  // endpoint to re-fetch from, so send them back to the list.
  if (isEditMode && !editingEvent) {
    return <Navigate to="/events" replace />
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold text-white">{editingEvent ? 'Edit event' : 'New event'}</h1>

      {upgradeRequired ? (
        <p
          data-testid="upgrade-required-message"
          role="alert"
          className="mb-4 rounded-[6px] bg-qor-warning px-2 py-1 text-sm text-white"
        >
          You've reached your Basic-tier limit — upgrade to Plus to publish more events this month.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
        <Field label="Title" value={fields.title} onChange={(v) => updateField('title', v)} required />
        <TextAreaField
          label="Description"
          value={fields.description}
          onChange={(v) => updateField('description', v)}
          required
        />
        <Field
          label="Date & time"
          type="datetime-local"
          value={fields.dateTime}
          onChange={(v) => updateField('dateTime', v)}
          required
        />
        <Field label="Location" value={fields.location} onChange={(v) => updateField('location', v)} required />
        <Field
          label="Full address"
          value={fields.fullAddress}
          onChange={(v) => updateField('fullAddress', v)}
          required
        />
        <Field
          label="Featured image URL"
          type="url"
          value={fields.featuredImageUrl}
          onChange={(v) => updateField('featuredImageUrl', v)}
          required
        />
        <Field
          label="External ticket link"
          type="url"
          value={fields.externalTicketLink}
          onChange={(v) => updateField('externalTicketLink', v)}
          required
        />

        <div className="flex flex-col gap-1">
          <label className={labelClassName} htmlFor="priceType">
            Price type
          </label>
          <select
            id="priceType"
            value={fields.priceType}
            onChange={(event) => updateField('priceType', event.target.value as 'free' | 'paid')}
            className={inputClassName}
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <Field
          label="Music category"
          value={fields.musicCategory}
          onChange={(v) => updateField('musicCategory', v)}
          required
        />
        <Field
          label="Capacity"
          type="number"
          value={fields.capacity}
          onChange={(v) => updateField('capacity', v)}
        />
        <Field label="Age range" value={fields.ageRange} onChange={(v) => updateField('ageRange', v)} />
        <TextAreaField
          label="Additional info"
          value={fields.additionalInfo}
          onChange={(v) => updateField('additionalInfo', v)}
        />
        <TextAreaField
          label="Accessibility info"
          value={fields.accessibilityInfo}
          onChange={(v) => updateField('accessibilityInfo', v)}
        />
        <TextAreaField label="Event rules" value={fields.eventRules} onChange={(v) => updateField('eventRules', v)} />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || venueId === null}
            className="rounded-[6px] bg-qor-primary px-4 py-2 text-white disabled:opacity-50"
          >
            Save
          </button>
          {editingEvent && editingEvent.status === EVENT_STATUS.draft ? (
            <button
              type="button"
              onClick={handlePublish}
              className="rounded-[6px] bg-qor-primary px-4 py-2 text-white"
            >
              Publish
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}

function Field({ label, value, onChange, type = 'text', required }: FieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        required={required}
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange, required }: FieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
        required={required}
      />
    </div>
  )
}
