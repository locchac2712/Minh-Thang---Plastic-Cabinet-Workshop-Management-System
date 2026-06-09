import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { sellerPaths } from '../config/sellerPaths'
import { fetchSellerOrderProductionTasks, fetchSellerOrdersRaw, type SellerOrderListDto } from '../sellerOrdersApi'
import { orderProductionTaskRef } from '../../shared/productionProgress/types'
import '../../admin/pages/AdminUsersPage.css'
import './SellerTrackingPage.css'

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return iso
  return new Date(t).toLocaleString('vi-VN')
}

function taskStatusVi(status: string): string {
  if (status === 'Waiting') return 'Chờ làm'
  if (status === 'Doing') return 'Đang làm'
  if (status === 'Done') return 'Hoàn tất'
  return status
}

function displayOrderRef(id: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) ? `${id.slice(0, 8)}…` : id
}

/** Nhật ký tiến độ xưởng — đơn Producing + lệnh sản xuất (API). */
export function SellerTrackingPage() {
  const [orders, setOrders] = useState<SellerOrderListDto[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [activeOrderId, setActiveOrderId] = useState<string>('')

  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Awaited<ReturnType<typeof fetchSellerOrderProductionTasks>>>([])

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const data = await fetchSellerOrdersRaw({ page: 0, size: 100, status: 'Producing' })
      setOrders(data.content)
      if (data.content.length > 0) setActiveOrderId((prev) => prev || data.content[0]!.id)
    } catch (e) {
      setOrders([])
      setOrdersError(e instanceof Error ? e.message : 'Không tải được danh sách đơn đang sản xuất')
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) => o.id.toLowerCase().includes(q) || o.agencyName.toLowerCase().includes(q),
    )
  }, [orders, query])

  useEffect(() => {
    if (filteredOrders.length === 0) return
    if (!filteredOrders.some((o) => o.id === activeOrderId)) {
      setActiveOrderId(filteredOrders[0]!.id)
    }
  }, [filteredOrders, activeOrderId])

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeOrderId) ?? null,
    [orders, activeOrderId],
  )

  const taskCounts = useMemo(() => {
    let waiting = 0
    let doing = 0
    let done = 0
    for (const t of tasks) {
      const s = t.status.toLowerCase()
      if (s === 'waiting') waiting += 1
      else if (s === 'doing') doing += 1
      else if (s === 'done') done += 1
    }
    return { waiting, doing, done, total: tasks.length }
  }, [tasks])

  useEffect(() => {
    if (!activeOrderId) return
    let cancelled = false
    setTasksLoading(true)
    setTasksError(null)
    void (async () => {
      try {
        const data = await fetchSellerOrderProductionTasks(activeOrderId)
        if (!cancelled) setTasks(data)
      } catch (e) {
        if (!cancelled) {
          setTasks([])
          setTasksError(e instanceof Error ? e.message : 'Không tải được lệnh sản xuất')
        }
      } finally {
        if (!cancelled) setTasksLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeOrderId])

  return (
    <div className="th-seller-track">
      <header className="th-seller-track__header">
        <div className="th-seller-track__title-row">
          <span className="material-symbols-outlined th-seller-track__title-icon" aria-hidden>
            precision_manufacturing
          </span>
          <div>
            <h1 className="th-seller-track__title">Theo dõi tiến độ xưởng</h1>
          </div>
        </div>
      </header>

      {ordersError ? (
        <p className="th-admin-users__api-error" role="alert">
          {ordersError}
        </p>
      ) : null}

      <ul className="th-seller-track__stats" aria-label="Tóm tắt nhanh">
        <li className="th-seller-track__stat">
          <span className="th-seller-track__stat-label">Đơn đang SX</span>
          <span className="th-seller-track__stat-value">{orders.length}</span>
          <span className="th-seller-track__stat-hint">Đang sản xuất</span>
        </li>
        <li className="th-seller-track__stat">
          <span className="th-seller-track__stat-label">Khớp tìm kiếm</span>
          <span className="th-seller-track__stat-value">{filteredOrders.length}</span>
          <span className="th-seller-track__stat-hint">Mã đơn / tên đại lý</span>
        </li>
        <li className="th-seller-track__stat">
          <span className="th-seller-track__stat-label">Lệnh (đơn chọn)</span>
          <span className="th-seller-track__stat-value">{taskCounts.total}</span>
          <span className="th-seller-track__stat-hint">
            {taskCounts.total > 0
              ? `Chờ ${taskCounts.waiting} · Làm ${taskCounts.doing} · Xong ${taskCounts.done}`
              : activeOrderId
                ? 'Chưa có lệnh'
                : '—'}
          </span>
        </li>
      </ul>

      <div className="th-seller-track__layout">
        <aside className="th-seller-track__panel th-seller-track__panel--orders" aria-label="Chọn đơn">
          <div className="th-seller-track__panel-head">
            <h2 className="th-seller-track__panel-title">Đơn đang sản xuất</h2>
            <div className="th-seller-track__panel-actions">
              {activeOrder ? (
                <Link
                  to={`${sellerPaths.order(activeOrder.id)}?tab=factory`}
                  className="th-seller-track__link-detail"
                >
                  Chi tiết đơn
                  <span className="material-symbols-outlined" aria-hidden>
                    open_in_new
                  </span>
                </Link>
              ) : null}
            </div>
          </div>
          <div className="th-seller-track__search">
            <label htmlFor="th-seller-track-search" className="th-seller-track__search-label">
              Tìm nhanh
            </label>
            <input
              id="th-seller-track-search"
              type="search"
              className="th-seller-track__search-input"
              placeholder="Mã đơn, tên đại lý…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="th-seller-track__order-body">
            {ordersLoading ? (
              <p className="th-seller-track__empty-panel">Đang tải danh sách đơn…</p>
            ) : filteredOrders.length === 0 ? (
              <p className="th-seller-track__empty-panel">
                {orders.length === 0
                  ? 'Hiện không có đơn ở trạng thái đang sản xuất.'
                  : 'Không có đơn khớp từ khóa. Thử bỏ bớt ký tự tìm kiếm.'}
              </p>
            ) : (
              <ul className="th-seller-track__order-list">
                {filteredOrders.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={`th-seller-track__order-btn${activeOrderId === o.id ? ' is-active' : ''}`}
                      onClick={() => setActiveOrderId(o.id)}
                    >
                      <span className="th-seller-track__order-code">{displayOrderRef(o.id)}</span>
                      <span className="th-seller-track__order-agency">{o.agencyName}</span>
                      <span className="th-seller-track__order-meta">
                        <span className="th-seller-track__order-amount">{formatVND(o.totalPayable)}</span>
                        <span className="th-seller-track__order-date">
                          Giao dự kiến: {o.expectedDeliveryDate || '—'}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <section className="th-seller-track__panel th-seller-track__panel--tasks" aria-label="Lệnh xưởng">
          <div className="th-seller-track__panel-head">
            <h2 className="th-seller-track__panel-title">Lệnh & nhật ký xưởng</h2>
            {taskCounts.total > 0 ? <span className="th-seller-track__badge">{taskCounts.total} lệnh</span> : null}
          </div>
          <div className="th-seller-track__tasks-body">
            {activeOrder ? (
              <div className="th-seller-track__tasks-head">
                <p className="th-seller-track__muted" style={{ margin: 0, flex: '1 1 auto' }}>
                  Đơn <code className="th-seller-track__inline-code">{displayOrderRef(activeOrder.id)}</code> ·{' '}
                  {activeOrder.agencyName}
                </p>
              </div>
            ) : null}

            {tasksError ? (
              <p className="th-admin-users__api-error" role="alert">
                {tasksError}
              </p>
            ) : null}

            {tasksLoading ? (
              <p className="th-seller-track__muted">Đang tải lệnh sản xuất…</p>
            ) : tasks.length === 0 ? (
              <p className="th-seller-track__muted">
                {activeOrderId
                  ? 'Đơn đã vào sản xuất. Xưởng cần tạo lô SX trước khi có tiến độ.'
                  : 'Chọn một đơn ở cột bên trái.'}
              </p>
            ) : (
              <div className="th-seller-track__task-list">
                {tasks.map((t) => (
                  <article key={t.taskId} className="th-seller-track__task-card">
                    <header>
                      <div>
                        <strong>{t.productName || 'Sản phẩm custom'}</strong>
                        <span className="th-seller-track__task-sub">
                          SL: {t.quantity} · Thợ: {t.assignedToName || '—'}
                        </span>
                      </div>
                      <div className="th-seller-track__task-badges">
                        <span
                          className={`th-seller-track__status th-seller-track__status--${t.status.toLowerCase()}`}
                        >
                          {taskStatusVi(t.status)}
                        </span>
                        {t.deliveredAt ? (
                          <span className="th-seller-track__delivery-badge th-seller-track__delivery-badge--done">
                            Đã giao
                          </span>
                        ) : t.status === 'Done' && t.deliverable ? (
                          <span className="th-seller-track__delivery-badge th-seller-track__delivery-badge--pending">
                            Chờ giao
                          </span>
                        ) : null}
                      </div>
                    </header>
                    <p className="th-seller-track__meta">
                      Mã lệnh: <code>{orderProductionTaskRef(t)}</code> · Bắt đầu: {t.startDate || '—'} · Dự kiến xong:{' '}
                      {t.expectedEndDate || '—'} · Hoàn tất: {fmtDateTime(t.completedAt)}
                    </p>
                    {t.status === 'Done' && (t.deliverable || t.deliveredAt) ? (
                      <p className="th-seller-track__muted" style={{ margin: '0.5rem 0 0' }}>
                        <Link to={`${sellerPaths.order(activeOrderId)}?tab=factory`}>
                          Giao lô tại tab Tiến độ xưởng
                        </Link>
                      </p>
                    ) : null}
                    {t.activityLogs.length === 0 ? (
                      <p className="th-seller-track__muted">Chưa có nhật ký tiến độ.</p>
                    ) : (
                      <>
                        <p className="th-seller-track__logs-title">Nhật ký</p>
                        <ol className="th-seller-track__logs">
                          {[...t.activityLogs]
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                            )
                            .map((log) => (
                              <li key={log.id}>
                                <div>
                                  <strong>{log.userName}</strong>
                                  <span>{fmtDateTime(log.createdAt)}</span>
                                </div>
                                <p>{log.description}</p>
                                {log.imageUrl ? (
                                  <a href={log.imageUrl} target="_blank" rel="noreferrer">
                                    Xem ảnh đính kèm
                                  </a>
                                ) : null}
                              </li>
                            ))}
                        </ol>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
