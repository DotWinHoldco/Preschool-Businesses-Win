'use client'

// @anchor: platform.form-builder.field-registry

import { useState } from 'react'
import type { FormFieldType } from '@/lib/schemas/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export interface FormFieldProps {
  field: {
    id: string
    field_key: string
    field_type: FormFieldType
    label: string | null
    description: string | null
    placeholder: string | null
    config: Record<string, unknown>
    validation_rules: Record<string, unknown>
    is_required: boolean
  }
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function FormField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  const Renderer = FIELD_RENDERERS[field.field_type] || FallbackField
  return <Renderer field={field} value={value} onChange={onChange} disabled={disabled} autoFocus={autoFocus} />
}

function ShortTextField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  return <Input type="text" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} autoFocus={autoFocus} placeholder={field.placeholder || ''} />
}

function LongTextField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  return <Textarea value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} autoFocus={autoFocus} placeholder={field.placeholder || ''} rows={4} />
}

function EmailField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  return <Input type="email" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} autoFocus={autoFocus} placeholder={field.placeholder || 'email@example.com'} />
}

function PhoneField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  return <Input type="tel" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} autoFocus={autoFocus} placeholder={field.placeholder || '(555) 555-5555'} />
}

function UrlField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  return <Input type="url" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} autoFocus={autoFocus} placeholder={field.placeholder || 'https://'} />
}

function NumberField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  const min = field.validation_rules?.min as number | undefined
  const max = field.validation_rules?.max as number | undefined
  const step = field.validation_rules?.step as number | undefined
  return <Input type="number" value={value != null ? String(value) : ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} disabled={disabled} autoFocus={autoFocus} min={min} max={max} step={step} placeholder={field.placeholder || ''} />
}

function CurrencyField({ field, value, onChange, disabled, autoFocus }: FormFieldProps) {
  const symbol = (field.config?.currency_symbol as string) || '$'
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{symbol}</span>
      <Input type="number" step="0.01" value={value != null ? String(value) : ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} disabled={disabled} autoFocus={autoFocus} className="pl-7" placeholder="0.00" />
    </div>
  )
}

function SingleSelectDropdown({ field, value, onChange, disabled }: FormFieldProps) {
  const options = (field.config?.options as { label: string; value: string }[]) || []
  return (
    <select value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
      <option value="">{field.placeholder || 'Select...'}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function SingleSelectRadio({ field, value, onChange, disabled }: FormFieldProps) {
  const options = (field.config?.options as { label: string; value: string }[]) || []
  return (
    <div className="space-y-2">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-[var(--color-muted)]" style={{ borderColor: value === o.value ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: value === o.value ? 'var(--color-primary-50, rgba(0,0,0,0.03))' : undefined }}>
          <input type="radio" name={field.field_key} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} disabled={disabled} className="accent-[var(--color-primary)]" />
          <span className="text-sm font-medium">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function MultiSelectCheckbox({ field, value, onChange, disabled }: FormFieldProps) {
  const options = (field.config?.options as { label: string; value: string }[]) || []
  const selected = Array.isArray(value) ? value as string[] : []
  return (
    <div className="space-y-2">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-3 cursor-pointer rounded-lg border p-3 transition-colors hover:bg-[var(--color-muted)]" style={{ borderColor: selected.includes(o.value) ? 'var(--color-primary)' : 'var(--color-border)' }}>
          <input type="checkbox" checked={selected.includes(o.value)} onChange={e => { onChange(e.target.checked ? [...selected, o.value] : selected.filter(v => v !== o.value)) }} disabled={disabled} className="rounded accent-[var(--color-primary)]" />
          <span className="text-sm font-medium">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function ImageChoiceField({ field, value, onChange, disabled }: FormFieldProps) {
  const options = (field.config?.options as { label: string; value: string; image_url?: string }[]) || []
  const multiple = field.config?.multiple as boolean
  const selected = multiple ? (Array.isArray(value) ? value as string[] : []) : null

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map(o => {
        const isSelected = multiple ? (selected?.includes(o.value)) : value === o.value
        return (
          <button key={o.value} type="button" disabled={disabled} onClick={() => {
            if (multiple) {
              const s = selected || []
              onChange(isSelected ? s.filter((v: string) => v !== o.value) : [...s, o.value])
            } else {
              onChange(o.value)
            }
          }} className="relative rounded-lg border-2 overflow-hidden transition-all p-3 text-center" style={{ borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)', transform: isSelected ? 'scale(1.02)' : 'scale(1)' }}>
            {o.image_url && <img src={o.image_url} alt={o.label} className="w-full h-24 object-cover rounded mb-2" />}
            <span className="text-sm font-medium">{o.label}</span>
            {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs text-white" style={{ backgroundColor: 'var(--color-primary)' }}>✓</div>}
          </button>
        )
      })}
    </div>
  )
}

function ButtonGroupField({ field, value, onChange, disabled }: FormFieldProps) {
  const options = (field.config?.options as { label: string; value: string }[]) || []
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)} className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all" style={{ borderColor: value === o.value ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: value === o.value ? 'var(--color-primary)' : 'transparent', color: value === o.value ? 'var(--color-primary-foreground)' : 'inherit' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function RatingField({ field, value, onChange, disabled }: FormFieldProps) {
  const max = (field.config?.max_rating as number) || 5
  const current = Number(value) || 0
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} className="text-2xl transition-transform hover:scale-110" style={{ color: n <= current ? 'var(--color-warning, #F59E0B)' : 'var(--color-border)' }}>
          ★
        </button>
      ))}
    </div>
  )
}

