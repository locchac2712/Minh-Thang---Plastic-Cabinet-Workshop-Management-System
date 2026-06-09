import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatDateVi } from '../../shared/formatDateVi'
import { IsoDatePickerField, validateIsoDateField } from '../../shared/date/isoDatePicker'
import { todayIsoDate } from '../utils/productionTaskDue'
import { productionOrderRef } from '../utils/productionOrderRef'
import {
  createProductionBatch,
  fetchProductionOrderBatches,
  type OrderItemBatchRemainingDto,
  type ProductionOrderQueueItemDto,
} from '../productionOrdersApi'
import '../../admin/pages/AdminUsersPage.css'

export type ProductionCreateBatchPanelProps = {
  open: boolean
  orderId: string
  queueContext?: ProductionOrderQueueItemDto | null
  onClose: () => void
  onCreated: () => void
}

export function ProductionCreateBatchPanel({
  open,
  orderId,
  queueContext,
  onClose,
  onCreated,
}: ProductionCreateBatchPanelProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const formId = useId()
  const titleId = useId()
  const endDateHintId = useId()
  const endDateErrorId = useId()
  const [remaining, setRemaining] = useState<OrderItemBatchRemainingDto[]>([])
  const [deliveryCap, setDeliveryCap] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [orderItemId, setOrderItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [expectedEndDate, setExpectedEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadRemaining = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionOrderBatches(orderId)
      setRemaining(data.remainingByItem.filter((r) => r.remainingBatchable > 0))
      if (!queueContext?.expectedDeliveryDate) {
        setDeliveryCap(data.expectedDeliveryDate)
      }
      setOrderItemId((prev) => {
        if (prev && data.remainingByItem.some((r) => r.orderItemId === prev && r.remainingBatchable > 0)) {
          return prev
        }
        const first = data.remainingByItem.find((r) => r.remainingBatchable > 0)
        return first?.orderItemId ?? ''
      })
    } catch (e) {
      setRemaining([])
      setLoadError(e instanceof Error ? e.message : 'Không tải được thông tin lô')
    } finally {
      setLoading(false)
    }
  }, [orderId, queueContext?.expectedDeliveryDate])

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open && orderId) {
      if (!el.open) el.showModal()
      setQuantity('')
      setExpectedEndDate('')
      setSubmitError(null)
      setDeliveryCap(queueContext?.expectedDeliveryDate ?? null)
      void loadRemaining()
    } else if (el.open) {
      el.close()
    }
  }, [open, orderId, loadRemaining, queueContext?.expectedDeliveryDate])

  useEffect(() => {
    if (!open || expectedEndDate) return
    const cap = queueContext?.expectedDeliveryDate ?? deliveryCap
    const today = todayIsoDate()
    if (cap && cap >= today) {
      setExpectedEndDate(cap)
    } else if (!cap) {
      setExpectedEndDate(today)
    }
  }, [open, queueContext?.expectedDeliveryDate, deliveryCap, expectedEndDate])

  const selected = remaining.find((r) => r.orderItemId === orderItemId)
  const maxQty = selected?.remainingBatchable ?? 0
  const effectiveDeliveryCap = queueContext?.expectedDeliveryDate ?? deliveryCap
  const today = todayIsoDate()
  const deliveryCapInPast = Boolean(effectiveDeliveryCap && effectiveDeliveryCap < today)

  const expectedEndDateError = useMemo(() => {
    if (deliveryCapInPast) return null
    return validateIsoDateField(expectedEndDate, {
      fieldLabel: 'Hạn lô',
      minIso: today,
      maxIso: effectiveDeliveryCap ?? undefined,
      required: true,
    })
  }, [deliveryCapInPast, effectiveDeliveryCap, expectedEndDate, today])

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderItemId || !selected) {
      setSubmitError('Chọn dòng đơn hàng')
      return
    }
    const qty = Number.parseInt(quantity, 10)
    if (!Number.isFinite(qty) || qty < 1) {
      setSubmitError('Số lượng lô phải >= 1')
      return
    }
    if (qty > maxQty) {
      setSubmitError(`Tối đa còn có thể lập lô: ${maxQty}`)
      return
    }
    const dateError = validateIsoDateField(expectedEndDate, {
      fieldLabel: 'Hạn lô',
      minIso: today,
      maxIso: effectiveDeliveryCap ?? undefined,
      required: true,
    })
    if (dateError) {
      setSubmitError(dateError)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await createProductionBatch(orderId, { orderItemId, quantity: qty, expectedEndDate })
      onCreated()
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Không tạo được lô')
    } finally {
      setSubmitting(false)
    }
  }

  const show = open && orderId

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
                inventory_2
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              Tạo lô sản xuất
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
          </header>
          <form id={formId} className="th-dlg__body th-prod-dlg-body" onSubmit={(e) => void handleSubmit(e)}>
            <p className="th-prod-dlg-lead">
              <strong>Đơn:</strong> <code>{productionOrderRef(orderId, queueContext?.orderDisplayCode)}</code>
              {queueContext ? (
                <>
                  {' '}
                  · {queueContext.agencyName}
                  {queueContext.expectedDeliveryDate
                    ? ` · Giao dự kiến ${formatDateVi(queueContext.expectedDeliveryDate)}`
                    : ''}
                </>
              ) : effectiveDeliveryCap ? (
                <> · Giao dự kiến {formatDateVi(effectiveDeliveryCap)}</>
              ) : null}
            </p>
            <p className="th-prod-dlg-text">Mỗi lô tạo một lệnh sản xuất riêng trên bảng công việc.</p>
            {loading ? <p className="th-prod-dlg-text">Đang tải…</p> : null}
            {loadError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                {loadError}
              </p>
            ) : null}
            {!loading && remaining.length === 0 && !loadError ? (
              <p className="th-prod-dlg-text">Đã lập đủ lô cho mọi dòng đơn hoặc chưa có dòng khả dụng.</p>
            ) : null}
            {remaining.length > 0 ? (
              <>
                <label htmlFor={`${formId}-item`} className="th-prod-dlg-text">
                  Dòng đơn
                </label>
                <select
                  id={`${formId}-item`}
                  className="th-prod-dlg-select"
                  value={orderItemId}
                  onChange={(e) => {
                    setOrderItemId(e.target.value)
                    setQuantity('')
                  }}
                  disabled={submitting}
                >
                  {remaining.map((r) => (
                    <option key={r.orderItemId} value={r.orderItemId}>
                      {r.productName} — còn lập {r.remainingBatchable}/{r.orderedQuantity}
                    </option>
                  ))}
                </select>
                <label htmlFor={`${formId}-qty`} className="th-prod-dlg-text">
                  Số lượng lô (tối đa {maxQty})
                </label>
                <input
                  id={`${formId}-qty`}
                  className="th-prod-dlg-input"
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={submitting}
                />
                <label htmlFor={`${formId}-end`} className="th-prod-dlg-text">
                  Hạn lô
                </label>
                <IsoDatePickerField
                  id={`${formId}-end`}
                  className="th-prod-dlg-date"
                  value={expectedEndDate}
                  minIso={today}
                  maxIso={deliveryCapInPast ? undefined : effectiveDeliveryCap ?? undefined}
                  onChange={(iso) => {
                    setExpectedEndDate(iso)
                    setSubmitError(null)
                  }}
                  disabled={submitting || deliveryCapInPast}
                  status={expectedEndDateError ? 'error' : undefined}
                  aria-invalid={expectedEndDateError ? true : undefined}
                  aria-describedby={
                    expectedEndDateError
                      ? endDateErrorId
                      : endDateHintId
                  }
                />
                {expectedEndDateError ? (
                  <p
                    id={endDateErrorId}
                    className="th-admin-users__api-error"
                    role="alert"
                    style={{ margin: 0 }}
                  >
                    {expectedEndDateError}
                  </p>
                ) : null}
                <p id={endDateHintId} className="th-prod-dlg-text">
                  {deliveryCapInPast
                    ? `Ngày giao dự kiến (${formatDateVi(effectiveDeliveryCap!)}) đã qua — cập nhật đơn trước khi tạo lô.`
                    : effectiveDeliveryCap
                      ? `Chọn từ ${formatDateVi(today)} đến ${formatDateVi(effectiveDeliveryCap)} (dd/MM/yyyy).`
                      : `Chọn từ ${formatDateVi(today)} trở đi — đơn chưa có ngày giao dự kiến.`}
                </p>
              </>
            ) : null}
            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
                {submitError}
              </p>
            ) : null}
          </form>
          <div className="th-dlg__footer">
            <button type="button" className="th-admin-users__btn-ghost" onClick={handleClose} disabled={submitting}>
              Hủy
            </button>
            <button
              type="submit"
              form={formId}
              className="th-admin-users__btn-primary"
              disabled={
                submitting ||
                remaining.length === 0 ||
                !expectedEndDate ||
                deliveryCapInPast ||
                Boolean(expectedEndDateError)
              }
            >
              <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
                inventory_2
              </span>
              {submitting ? 'Đang tạo…' : 'Tạo lô'}
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
