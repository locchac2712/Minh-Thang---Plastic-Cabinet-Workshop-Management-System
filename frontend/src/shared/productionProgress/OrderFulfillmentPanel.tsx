import type { OrderFulfillmentSummaryDto } from './types'
import './OrderFulfillmentPanel.css'

export type OrderFulfillmentPanelProps = {
  summary: OrderFulfillmentSummaryDto | null
  loading: boolean
  error: string | null
  onRetry?: () => void
  emptyMessage?: string
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

export function OrderFulfillmentPanel({
  summary,
  loading,
  error,
  onRetry,
  emptyMessage = 'Chưa có dữ liệu lập lô. Xưởng cần tạo lô sản xuất trước.',
}: OrderFulfillmentPanelProps) {
  if (loading) {
    return <p className="th-opp-muted">Đang tải tiến độ lập lô / giao hàng…</p>
  }

  if (error) {
    return (
      <div className="th-sod-fulfill__error" role="alert">
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

  if (!summary?.lines?.length) {
    return (
      <div className="th-sod-fulfill__empty">
        <span className="material-symbols-outlined" aria-hidden>
          precision_manufacturing
        </span>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const totalOrdered = summary.lines.reduce((s, l) => s + l.orderedQuantity, 0)
  const totalBatched = summary.lines.reduce((s, l) => s + l.batchedQuantity, 0)
  const totalDelivered = summary.lines.reduce((s, l) => s + l.deliveredQuantity, 0)

  return (
    <div className="th-sod-fulfill">
      <h3 className="th-sod-fulfill__title">
        <span className="material-symbols-outlined" aria-hidden>
          inventory
        </span>
        Tóm tắt lập lô &amp; giao hàng
      </h3>
      <ul className="th-sod-fulfill__kpis" aria-label="Tổng hợp đơn">
        <li className="th-sod-fulfill__kpi">
          <span className="th-sod-fulfill__kpi-label">Đặt hàng</span>
          <span className="th-sod-fulfill__kpi-value">{totalOrdered}</span>
        </li>
        <li className="th-sod-fulfill__kpi">
          <span className="th-sod-fulfill__kpi-label">Đã lập lô</span>
          <span className="th-sod-fulfill__kpi-value">{totalBatched}</span>
        </li>
        <li className="th-sod-fulfill__kpi">
          <span className="th-sod-fulfill__kpi-label">Đã giao</span>
          <span className="th-sod-fulfill__kpi-value">{totalDelivered}</span>
        </li>
      </ul>
      <div className="th-sod-fulfill__lines">
        {summary.lines.map((line) => {
          const batchPct = pct(line.batchedQuantity, line.orderedQuantity)
          const deliverPct = pct(line.deliveredQuantity, line.orderedQuantity)
          return (
            <article key={line.orderItemId} className="th-sod-fulfill__line">
              <div className="th-sod-fulfill__line-head">
                <h4 className="th-sod-fulfill__line-name">{line.productName}</h4>
                <span className="th-sod-fulfill__line-qty">
                  Đặt {line.orderedQuantity} · còn giao {line.remainingToDeliver}
                </span>
              </div>
              <div className="th-sod-fulfill__bars">
                <div className="th-sod-fulfill__bar-row">
                  <span className="th-sod-fulfill__bar-label">Lập lô</span>
                  <div className="th-sod-fulfill__bar-track" role="presentation">
                    <div
                      className="th-sod-fulfill__bar-fill th-sod-fulfill__bar-fill--batch"
                      style={{ width: `${batchPct}%` }}
                    />
                  </div>
                  <span className="th-sod-fulfill__bar-num">
                    {line.batchedQuantity}/{line.orderedQuantity}
                  </span>
                </div>
                <div className="th-sod-fulfill__bar-row">
                  <span className="th-sod-fulfill__bar-label">Giao</span>
                  <div className="th-sod-fulfill__bar-track" role="presentation">
                    <div
                      className="th-sod-fulfill__bar-fill th-sod-fulfill__bar-fill--deliver"
                      style={{ width: `${deliverPct}%` }}
                    />
                  </div>
                  <span className="th-sod-fulfill__bar-num">
                    {line.deliveredQuantity}/{line.orderedQuantity}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
