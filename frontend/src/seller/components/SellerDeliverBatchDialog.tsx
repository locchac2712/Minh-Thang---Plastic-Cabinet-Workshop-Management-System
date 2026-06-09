import { useEffect, useId, useRef, useState } from 'react'
import { deliverSellerOrderBatch, uploadSellerProofImage } from '../sellerOrdersApi'
import { productionTaskRefFromId } from '../../production/utils/productionTaskRef'
import '../../admin/pages/AdminUsersPage.css'
import './SellerDeliverBatchDialog.css'

export type SellerDeliverBatchDialogProps = {
  open: boolean
  orderId: string
  taskId: string
  taskDisplayCode?: string | null
  productName: string
  quantity: number
  /** Địa chỉ mặc định trên đơn — gợi ý, NVBH có thể sửa cho từng lô. */
  defaultDeliveryAddress?: string
  onClose: () => void
  onDelivered: () => void
}

export function SellerDeliverBatchDialog({
  open,
  orderId,
  taskId,
  taskDisplayCode,
  productName,
  quantity,
  defaultDeliveryAddress,
  onClose,
  onDelivered,
}: SellerDeliverBatchDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const addressId = useId()
  const proofId = useId()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open) {
      setSubmitError(null)
      const base = (defaultDeliveryAddress ?? '').trim()
      setDeliveryAddress(base !== '—' ? base : '')
      setProofFile(null)
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [open, defaultDeliveryAddress, taskId])

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null)
      return
    }
    const url = URL.createObjectURL(proofFile)
    setProofPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [proofFile])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleConfirm = async () => {
    const address = deliveryAddress.trim()
    if (!address) {
      setSubmitError('Nhập địa chỉ giao cho lô này.')
      return
    }
    if (!proofFile) {
      setSubmitError('Tải ảnh bằng chứng giao hàng (biên bản, hàng tại điểm giao…).')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const proofUrl = await uploadSellerProofImage(proofFile)
      await deliverSellerOrderBatch(orderId, {
        taskId,
        deliveryAddress: address,
        deliveryProofImageUrl: proofUrl,
      })
      onDelivered()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Không giao lô được')
    } finally {
      setSubmitting(false)
    }
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
        <div className="th-dlg__panel th-admin-users th-sod-deliver-dlg" onClick={(e) => e.stopPropagation()}>
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                local_shipping
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Giao lô sản xuất
            </h2>
            <button
              type="button"
              className="th-dlg__close"
              onClick={handleClose}
              disabled={submitting}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </div>
          <div className="th-dlg__body">
            <p className="th-sod-deliver-dlg__summary">
              Xuất kho và giao lô <strong>{productName || 'sản phẩm'}</strong> —{' '}
              <strong>{quantity}</strong> đơn vị. Mỗi lô có thể giao một điểm khác nhau.
            </p>
            <p className="th-sod-deliver-dlg__task-id">
              Mã lệnh: <code>{productionTaskRefFromId(taskId, taskDisplayCode)}</code>
            </p>

            <div className="th-sod-deliver-dlg__field">
              <label className="th-sod-deliver-dlg__label" htmlFor={addressId}>
                Địa chỉ giao lô này <span className="th-sod-deliver-dlg__req">*</span>
              </label>
              <textarea
                id={addressId}
                className="th-sod-deliver-dlg__textarea"
                rows={3}
                placeholder="Số nhà, khu công nghiệp, quận/huyện, tỉnh…"
                value={deliveryAddress}
                disabled={submitting}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              {defaultDeliveryAddress && defaultDeliveryAddress.trim() !== '—' ? (
                <button
                  type="button"
                  className="th-sod-deliver-dlg__link-btn"
                  disabled={submitting}
                  onClick={() => setDeliveryAddress(defaultDeliveryAddress.trim())}
                >
                  Dùng địa chỉ trên đơn
                </button>
              ) : null}
            </div>

            <div className="th-sod-deliver-dlg__field">
              <span className="th-sod-deliver-dlg__label" id={`${proofId}-label`}>
                Ảnh bằng chứng giao hàng <span className="th-sod-deliver-dlg__req">*</span>
              </span>
              <div className="th-sod-deliver-dlg__upload">
                <input
                  id={proofId}
                  className="th-sod-deliver-dlg__file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={submitting}
                  aria-labelledby={`${proofId}-label`}
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor={proofId} className="th-sod-deliver-dlg__upload-btn">
                  <span className="material-symbols-outlined" aria-hidden>
                    add_a_photo
                  </span>
                  {proofFile ? 'Đổi ảnh' : 'Chọn / chụp ảnh'}
                </label>
                {proofFile ? (
                  <button
                    type="button"
                    className="th-sod-deliver-dlg__link-btn"
                    disabled={submitting}
                    onClick={() => setProofFile(null)}
                  >
                    Gỡ ảnh
                  </button>
                ) : null}
              </div>
              {proofFile ? (
                <p className="th-sod-deliver-dlg__file-name">{proofFile.name}</p>
              ) : (
                <p className="th-sod-deliver-dlg__hint">Biên bản giao nhận, hàng tại điểm giao, xe biển số…</p>
              )}
              {proofPreview ? (
                <div className="th-sod-deliver-dlg__preview">
                  <img src={proofPreview} alt="Xem trước ảnh bằng chứng" />
                </div>
              ) : null}
            </div>

            {submitError ? (
              <p className="th-admin-users__api-error" role="alert">
                {submitError}
              </p>
            ) : null}
          </div>
          <div className="th-dlg__footer">
            <button
              type="button"
              className="th-admin-users__btn-ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-users__btn-primary"
              onClick={() => void handleConfirm()}
              disabled={submitting}
            >
              {submitting ? 'Đang tải lên…' : 'Xác nhận giao lô'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
