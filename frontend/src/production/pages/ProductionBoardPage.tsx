import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { App } from 'antd'
import { AppFilterBar, AppFilterField, AppPagination } from '../../shared/ui/listing'
import { ProductionBoardOrderFilter } from '../components/ProductionBoardOrderFilter'
import { fetchMeProfile } from '../../auth/authApi'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { sellerPaths } from '../../seller/config/sellerPaths'
import { productionPaths } from '../config/productionPaths'
import { ProductionAssignTaskDialog } from '../components/ProductionAssignTaskDialog'
import { ProductionCompleteTaskDialog } from '../components/ProductionCompleteTaskDialog'
import { ProductionStartTaskDialog } from '../components/ProductionStartTaskDialog'
import {
  assignProductionTask,
  completeProductionTask,
  fetchProductionTaskLogs,
  fetchProductionTasks,
  productionTaskStatusToColumn,
  startProductionTask,
  type ProductionTaskDto,
} from '../productionTasksApi'
import { formatTaskDueFootLabel, isTaskDueOverdue } from '../utils/productionTaskDue'
import { productionOrderRef, isProductionBoardTask } from '../utils/productionOrderRef'
import { productionTaskRef } from '../utils/productionTaskRef'
import './ProductionBoardPage.css'

type ColumnKey = 'waiting' | 'doing' | 'done'

type TaskScope = 'personal' | 'all'

const COLUMNS: { key: ColumnKey; title: string; hint: string; mod?: string }[] = [
  {
    key: 'waiting',
    title: 'Chờ làm',
    hint: 'Chờ phân công hoặc đủ vật tư',
    mod: 'th-prod-column--waiting',
  },
  {
    key: 'doing',
    title: 'Đang làm',
    hint: 'Đang thi công tại tổ',
    mod: 'th-prod-column--doing',
  },
  {
    key: 'done',
    title: 'Hoàn thành',
    hint: 'Đã hoàn tất',
    mod: 'th-prod-column--done',
  },
]

function taskTitleLine(t: ProductionTaskDto): string {
  if (t.productName?.trim()) return t.productName.trim()
  if (t.customRequirements?.trim()) {
    const c = t.customRequirements.trim()
    return c.length > 120 ? `${c.slice(0, 117)}…` : c
  }
  return 'Lệnh sản xuất'
}

function cardsForColumn(tasks: ProductionTaskDto[], col: ColumnKey): ProductionTaskDto[] {
  return tasks.filter((t) => productionTaskStatusToColumn(t.status) === col)
}

function productionTaskDetailPath(t: ProductionTaskDto): string {
  const ref = productionTaskRef(t)
  return t.orderId
    ? productionPaths.tasks.byOrderTask(ref)
    : productionPaths.tasks.internalTask(ref)
}

