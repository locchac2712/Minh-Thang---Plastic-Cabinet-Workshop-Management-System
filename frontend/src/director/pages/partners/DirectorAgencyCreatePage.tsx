import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { directorPaths } from '../../config/directorPaths'
import { AdminBreadcrumb } from '../../../admin/components/AdminBreadcrumb/AdminBreadcrumb'
import {
  AdminAgencyApiError,
  createAdminAgency,
  fetchAdminActiveSellers,
  type UserListItem,
} from '../../../admin/partners/adminAgenciesApi'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminProductDetailPage.css'

type FormState = {
  assignedSellerId: string
  name: string
  legalCompanyName: string
  phone: string
  address: string
  taxCode: string
}

const initialForm = (): FormState => ({
  assignedSellerId: '',
  name: '',
  legalCompanyName: '',
  phone: '',
  address: '',
  taxCode: '',
})

export function DirectorAgencyCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialForm)
  const [sellers, setSellers] = useState<UserListItem[]>([])
  const [sellersError, setSellersError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let ok = true
    ;(async () => {
      try {
        const list = await fetchAdminActiveSellers(200)
        if (!ok) return
        setSellers(list)
        setSellersError(null)
      } catch (e) {
        if (!ok) return
        setSellersError(
          e instanceof AdminAgencyApiError ? e.message : 'Không tải được danh sách NVBH.',
        )
        setSellers([])
      }
    })()
    return () => {
      ok = false
    }
  }, [])

  const goList = useCallback(() => {
    navigate(directorPaths.partners.agencies)
  }, [navigate])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setFieldErrors({})
      if (!form.assignedSellerId) {
        setFieldErrors({ assignedSellerId: 'Vui lòng chọn NVBH phụ trách' })
        return
      }
      const name = form.name.trim()
      if (!name) {
        setFieldErrors({ name: 'Tên đại lý không được để trống' })
        return
      }
      setSubmitting(true)
      try {
        const created = await createAdminAgency({
          assignedSellerId: form.assignedSellerId,
          name,
          level: 'VIP',
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          taxCode: form.taxCode.trim() || undefined,
          legalCompanyName: form.legalCompanyName.trim() || undefined,
        })
        navigate(directorPaths.partners.agency(created.id), { replace: true })
      } catch (err) {
        if (err instanceof AdminAgencyApiError) {
          setSubmitError(err.message)
          if (err.fieldErrors) setFieldErrors(err.fieldErrors)
        } else if (err instanceof Error) {
          setSubmitError(err.message)
        } else {
          setSubmitError('Không tạo được đại lý.')
        }
      } finally {
        setSubmitting(false)
      }
    },
    [form, navigate],
  )

  return (
    <div className="th-admin-product-detail">
      <div className="th-admin-product-detail__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: directorPaths.dashboard },
            { label: 'Khách sỉ', to: directorPaths.partners.agencies },
            { label: 'Tạo mới' },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={directorPaths.partners.agencies} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
        </div>
      </div>

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-product-detail__hero-text">
          <h1 className="th-admin-product-detail__title">Đại lý mới</h1>
          <p className="th-admin-product-detail__sku" style={{ margin: '0.5rem 0 0' }}>
            Tên công ty pháp nhân gửi kèm khi tạo. Cấp lưu mặc định <strong>VIP</strong> (không hiện trên form). Có thể
            chỉnh sửa đầy đủ sau tại trang chi tiết đại lý.
          </p>
        </div>
      </header>

      {sellersError && (
        <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 0 0.5rem' }}>
          {sellersError}
        </p>
      )}

      <form className="th-admin-product-detail__form" onSubmit={handleSubmit}>
        {submitError && (
          <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 0 0.5rem' }}>
            {submitError}
          </p>
        )}

        <label className="th-admin-product-detail__field">
          <span className="th-admin-product-detail__label">NVBH phụ trách *</span>
          <select
            className="th-admin-product-detail__input"
            value={form.assignedSellerId}
            onChange={(e) => setForm((f) => ({ ...f, assignedSellerId: e.target.value }))}
            required
            disabled={submitting}
          >
            <option value="">-- Chọn user SELLER đang hoạt động --</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.email})
              </option>
            ))}
          </select>
          {fieldErrors.assignedSellerId && (
            <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
              {fieldErrors.assignedSellerId}
            </span>
          )}
        </label>

        <label className="th-admin-product-detail__field">
          <span className="th-admin-product-detail__label">Tên đại lý *</span>
          <input
            className="th-admin-product-detail__input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={255}
            required
            disabled={submitting}
          />
          {fieldErrors.name && (
            <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
              {fieldErrors.name}
            </span>
          )}
        </label>

        <label className="th-admin-product-detail__field">
          <span className="th-admin-product-detail__label">Tên công ty (pháp nhân)</span>
          <input
            className="th-admin-product-detail__input"
            value={form.legalCompanyName}
            onChange={(e) => setForm((f) => ({ ...f, legalCompanyName: e.target.value }))}
            maxLength={255}
            disabled={submitting}
            placeholder="Công ty TNHH…"
          />
          {fieldErrors.legalCompanyName && (
            <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
              {fieldErrors.legalCompanyName}
            </span>
          )}
        </label>

        <div className="th-admin-product-detail__form-row">
          <label className="th-admin-product-detail__field">
            <span className="th-admin-product-detail__label">SĐT</span>
            <input
              className="th-admin-product-detail__input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              maxLength={20}
              disabled={submitting}
            />
          </label>
          <label className="th-admin-product-detail__field">
            <span className="th-admin-product-detail__label">MST</span>
            <input
              className="th-admin-product-detail__input"
              value={form.taxCode}
              onChange={(e) => setForm((f) => ({ ...f, taxCode: e.target.value }))}
              maxLength={50}
              disabled={submitting}
            />
          </label>
        </div>

        <label className="th-admin-product-detail__field">
          <span className="th-admin-product-detail__label">Địa chỉ</span>
          <input
            className="th-admin-product-detail__input"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            disabled={submitting}
          />
        </label>

        <div className="th-admin-product-detail__actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="th-admin-product-detail__btn-ghost" onClick={goList} disabled={submitting}>
            Hủy
          </button>
          <button type="submit" className="th-admin-product-detail__btn-primary" disabled={submitting}>
            {submitting ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  )
}
