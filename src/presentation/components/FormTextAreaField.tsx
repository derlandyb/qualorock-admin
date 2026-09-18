import { formInputClassName, formLabelClassName } from '@presentation/components/formFieldStyles'

interface FormTextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
}

export function FormTextAreaField({ label, value, onChange, required }: FormTextAreaFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={formLabelClassName}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={formInputClassName}
        required={required}
      />
    </div>
  )
}
