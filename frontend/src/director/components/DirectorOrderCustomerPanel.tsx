import { Link } from 'react-router-dom'
import { directorPaths } from '../config/directorPaths'
import type { DirectorPricingApprovalRow } from '../data/directorPricingApprovalsMock'
import './DirectorOrderCustomerPanel.css'

function agencyInitials(shortName: string): string {
  const parts = shortName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
  return shortName.slice(0, 2).toUpperCase()
}

function hasContactValue(value: string | undefined): boolean {
  const t = value?.trim()
  return Boolean(t && t !== '—')
}

export type DirectorOrderCustomerPanelProps = {
  row: DirectorPricingApprovalRow
  compact?: boolean
}

/** Thông tin khách sỉ trên hồ sơ duyệt đơn GD. */
export function DirectorOrderCustomerPanel({ row, compact = false }: DirectorOrderCustomerPanelProps) {
  const legalName = row.agencyLegalName ?? row.agencyShortName
  const address = row.agencyAddress ?? '—'
  const city = row.agencyCity?.trim()

  return (
    <section
      className={
        compact
          ? 'th-director-customer th-director-customer--compact'
          : 'th-director-customer'
      }
      aria-label="Khách sỉ"
    >
      {!compact ? (
        <h3 className="th-director-customer__title">
          <span className="material-symbols-outlined" aria-hidden>
            domain
          </span>
          Khách sỉ
        </h3>
      ) : null}
      <div className="th-director-customer__top">
        <div className="th-director-customer__avatar" aria-hidden>
          {agencyInitials(row.agencyShortName)}
        </div>
        <div className="th-director-customer__id">
          <div className="th-director-customer__name-row">
            <span className="th-director-customer__name">{row.agencyShortName}</span>
            <code className="th-director-customer__code">{row.agencyCode}</code>
          </div>
          <p className="th-director-customer__legal">{legalName}</p>
        </div>
      </div>
      <ul className="th-director-customer__contacts">
        <li className="th-director-customer__contact">
          <span className="material-symbols-outlined" aria-hidden>
            call
          </span>
          <div>
            <span className="th-director-customer__label">Điện thoại</span>
            {hasContactValue(row.agencyPhone) ? (
              <a href={`tel:${row.agencyPhone!.replace(/\s/g, '')}`}>{row.agencyPhone}</a>
            ) : (
              <span>—</span>
            )}
          </div>
        </li>
        <li className="th-director-customer__contact">
          <span className="material-symbols-outlined" aria-hidden>
            mail
          </span>
          <div>
            <span className="th-director-customer__label">Email</span>
            {hasContactValue(row.agencyEmail) ? (
              <a href={`mailto:${row.agencyEmail}`}>{row.agencyEmail}</a>
            ) : (
              <span>—</span>
            )}
          </div>
        </li>
        <li className="th-director-customer__contact">
          <span className="material-symbols-outlined" aria-hidden>
            location_on
          </span>
          <div>
            <span className="th-director-customer__label">Địa chỉ giao dự kiến</span>
            <span className="th-director-customer__address">
              {address}
              {city ? <span className="th-director-customer__muted"> · {city}</span> : null}
            </span>
          </div>
        </li>
      </ul>
      {row.agencyId ? (
        <Link to={directorPaths.partners.agency(row.agencyId)} className="th-director-customer__profile-link">
          Xem hồ sơ đại lý
          <span className="material-symbols-outlined" aria-hidden>
            arrow_forward
          </span>
        </Link>
      ) : null}
    </section>
  )
}
