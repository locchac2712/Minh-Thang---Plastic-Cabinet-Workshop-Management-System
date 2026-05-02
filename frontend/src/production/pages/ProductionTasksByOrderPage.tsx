import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sellerOrderKindLabel } from '../../seller/data/sellerOrdersMock'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { productionPaths } from '../config/productionPaths'
import { floorColumnLabel, type ProductionFloorColumn } from '../data/productionTasksByOrderMock'
import {
  fetchProductionTasks,
  productionTaskStatusToColumn,
  type ProductionTaskDto,
} from '../productionTasksApi'
import './ProductionTasksByOrderPage.css'

type FilterTab = 'all' | ProductionFloorColumn

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

function formatDue(iso: string | null): string {
  if (!iso?.trim()) return '—'
  const d = iso.trim()
  return d.length >= 10 ? d.slice(0, 10) : d
}

/**
 * Lệnh sản xuất gắn đơn bán — GET /api/production/tasks, chỉ task có orderId (Make-to-Order).
 */
export function ProductionTasksByOrderPage() {
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
  /** Mở/đóng từng đơn trong cây (mặc định mở khi có dữ liệu nhóm mới). */
  const [orderOpen, setOrderOpen] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionTasks({ page: pageIndex, size: pageSize })
      setTasks(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (e) {
      setTasks([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const orderTasks = useMemo(() => tasks.filter((t) => t.orderId != null && t.orderId !== ''), [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orderTasks.filter((t) => {
      if (!matchesFloor(t, filterTab)) return false
      if (!q) return true
      const oid = t.orderId ?? ''
      return (
        t.id.toLowerCase().includes(q) ||
        oid.toLowerCase().includes(q) ||
        (t.productName ?? '').toLowerCase().includes(q) ||
        (t.assignedToName ?? '').toLowerCase().includes(q)
      )
    })
  }, [orderTasks, search, filterTab])

  /** Cây: đơn hàng → các task SX gắn đơn đó (sắp xếp theo mã đơn). */
  const treeByOrder = useMemo(() => {
    const map = new Map<string, ProductionTaskDto[]>()
    for (const t of filtered) {
      const oid = t.orderId?.trim()
      if (!oid) continue
      const cur = map.get(oid) ?? []
      cur.push(t)
      map.set(oid, cur)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([orderId, groupTasks]) => ({ orderId, tasks: groupTasks }))
  }, [filtered])

  useEffect(() => {
    setOrderOpen(Object.fromEntries(treeByOrder.map(({ orderId }) => [orderId, true])))
  }, [treeByOrder])

  const FILTER_CHIPS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'waiting', label: 'Chờ làm' },
    { id: 'doing', label: 'Đang làm' },
    { id: 'done', label: 'Xong xưởng' },
  ]

  function openRow(t: ProductionTaskDto) {
    navigate(productionPaths.tasks.byOrderTask(t.id))
  }

  return (
    <div className="th-prod-byorder">
      <header className="th-prod-byorder__header">
        <h1 className="th-prod-byorder__title">Lệnh theo đơn bán</h1>
      </header>

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
              placeholder="Mã lệnh, đơn, sản phẩm, thợ…"
              value={search}
              onChangeValue={setSearch}
              autoComplete="off"
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-prod-byorder__loading">Đang tải lệnh…</p> : null}

      <div className="th-prod-byorder__tree-wrap" aria-busy={loading}>
        {!loading && filtered.length === 0 ? (
          <div className="th-prod-byorder__tree-empty">
            {orderTasks.length === 0
              ? 'Trang này không có lệnh gắn đơn — thử trang khác hoặc đợi đơn vào xưởng.'
              : 'Không có lệnh khớp bộ lọc.'}
          </div>
        ) : null}

        {!loading && treeByOrder.length > 0 ? (
          <div className="th-prod-byorder-tree">
            {treeByOrder.map(({ orderId, tasks: groupTasks }) => {
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
                      <code className="th-prod-byorder-order__order-id">{orderId}</code>
                    </span>
                    <span className="th-prod-byorder-order__meta">
                      <span className="th-prod-byorder-order__badge">{groupTasks.length} lệnh SX</span>
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
                    <div className="th-prod-byorder-order__table-scroll">
                      <table className="th-prod-data-table th-prod-data-table--nested">
                        <thead>
                          <tr>
                            <th scope="col">Lệnh SX</th>
                            <th scope="col">Cột xưởng</th>
                            <th scope="col">Thợ</th>
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
                                  <code className="th-prod-byorder__code">{t.id}</code>
                                  <div className="th-prod-data-table__summary">{taskTitleLine(t)}</div>
                                </td>
                                <td>
                                  <span className={`th-prod-byorder__floor th-prod-byorder__floor--${floor}`}>
                                    {floorColumnLabel(floor)}
                                  </span>
                                </td>
                                <td className="th-prod-data-table__muted">
                                  {t.assignedToName?.trim() ? t.assignedToName : '—'}
                                </td>
                                <td className="th-prod-data-table__date">{formatDue(t.expectedEndDate)}</td>
                                <td className="th-prod-data-table__money">{t.quantity}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
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
    </div>
  )
}
