import { App } from 'antd'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sellerOrderKindLabel } from '../../seller/data/sellerOrdersMock'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { ProductionCreateBatchPanel } from '../components/ProductionCreateBatchPanel'
import { productionPaths } from '../config/productionPaths'
import { floorColumnLabel, type ProductionFloorColumn } from '../data/productionTasksByOrderMock'
import {
  fetchProductionOrders,
  fetchProductionOrderTasks,
  type ProductionOrderQueueItemDto,
} from '../productionOrdersApi'
import {
  fetchProductionTasks,
  productionTaskStatusToColumn,
  type ProductionTaskDto,
} from '../productionTasksApi'
import { formatTaskDueCell, isTaskDueOverdue } from '../utils/productionTaskDue'
import { productionOrderRef } from '../utils/productionOrderRef'
import { productionTaskRef } from '../utils/productionTaskRef'
import './ProductionTasksByOrderPage.css'

type FilterTab = 'all' | ProductionFloorColumn
type QueueTab = 'awaiting' | 'all'

function matchesFloor(t: ProductionTaskDto, tab: FilterTab): boolean {
  if (tab === 'all') return true
  return productionTaskStatusToColumn(t.status) === tab
}

function taskTitleLine(t: ProductionTaskDto): string {
  if (t.productName?.trim()) return t.productName.trim()
  if (t.customRequirements?.trim()) {
    const c = t.customRequirements.trim()
    return c.length > 120 ? `${c.slice(0, 117)}…` : c
  }
  return 'Lệnh sản xuất'
}

function orderTypeToSellerKind(ot: string | null): 'ready_made' | 'custom' {
  const s = (ot ?? '').toLowerCase()
  if (s.includes('custom')) return 'custom'
  return 'ready_made'
}

