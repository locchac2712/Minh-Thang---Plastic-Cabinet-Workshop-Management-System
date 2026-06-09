import { formatDateVi } from '../../../shared/formatDateVi'
import { quotationValidityLabel, type QuotationValidityLabel } from '../../sellerQuotationValidity'
import './QuotationValidityDisplay.css'

export type QuotationValidityDisplayProps = {
  validUntil?: string | null
  layout?: 'inline' | 'stack'
  showStatus?: boolean
  className?: string
}

function statusLabel(state: QuotationValidityLabel): string | null {
  if (state === 'expired') return 'Hết hạn'
  if (state === 'expiring_soon') return 'Sắp hết hạn'
  return null
}

export function QuotationValidityDisplay({
  validUntil,
  layout = 'inline',
  showStatus = true,
  className,
}: QuotationValidityDisplayProps) {
  const state = quotationValidityLabel(validUntil)
  const dateText = validUntil?.trim() ? formatDateVi(validUntil) : 'Không giới hạn'
  const chip = showStatus ? statusLabel(state) : null

  const classes = [
    'th-qt-validity',
    `th-qt-validity--${layout}`,
    state === 'expired' || state === 'expiring_soon' ? `th-qt-validity--${state}` : '',
    !validUntil?.trim() ? 'th-qt-validity--open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      <span className="th-qt-validity__date">{dateText}</span>
      {chip ? <span className={`th-qt-validity__status th-qt-validity__status--${state}`}>{chip}</span> : null}
    </span>
  )
}
