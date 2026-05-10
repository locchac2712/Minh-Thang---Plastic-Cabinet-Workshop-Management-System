import { useCallback, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { App } from 'antd'
import { sellerPaths } from '../config/sellerPaths'
import { createSellerAgency, SellerAgencyApiError } from '../services/sellerAgenciesApi'
import '../../admin/pages/AdminUsersPage.css'
import './SellerAgencyCreatePage.css'

/** Mặc định theo yêu cầu — CreateAgencyRequest.level */
const SELLER_NEW_AGENCY_LEVEL = 'VIP'

type FormState = {
  legalName: string
  shortName: string
  taxCode: string
  phone: string
  email: string
  address: string
}

const emptyForm = (): FormState => ({
  legalName: '',
  shortName: '',
  taxCode: '',
  phone: '',
  email: '',
  address: '',
})

const BREADCRUMB_ITEMS: { label: string; to?: string }[] = [
  { label: 'Trang NVBH', to: sellerPaths.dashboard },
  { label: 'Khách sỉ trực thuộc', to: sellerPaths.agencies },
  { label: 'Thêm khách hàng' },
]

function trimAddress(street: string): string | undefined {
  const s = street.trim()
  return s || undefined
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function SellerAgencyCreatePage() {
  const { message } = App.useApp()
  const fid = useId()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)

      const legal = form.legalName.trim()
      const short = form.shortName.trim()
      const tax = form.taxCode.trim()
      const phone = form.phone.trim()
      const email = form.email.trim()
      if (!legal || !short) return
      if (!tax) {
        message.warning('Vui lòng nhập mã số thuế.')
        return
      }
      if (!phone) {
        message.warning('Vui lòng nhập số điện thoại.')
        return
      }
      if (!email) {
        message.warning('Vui lòng nhập email.')
        return
      }
      if (!isValidEmail(email)) {
        message.warning('Email không hợp lệ.')
        return
      }

      const addressLine = trimAddress(form.address)

      setSubmitting(true)
      try {
        const row = await createSellerAgency({
          name: short,
          level: SELLER_NEW_AGENCY_LEVEL,
          phone,
          legalCompanyName: legal,
          address: addressLine,
          taxCode: tax,
          email,
        })

        navigate(sellerPaths.agency(row.id))
      } catch (err) {
        if (err instanceof SellerAgencyApiError) {
          setSubmitError(err.message)
        } else {
          setSubmitError('Không tạo được đại lý. Vui lòng thử lại.')
        }
      } finally {
        setSubmitting(false)
      }
    },
    [form, message, navigate],
  )

  return (
    <div className="th-seller-agency-create">
      <nav className="th-seller-agency-create__breadcrumb" aria-label="Breadcrumb">
        <ol className="th-seller-agency-create__breadcrumb-list">
          {BREADCRUMB_ITEMS.map((item, i) => {
            const last = i === BREADCRUMB_ITEMS.length - 1
            return (
              <li key={`${item.label}-${i}`} className="th-seller-agency-create__breadcrumb-item">
                {item.to && !last ? (
                  <Link to={item.to} className="th-seller-agency-create__breadcrumb-link">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last
                        ? 'th-seller-agency-create__breadcrumb-current'
                        : 'th-seller-agency-create__breadcrumb-text'
                    }
                    aria-current={last ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!last ? (
                  <span className="th-seller-agency-create__breadcrumb-sep" aria-hidden>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>

      <header className="th-seller-agency-create__header">
        <div className="th-seller-agency-create__title-row">
          <span className="material-symbols-outlined th-seller-agency-create__title-icon" aria-hidden>
            person_add
          </span>
          <div>
            <h1 className="th-seller-agency-create__title">Thêm khách hàng mới</h1>
          </div>
        </div>
      </header>

      <form className="th-seller-agency-create__form" onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <p className="th-admin-users__api-error" role="alert">
            {submitError}
          </p>
        ) : null}

        <section className="th-seller-agency-create__card" aria-labelledby={`${fid}-sec-legal`}>
          <h2 id={`${fid}-sec-legal`} className="th-seller-agency-create__sec-title">
            <span className="material-symbols-outlined th-seller-agency-create__sec-icon" aria-hidden>
              corporate_fare
            </span>
            Pháp nhân &amp; thuế
          </h2>
          <div className="th-seller-agency-create__grid">
            <label className="th-seller-agency-create__field th-seller-agency-create__field--full">
              <span className="th-seller-agency-create__label">
                Tên đầy đủ (pháp nhân) <abbr title="bắt buộc">*</abbr>
              </span>
              <input
                id={`${fid}-legal`}
                className="th-seller-agency-create__input"
                type="text"
                autoComplete="organization"
                value={form.legalName}
                onChange={(e) => update('legalName', e.target.value)}
                required
                disabled={submitting}
                placeholder="VD: Công ty TNHH …"
              />
            </label>
            <label className="th-seller-agency-create__field">
              <span className="th-seller-agency-create__label">
                Tên gọi ngắn <abbr title="bắt buộc">*</abbr>
              </span>
              <input
                id={`${fid}-short`}
                className="th-seller-agency-create__input"
                type="text"
                value={form.shortName}
                onChange={(e) => update('shortName', e.target.value)}
                required
                disabled={submitting}
                placeholder="VD: Khách miền Nam 1"
              />
            </label>
            <label className="th-seller-agency-create__field">
              <span className="th-seller-agency-create__label">
                Mã số thuế <abbr title="bắt buộc">*</abbr>
              </span>
              <input
                id={`${fid}-tax`}
                className="th-seller-agency-create__input"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form.taxCode}
                onChange={(e) => update('taxCode', e.target.value)}
                required
                disabled={submitting}
                placeholder="VD: 0123456789"
              />
            </label>
          </div>
        </section>

        <section className="th-seller-agency-create__card" aria-labelledby={`${fid}-sec-contact`}>
          <h2 id={`${fid}-sec-contact`} className="th-seller-agency-create__sec-title">
            <span className="material-symbols-outlined th-seller-agency-create__sec-icon" aria-hidden>
              contact_mail
            </span>
            Liên hệ &amp; địa chỉ
          </h2>
          <div className="th-seller-agency-create__grid">
            <label className="th-seller-agency-create__field">
              <span className="th-seller-agency-create__label">
                Điện thoại <abbr title="bắt buộc">*</abbr>
              </span>
              <input
                id={`${fid}-phone`}
                className="th-seller-agency-create__input"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                required
                disabled={submitting}
                placeholder="0900 …"
              />
            </label>
            <label className="th-seller-agency-create__field">
              <span className="th-seller-agency-create__label">
                Email <abbr title="bắt buộc">*</abbr>
              </span>
              <input
                id={`${fid}-email`}
                className="th-seller-agency-create__input"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                disabled={submitting}
                placeholder="kd@…"
              />
            </label>
            <label className="th-seller-agency-create__field th-seller-agency-create__field--full">
              <span className="th-seller-agency-create__label">Địa chỉ giao dịch</span>
              <input
                id={`${fid}-addr`}
                className="th-seller-agency-create__input"
                type="text"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                disabled={submitting}
              />
            </label>
          </div>
        </section>

        <div className="th-seller-agency-create__actions">
          <Link to={sellerPaths.agencies} className="th-seller-agency-create__btn-secondary">
            Hủy
          </Link>
          <button
            type="submit"
            className="th-seller-agency-create__btn-primary"
            disabled={submitting}
          >
            <span className="material-symbols-outlined" aria-hidden>
              save
            </span>
            {submitting ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </div>
  )
}
