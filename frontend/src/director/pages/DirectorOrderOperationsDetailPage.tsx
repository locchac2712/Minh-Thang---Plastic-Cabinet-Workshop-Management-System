import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  agencyOrderStatusBadgeClass,
} from '../../admin/partners/AgencyOrderHistoryTable'
import { orderStatusLabelVi } from '../../dashboards/orderStatusLabels'
import { OrderFulfillmentPanel } from '../../shared/productionProgress/OrderFulfillmentPanel'
import { OrderWastePanel } from '../../shared/productionProgress/OrderWastePanel'
import { OrderProductionTaskTimeline } from '../../shared/productionProgress/OrderProductionTaskTimeline'
import type { OrderProductionTaskDto } from '../../shared/productionProgress/types'
import {
  isOrderOperationsPhase,
  isOrderQuotationPhase,
} from '../../shared/orderPhase'
import {
  DirectorOperationsApiError,
  fetchDirectorOperationsOrder,
  fetchDirectorOrderFulfillment,
  fetchDirectorOrderProductionTasks,
  fetchDirectorOrderWaste,
} from '../directorOperationsApi'
import { directorPaths } from '../config/directorPaths'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorOrderOperationsDetailPage.css'

function formatDateTime(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d.length >= 19 ? d.slice(0, 19) : d
  return noMs.includes('T') ? noMs.replace('T', ' ') : noMs
}

function orderCodeFromOpsDto(d: {
  displayCode?: string | null
  id: string
}): string {
  const code = d.displayCode?.trim()
  return code || d.id
}

