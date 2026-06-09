import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  agencyOrderStatusBadgeClass,
} from '../../admin/partners/AgencyOrderHistoryTable'
import { isOrderOperationsPhase } from '../../shared/orderPhase'
import { orderStatusLabelVi } from '../../dashboards/orderStatusLabels'
import { directorPaths } from '../config/directorPaths'
import {
  fetchDirectorOrderPipeline,
  orderRefFromPipelineRow,
  type DirectorOrderPipelineRow,
} from '../directorOperationsApi'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorOrdersPipelinePage.css'

type StatusTab = 'Producing' | 'Approved' | 'Done' | 'all'

const STATUS_TABS: { id: StatusTab; label: string; statusParam?: string }[] = [
  { id: 'Producing', label: 'Đang SX', statusParam: 'Producing' },
  { id: 'Approved', label: 'Đã duyệt chờ SX', statusParam: 'Approved' },
  { id: 'Done', label: 'Hoàn tất', statusParam: 'Done' },
  { id: 'all', label: 'Tất cả', statusParam: 'Approved,Producing,Done' },
]

function formatLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultMonthRange(): { fromDate: string; toDate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  return {
    fromDate: formatLocalISODate(new Date(y, m, 1)),
    toDate: formatLocalISODate(new Date(y, m + 1, 0)),
  }
}

function progressPct(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((done / total) * 100))
}

function FulfillmentBar({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = progressPct(done, total)
  return (
    <div className="th-director-pipe__progress" title={`${label}: ${done} / ${total}`}>
      <div className="th-director-pipe__progress-track">
        <div className="th-director-pipe__progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="th-director-pipe__progress-text">
        {done}/{total}
      </span>
    </div>
  )
}

/** Pipeline đơn fulfillment (DH) + tiến độ lô / giao — Giám đốc. */
export function DirectorOrdersPipelinePage() {
  const [{ fromDate, toDate }, setRange] = useState(defaultMonthRange)
  const [tab, setTab] = useState<StatusTab>('Producing')
  const [lateOnly, setLateOnly] = useState(false)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<DirectorOrderPipelineRow[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusParam = STATUS_TABS.find((t) => t.id === tab)?.statusParam

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDirectorOrderPipeline({
        page,
        size: 20,
        status: statusParam,
        fromDate,
        toDate,
        lateOnly,
      })
      setRows(res.content)
      setTotalPages(res.totalPages)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setError(e instanceof Error ? e.message : 'Không tải được pipeline đơn')
    } finally {
      setLoading(false)
    }
  }, [page, statusParam, fromDate, toDate, lateOnly])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(0)
  }, [tab, fromDate, toDate, lateOnly])

  return (
    <div className="th-director-pipe">
      <header className="th-director-pipe__header">
        <p className="th-director-pipe__period">
          <span className="material-symbols-outlined" aria-hidden>
            local_shipping
          </span>
          Điều hành sản xuất
        </p>
        <h1 className="th-director-pipe__title">Tình trạng đơn hàng</h1>
      </header>

      <div className="th-director-pipe__tabs" role="tablist" aria-label="Trạng thái đơn">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={
              tab === t.id
                ? 'th-director-pipe__tab th-director-pipe__tab--active'
                : 'th-director-pipe__tab'
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="th-director-pipe__filters">
        <label className="th-director-pipe__field">
          <span>Từ ngày (tạo đơn)</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setRange((r) => ({ ...r, fromDate: e.target.value }))}
          />
        </label>
        <label className="th-director-pipe__field">
          <span>Đến ngày</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setRange((r) => ({ ...r, toDate: e.target.value }))}
          />
        </label>
        <label className="th-director-pipe__late">
          <input
            type="checkbox"
            checked={lateOnly}
            onChange={(e) => setLateOnly(e.target.checked)}
          />
          Chỉ đơn trễ hạn giao
        </label>
      </div>

      {error ? (
        <p className="th-admin-users__api-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="th-director-pipe__table-wrap">
        {loading ? <p className="th-director-pipe__hint">Đang tải…</p> : null}
        <table className="th-director-pipe__table">
          <thead>
            <tr>
              <th scope="col">Mã đơn / Khách</th>
              <th scope="col">Từ báo giá</th>
              <th scope="col">NVBH</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Hạn giao</th>
              <th scope="col">Lập lô</th>
              <th scope="col">Giao hàng</th>
              <th scope="col" className="th-director-pipe__num">
                Giá trị
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="th-director-pipe__empty">
                  Không có đơn phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const orderRef = orderRefFromPipelineRow(row)
                const sourceRef = row.sourceDisplayCode?.trim() || null
                return (
                  <tr key={row.orderId} className={row.deliveryLate ? 'th-director-pipe__row--late' : undefined}>
                    <td>
                      {isOrderOperationsPhase(row.status) ? (
                        <Link
                          to={directorPaths.operations.order(orderRef)}
                          className="th-director-pipe__order-link"
                        >
                          {orderRef}
                        </Link>
                      ) : (
                        <span>{orderRef}</span>
                      )}
                      <span className="th-director-pipe__agency">{row.agencyName}</span>
                      {row.openTaskCount > 0 ? (
                        <span className="th-director-pipe__wip">{row.openTaskCount} lô đang SX</span>
                      ) : null}
                    </td>
                    <td className="th-director-pipe__provenance">
                      {sourceRef ? (
                        <Link
                          to={directorPaths.approvals.pricingOrder(sourceRef)}
                          className="th-director-pipe__provenance-link"
                          title={`Mở báo giá ${sourceRef}`}
                        >
                          {sourceRef}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{row.sellerName}</td>
                    <td>
                      <span className={agencyOrderStatusBadgeClass(row.status)}>
                        {orderStatusLabelVi(row.status)}
                      </span>
                    </td>
                    <td>
                      {row.expectedDeliveryDate ?? '—'}
                      {row.deliveryLate ? (
                        <span className="th-director-pipe__late-badge">Trễ</span>
                      ) : null}
                    </td>
                    <td>
                      <FulfillmentBar
                        done={row.batchedQty}
                        total={row.orderedQty}
                        label="Lập lô"
                      />
                    </td>
                    <td>
                      <FulfillmentBar
                        done={row.deliveredQty}
                        total={row.orderedQty}
                        label="Giao"
                      />
                    </td>
                    <td className="th-director-pipe__num">{formatVND(row.totalPayable)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="th-director-pipe__pager">
          <button type="button" disabled={page <= 0 || loading} onClick={() => setPage((p) => p - 1)}>
            Trước
          </button>
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}
    </div>
  )
}
