import { Link } from 'react-router-dom'
import { orderStatusLabelVi } from '../../dashboards/orderStatusLabels'
import { formatVND } from './agencyModel'
import type { AgencyOrderRow } from './agencyDetailMock'
import { formatOrderAmount } from './agencyDetailMock'
import '../pages/AdminProductDetailPage.css'
import './AgencyOrderHistoryTable.css'

export type AgencyOrderHistoryTableProps = {
  rows: AgencyOrderRow[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  orderLink?: (orderRef: string) => string
  /** Hiển thị nhãn «Báo giá» trên dòng BG — tắt ở tab đơn fulfillment. */
  showQuotationBadge?: boolean
}

export function agencyOrderStatusBadgeClass(status: string | undefined): string {
  const base = 'th-agency-order-badge'
  const key = (status ?? '').trim().toLowerCase()
  if (!key) return base
  return `${base} th-agency-order-badge--${key}`
}

const QUOTATION_PHASE_STATUSES = new Set(['draft', 'pending', 'approved', 'rejected', 'canceled'])

export function isAgencyOrderQuotationPhase(status: string | undefined): boolean {
  return QUOTATION_PHASE_STATUSES.has((status ?? '').trim().toLowerCase())
}

function resolveRecordKind(d: {
  displayCode?: string | null
  sourceOrderId?: string | null
  recordKind?: string | null
}): 'quotation' | 'fulfillment' {
  const ref = d.displayCode?.trim() ?? ''
  if (ref.startsWith('BG-')) return 'quotation'
  if (ref.startsWith('DH-')) return 'fulfillment'
  if (d.recordKind === 'fulfillment' || d.recordKind === 'quotation') {
    return d.recordKind
  }
  if (d.sourceOrderId) return 'fulfillment'
  return 'quotation'
}

export function mapApiOrderToAgencyOrderRow(d: {
  id: string
  displayCode?: string | null
  sourceOrderId?: string | null
  recordKind?: string | null
  totalPayable: number
  status: string
  createdAt: string
}): AgencyOrderRow {
  const date = d.createdAt?.slice(0, 10) ?? '—'
  const ref = d.displayCode?.trim() || d.id
  return {
    id: d.id,
    orderRef: ref,
    orderDate: date,
    amountVnd: d.totalPayable,
    status: d.status,
    statusLabel: orderStatusLabelVi(d.status),
    recordKind: resolveRecordKind(d),
  }
}

function formatOrderRefDisplay(ref: string): string {
  if (/^(BG|DH)-\d{4}-\d{5}$/.test(ref.trim())) return ref.trim()
  return ref.length > 12 ? `${ref.slice(0, 8)}…` : ref
}

export function AgencyOrderHistoryTable({
  rows,
  loading = false,
  error = null,
  emptyMessage = 'Chưa có đơn hàng.',
  orderLink,
  showQuotationBadge = true,
}: AgencyOrderHistoryTableProps) {
  if (loading) {
    return <p className="th-admin-product-detail__tab-lead">Đang tải lịch sử đơn…</p>
  }
  if (error) {
    return (
      <p className="th-admin-list-toolbar__error" role="alert">
        {error}
      </p>
    )
  }
  if (rows.length === 0) {
    return <p className="th-admin-product-detail__tab-lead">{emptyMessage}</p>
  }
  return (
    <div className="th-admin-product-detail__table-wrap">
      <table className="th-admin-product-detail__table">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Ngày</th>
            <th>Giá trị</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {orderLink ? (
                  <Link to={orderLink(r.orderRef)} className="th-admin-product-detail__mono">
                    <code>{formatOrderRefDisplay(r.orderRef)}</code>
                  </Link>
                ) : (
                  <code className="th-admin-product-detail__mono">{formatOrderRefDisplay(r.orderRef)}</code>
                )}
              </td>
              <td>{r.orderDate}</td>
              <td>{formatOrderAmount(r.amountVnd)}</td>
              <td>
                <div className="th-agency-order-badges">
                  {showQuotationBadge && r.recordKind === 'quotation' ? (
                    <span className="th-agency-order-badge th-agency-order-badge--quotation">Báo giá</span>
                  ) : null}
                  <span className={agencyOrderStatusBadgeClass(r.status)}>
                    {r.status ? orderStatusLabelVi(r.status) : r.statusLabel}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="th-admin-product-detail__tab-lead" style={{ textAlign: 'right' }}>
              Tổng {rows.length} đơn hiển thị · {formatVND(rows.reduce((s, r) => s + r.amountVnd, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
