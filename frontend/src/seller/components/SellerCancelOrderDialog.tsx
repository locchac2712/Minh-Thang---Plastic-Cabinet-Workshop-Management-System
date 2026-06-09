import { useEffect, useId, useRef } from 'react'
import type { SellerOrderListRowStatus } from '../data/sellerOrdersMock'
import type { SellerOrderDetailVariant } from '../sellerOrderDetailPhase'
import '../../admin/pages/AdminUsersPage.css'

function cancelHint(status: SellerOrderListRowStatus, variant: SellerOrderDetailVariant): string {
  if (variant === 'quotation') {
    switch (status) {
      case 'approved':
        return 'Báo giá sẽ không còn hiệu lực và chuyển sang trạng thái Đã hủy.'
      default:
        return 'Báo giá sẽ chuyển sang trạng thái Đã hủy. Thao tác không thể hoàn tác.'
    }
  }
  switch (status) {
    case 'draft':
    case 'pending':
    case 'pending_approval':
      return 'Đơn sẽ chuyển sang trạng thái Đã hủy.'
    case 'approved':
      return 'Mọi lệnh SX chờ (nếu có) sẽ bị xóa trước khi hủy.'
    case 'producing':
      return 'Chỉ hủy được khi mọi lệnh còn ở trạng thái Chờ làm và chưa giao lô nào.'
    default:
      return 'Thao tác không thể hoàn tác.'
  }
}

export type SellerCancelOrderDialogProps = {
  open: boolean
  variant?: SellerOrderDetailVariant
  orderCode: string
  status: SellerOrderListRowStatus
  isSubmitting: boolean
  submitError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function SellerCancelOrderDialog({
  open,
  variant = 'order',
  orderCode,
  status,
  isSubmitting,
  submitError,
  onClose,
  onConfirm,
}: SellerCancelOrderDialogProps) {
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

  const isQuotation = variant === 'quotation'
  const title = isQuotation ? 'Hủy báo giá' : 'Hủy đơn hàng'
  const confirmLead = isQuotation ? 'Xác nhận hủy báo giá' : 'Xác nhận hủy đơn'

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
                cancel
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              {title}
            </h2>
            <button type="button" className="th-dlg__close" onClick={handleClose} disabled={isSubmitting} aria-label="Đóng">
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </div>
          <div className="th-dlg__body">
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              {confirmLead} <code>{orderCode}</code>? {cancelHint(status, variant)}
            </p>
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: '0.75rem 0 0' }}>
                {submitError}
              </p>
            ) : null}
          </div>
          <div className="th-dlg__footer">
            <button type="button" className="th-admin-users__btn-ghost" onClick={handleClose} disabled={isSubmitting}>
              Không hủy
            </button>
            <button
              type="button"
              className="th-admin-users__btn-primary"
              style={{ background: '#b91c1c' }}
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang hủy…' : isQuotation ? 'Xác nhận hủy báo giá' : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