function OpinionScaleField({ field, value, onChange, disabled }: FormFieldProps) {
  const min = (field.config?.scale_min as number) ?? 1
  const max = (field.config?.scale_max as number) ?? 10
  const minLabel = (field.config?.min_label as string) || ''
  const maxLabel = (field.config?.max_label as string) || ''
  const current = Number(value)
  return (
    <div>
      <div className="flex gap-1 justify-center">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => (
          <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} className="w-10 h-10 rounded-md border-2 text-sm font-semibold transition-all" style={{ borderColor: current === n ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: current === n ? 'var(--color-primary)' : 'transparent', color: current === n ? 'var(--color-primary-foreground)' : 'inherit' }}>
            {n}
          </button>
        ))}
      </div>
      {(minLabel || maxLabel) && (
        <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}

function NpsField({ field, value, onChange, disabled }: FormFieldProps) {
  const current = Number(value)
  return (
    <div>
      <div className="flex gap-1 justify-center">
        {Array.from({ length: 11 }, (_, i) => i).map(n => {
          const bg = current === n
            ? n <= 6 ? '#EF4444' : n <= 8 ? '#F59E0B' : '#10B981'
            : undefined
          return (
            <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} className="w-9 h-9 rounded-md border-2 text-xs font-semibold transition-all" style={{ borderColor: current === n ? bg : 'var(--color-border)', backgroundColor: bg || 'transparent', color: current === n ? '#fff' : 'inherit' }}>
              {n}
            </button>
          )
        })}
      </div>
      <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        <span>Not likely</span><span>Very likely</span>
      </div>
    </div>
  )
}

function YesNoField({ field, value, onChange, disabled }: FormFieldProps) {
  return (
    <div className="flex gap-3">
      {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(o => (
        <button key={o.label} type="button" disabled={disabled} onClick={() => onChange(o.val)} className="flex-1 py-3 rounded-lg border-2 text-sm font-semibold transition-all" style={{ borderColor: value === o.val ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: value === o.val ? 'var(--color-primary)' : 'transparent', color: value === o.val ? 'var(--color-primary-foreground)' : 'inherit' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function LegalAcceptanceField({ field, value, onChange, disabled }: FormFieldProps) {
  const text = (field.config?.legal_text as string) || field.label || 'I agree to the terms'
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} disabled={disabled} className="mt-1 rounded accent-[var(--color-primary)]" />
      <span className="text-sm" dangerouslySetInnerHTML={{ __html: text }} />
    </label>
  )
}

function DateField({ field, value, onChange, disabled }: FormFieldProps) {
  return <Input type="date" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} />
}

function TimeField({ field, value, onChange, disabled }: FormFieldProps) {
  return <Input type="time" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} />
}

function DateTimeField({ field, value, onChange, disabled }: FormFieldProps) {
  return <Input type="datetime-local" value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} />
}

function FileUploadField({ field, value, onChange, disabled }: FormFieldProps) {
  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: 'var(--color-border)' }}>
      <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f.name) }} disabled={disabled} className="text-sm" />
      {value != null && <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>Selected: {String(value)}</p>}
    </div>
  )
}