/** Bảng công việc ráp tủ — ba cột chờ / đang làm / hoàn thành. */
export function ProductionBoardPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const baseId = useId()
  const orderFilterId = `${baseId}-order-filter`
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [taskScope, setTaskScope] = useState<TaskScope>('personal')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(100)
  const [tasks, setTasks] = useState<ProductionTaskDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [me, setMe] = useState<{ id: string; fullName: string } | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [meError, setMeError] = useState<string | null>(null)

  const [assignTask, setAssignTask] = useState<ProductionTaskDto | null>(null)
  const [assignSubmitting, setAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [startTask, setStartTask] = useState<ProductionTaskDto | null>(null)
  const [startSubmitting, setStartSubmitting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [completeTask, setCompleteTask] = useState<ProductionTaskDto | null>(null)
  const [completeSubmitting, setCompleteSubmitting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const actionBusy = assignSubmitting || startSubmitting || completeSubmitting

  useEffect(() => {
    let cancelled = false
    setMeLoading(true)
    void (async () => {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) {
          setMe(null)
          setMeError('Chưa đăng nhập')
          setMeLoading(false)
        }
        return
      }
      try {
        const data = await fetchMeProfile({ accessToken: token, tokenType: getTokenType() })
        if (!cancelled) {
          setMe({ id: data.id, fullName: data.fullName })
          setMeError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setMe(null)
          setMeError(e instanceof Error ? e.message : 'Không lấy được hồ sơ (/me)')
        }
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleAssignConfirm = useCallback(async () => {
    if (!assignTask || !me?.id) return
    setAssignSubmitting(true)
    setAssignError(null)
    try {
      const updated = await assignProductionTask(assignTask.id, me.id)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setAssignTask(null)
      message.success('Đã nhận việc')
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Không nhận việc được')
    } finally {
      setAssignSubmitting(false)
    }
  }, [assignTask, me?.id, message])

  const handleStartConfirm = useCallback(async () => {
    if (!startTask) return
    setStartSubmitting(true)
    setStartError(null)
    try {
      const updated = await startProductionTask(startTask.id)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setStartTask(null)
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Không bắt đầu được lệnh')
    } finally {
      setStartSubmitting(false)
    }
  }, [startTask])

  const handleCompleteConfirm = useCallback(async () => {
    if (!completeTask) return
    setCompleteSubmitting(true)
    setCompleteError(null)
    try {
      const logs = await fetchProductionTaskLogs(completeTask.id)
      if (logs.length < 1) {
        setCompleteError(
          'Cần ít nhất một nhật ký làm việc của lệnh trước khi hoàn tất.',
        )
        return
      }
      const updated = await completeProductionTask(completeTask.id)
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setCompleteTask(null)
    } catch (e) {
      setCompleteError(e instanceof Error ? e.message : 'Không hoàn tất được lệnh')
    } finally {
      setCompleteSubmitting(false)
    }
  }, [completeTask])

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

  const taskOrderHints = useMemo(() => {
    const seen = new Set<string>()
    const out: Array<{
      orderId: string
      orderDisplayCode?: string | null
      agencyName?: string | null
    }> = []
    for (const t of tasks) {
      if (!t.orderId || !isProductionBoardTask(t) || seen.has(t.orderId)) continue
      seen.add(t.orderId)
      out.push({
        orderId: t.orderId,
        orderDisplayCode: t.orderDisplayCode,
        agencyName: t.orderAgencyName,
      })
    }
    return out
  }, [tasks])

  /**
   * Cá nhân: lệnh chưa nhận + lệnh đã giao cho bạn (ẩn lệnh thợ khác).
   * Tất cả: mọi lệnh trên trang hiện tại (sau lọc đơn).
   */
  const filteredTasks = useMemo(() => {
    const fulfillmentTasks = tasks.filter(isProductionBoardTask)
    const list =
      orderFilter === 'all'
        ? fulfillmentTasks
        : fulfillmentTasks.filter((t) => t.orderId === orderFilter)
    if (taskScope === 'all') return list
    const unassigned = (t: ProductionTaskDto) => !t.assignedToId
    if (meLoading) {
      return list.filter(unassigned)
    }
    if (!me?.id) {
      return list.filter(unassigned)
    }
    return list.filter((t) => unassigned(t) || t.assignedToId === me.id)
  }, [tasks, orderFilter, taskScope, me?.id, meLoading])

  const columnCards = useMemo(
    () => ({
      waiting: cardsForColumn(filteredTasks, 'waiting'),
      doing: cardsForColumn(filteredTasks, 'doing'),
      done: cardsForColumn(filteredTasks, 'done'),
    }),
    [filteredTasks],
  )

  return (
    <div className="th-prod-board">
      <ProductionAssignTaskDialog
        open={assignTask !== null}
        task={assignTask}
        workerFullName={me?.fullName ?? ''}
        isSubmitting={assignSubmitting}
        submitError={assignError}
        onClose={() => {
          if (actionBusy) return
          setAssignTask(null)
          setAssignError(null)
        }}
        onConfirm={() => void handleAssignConfirm()}
      />
      <ProductionStartTaskDialog
        open={startTask !== null}
        task={startTask}
        workerFullName={me?.fullName ?? ''}
        isSubmitting={startSubmitting}
        submitError={startError}
        onClose={() => {
          if (actionBusy) return
          setStartTask(null)
          setStartError(null)
        }}
        onConfirm={() => void handleStartConfirm()}
      />
      <ProductionCompleteTaskDialog
        open={completeTask !== null}
        task={completeTask}
        workerFullName={me?.fullName ?? ''}
        isSubmitting={completeSubmitting}
        submitError={completeError}
        onClose={() => {
          if (actionBusy) return
          setCompleteTask(null)
          setCompleteError(null)
        }}
        onConfirm={() => void handleCompleteConfirm()}
      />
      <header className="th-prod-board__header">
        <h1 className="th-prod-board__title">Bảng công việc ráp tủ</h1>
      </header>

      {loadError ? (
        <p className="th-prod-board__error" role="alert">
          {loadError}
        </p>
      ) : null}

      {meError && !loadError ? (
        <p className="th-prod-board__me-warn" role="status">
          Không tải được hồ sơ đăng nhập: {meError} — nút &quot;Nhận việc&quot; tạm khóa.
        </p>
      ) : null}

      <div className="th-prod-board__toolbar">
        <AppFilterBar>
          <AppFilterField label="Đơn hàng" className="th-prod-board__filter">
            <ProductionBoardOrderFilter
              className="th-prod-board__order-select"
              value={orderFilter}
              onChangeValue={setOrderFilter}
              allOptionLabel={`Tất cả (${loading ? '…' : totalElements} lệnh trang này)`}
              taskOrderHints={taskOrderHints}
            />
          </AppFilterField>
          <div className="th-prod-board__toolbar-switch">
            <label className="th-prod-board__switch th-prod-board__switch--scope">
              <span
                className={
                  taskScope === 'personal'
                    ? 'th-prod-board__switch-side th-prod-board__switch-side--active'
                    : 'th-prod-board__switch-side'
                }
              >
                Cá nhân
              </span>
              <input
                type="checkbox"
                className="th-prod-board__switch-input"
                checked={taskScope === 'all'}
                onChange={(e) => setTaskScope(e.target.checked ? 'all' : 'personal')}
                aria-controls={`${orderFilterId}-hint`}
              />
              <span className="th-prod-board__switch-track" aria-hidden />
              <span
                className={
                  taskScope === 'all'
                    ? 'th-prod-board__switch-side th-prod-board__switch-side--active'
                    : 'th-prod-board__switch-side'
                }
              >
                Tất cả
              </span>
            </label>
          </div>
        </AppFilterBar>
        <p id={`${orderFilterId}-hint`} className="th-prod-board__toolbar-hint">
          {taskScope === 'personal'
            ? 'Lệnh chưa nhận + lệnh của bạn.'
            : 'Mọi lệnh trang này; thao tác chỉ trên lệnh của bạn.'}
        </p>
      </div>

      {loading ? (
        <p className="th-prod-board__loading">Đang tải công việc…</p>
      ) : null}

      <div className="th-prod-board__columns" role="region" aria-label="Bảng công việc ráp tủ" aria-busy={loading}>
        {COLUMNS.map((col) => (
          <section
            key={col.key}
            className={`th-prod-column ${col.mod ?? ''}`.trim()}
            aria-labelledby={`${baseId}-col-${col.key}`}
            role="list"
          >
            <h2 id={`${baseId}-col-${col.key}`} className="th-prod-column__title">
              {col.title}
              <span className="th-prod-column__count" aria-hidden="true">
                {columnCards[col.key].length}
              </span>
            </h2>
            <p className="th-prod-column__hint">{col.hint}</p>
            <div className="th-prod-column__drop" role="presentation">
              {columnCards[col.key].length === 0 ? (
                <p className="th-prod-column__empty">
                  {taskScope === 'personal'
                    ? orderFilter === 'all'
                      ? 'Không có lệnh chưa nhận / của bạn ở cột này (sau lọc).'
                      : 'Không có lệnh phù hợp ở cột này cho đơn đã chọn.'
                    : orderFilter === 'all'
                      ? 'Không có lệnh ở cột này trên trang hiện tại.'
                      : 'Không có lệnh ở cột này cho đơn đã chọn.'}
                </p>
              ) : (
                columnCards[col.key].map((card) => (
                  <article
                    key={card.id}
                    className="th-prod-card th-prod-card--clickable"
                    role="listitem"
                    tabIndex={0}
                    title="Mở chi tiết lệnh"
                    onClick={() => navigate(productionTaskDetailPath(card))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(productionTaskDetailPath(card))
                      }
                    }}
                  >
                    <div className="th-prod-card__top">
                      <span className="th-prod-card__task" aria-hidden>
                        Lệnh SX
                      </span>
                      {card.orderType ? (
                        <span className="th-prod-card__type">{card.orderType}</span>
                      ) : null}
                    </div>
                    <dl className="th-prod-card__ids">
                      <div className="th-prod-card__id-row">
                        <dt className="th-prod-card__id-label">Mã lệnh</dt>
                        <dd className="th-prod-card__id-dd">
                          <code className="th-prod-card__id-value">{productionTaskRef(card)}</code>
                        </dd>
                      </div>
                      <div className="th-prod-card__id-row">
                        <dt className="th-prod-card__id-label">Mã đơn</dt>
                        <dd className="th-prod-card__id-dd">
                          {card.orderId ? (
                            <Link
                              className="th-prod-card__id-link"
                              to={sellerPaths.order(card.orderId)}
                              title="Chi tiết đơn NVBH"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <code className="th-prod-card__id-value">
                                {productionOrderRef(card.orderId, card.orderDisplayCode)}
                              </code>
                            </Link>
                          ) : (
                            <span className="th-prod-card__id-none">— (dự trữ / nội bộ)</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                    <p className="th-prod-card__summary">{taskTitleLine(card)}</p>
                    <div className="th-prod-card__meta">
                      <span className="th-prod-card__agency">SL {card.quantity}</span>
                    </div>
                    {!card.assignedToId ? (
                      <span className="th-prod-card__claim-badge">Chưa nhận việc</span>
                    ) : (
                      <p className="th-prod-card__assign">Thợ phụ trách: {card.assignedToName?.trim() || '—'}</p>
                    )}
                    {card.deliverable ? (
                      <p className="th-prod-card__assign" style={{ color: '#b45309' }}>
                        Chờ Seller giao lô
                      </p>
                    ) : null}
                    {!card.assignedToId ? (
                      <div
                        className="th-prod-card__actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="th-prod-card__claim"
                          disabled={loading || meLoading || !me?.id || actionBusy}
                          onClick={() => {
                            setAssignError(null)
                            setAssignTask(card)
                          }}
                          title={
                            meLoading
                              ? 'Đang tải hồ sơ…'
                              : !me?.id
                                ? meError ?? 'Chưa có mã người dùng'
                                : 'Nhận lệnh về cho bạn'
                          }
                        >
                          Nhận việc
                        </button>
                      </div>
                    ) : card.status === 'Waiting' && card.assignedToId === me?.id ? (
                      <div
                        className="th-prod-card__actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="th-prod-card__start"
                          disabled={loading || meLoading || actionBusy}
                          onClick={() => {
                            setStartError(null)
                            setStartTask(card)
                          }}
                          title="Bắt đầu làm — chuyển sang đang làm"
                        >
                          Bắt đầu làm
                        </button>
                      </div>
                    ) : card.status === 'Doing' && card.assignedToId === me?.id ? (
                      <div
                        className="th-prod-card__actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="th-prod-card__complete"
                          disabled={loading || meLoading || actionBusy}
                          onClick={() => {
                            setCompleteError(null)
                            setCompleteTask(card)
                          }}
                          title="Hoàn tất — chuyển sang đã xong"
                        >
                          Hoàn tất
                        </button>
                      </div>
                    ) : null}
                    <div className="th-prod-card__foot">
                      <span
                        className={
                          isTaskDueOverdue(card)
                            ? 'th-prod-card__due th-prod-card__due--overdue'
                            : 'th-prod-card__due'
                        }
                      >
                        {formatTaskDueFootLabel(card)}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-prod-board__pager"
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
