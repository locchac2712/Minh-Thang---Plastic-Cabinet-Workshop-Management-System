import { DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { formatDateVi } from '../formatDateVi'
import './isoDatePicker.css'

dayjs.extend(customParseFormat)

/** Ant Design render dropdown ra body → bị `<dialog>` top layer che; gắn vào dialog nếu có. */
function datePickerPopupContainer(trigger: HTMLElement): HTMLElement {
  const dialog = trigger.closest('dialog')
  if (dialog instanceof HTMLElement) return dialog
  return document.body
}

export function isoStringToDayjs(iso: string | null | undefined): Dayjs | null {
  if (!iso?.trim()) return null
  const d = dayjs(iso.trim().slice(0, 10), 'YYYY-MM-DD', true)
  return d.isValid() ? d.startOf('day') : null
}

export function dayjsToIsoString(d: Dayjs | null | undefined): string {
  if (!d?.isValid()) return ''
  return d.format('YYYY-MM-DD')
}

export type ValidateIsoDateOptions = {
  required?: boolean
  minIso?: string | null
  maxIso?: string | null
  /** Nhãn trường trong thông báo lỗi */
  fieldLabel?: string
}

/** Trả về thông báo lỗi tiếng Việt hoặc `null` nếu hợp lệ. */
export function validateIsoDateField(
  iso: string,
  { required = true, minIso, maxIso, fieldLabel = 'Ngày' }: ValidateIsoDateOptions = {},
): string | null {
  const trimmed = iso.trim()
  if (!trimmed) {
    return required ? `Chọn ${fieldLabel.toLowerCase()}.` : null
  }
  const d = isoStringToDayjs(trimmed)
  if (!d) {
    return `${fieldLabel} không hợp lệ (dd/MM/yyyy).`
  }
  const normalized = dayjsToIsoString(d)
  if (minIso) {
    const min = isoStringToDayjs(minIso)
    if (min && d.isBefore(min, 'day')) {
      return `${fieldLabel} không được trước ${formatDateVi(minIso)}.`
    }
  }
  if (maxIso) {
    const max = isoStringToDayjs(maxIso)
    if (max && d.isAfter(max, 'day')) {
      return `${fieldLabel} không được sau ${formatDateVi(maxIso)}.`
    }
  }
  if (normalized !== trimmed.slice(0, 10)) {
    return `${fieldLabel} không hợp lệ.`
  }
  return null
}

type IsoDatePickerFieldProps = {
  id?: string
  value: string
  onChange: (iso: string) => void
  minIso?: string | null
  maxIso?: string | null
  disabled?: boolean
  className?: string
  status?: 'error'
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

/** DatePicker Ant Design — hiển thị dd/MM/yyyy, giá trị nội bộ ISO YYYY-MM-DD. */
export function IsoDatePickerField({
  id,
  value,
  onChange,
  minIso,
  maxIso,
  disabled,
  className,
  status,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: IsoDatePickerFieldProps) {
  const min = isoStringToDayjs(minIso ?? undefined)
  const max = isoStringToDayjs(maxIso ?? undefined)

  return (
    <DatePicker
      id={id}
      className={className}
      format="DD/MM/YYYY"
      placeholder="dd/MM/yyyy"
      value={isoStringToDayjs(value)}
      disabled={disabled}
      status={status}
      style={{ width: '100%' }}
      allowClear={false}
      inputReadOnly={false}
      getPopupContainer={datePickerPopupContainer}
      classNames={{ popup: { root: 'th-iso-date-picker-popup' } }}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      disabledDate={(current) => {
        if (!current?.isValid()) return false
        if (min && current.isBefore(min, 'day')) return true
        if (max && current.isAfter(max, 'day')) return true
        return false
      }}
      onChange={(next) => onChange(dayjsToIsoString(next))}
    />
  )
}
