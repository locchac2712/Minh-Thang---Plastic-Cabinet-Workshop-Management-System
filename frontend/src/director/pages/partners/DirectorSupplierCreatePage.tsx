import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { directorPaths } from '../../config/directorPaths'
import { AdminBreadcrumb } from '../../../admin/components/AdminBreadcrumb/AdminBreadcrumb'
import { AdminSupplierApiError, createAdminSupplier } from '../../../admin/partners/adminSuppliersApi'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminProductDetailPage.css'

type FormState = {
  name: string
  phone: string
  address: string
  taxCode: string
}

const emptyForm = (): FormState => ({
  name: '',
  phone: '',
  address: '',
  taxCode: '',
})

export function DirectorSupplierCreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const goList = useCallback(() => {
    navigate(directorPaths.partners.suppliers)
  }, [navigate])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setFieldErrors({})
      const name = form.name.trim()
      if (!name) {
        setFieldErrors({ name: 'Tên nhà cung cấp là bắt buộc' })
        return
      }
      setSubmitting(true)
      try {
        const created = await createAdminSupplier({
          name,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          taxCode: form.taxCode.trim() || undefined,
        })
        navigate(directorPaths.partners.supplier(created.id), { replace: true })
      } catch (err) {
        if (err instanceof AdminSupplierApiError) {
          setSubmitError(err.message)
          if (err.fieldErrors) setFieldErrors(err.fieldErrors)
        } else if (err instanceof Error) {
          setSubmitError(err.message)
        } else {
          setSubmitError('Không tạo được nhà cung cấp.')
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
            { label: 'Nhà cung cấp', to: directorPaths.partners.suppliers },
            { label: 'Tạo mới' },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={directorPaths.partners.suppliers} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
        </div>
      </div>

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-product-detail__hero-text">
          <h1 className="th-admin-product-detail__title">Nhà cung cấp mới</h1>
          <p className="th-admin-product-detail__sku" style={{ margin: '0.5rem 0 0' }}>
            Khai báo nhà cung cấp mới trong hệ thống.
          </p>
        </div>
      </header>

      <form className="th-admin-product-detail__form" onSubmit={handleSubmit}>
        {submitError && (
          <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 0 0.5rem' }}>
            {submitError}
          </p>
        )}

        <label className="th-admin-product-detail__field">
          <span className="th-admin-product-detail__label">Tên *</span>
          <input
            className="th-admin-product-detail__input"
            name="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={255}
            required
            autoFocus
            disabled={submitting}
          />
          {fieldErrors.name && (
            <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
              {fieldErrors.name}
            </span>
          )}
        </label>

        <div className="th-admin-product-detail__form-row">
          <label className="th-admin-product-detail__field">
            <span className="th-admin-product-detail__label">Điện thoại</span>
            <input
              className="th-admin-product-detail__input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              maxLength={20}
              disabled={submitting}
            />
            {fieldErrors.phone && (
              <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
                {fieldErrors.phone}
              </span>
            )}
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
            {fieldErrors.taxCode && (
              <span className="th-admin-product-detail__hint" style={{ color: '#b91c1c' }}>
                {fieldErrors.taxCode}
              </span>
            )}
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
          <button
            type="button"
            className="th-admin-product-detail__btn-ghost"
            onClick={goList}
            disabled={submitting}
          >
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
