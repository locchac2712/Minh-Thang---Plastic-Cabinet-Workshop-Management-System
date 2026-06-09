import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import '../../admin/pages/AdminUsersPage.css'

export type DirectorPricingDecisionVariant = 'reject' | 'revise' | 'approve'

type VariantMeta = {
  icon: string
  title: string
  lead: string
  submitLabel: string
  submittingLabel: string
  submitClass: string
  requiresNote: boolean
  noteLabel: string
  notePlaceholder: string
  submitIcon: string
}

export type DirectorPricingDecisionDialogProps = {
  open: boolean
  variant: DirectorPricingDecisionVariant | null
  orderCode: string
  /** Ví dụ tên khách / mã đại lý — hiển thị phụ đề */
  contextHint?: string | null
  isSubmitting: boolean
  /** Lỗi từ API sau khi gửi */
  submitError: string | null
  onClose: () => void
  /** Ghi chú do GD nhập (reject/revise); approve gọi với chuỗi rỗng */
  onSubmit: (note: string) => void
  /** Cảnh báo hết hạn báo giá (informational) */
  validityHint?: string | null
}

function variantMeta(v: DirectorPricingDecisionVariant): VariantMeta {
  if (v === 'reject') {
    return {
      icon: 'block',
      title: 'Từ chối báo giá',
      lead:
        'Đơn sẽ cập nhật trạng thái theo hệ thống (ví dụ hủy / không duyệt). Nhập lý do rõ ràng để NVBH và kế toán theo dõi.',
      submitLabel: 'Xác nhận từ chối',
      submittingLabel: 'Đang gửi…',
      submitClass: 'th-admin-users__btn-danger',
      requiresNote: true,
      noteLabel: 'Lý do từ chối',
      notePlaceholder:
        'Ví dụ: Chiết khấu vượt ngưỡng phê duyệt; cần làm rõ BOM trước khi báo giá lại…',
      submitIcon: 'block',
    }
  }
  if (v === 'approve') {
    return {
      icon: 'verified',
      title: 'Phê duyệt báo giá',
      lead: 'Xác nhận chấp nhận giá và chiết khấu trong hồ sơ.',
      submitLabel: 'Xác nhận phê duyệt',
      submittingLabel: 'Đang phê duyệt…',
      submitClass: 'th-admin-users__btn-primary',
      requiresNote: false,
      noteLabel: '',
      notePlaceholder: '',
      submitIcon: 'check_circle',
    }
  }
  return {
    icon: 'edit_note',
    title: 'Yêu cầu điều chỉnh',
    lead: '',
    submitLabel: 'Gửi yêu cầu',
    submittingLabel: 'Đang gửi…',
    submitClass: 'th-admin-users__btn-primary',
    requiresNote: true,
    noteLabel: 'Nội dung yêu cầu',
    notePlaceholder: 'Nêu rõ phần cần chỉnh: giá dòng hàng, chiết khấu, mô tả kỹ thuật…',
    submitIcon: 'send',
  }
}

export function DirectorPricingDecisionDialog({
  open,
  variant,
  orderCode,
  contextHint,
  isSubmitting,
  submitError,
  onClose,
  onSubmit,
  validityHint,
}: DirectorPricingDecisionDialogProps) {
  const dlgRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const meta = variant ? variantMeta(variant) : variantMeta('revise')

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (open && variant) {
      setNote('')
      setLocalError(null)
      if (!el.open) el.showModal()
    } else if (el.open && (!open || !variant)) {
      el.close()
    }
  }, [open, variant])

  const handleDialogClose = () => {
    if (isSubmitting) return
    setLocalError(null)
    onClose()
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!variant) return
    if (variant === 'approve') {
      setLocalError(null)
      onSubmit('')
      return
    }
    const trimmed = note.trim()
    if (!trimmed) {
      setLocalError('Vui lòng nhập ghi chú.')
      return
    }
    setLocalError(null)
    onSubmit(trimmed)
  }

  const show = open && variant

  return (
    <dialog
      ref={dlgRef}
      className="th-dlg"
      aria-labelledby={titleId}
      aria-modal="true"
      onClose={handleDialogClose}
      onClick={(e) => {
        if (e.target === dlgRef.current) handleDialogClose()
      }}
    >
      {show ? (
        <div
          className="th-dlg__panel th-admin-users"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                {meta.icon}
              </span>
            </div>
            <h2 id={titleId} className="th-dlg__title">
              {meta.title}
            </h2>
            <button
              type="button"
              className="th-dlg__close"
              onClick={handleDialogClose}
              disabled={isSubmitting}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </div>
          <form onSubmit={handleFormSubmit}>
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
              {meta.lead ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  {meta.lead}
                </p>
              ) : null}
              {validityHint ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: '#b45309',
                    lineHeight: 1.45,
                  }}
                  role="status"
                >
                  {validityHint}
                </p>
              ) : null}
              {meta.requiresNote ? (
                <label className="th-admin-users-field">
                  <span className="th-admin-users-field__label">{meta.noteLabel}</span>
                  <textarea
                    className="th-admin-users-field__input"
                    rows={5}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value)
                      if (localError) setLocalError(null)
                    }}
                    placeholder={meta.notePlaceholder}
                    disabled={isSubmitting}
                    autoFocus
                    aria-invalid={Boolean(localError)}
                    aria-describedby={localError || submitError ? `${titleId}-err` : undefined}
                    style={{ minHeight: '7rem', resize: 'vertical' }}
                  />
                </label>
              ) : null}
              {(localError || submitError) && (
                <p
                  id={`${titleId}-err`}
                  className="th-admin-users__api-error"
                  role="alert"
                  style={{ margin: 0 }}
                >
                  {localError ?? submitError}
                </p>
              )}
            </div>
            <div className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                onClick={handleDialogClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button type="submit" className={meta.submitClass} disabled={isSubmitting}>
                <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
                  {meta.submitIcon}
                </span>
                {isSubmitting ? meta.submittingLabel : meta.submitLabel}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </dialog>
  )
}
