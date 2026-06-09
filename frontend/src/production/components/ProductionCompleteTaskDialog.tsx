import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { productionPaths } from '../config/productionPaths'
import { fetchProductionTaskLogs, type ProductionTaskDto } from '../productionTasksApi'
import { productionTaskRef } from '../utils/productionTaskRef'

export type ProductionCompleteTaskDialogProps = {
  open: boolean
  task: ProductionTaskDto | null
  workerFullName: string
  isSubmitting: boolean
  submitError: string | null
  onClose: () => void
  onConfirm: () => void
}

function taskSummary(t: ProductionTaskDto): string {
  if (t.productName?.trim()) return t.productName.trim()
  if (t.customRequirements?.trim()) {
    const c = t.customRequirements.trim()
    return c.length > 100 ? `${c.slice(0, 97)}…` : c
  }
  return 'Lệnh sản xuất'
}

export function ProductionCompleteTaskDialog({
  open,
  task,
  workerFullName,
  isSubmitting,
  submitError,
  onClose,
  onConfirm,
}: ProductionCompleteTaskDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [logsChecking, setLogsChecking] = useState(false)
  const [logCount, setLogCount] = useState<number | null>(null)
  const [logsCheckError, setLogsCheckError] = useState<string | null>(null)

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open && task) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open, task])

  useEffect(() => {
    if (!open || !task?.id) {
      setLogsChecking(false)
      setLogCount(null)
      setLogsCheckError(null)
      return
    }
    let cancelled = false
    setLogsChecking(true)
    setLogCount(null)
    setLogsCheckError(null)
    void fetchProductionTaskLogs(task.id)
      .then((logs) => {
        if (!cancelled) {
          setLogCount(logs.length)
          setLogsChecking(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLogsCheckError(e instanceof Error ? e.message : 'Không kiểm tra được nhật ký')
          setLogsChecking(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, task?.id])

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

  const hasRequiredLog = logCount != null && logCount >= 1
  const canConfirm = hasRequiredLog && !logsChecking && !logsCheckError && !isSubmitting

  const show = open && task

  return (
    <dialog
      ref={dlgRef}
      className="th-dlg"
      aria-labelledby={titleId}
      aria-modal="true"
      onClose={handleClose}
      onClick={(e) => {
        if (e.target === dlgRef.current) handleClose()
      }}
    >
      {show ? (
        <div className="th-dlg__panel th-admin-users" onClick={(e) => e.stopPropagation()}>
          <header className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                task_alt
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Hoàn tất lệnh sản xuất
            </h2>
            <button
              type="button"
              className="th-dlg__close"
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </header>
          <div className="th-dlg__body th-prod-dlg-body">
            <p className="th-prod-dlg-lead">
              <strong>Mã lệnh:</strong> <code>{productionTaskRef(task)}</code>
            </p>
            <p className="th-prod-dlg-text">
              <strong>Nội dung:</strong> {taskSummary(task)}
            </p>
            <p className="th-prod-dlg-text">
              Xác nhận hoàn tất lệnh với tư cách <strong>{workerFullName || '—'}</strong>. Hệ thống sẽ chuyển trạng thái sang{' '}
              <strong>đã hoàn tất</strong> và ghi nhận thời điểm hoàn tất.
            </p>
            {logsChecking ? (
              <p className="th-prod-dlg-text" role="status">
                Đang kiểm tra nhật ký làm việc…
              </p>
            ) : null}
            {logsCheckError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                {logsCheckError}
              </p>
            ) : null}
            {!logsChecking && !logsCheckError && logCount != null && logCount < 1 ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                Cần ít nhất một nhật ký làm việc của lệnh này trước khi hoàn tất.{' '}
                <Link
                  to={productionPaths.activity}
                  state={{ preselectTaskId: task.id }}
                  onClick={handleClose}
                >
                  Ghi nhật ký tại Nhật ký làm việc
                </Link>
              </p>
            ) : null}
            {!logsChecking && !logsCheckError && hasRequiredLog ? (
              <p className="th-prod-dlg-text" role="status">
                Đã có {logCount} nhật ký làm việc — có thể hoàn tất lệnh.
              </p>
            ) : null}
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                {submitError}
              </p>
            ) : null}
          </div>
          <div className="th-dlg__footer">
            <button type="button" className="th-admin-users__btn-ghost" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-users__btn-primary"
              onClick={onConfirm}
              disabled={!canConfirm}
              title={
                !hasRequiredLog && logCount != null
                  ? 'Cần ít nhất một nhật ký làm việc'
                  : undefined
              }
            >
              <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
                check_circle
              </span>
              {isSubmitting ? 'Đang gửi…' : 'Xác nhận hoàn tất'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
