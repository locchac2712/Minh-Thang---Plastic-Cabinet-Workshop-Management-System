import { useEffect, useId, useRef } from 'react'
import type { ProductionTaskDto } from '../productionTasksApi'

export type ProductionStartTaskDialogProps = {
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

export function ProductionStartTaskDialog({
  open,
  task,
  workerFullName,
  isSubmitting,
  submitError,
  onClose,
  onConfirm,
}: ProductionStartTaskDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open && task) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open, task])

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

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
                play_circle
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Bắt đầu làm lệnh
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
              <strong>Mã lệnh:</strong> <code>{task.id}</code>
            </p>
            <p className="th-prod-dlg-text">
              <strong>Nội dung:</strong> {taskSummary(task)}
            </p>
            <p className="th-prod-dlg-text">
              Xác nhận bắt đầu thi công với tư cách <strong>{workerFullName || '—'}</strong>. Trạng thái chuyển sang{' '}
              <strong>Doing</strong> và hệ thống ghi nhận ngày bắt đầu (PATCH <code>/start</code>).
            </p>
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
            <button type="button" className="th-admin-users__btn-primary" onClick={onConfirm} disabled={isSubmitting}>
              <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
                play_arrow
              </span>
              {isSubmitting ? 'Đang gửi…' : 'Xác nhận bắt đầu'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
