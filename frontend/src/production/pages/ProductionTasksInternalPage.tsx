import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { productionPaths } from '../config/productionPaths'
import type { ProductionFloorColumn } from '../data/productionTasksByOrderMock'
import { internalStatusLabel, type ProductionInternalTaskStatus } from '../data/productionTasksInternalMock'
import {
  fetchProductionTasks,
  productionTaskStatusToColumn,
  type ProductionTaskDto,
} from '../productionTasksApi'
import { formatTaskDueCell, isTaskDueOverdue } from '../utils/productionTaskDue'
import { productionTaskRef } from '../utils/productionTaskRef'
import './ProductionTasksInternalPage.css'

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

function isMtsTask(t: ProductionTaskDto): boolean {
  return t.orderId == null || t.orderId === ''
}

function statusClassFromTask(t: ProductionTaskDto): string {
  const col = productionTaskStatusToColumn(t.status)
  if (col === 'done') return 'th-prod-internal__status th-prod-internal__status--done'
  if (col === 'doing') return 'th-prod-internal__status th-prod-internal__status--doing'
  return 'th-prod-internal__status th-prod-internal__status--wait'
}

/**
 * Lệnh tồn kho (MTS) — GET /api/production/tasks, chỉ task không có orderId.
 */
export function ProductionTasksInternalPage() {
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

  const mtsTasks = useMemo(() => tasks.filter(isMtsTask), [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mtsTasks.filter((t) => {
      if (!matchesFloor(t, filterTab)) return false
      if (!q) return true
      const pid = t.productId ?? ''
      return (
        t.id.toLowerCase().includes(q) ||
        (t.displayCode ?? '').toLowerCase().includes(q) ||
        pid.toLowerCase().includes(q) ||
        (t.productName ?? '').toLowerCase().includes(q) ||
        (t.customRequirements ?? '').toLowerCase().includes(q) ||
        (t.assignedToName ?? '').toLowerCase().includes(q) ||
        (t.orderType ?? '').toLowerCase().includes(q)
      )
    })
  }, [mtsTasks, search, filterTab])

  const FILTER_CHIPS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'Tất cả' },
    { id: 'waiting', label: 'Chờ nhận' },
    { id: 'doing', label: 'Đang làm' },
    { id: 'done', label: 'Hoàn tất' },
  ]

  function openRow(t: ProductionTaskDto) {
    navigate(productionPaths.tasks.internalTask(t.id))
  }

  return (
    <div className="th-prod-internal">
      <header className="th-prod-internal__header">
        <h1 className="th-prod-internal__title">Lệnh tồn kho (MTS)</h1>
      </header>

      {loadError ? (
        <p className="th-prod-internal__error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="th-prod-internal__toolbar">
        <div className="th-prod-internal__tabs" role="tablist" aria-label="Trạng thái lệnh">
          {FILTER_CHIPS.map((c) => {
            const active = filterTab === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active ? 'th-prod-internal__tab th-prod-internal__tab--active' : 'th-prod-internal__tab'
                }
                onClick={() => setFilterTab(c.id)}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <AppFilterBar className="th-prod-internal__search">
          <AppFilterField search>
            <AppFilterInput
              id={`${fid}-search`}
              placeholder="Mã lệnh, mã sản phẩm, tên SP, thợ, loại…"
              value={search}
              onChangeValue={setSearch}
              autoComplete="off"
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-prod-internal__loading">Đang tải lệnh…</p> : null}

      <div className="th-prod-table-shell" aria-busy={loading}>
        <table className="th-prod-data-table">
          <thead>
            <tr>
              <th scope="col">Mã lệnh (task)</th>
              <th scope="col">SKU / product</th>
              <th scope="col">Thành phẩm</th>
              <th scope="col" className="th-prod-data-table__col-num">
                SL
              </th>
              <th scope="col">Loại / ghi chú</th>
              <th scope="col">Thợ phụ trách</th>
              <th scope="col">Trạng thái</th>
              <th scope="col" className="th-prod-data-table__col-date">
                Hạn xong
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="th-prod-data-table__empty">
                  {mtsTasks.length === 0
                    ? 'Trang này không có lệnh MTS (không order) — thử trang khác hoặc tạo lệnh từ Giám đốc.'
                    : 'Không có lệnh khớp bộ lọc.'}
                </td>
              </tr>
            ) : null}
            {!loading
              ? filtered.map((t) => {
                  const st = productionTaskStatusToColumn(t.status) as ProductionInternalTaskStatus
                  const purpose = t.orderType?.trim() || 'MTS / nội bộ'
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
                        <code className="th-prod-internal__code th-prod-internal__code--full">{productionTaskRef(t)}</code>
                      </td>
                      <td>
                        <code className="th-prod-internal__sku th-prod-internal__sku--full">
                          {t.productId?.trim() ? t.productId : '—'}
                        </code>
                      </td>
                      <td className="th-prod-data-table__name">{taskTitleLine(t)}</td>
                      <td className="th-prod-data-table__num">{t.quantity}</td>
                      <td>
                        <span className="th-prod-internal__purpose" title={purpose}>
                          {purpose}
                        </span>
                      </td>
                      <td>
                        <span className="th-prod-data-table__worker">
                          {t.assignedToName?.trim() ? t.assignedToName : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={statusClassFromTask(t)}>{internalStatusLabel(st)}</span>
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
                    </tr>
                  )
                })
              : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-prod-internal__pager"
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
