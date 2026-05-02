import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { sellerPaths } from '../../seller/config/sellerPaths'
import { sellerOrderKindLabel } from '../../seller/data/sellerOrdersMock'
import { productionPaths } from '../config/productionPaths'
import { floorColumnLabel } from '../data/productionTasksByOrderMock'
import { internalStatusLabel, type ProductionInternalTaskStatus } from '../data/productionTasksInternalMock'
import {
  productionTaskStatusToColumn,
  type ProductionTaskDetailDto,
} from '../productionTasksApi'
import '../pages/ProductionTaskByOrderDetailPage.css'

export type ProductionTaskDetailVariant = 'by-order' | 'internal'

function orderTypeToSellerKind(ot: string | null): 'ready_made' | 'custom' {
  const s = (ot ?? '').toLowerCase()
  if (s.includes('custom')) return 'custom'
  return 'ready_made'
}

function formatIsoDate(iso: string | null): string {
  if (!iso?.trim()) return '—'
  const d = iso.trim()
  return d.length >= 10 ? d.slice(0, 10) : d
}

function formatDateTime(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d.length >= 19 ? d.slice(0, 19) : d
  return noMs.includes('T') ? noMs.replace('T', ' ') : noMs
}

type Props = {
  task: ProductionTaskDetailDto
  variant: ProductionTaskDetailVariant
}

/**
 * Chi tiết lệnh SX từ GET /api/production/tasks/:id/details — dùng chung cho trang theo đơn & MTS.
 */
