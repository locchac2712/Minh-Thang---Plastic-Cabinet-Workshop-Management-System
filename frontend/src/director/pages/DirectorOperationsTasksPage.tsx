import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  productionTaskStatusToColumn,
  type ProductionTaskDto,
} from '../../production/productionTasksApi'
import { formatTaskDueCell, isTaskDueOverdue } from '../../production/utils/productionTaskDue'
import { directorPaths } from '../config/directorPaths'
import { fetchDirectorOperationTasks, orderRefFromProductionTask, taskRefFromProductionTask } from '../directorOperationsApi'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorOperationsTasksPage.css'

type StatusTab = 'Waiting' | 'Doing' | 'Done' | 'all'

const STATUS_TABS: { id: StatusTab; label: string; statusParam?: string }[] = [
  { id: 'Waiting', label: 'Chờ làm', statusParam: 'Waiting' },
  { id: 'Doing', label: 'Đang làm', statusParam: 'Doing' },
  { id: 'Done', label: 'Hoàn tất', statusParam: 'Done' },
  { id: 'all', label: 'Tất cả' },
]

function taskTitleLine(t: ProductionTaskDto): string {
  if (t.productName?.trim()) return t.productName.trim()
  return 'Lệnh sản xuất'
}

function statusLabel(status: ProductionTaskDto['status']): string {
  const m: Record<ProductionTaskDto['status'], string> = {
    Waiting: 'Chờ làm',
    Doing: 'Đang làm',
    Done: 'Hoàn tất',
  }
  return m[status] ?? status
}

/** Danh sách lệnh SX toàn công ty — read-only cho Giám đốc. */
export function DirectorOperationsTasksPage() {
  const [tab, setTab] = useState<StatusTab>('Doing')
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<ProductionTaskDto[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const statusParam = STATUS_TABS.find((t) => t.id === tab)?.statusParam

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchDirectorOperationTasks({
        page,
        size: 20,
        status: statusParam,
      })
      setRows(res.content)
      setTotalPages(res.totalPages)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setError(e instanceof Error ? e.message : 'Không tải được danh sách lệnh')
    } finally {
      setLoading(false)
    }
  }, [page, statusParam])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(0)
  }, [tab])

  return (
    <div className="th-director-ops-tasks">
      <header className="th-director-ops-tasks__header">
        <p className="th-director-ops-tasks__period">
          <span className="material-symbols-outlined" aria-hidden>
            manufacturing
          </span>
          Điều hành sản xuất
        </p>
        <h1 className="th-director-ops-tasks__title">Lệnh đang chạy</h1>
      </header>

      <div className="th-director-ops-tasks__tabs" role="tablist">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={
              tab === t.id
                ? 'th-director-ops-tasks__tab th-director-ops-tasks__tab--active'
                : 'th-director-ops-tasks__tab'
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="th-admin-users__api-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="th-director-ops-tasks__table-wrap">
        {loading ? <p className="th-director-ops-tasks__hint">Đang tải…</p> : null}
        <table className="th-director-ops-tasks__table">
          <thead>
            <tr>
              <th scope="col">Lệnh</th>
              <th scope="col">Đơn / Khách</th>
              <th scope="col">Sản phẩm</th>
              <th scope="col">SL</th>
              <th scope="col">PIC</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Hạn</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="th-director-ops-tasks__empty">
                  Không có lệnh phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const orderRef = orderRefFromProductionTask(row)
                const taskRef = taskRefFromProductionTask(row)
                return (
                <tr
                  key={row.id}
                  className={isTaskDueOverdue(row) ? 'th-director-ops-tasks__row--late' : undefined}
                >
                  <td>
                    <Link
                      to={directorPaths.operations.task(taskRef)}
                      className="th-director-ops-tasks__link"
                    >
                      {taskRef}
                    </Link>
                  </td>
                  <td>
                    {orderRef ? (
                      <>
                        <Link
                          to={directorPaths.operations.order(orderRef)}
                          className="th-director-ops-tasks__link"
                        >
                          {orderRef}
                        </Link>
                        {row.orderAgencyName ? (
                          <span className="th-director-ops-tasks__sub">{row.orderAgencyName}</span>
                        ) : null}
                      </>
                    ) : (
                      <span className="th-director-ops-tasks__sub">Dự trữ / nội bộ</span>
                    )}
                  </td>
                  <td>{taskTitleLine(row)}</td>
                  <td className="th-director-ops-tasks__num">{row.quantity}</td>
                  <td>{row.assignedToName?.trim() || '—'}</td>
                  <td>
                    <span
                      className={`th-director-ops-tasks__pill th-director-ops-tasks__pill--${productionTaskStatusToColumn(row.status)}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td>{formatTaskDueCell(row)}</td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="th-director-ops-tasks__pager">
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
