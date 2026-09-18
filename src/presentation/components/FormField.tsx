import { formInputClassName, formLabelClassName } from '@presentation/components/formFieldStyles'

interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
}

export function FormField({ label, value, onChange, type = 'text', required }: FormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={formLabelClassName}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={formInputClassName}
        required={required}
      />
    </div>
  )
}