export function ProductionTaskDetailFromApi({ task, variant }: Props) {
  const floor = productionTaskStatusToColumn(task.status)
  const statusLabel = internalStatusLabel(floor as ProductionInternalTaskStatus)
  const hasOrder = Boolean(task.orderId && task.orderId !== '')
  const mismatchByOrder = variant === 'by-order' && !hasOrder
  const mismatchInternal = variant === 'internal' && hasOrder
  const kind = orderTypeToSellerKind(task.orderType)
  const q = Number.isFinite(task.quantity) ? task.quantity : 0
  const orderItems = task.orderItems ?? []
  const bomItems = task.bomItems ?? []

  const listPath =
    variant === 'by-order' ? productionPaths.tasks.byOrder : productionPaths.tasks.internal
  const listLabel =
    variant === 'by-order' ? 'Lệnh theo đơn bán' : 'Lệnh tồn kho (MTS)'

  const cr = task.customRequirements?.trim()
  const titleLine =
    task.productName?.trim() ||
    (cr ? (cr.length > 200 ? `${cr.slice(0, 197)}…` : cr) : 'Lệnh sản xuất')

  return (
    <div className="th-prod-tdetail">
      <nav className="th-prod-tdetail__breadcrumb" aria-label="Breadcrumb">
        <ol className="th-prod-tdetail__crumbs">
          <li>
            <Link to={listPath}>{listLabel}</Link>
          </li>
          <li aria-current="page">
            <code className="th-prod-tdetail__uuid">{task.id}</code>
          </li>
        </ol>
      </nav>

      <header className="th-prod-tdetail__header">
        <div className="th-prod-tdetail__header-row">
          <Link className="th-prod-tdetail__back" to={listPath}>
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
        </div>
        <div className="th-prod-tdetail__hero">
          <div className="th-prod-tdetail__hero-main">
            <h1 className="th-prod-tdetail__h1">
              <code className="th-prod-tdetail__task-code th-prod-tdetail__uuid">{task.id}</code>
            </h1>
            <p className="th-prod-tdetail__summary">{titleLine}</p>
          </div>
          <div className="th-prod-tdetail__badges">
            <span className={`th-prod-tdetail__floor th-prod-tdetail__floor--${floor}`}>
              {floorColumnLabel(floor)}
            </span>
            <span className="th-prod-tdetail__nvbh">{statusLabel}</span>
            <span
              className={
                kind === 'custom'
                  ? 'th-prod-tdetail__kind th-prod-tdetail__kind--custom'
                  : 'th-prod-tdetail__kind'
              }
            >
              {task.orderType?.trim() ? `${task.orderType} · ` : ''}
              {sellerOrderKindLabel(kind)}
            </span>
          </div>
        </div>
      </header>

      {mismatchByOrder ? (
        <div className="th-prod-tdetail__mismatch" role="status">
          <p>
            <strong>Lệnh này không gắn đơn NVBH</strong> — thuộc nhóm Make-to-Stock / nội bộ.
          </p>
          <p>
            <Link to={productionPaths.tasks.internal}>→ Xem trong «Lệnh tồn kho (MTS)»</Link>
          </p>
        </div>
      ) : null}

      {mismatchInternal ? (
        <div className="th-prod-tdetail__mismatch" role="status">
          <p>
            <strong>Lệnh này gắn đơn NVBH</strong> — không phải lệnh tồn kho thuần MTS.
          </p>
          <p>
            <Link to={productionPaths.tasks.byOrder}>→ Mở «Lệnh theo đơn bán»</Link>
            {task.orderId ? (
              <>
                {' · '}
                <Link to={sellerPaths.order(task.orderId)}>Chi tiết đơn NVBH</Link>
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="th-prod-tdetail__grid">
        <section className="th-prod-tdetail__card" aria-labelledby="td-api-task">
          <h2 id="td-api-task" className="th-prod-tdetail__card-title">
            Thông tin lệnh
          </h2>
          <dl className="th-prod-tdetail__kv">
            <dt>Product ID</dt>
            <dd>
              <code className="th-prod-tdetail__uuid">{task.productId ?? '—'}</code>
            </dd>
            <dt>Số lượng</dt>
            <dd>{q}</dd>
            <dt>Thợ</dt>
            <dd>{task.assignedToName?.trim() ? task.assignedToName : '—'}</dd>
            <dt>Tạo lệnh</dt>
            <dd>{formatDateTime(task.createdAt)}</dd>
            <dt>Bắt đầu (dự kiến)</dt>
            <dd>{formatIsoDate(task.startDate)}</dd>
            <dt>Hạn xong</dt>
            <dd>{formatIsoDate(task.expectedEndDate)}</dd>
            <dt>Hoàn tất</dt>
            <dd>{formatIsoDate(task.completedAt)}</dd>
          </dl>
          {task.customRequirements?.trim() ? (
            <p className="th-prod-tdetail__req">
              <strong>Yêu cầu:</strong> {task.customRequirements.trim()}
            </p>
          ) : null}
        </section>

        <section className="th-prod-tdetail__card" aria-labelledby="td-api-order">
          <h2 id="td-api-order" className="th-prod-tdetail__card-title">
            Đơn hàng
          </h2>
          {hasOrder ? (
            <>
              <dl className="th-prod-tdetail__kv">
                <dt>Order ID</dt>
                <dd>
                  <Link className="th-prod-tdetail__link" to={sellerPaths.order(task.orderId!)}>
                    <code className="th-prod-tdetail__uuid">{task.orderId}</code>
                  </Link>
                </dd>
              </dl>
              <Link className="th-prod-tdetail__cta" to={sellerPaths.order(task.orderId!)}>
                Mở chi tiết đơn trên NVBH
                <span className="material-symbols-outlined" aria-hidden>
                  open_in_new
                </span>
              </Link>
            </>
          ) : (
            <p className="th-prod-tdetail__lead" style={{ margin: 0 }}>
              Không có đơn NVBH (lệnh nội bộ / dự trữ).
            </p>
          )}
        </section>

        <section className="th-prod-tdetail__card th-prod-tdetail__card--wide" aria-labelledby="td-api-lines">
          <h2 id="td-api-lines" className="th-prod-tdetail__card-title">
            Dòng đặt hàng
          </h2>
          {orderItems.length === 0 ? (
            <p className="th-prod-tdetail__lead" style={{ margin: 0 }}>
              Chưa có dòng đặt hàng.
            </p>
          ) : (
            <div className="th-prod-table-shell">
              <table className="th-prod-data-table">
                <thead>
                  <tr>
                    <th scope="col">Mã hàng</th>
                    <th scope="col">Sản phẩm</th>
                    <th scope="col" className="th-prod-data-table__num">
                      SL
                    </th>
                    <th scope="col" className="th-prod-data-table__num">
                      Đơn giá
                    </th>
                    <th scope="col" className="th-prod-data-table__num">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <code>{line.productSku}</code>
                      </td>
                      <td>
                        {line.productName}
                        {line.customName ? (
                          <span className="th-prod-tdetail__line-note"> ({line.customName})</span>
                        ) : null}
                      </td>
                      <td className="th-prod-data-table__num">{line.quantity}</td>
                      <td className="th-prod-data-table__num">{formatVND(line.unitPrice)}</td>
                      <td className="th-prod-data-table__num">{formatVND(line.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="th-prod-tdetail__card th-prod-tdetail__card--wide" aria-labelledby="td-api-bom">
          <h2 id="td-api-bom" className="th-prod-tdetail__card-title">
            BOM vật tư
          </h2>
          {bomItems.length === 0 ? (
            <p className="th-prod-tdetail__lead" style={{ margin: 0 }}>
              Chưa có dữ liệu BOM.
            </p>
          ) : (
            <div className="th-prod-table-shell">
              <table className="th-prod-data-table">
                <thead>
                  <tr>
                    <th scope="col">Mã</th>
                    <th scope="col">Vật tư</th>
                    <th scope="col">ĐVT</th>
                    <th scope="col" className="th-prod-data-table__num">
                      SL / 1 TP
                    </th>
                    <th scope="col" className="th-prod-data-table__num">
                      Tổng ({q} TP)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((b) => {
                    const total = b.quantityPerUnit * q
                    return (
                      <tr key={b.materialId}>
                        <td>
                          <code>{b.materialCode}</code>
                        </td>
                        <td>{b.materialName}</td>
                        <td>{b.unit}</td>
                        <td className="th-prod-data-table__num">{b.quantityPerUnit}</td>
                        <td className="th-prod-data-table__num">{total}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
