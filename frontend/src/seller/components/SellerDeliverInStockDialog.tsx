import { useEffect, useId, useRef } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import '../../admin/pages/AdminUsersPage.css'

export type SellerDeliverInStockDialogProps = {
  open: boolean
  orderCode: string
  grandTotalVnd: number
  isSubmitting: boolean
  submitError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function SellerDeliverInStockDialog({
  open,
  orderCode,
  grandTotalVnd,
  isSubmitting,
  submitError,
  onClose,
  onConfirm,
}: SellerDeliverInStockDialogProps) {
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
        <div className="th-dlg__panel th-admin-users" onClick={(e) => e.stopPropagation()}>
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                inventory
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Giao từ kho (hàng có sẵn)
            </h2>
            <button type="button" className="th-dlg__close" onClick={handleClose} disabled={isSubmitting} aria-label="Đóng">
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </div>
          <div className="th-dlg__body">
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              Đơn <code>{orderCode}</code> sẽ chuyển thẳng sang <strong>Hoàn tất</strong>: trừ tồn kho theo từng
              dòng và ghi công nợ <strong>{formatVND(grandTotalVnd)}</strong> cho đại lý.
            </p>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
              Dùng cho đơn catalog nháp — không áp dụng luồng sản xuất MTO.
            </p>
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: '0.75rem 0 0' }}>
                {submitError}
              </p>
            ) : null}
          </div>
          <div className="th-dlg__footer">
            <button type="button" className="th-admin-users__btn-ghost" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="button" className="th-admin-users__btn-primary" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý…' : 'Xác nhận giao từ kho'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