export function ProductionTasksByOrderPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const fid = useId()
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [tasks, setTasks] = useState<ProductionTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [orderOpen, setOrderOpen] = useState<Record<string, boolean>>({})
  const [batchDialogOrderId, setBatchDialogOrderId] = useState<string | null>(null)
  const [batchDialogContext, setBatchDialogContext] = useState<ProductionOrderQueueItemDto | null>(
    null,
  )

  const [queueTab, setQueueTab] = useState<QueueTab>('awaiting')
  const [queueOrders, setQueueOrders] = useState<ProductionOrderQueueItemDto[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [queueError, setQueueError] = useState<string | null>(null)
  const [activeOrderId, setActiveOrderId] = useState('')

  const loadQueue = useCallback(async () => {
    setQueueLoading(true)
    setQueueError(null)
    try {
      const data = await fetchProductionOrders({
        status: 'Producing',
        awaitingBatch: queueTab === 'awaiting' ? true : undefined,
        page: 0,
        size: 100,
      })
      setQueueOrders(data.content)
      if (data.content.length > 0) {
        setActiveOrderId((prev) =>
          prev && data.content.some((o) => o.orderId === prev) ? prev : data.content[0]!.orderId,
        )
      }
    } catch (e) {
      setQueueOrders([])
      setQueueError(e instanceof Error ? e.message : 'Không tải được danh sách đơn')
    } finally {
      setQueueLoading(false)
    }
  }, [queueTab])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (activeOrderId) {
        const data = await fetchProductionOrderTasks(activeOrderId)
        setTasks(data)
        setTotalPages(1)
        setTotalElements(data.length)
      } else {
        const data = await fetchProductionTasks({ page: pageIndex, size: pageSize })
        setTasks(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      }
    } catch (e) {
      setTasks([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [activeOrderId, pageIndex, pageSize])

  useEffect(() => {
    setPageIndex(0)
  }, [activeOrderId])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    void load()
  }, [load])

  const queueById = useMemo(
    () => new Map(queueOrders.map((o) => [o.orderId, o])),
    [queueOrders],
  )

  const orderTasks = useMemo(() => tasks.filter((t) => t.orderId != null && t.orderId !== ''), [tasks])

  const orderDisplayById = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of queueOrders) {
      const code = o.orderDisplayCode?.trim()
      if (code) map.set(o.orderId, code)
    }
    for (const t of orderTasks) {
      const oid = t.orderId?.trim()
      const code = t.orderDisplayCode?.trim()
      if (oid && code) map.set(oid, code)
    }
    return map
  }, [queueOrders, orderTasks])

  const orderRef = useCallback(
    (orderId: string) => productionOrderRef(orderId, orderDisplayById.get(orderId)),
    [orderDisplayById],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orderTasks.filter((t) => {
      if (activeOrderId && t.orderId !== activeOrderId) return false
      if (!matchesFloor(t, filterTab)) return false
      if (!q) return true
      const oid = t.orderId ?? ''
      const display = orderDisplayById.get(oid) ?? ''
      return (
        t.id.toLowerCase().includes(q) ||
        (t.displayCode ?? '').toLowerCase().includes(q) ||
        oid.toLowerCase().includes(q) ||
        display.toLowerCase().includes(q) ||
        (t.productName ?? '').toLowerCase().includes(q) ||
        (t.assignedToName ?? '').toLowerCase().includes(q)
      )
    })
  }, [orderTasks, search, filterTab, activeOrderId, orderDisplayById])

  const taskMapByOrder = useMemo(() => {
    const map = new Map<string, ProductionTaskDto[]>()
    for (const t of filtered) {
      const oid = t.orderId?.trim()
      if (!oid) continue
      const cur = map.get(oid) ?? []
      cur.push(t)
      map.set(oid, cur)
    }
    return map
  }, [filtered])

  const mergedOrderIds = useMemo(() => {
    const ids = new Set<string>()
    if (activeOrderId) {
      ids.add(activeOrderId)
    } else {
      for (const o of queueOrders) ids.add(o.orderId)
      for (const t of filtered) {
        if (t.orderId) ids.add(t.orderId)
      }
    }
    return [...ids].sort()
  }, [activeOrderId, queueOrders, filtered])

  useEffect(() => {
    setOrderOpen((prev) => {
      const next = { ...prev }
      for (const orderId of mergedOrderIds) {
        if (next[orderId] === undefined) next[orderId] = true
      }
      return next
    })
  }, [mergedOrderIds])

  const FILTER_CHIPS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'waiting', label: 'Chờ làm' },
    { id: 'doing', label: 'Đang làm' },
    { id: 'done', label: 'Xong xưởng' },
  ]

  function openRow(t: ProductionTaskDto) {
    navigate(productionPaths.tasks.byOrderTask(productionTaskRef(t)))
  }

  function openBatchDialog(orderId: string, context?: ProductionOrderQueueItemDto | null) {
    setBatchDialogOrderId(orderId)
    setBatchDialogContext(context ?? queueById.get(orderId) ?? null)
  }

  function handleBatchCreated() {
    message.success('Đã tạo lô sản xuất')
    if (batchDialogOrderId) {
      setOrderOpen((prev) => ({ ...prev, [batchDialogOrderId]: true }))
      setActiveOrderId(batchDialogOrderId)
    }
    void loadQueue()
    void load()
  }

  return (
    <div className="th-prod-byorder">
      <ProductionCreateBatchPanel
        open={batchDialogOrderId != null}
        orderId={batchDialogOrderId ?? ''}
        queueContext={batchDialogContext}
        onClose={() => {
          setBatchDialogOrderId(null)
          setBatchDialogContext(null)
        }}
        onCreated={handleBatchCreated}
      />
      <header className="th-prod-byorder__header">
        <h1 className="th-prod-byorder__title">Lệnh theo đơn bán</h1>
        <p className="th-prod-byorder__lead">Chọn đơn đang sản xuất bên trái để tạo lô hoặc xem lệnh.</p>
      </header>

      <div className="th-prod-byorder__layout">
        <aside className="th-prod-byorder__queue" aria-label="Đơn đang sản xuất">
          <div className="th-prod-byorder__queue-head">
            <h2 className="th-prod-byorder__queue-title">Đơn đang SX</h2>
            <div className="th-prod-byorder__queue-tabs">
              <button
                type="button"
                className={
                  queueTab === 'awaiting'
                    ? 'th-prod-byorder__tab th-prod-byorder__tab--active'
                    : 'th-prod-byorder__tab'
                }
                onClick={() => setQueueTab('awaiting')}
              >
                Chờ lập lô
              </button>
              <button
                type="button"
                className={
                  queueTab === 'all'
                    ? 'th-prod-byorder__tab th-prod-byorder__tab--active'
                    : 'th-prod-byorder__tab'
                }
                onClick={() => setQueueTab('all')}
              >
                Tất cả
              </button>
            </div>
          </div>
          {queueError ? (
            <p className="th-prod-byorder__error" role="alert">
              {queueError}
            </p>
          ) : null}
          {queueLoading ? (
            <p className="th-prod-byorder__loading">Đang tải đơn…</p>
          ) : queueOrders.length === 0 ? (
            <p className="th-prod-byorder__tree-empty">
              {queueTab === 'awaiting'
                ? 'Không có đơn chờ lập lô.'
                : 'Không có đơn đang sản xuất.'}
            </p>
          ) : (
            <ul className="th-prod-byorder__queue-list">
              {queueOrders.map((o) => (
                <li key={o.orderId}>
                  <button
                    type="button"
                    className={`th-prod-byorder__queue-btn${activeOrderId === o.orderId ? ' is-active' : ''}`}
                    onClick={() => setActiveOrderId(o.orderId)}
                  >
                    <span className="th-prod-byorder__queue-code">{orderRef(o.orderId)}</span>
                    <span className="th-prod-byorder__queue-agency">{o.agencyName}</span>
                    <span className="th-prod-byorder__queue-meta">
                      Còn lập: {o.remainingBatchableTotal} · {o.taskCount} lệnh
                    </span>
                  </button>
                  <button
                    type="button"
                    className="th-prod-byorder__queue-create"
                    onClick={() => openBatchDialog(o.orderId, o)}
                  >
                    Tạo lô
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="th-prod-byorder__main" aria-label="Lệnh theo đơn">
          {loadError ? (
            <p className="th-prod-byorder__error" role="alert">
              {loadError}
            </p>
          ) : null}

          <div className="th-prod-byorder__toolbar">
            <div className="th-prod-byorder__tabs" role="tablist" aria-label="Cột xưởng">
              {FILTER_CHIPS.map((c) => {
                const active = filterTab === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={
                      active ? 'th-prod-byorder__tab th-prod-byorder__tab--active' : 'th-prod-byorder__tab'
                    }
                    onClick={() => setFilterTab(c.id)}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
            <AppFilterBar className="th-prod-byorder__search">
              <AppFilterField search>
                <AppFilterInput
                  id={`${fid}-search`}
                  placeholder="Mã lệnh, sản phẩm, thợ…"
                  value={search}
                  onChangeValue={setSearch}
                  autoComplete="off"
                />
              </AppFilterField>
            </AppFilterBar>
          </div>

          {loading ? <p className="th-prod-byorder__loading">Đang tải lệnh…</p> : null}

          <div className="th-prod-byorder__tree-wrap" aria-busy={loading}>
            {!loading && mergedOrderIds.length === 0 ? (
              <div className="th-prod-byorder__tree-empty">
                Chọn một đơn bên trái để tạo lô hoặc xem lệnh.
              </div>
            ) : null}

            {!loading && mergedOrderIds.length > 0 ? (
              <div className="th-prod-byorder-tree">
                {mergedOrderIds.map((orderId) => {
                  const groupTasks = taskMapByOrder.get(orderId) ?? []
                  const queueItem = queueById.get(orderId)
                  const head = groupTasks[0]
                  const headKind = head ? orderTypeToSellerKind(head.orderType) : 'ready_made'
                  return (
                    <details
                      key={orderId}
                      className="th-prod-byorder-order"
                      open={orderOpen[orderId] ?? true}
                      onToggle={(e) => {
                        const el = e.currentTarget
                        setOrderOpen((prev) => ({ ...prev, [orderId]: el.open }))
                      }}
                    >
                      <summary className="th-prod-byorder-order__summary">
                        <span className="th-prod-byorder-order__summary-text">
                          <span className="th-prod-byorder-order__label">Đơn hàng</span>
                          <code className="th-prod-byorder-order__order-id">{orderRef(orderId)}</code>
                          {queueItem ? (
                            <span className="th-prod-byorder-order__agency">{queueItem.agencyName}</span>
                          ) : null}
                        </span>
                        <span className="th-prod-byorder-order__meta">
                          <button
                            type="button"
                            className="th-prod-byorder__tab th-prod-byorder__tab--active"
                            style={{ marginRight: '0.5rem' }}
                            onClick={(e) => {
                              e.preventDefault()
                              openBatchDialog(orderId, queueItem ?? null)
                            }}
                          >
                            Tạo lô
                          </button>
                          <span className="th-prod-byorder-order__badge">{groupTasks.length} lệnh SX</span>
                          {queueItem ? (
                            <span className="th-prod-byorder-order__remaining">
                              Còn lập {queueItem.remainingBatchableTotal}
                            </span>
                          ) : null}
                          {head ? (
                            <span
                              className={
                                headKind === 'custom'
                                  ? 'th-prod-byorder__kind th-prod-byorder__kind--custom th-prod-byorder-order__kind'
                                  : 'th-prod-byorder__kind th-prod-byorder-order__kind'
                              }
                            >
                              {sellerOrderKindLabel(headKind)}
                            </span>
                          ) : null}
                        </span>
                      </summary>
                      <div className="th-prod-byorder-order__body">
                        {groupTasks.length === 0 ? (
                          <p className="th-prod-byorder__tree-empty" style={{ padding: '0.75rem 1rem' }}>
                            Chưa có lô — bấm «Tạo lô» để mở lệnh sản xuất.
                          </p>
                        ) : (
                          <div className="th-prod-byorder-order__table-scroll">
                            <table className="th-prod-data-table th-prod-data-table--nested">
                              <thead>
                                <tr>
                                  <th scope="col">Lệnh SX</th>
                                  <th scope="col">Cột xưởng</th>
                                  <th scope="col">Thợ phụ trách</th>
                                  <th scope="col" className="th-prod-data-table__col-date">
                                    Hạn giao
                                  </th>
                                  <th scope="col" className="th-prod-data-table__col-num">
                                    SL
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {groupTasks.map((t) => {
                                  const floor = productionTaskStatusToColumn(t.status)
                                  return (
                                    <tr
                                      key={t.id}
                                      className="th-prod-data-table__row"
                                      tabIndex={0}
                                      role="link"
                                      title="Mở chi tiết lệnh"
                                      onClick={() => openRow(t)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault()
                                          openRow(t)
                                        }
                                      }}
                                    >
                                      <td>
                                        <code className="th-prod-byorder__code">{productionTaskRef(t)}</code>
                                        <div className="th-prod-data-table__summary">{taskTitleLine(t)}</div>
                                      </td>
                                      <td>
                                        <span
                                          className={`th-prod-byorder__floor th-prod-byorder__floor--${floor}`}
                                        >
                                          {floorColumnLabel(floor)}
                                        </span>
                                      </td>
                                      <td className="th-prod-data-table__muted">
                                        {t.assignedToName?.trim() ? t.assignedToName : '—'}
                                      </td>
                                      <td
                                        className={
                                          isTaskDueOverdue(t)
                                            ? 'th-prod-data-table__date th-prod-due--overdue'
                                            : 'th-prod-data-table__date'
                                        }
                                      >
                                        {formatTaskDueCell(t)}
                                      </td>
                                      <td className="th-prod-data-table__money">{t.quantity}</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            ) : null}
          </div>

          {totalPages > 1 && !activeOrderId ? (
            <AppPagination
              className="th-prod-byorder__pager"
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalElements}
              simple
              showSizeChanger={false}
              onPageIndexChange={setPageIndex}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}