function SignaturePadField({ field, value, onChange, disabled }: FormFieldProps) {
  const [mode, setMode] = useState<'draw' | 'type'>('type')
  const [typed, setTyped] = useState('')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('type')} className="text-xs px-3 py-1 rounded-full border" style={{ backgroundColor: mode === 'type' ? 'var(--color-primary)' : 'transparent', color: mode === 'type' ? 'var(--color-primary-foreground)' : 'inherit' }}>Type</button>
        <button type="button" onClick={() => setMode('draw')} className="text-xs px-3 py-1 rounded-full border" style={{ backgroundColor: mode === 'draw' ? 'var(--color-primary)' : 'transparent', color: mode === 'draw' ? 'var(--color-primary-foreground)' : 'inherit' }}>Draw</button>
      </div>
      {mode === 'type' ? (
        <Input
          value={typed}
          onChange={e => { setTyped(e.target.value); onChange({ type: 'typed', name: e.target.value, timestamp: new Date().toISOString() }) }}
          disabled={disabled}
          placeholder="Type your full name"
          className="text-lg italic"
          style={{ fontFamily: 'cursive' }}
        />
      ) : (
        <div className="border rounded-lg h-32 flex items-center justify-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Canvas signature pad</p>
        </div>
      )}
    </div>
  )
}

function SliderField({ field, value, onChange, disabled }: FormFieldProps) {
  const min = (field.config?.min as number) ?? 0
  const max = (field.config?.max as number) ?? 100
  const step = (field.config?.step as number) ?? 1
  return (
    <div className="space-y-2">
      <input type="range" min={min} max={max} step={step} value={Number(value ?? min)} onChange={e => onChange(Number(e.target.value))} disabled={disabled} className="w-full accent-[var(--color-primary)]" />
      <div className="flex justify-between text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
        <span>{min}</span><span className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>{String(value ?? min)}</span><span>{max}</span>
      </div>
    </div>
  )
}

function SectionHeaderField({ field }: FormFieldProps) {
  return <h2 className="text-xl font-bold mt-6" style={{ color: 'var(--color-foreground)' }}>{field.label}</h2>
}

function DescriptionBlockField({ field }: FormFieldProps) {
  return <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{field.description || field.label}</p>
}

function DividerField() {
  return <hr className="my-4" style={{ borderColor: 'var(--color-border)' }} />
}

function SpacerField() {
  return <div className="h-8" />
}

function HiddenFieldInput() {
  return null
}

function FallbackField({ field, value, onChange, disabled }: FormFieldProps) {
  return <Input value={String(value ?? '')} onChange={e => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder || field.label || ''} />
}

const FIELD_RENDERERS: Record<string, (props: FormFieldProps) => React.ReactNode> = {
  short_text: ShortTextField,
  long_text: LongTextField,
  rich_text: LongTextField,
  email: EmailField,
  phone: PhoneField,
  url: UrlField,
  number: NumberField,
  currency: CurrencyField,
  single_select_dropdown: SingleSelectDropdown,
  single_select_radio: SingleSelectRadio,
  multi_select_checkbox: MultiSelectCheckbox,
  image_choice: ImageChoiceField,
  button_group: ButtonGroupField,
  rating: RatingField,
  opinion_scale: OpinionScaleField,
  nps: NpsField,
  yes_no: YesNoField,
  legal_acceptance: LegalAcceptanceField,
  date: DateField,
  time: TimeField,
  datetime: DateTimeField,
  date_range: DateField,
  file_upload: FileUploadField,
  image_upload: FileUploadField,
  signature_pad: SignaturePadField,
  slider: SliderField,
  section_header: SectionHeaderField,
  description_block: DescriptionBlockField,
  divider: DividerField,
  spacer: SpacerField,
  hidden_field: HiddenFieldInput,
}

export { FIELD_RENDERERS }
