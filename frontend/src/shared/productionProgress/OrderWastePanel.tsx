import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { productionTaskRefFromId } from '../../production/utils/productionTaskRef'
import { formatDateVi } from '../formatDateVi'
import './OrderWastePanel.css'

export type OrderWasteMaterialRow = {
  materialId: string
  materialCode: string | null
  materialName: string | null
  quantityAbs: number
  damageVnd: number
}

export type OrderWasteEventRow = {
  logId: string
  taskId: string | null
  taskDisplayCode?: string | null
  productName: string | null
  assignedToName: string | null
  materialCode: string | null
  materialName: string | null
  quantityAbs: number
  damageVnd: number
  note: string | null
  createdAt: string
}

export type OrderWasteSummaryDto = {
  orderId: string
  estimatedDamageVnd: number
  wasteEventCount: number
  discardedBoardEquivalent: number
  materialRows: OrderWasteMaterialRow[]
  events: OrderWasteEventRow[]
}

export type OrderWastePanelProps = {
  summary: OrderWasteSummaryDto | null
  loading: boolean
  error: string | null
  onRetry?: () => void
  taskDetailLink?: (taskId: string) => string
  emptyMessage?: string
}

function formatEventTime(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const datePart = d.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const timePart = d.includes('T') ? d.split('T')[1]?.slice(0, 5) : ''
    return timePart ? `${formatDateVi(datePart)} ${timePart}` : formatDateVi(datePart)
  }
  return d
}

function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

export function OrderWastePanel({
  summary,
  loading,
  error,
  onRetry,
  taskDetailLink,
  emptyMessage = 'Chưa ghi nhận hao phí trên các lệnh SX của đơn này.',
}: OrderWastePanelProps) {
  if (loading) {
    return <p className="th-opp-muted">Đang tải hao phí / hư hỏng NVL…</p>
  }

  if (error) {
    return (
      <div className="th-order-waste__error" role="alert">
        <p className="th-admin-users__api-error" style={{ margin: 0 }}>
          {error}
        </p>
        {onRetry ? (
          <button type="button" className="th-opp-btn th-opp-btn--ghost" onClick={onRetry}>
            Thử lại
          </button>
        ) : null}
      </div>
    )
  }

  if (!summary || summary.wasteEventCount === 0) {
    return (
      <div className="th-order-waste__empty">
        <span className="material-symbols-outlined" aria-hidden>
          delete_forever
        </span>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const boards = summary.discardedBoardEquivalent
  const showBoards = boards > 0

  return (
    <div className="th-order-waste">
      <ul className="th-order-waste__kpis">
        <li className="th-order-waste__kpi">
          <span className="th-order-waste__kpi-label">Thiệt hại ước tính</span>
          <strong className="th-order-waste__kpi-value">{formatVND(summary.estimatedDamageVnd)}</strong>
        </li>
        <li className="th-order-waste__kpi">
          <span className="th-order-waste__kpi-label">Sự kiện hao phí</span>
          <strong className="th-order-waste__kpi-value">{summary.wasteEventCount}</strong>
        </li>
        {showBoards ? (
          <li className="th-order-waste__kpi">
            <span className="th-order-waste__kpi-label">Tấm hư (ước tính)</span>
            <strong className="th-order-waste__kpi-value">{formatQty(boards)}</strong>
          </li>
        ) : null}
      </ul>

      {summary.materialRows.length > 0 ? (
        <div className="th-order-waste__block">
          <h3 className="th-order-waste__subtitle">Theo vật tư</h3>
          <div className="th-order-waste__table-scroll">
            <table className="th-order-waste__table">
              <thead>
                <tr>
                  <th scope="col">Mã NVL</th>
                  <th scope="col">Tên vật tư</th>
                  <th scope="col" className="th-order-waste__num">
                    SL hao
                  </th>
                  <th scope="col" className="th-order-waste__num">
                    Thiệt hại
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.materialRows.map((row) => (
                  <tr key={row.materialId}>
                    <td>
                      <code>{row.materialCode?.trim() || '—'}</code>
                    </td>
                    <td>{row.materialName?.trim() || '—'}</td>
                    <td className="th-order-waste__num">{formatQty(row.quantityAbs)}</td>
                    <td className="th-order-waste__num">{formatVND(row.damageVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {summary.events.length > 0 ? (
        <div className="th-order-waste__block">
          <h3 className="th-order-waste__subtitle">Nhật ký hao phí</h3>
          <div className="th-order-waste__table-scroll">
            <table className="th-order-waste__table">
              <thead>
                <tr>
                  <th scope="col">Thời gian</th>
                  <th scope="col">Vật tư</th>
                  <th scope="col" className="th-order-waste__num">
                    SL
                  </th>
                  <th scope="col" className="th-order-waste__num">
                    Thiệt hại
                  </th>
                  <th scope="col">Lô SX</th>
                  <th scope="col">Thợ phụ trách</th>
                  <th scope="col">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {summary.events.map((ev) => (
                  <tr key={ev.logId}>
                    <td className="th-order-waste__muted">{formatEventTime(ev.createdAt)}</td>
                    <td>
                      <span className="th-order-waste__material">
                        {ev.materialCode?.trim() ? (
                          <code>{ev.materialCode}</code>
                        ) : null}
                        <span>{ev.materialName?.trim() || '—'}</span>
                      </span>
                    </td>
                    <td className="th-order-waste__num">{formatQty(ev.quantityAbs)}</td>
                    <td className="th-order-waste__num">{formatVND(ev.damageVnd)}</td>
                    <td>
                      {ev.taskId && taskDetailLink ? (
                        <Link to={taskDetailLink(ev.taskId)} className="th-order-waste__task-link">
                          {ev.productName?.trim() ||
                            (ev.taskId
                              ? productionTaskRefFromId(ev.taskId, ev.taskDisplayCode)
                              : '—')}
                        </Link>
                      ) : (
                        ev.productName?.trim() || '—'
                      )}
                    </td>
                    <td>{ev.assignedToName?.trim() || '—'}</td>
                    <td className="th-order-waste__note">{ev.note?.trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