/** Chi tiết đơn fulfillment — vận hành SX (read-only) cho Giám đốc. */
export function DirectorOrderOperationsDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [agencyName, setAgencyName] = useState('')
  const [sellerName, setSellerName] = useState('')
  const [orderCode, setOrderCode] = useState('')
  const [sourceDisplayCode, setSourceDisplayCode] = useState<string | null>(null)
  const [headerLoading, setHeaderLoading] = useState(true)
  const [headerError, setHeaderError] = useState<string | null>(null)
  const [headerNotFound, setHeaderNotFound] = useState(false)

  const [fulfillment, setFulfillment] = useState<Awaited<
    ReturnType<typeof fetchDirectorOrderFulfillment>
  > | null>(null)
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false)
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null)

  const [tasks, setTasks] = useState<OrderProductionTaskDto[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const [waste, setWaste] = useState<Awaited<ReturnType<typeof fetchDirectorOrderWaste>> | null>(null)
  const [wasteLoading, setWasteLoading] = useState(false)
  const [wasteError, setWasteError] = useState<string | null>(null)

  const quotationPhase = isOrderQuotationPhase(orderStatus ?? undefined)
  const operationsPhase = isOrderOperationsPhase(orderStatus ?? undefined)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    setHeaderLoading(true)
    setHeaderError(null)
    setHeaderNotFound(false)
    void fetchDirectorOperationsOrder(orderId)
      .then((row) => {
        if (cancelled) return
        setOrderStatus(row.status ?? null)
        setAgencyName(row.agencyName || '—')
        setSellerName(row.createdByName || '—')
        setOrderCode(orderCodeFromOpsDto(row))
        setSourceDisplayCode(row.sourceDisplayCode?.trim() || null)
      })
      .catch((e) => {
        if (cancelled) return
        if (e instanceof DirectorOperationsApiError && e.status === 404) {
          setHeaderNotFound(true)
          setOrderCode(orderId)
        } else {
          setHeaderError(e instanceof Error ? e.message : 'Không tải được thông tin đơn')
        }
      })
      .finally(() => {
        if (!cancelled) setHeaderLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const loadFulfillment = useCallback(async () => {
    if (!orderId || !operationsPhase) return
    setFulfillmentLoading(true)
    setFulfillmentError(null)
    try {
      const data = await fetchDirectorOrderFulfillment(orderId)
      setFulfillment(data)
    } catch (e) {
      setFulfillment(null)
      if (e instanceof DirectorOperationsApiError && e.status === 409) {
        setFulfillmentError(e.message)
      } else {
        setFulfillmentError(e instanceof Error ? e.message : 'Không tải được tiến độ giao hàng')
      }
    } finally {
      setFulfillmentLoading(false)
    }
  }, [orderId, operationsPhase])

  const loadTasks = useCallback(async () => {
    if (!orderId || !operationsPhase) return
    setTasksLoading(true)
    setTasksError(null)
    try {
      const data = await fetchDirectorOrderProductionTasks(orderId)
      setTasks(data)
      setSelectedTaskId((prev) => {
        if (prev && data.some((t) => t.taskId === prev)) return prev
        return data[0]?.taskId ?? null
      })
    } catch (e) {
      setTasks([])
      if (e instanceof DirectorOperationsApiError && e.status === 409) {
        setTasksError(e.message)
      } else {
        setTasksError(e instanceof Error ? e.message : 'Không tải được nhật ký lệnh SX')
      }
    } finally {
      setTasksLoading(false)
    }
  }, [orderId, operationsPhase])

  const loadWaste = useCallback(async () => {
    if (!orderId || !operationsPhase) return
    setWasteLoading(true)
    setWasteError(null)
    try {
      const data = await fetchDirectorOrderWaste(orderId)
      setWaste(data)
    } catch (e) {
      setWaste(null)
      if (e instanceof DirectorOperationsApiError && e.status === 409) {
        setWasteError(e.message)
      } else {
        setWasteError(e instanceof Error ? e.message : 'Không tải được hao phí / hư hỏng NVL')
      }
    } finally {
      setWasteLoading(false)
    }
  }, [orderId, operationsPhase])

  useEffect(() => {
    if (operationsPhase) {
      void loadFulfillment()
      void loadWaste()
      void loadTasks()
    }
  }, [operationsPhase, loadFulfillment, loadWaste, loadTasks])

  const emptyTasksMessage = useMemo(() => {
    const s = (orderStatus ?? '').toLowerCase()
    if (s === 'approved') {
      return 'Đã duyệt — chờ xưởng lập lô sản xuất.'
    }
    return 'Chưa có lệnh sản xuất trên đơn này.'
  }, [orderStatus])

  if (!orderId) {
    return <Navigate to={directorPaths.operations.orders} replace />
  }

  if (!headerLoading && headerNotFound) {
    return (
      <div className="th-director-ops-detail">
        <header className="th-director-ops-detail__header">
          <Link to={directorPaths.operations.orders} className="th-director-ops-detail__back">
            ← Pipeline đơn hàng
          </Link>
          <h1 className="th-director-ops-detail__title">Không tìm thấy đơn hàng</h1>
        </header>
        <div className="th-director-ops-detail__callout" role="status">
          <p>
            Mã <code>{orderCode}</code> không tồn tại hoặc không thuộc tình trạng đơn hàng. Báo giá gốc xem tại
            Phê duyệt.
          </p>
          <Link to={directorPaths.approvals.pricingOrder(orderId)} className="th-director-ops-detail__cta">
            Mở phê duyệt / báo giá
          </Link>
        </div>
      </div>
    )
  }

  if (!headerLoading && quotationPhase) {
    return (
      <div className="th-director-ops-detail">
        <header className="th-director-ops-detail__header">
          <Link to={directorPaths.operations.orders} className="th-director-ops-detail__back">
            ← Pipeline đơn hàng
          </Link>
          <h1 className="th-director-ops-detail__title">Đơn ở giai đoạn báo giá</h1>
        </header>
        <div className="th-director-ops-detail__callout" role="status">
          <p>
            Đơn <code>{orderCode}</code> đang ở giai đoạn báo giá / phê duyệt — không có tiến độ
            sản xuất tại đây.
          </p>
          <Link to={directorPaths.approvals.pricingOrder(orderId)} className="th-director-ops-detail__cta">
            Mở phê duyệt / báo giá
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="th-director-ops-detail">
      <header className="th-director-ops-detail__header">
        <Link to={directorPaths.operations.orders} className="th-director-ops-detail__back">
          ← Pipeline đơn hàng
        </Link>
        <p className="th-director-ops-detail__kicker">Tiến độ vận hành</p>
        <h1 className="th-director-ops-detail__title">
          Đơn <code>{orderCode}</code>
        </h1>
        {headerLoading ? (
          <p className="th-director-ops-detail__muted">Đang tải thông tin đơn…</p>
        ) : headerError ? (
          <p className="th-admin-users__api-error" role="alert">
            {headerError}
          </p>
        ) : (
          <div className="th-director-ops-detail__meta">
            <span>{agencyName}</span>
            <span>NVBH: {sellerName}</span>
            {orderStatus ? (
              <span className={agencyOrderStatusBadgeClass(orderStatus)}>
                {orderStatusLabelVi(orderStatus)}
              </span>
            ) : null}
            {sourceDisplayCode ? (
              <Link
                to={directorPaths.approvals.pricingOrder(sourceDisplayCode)}
                className="th-director-ops-detail__link"
              >
                Báo giá gốc {sourceDisplayCode}
              </Link>
            ) : null}
          </div>
        )}
      </header>

      {operationsPhase ? (
        <section className="th-director-ops-detail__card">
          <h2 className="th-director-ops-detail__section-title">
            <span className="material-symbols-outlined" aria-hidden>
              inventory
            </span>
            Lập lô &amp; giao hàng
          </h2>
          <OrderFulfillmentPanel
            summary={fulfillment}
            loading={fulfillmentLoading}
            error={fulfillmentError}
            onRetry={() => void loadFulfillment()}
            emptyMessage={
              (orderStatus ?? '').toLowerCase() === 'approved'
                ? 'Đã duyệt — chờ xưởng lập lô.'
                : undefined
            }
          />
        </section>
      ) : null}

      {operationsPhase ? (
        <section className="th-director-ops-detail__card">
          <h2 className="th-director-ops-detail__section-title">
            <span className="material-symbols-outlined" aria-hidden>
              delete_forever
            </span>
            Hao phí / hư hỏng NVL
          </h2>
          <OrderWastePanel
            summary={waste}
            loading={wasteLoading}
            error={wasteError}
            onRetry={() => void loadWaste()}
            taskDetailLink={(taskId) => directorPaths.operations.task(taskId)}
          />
        </section>
      ) : null}

      {operationsPhase ? (
        <section className="th-director-ops-detail__card">
          <h2 className="th-director-ops-detail__section-title">
            <span className="material-symbols-outlined" aria-hidden>
              manufacturing
            </span>
            Nhật ký ca làm việc
          </h2>
          {tasksLoading ? (
            <p className="th-director-ops-detail__muted">Đang tải lệnh sản xuất…</p>
          ) : tasksError ? (
            <p className="th-admin-users__api-error" role="alert">
              {tasksError}
            </p>
          ) : tasks.length === 0 ? (
            <p className="th-director-ops-detail__muted">{emptyTasksMessage}</p>
          ) : (
            <OrderProductionTaskTimeline
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
              readOnly
              formatDateTime={formatDateTime}
              taskDetailLink={(taskId) => directorPaths.operations.task(taskId)}
            />
          )}
        </section>
      ) : null}
    </div>
  )
}
