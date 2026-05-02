import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppFilterBar, AppFilterField, AppFilterSelect, AppPagination } from '../../shared/ui/listing'
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
  fetchProductionTasks,
  productionTaskStatusToColumn,
  startProductionTask,
  type ProductionTaskDto,
} from '../productionTasksApi'
import './ProductionBoardPage.css'

type ColumnKey = 'waiting' | 'doing' | 'done'

const COLUMNS: { key: ColumnKey; title: string; hint: string; mod?: string }[] = [
  {
    key: 'waiting',
    title: 'Chờ làm',
    hint: 'Chờ phân công hoặc đủ vật tư',
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

function shortId(id: string): string {
  const x = id.replace(/-/g, '')
  return x.length >= 8 ? x.slice(0, 8) : id.slice(0, 8)
}

function cardsForColumn(tasks: ProductionTaskDto[], col: ColumnKey): ProductionTaskDto[] {
  return tasks.filter((t) => productionTaskStatusToColumn(t.status) === col)
}

function productionTaskDetailPath(t: ProductionTaskDto): string {
  return t.orderId
    ? productionPaths.tasks.byOrderTask(t.id)
    : productionPaths.tasks.internalTask(t.id)
}

/** Bảng công việc ráp tủ — ba cột chờ / đang làm / hoàn thành. */
export function ProductionBoardPage() {
  const navigate = useNavigate()
  const baseId = useId()
  const orderFilterId = `${baseId}-order-filter`
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
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
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Không nhận việc được')
    } finally {
      setAssignSubmitting(false)
    }
  }, [assignTask, me?.id])

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

  const orderOptions = useMemo(() => {
    const seen = new Set<string>()
    const out: { id: string; label: string }[] = []
    for (const t of tasks) {
      if (t.orderId && !seen.has(t.orderId)) {
        seen.add(t.orderId)
        out.push({
          id: t.orderId,
          label: `${shortId(t.orderId)}…`,
        })
      }
    }
    return out.sort((a, b) => a.id.localeCompare(b.id))
  }, [tasks])

  /**
   * Ẩn lệnh của người khác: chỉ hiện lệnh chưa ai nhận + lệnh đã giao cho bạn.
   * (Switch «Chỉ lệnh của tôi» đang tạm ẩn.)
   */
  const filteredTasks = useMemo(() => {
    const list = orderFilter === 'all' ? tasks : tasks.filter((t) => t.orderId === orderFilter)
    const unassigned = (t: ProductionTaskDto) => !t.assignedToId
    if (meLoading) {
      return list.filter(unassigned)
    }
    if (!me?.id) {
      return list.filter(unassigned)
    }
    return list.filter((t) => unassigned(t) || t.assignedToId === me.id)
  }, [tasks, orderFilter, me?.id, meLoading])

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
        workerId={me?.id ?? ''}
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
            <AppFilterSelect
              value={orderFilter}
              onChangeValue={setOrderFilter}
              options={[
                { value: 'all', label: `Tất cả (${loading ? '…' : totalElements} lệnh trang này)` },
                ...orderOptions.map((option) => ({ value: option.id, label: `Đơn ${option.label}` })),
              ]}
            />
          </AppFilterField>
        </AppFilterBar>
        {/*
          Tạm ẩn switch «Chỉ lệnh của tôi» — mặc định: lệnh chưa nhận + lệnh của user (ẩn lệnh thợ khác).
        */}
        <p id={`${orderFilterId}-hint`} className="th-prod-board__toolbar-hint">
          Hiển thị lệnh chưa nhận và lệnh đã giao cho bạn (ẩn lệnh của thợ khác). Đổi trang để xem thêm lệnh.
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
                  {orderFilter === 'all'
                    ? 'Không có lệnh chưa nhận / của bạn ở cột này (sau lọc).'
                    : 'Không có lệnh phù hợp ở cột này cho đơn đã chọn.'}
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
                          <code className="th-prod-card__id-value">{card.id}</code>
                        </dd>
                      </div>
                      <div className="th-prod-card__id-row">
                        <dt className="th-prod-card__id-label">Đơn ID</dt>
                        <dd className="th-prod-card__id-dd">
                          {card.orderId ? (
                            <Link
                              className="th-prod-card__id-link"
                              to={sellerPaths.order(card.orderId)}
                              title="Chi tiết đơn NVBH"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <code className="th-prod-card__id-value">{card.orderId}</code>
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
                    <p className="th-prod-card__assign">
                      {card.assignedToName?.trim()
                        ? `Thợ: ${card.assignedToName}`
                        : 'Chưa phân công'}
                    </p>
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
                      <span className="th-prod-card__due">
                        {card.status === 'Done' && card.completedAt
                          ? `Xong ${card.completedAt.replace('T', ' ').slice(0, 16)}`
                          : card.expectedEndDate
                            ? `Hạn ${card.expectedEndDate}`
                            : card.startDate
                              ? `Bắt đầu ${card.startDate}`
                              : '—'}
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
