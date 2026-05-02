import { useEffect, useId, useRef } from 'react'
import '../../admin/pages/AdminUsersPage.css'

export type SellerPushProductionDialogProps = {
  open: boolean
  orderCode: string
  contextHint?: string | null
  isSubmitting: boolean
  submitError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function SellerPushProductionDialog({
  open,
  orderCode,
  contextHint,
  isSubmitting,
  submitError,
  onClose,
  onConfirm,
}: SellerPushProductionDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open])

  const handleClose = () => {
    if (isSubmitting) return
    onClose()
  }

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
      {open ? (
        <div
          className="th-dlg__panel th-admin-users"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                precision_manufacturing
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Đẩy xuống kho sản xuất
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
          </div>
          <div className="th-dlg__body">
            <p
              style={{
                margin: 0,
                fontSize: '0.8125rem',
                color: '#64748b',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: '#0f172a' }}>Mã đơn:</strong>{' '}
              <code style={{ fontSize: '0.8rem' }}>{orderCode}</code>
              {contextHint ? (
                <>
                  <br />
                  <span>{contextHint}</span>
                </>
              ) : null}
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              Sau khi xác nhận, đơn chuyển sang trạng thái <strong>Đang sản xuất (Producing)</strong> để
              xưởng và kho tiếp nhận lệnh. Thao tác này thường dùng khi Giám đốc đã phê duyệt giá.
            </p>
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                {submitError}
              </p>
            ) : null}
          </div>
          <div className="th-dlg__footer">
            <button
              type="button"
              className="th-admin-users__btn-ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-users__btn-primary"
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
                play_arrow
              </span>
              {isSubmitting ? 'Đang gửi…' : 'Xác nhận đẩy xưởng'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
