import { useEffect, useId, useRef } from 'react'
import type { OrderFulfillmentSummaryDto } from '../sellerOrdersApi'
import '../../admin/pages/AdminUsersPage.css'

export type SellerMarkDoneDialogProps = {
  open: boolean
  orderCode: string
  isSubmitting: boolean
  submitError: string | null
  canConfirm: boolean
  fulfillment: OrderFulfillmentSummaryDto | null
  fulfillmentError: string | null
  onClose: () => void
  onConfirm: () => void
}

export function SellerMarkDoneDialog({
  open,
  orderCode,
  isSubmitting,
  submitError,
  canConfirm,
  fulfillment,
  fulfillmentError,
  onClose,
  onConfirm,
}: SellerMarkDoneDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  const blockers =
    fulfillment?.lines?.filter(
      (l) => l.remainingToBatch > 0 || l.remainingToDeliver > 0,
    ) ?? []

  const allowConfirm = canConfirm || Boolean(fulfillmentError)

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
                task_alt
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Xác nhận hoàn thành đơn hàng
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
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
              Đơn <code>{orderCode}</code> — chốt đơn và ghi công nợ sau khi đã giao đủ từng lô.{' '}
              <strong>Không xuất kho tại bước này.</strong>
            </p>
            {fulfillmentError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: '0.75rem 0 0' }}>
                Không tải được tiến độ giao — vẫn có thể thử chốt đơn; hệ thống sẽ kiểm tra lại.
              </p>
            ) : null}
            {!allowConfirm && blockers.length > 0 ? (
              <ul
                className="th-seller-order-detail__mark-done-blockers"
                style={{ margin: '0.75rem 0 0', paddingLeft: '1.1rem', fontSize: '0.8125rem' }}
              >
                {blockers.map((l) => (
                  <li key={l.orderItemId}>
                    <strong>{l.productName}</strong>
                    {l.remainingToBatch > 0 ? ` — còn lập lô ${l.remainingToBatch}` : null}
                    {l.remainingToDeliver > 0 ? ` — còn giao ${l.remainingToDeliver}` : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {!allowConfirm && blockers.length === 0 && !fulfillmentError ? (
              <p
                className="th-seller-order-detail__muted"
                style={{ margin: '0.75rem 0 0', fontSize: '0.8125rem' }}
                role="status"
              >
                Cần lập đủ lô, hoàn tất sản xuất và giao đủ số lượng trước khi chốt đơn.
              </p>
            ) : null}
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: '0.75rem 0 0' }}>
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
              disabled={isSubmitting || !allowConfirm}
              title={!allowConfirm ? 'Chưa giao đủ hoặc còn lô chưa lập' : undefined}
            >
              {isSubmitting ? 'Đang cập nhật…' : 'Xác nhận hoàn tất'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
