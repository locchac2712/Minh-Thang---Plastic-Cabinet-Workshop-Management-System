import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UNIT_OPTIONS } from '../manufacturing/materialModel'
import { adminPaths } from '../config/adminPaths'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { createAdminMaterial } from '../manufacturing/adminMaterialsApi'
import { SupplierMultiSelect } from '../../shared/components/SupplierMultiSelect'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import './AdminProductCreatePage.css'
import './AdminMaterialCreatePage.css'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type UploadImageResponse = {
  url: string
  publicId: string
}

type MaterialFormState = {
  code: string
  name: string
  unit: string
  minStockLevel: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

const emptyForm = (): MaterialFormState => ({
  code: '',
  name: '',
  unit: 'Cái',
  minStockLevel: 0,
})

export function AdminMaterialCreatePage() {
  const navigate = useNavigate()
  const fid = useId()
  const [form, setForm] = useState<MaterialFormState>(emptyForm)
  const [supplierIds, setSupplierIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const goBack = useCallback(() => {
    navigate(adminPaths.manufacturing.materials)
  }, [navigate])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleImageChange = useCallback((files: FileList | null) => {
    const file = files?.[0] ?? null
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (!file) {
      setImageFile(null)
      setPreviewUrl(null)
      return
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }, [previewUrl])

  const clearImage = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageFile(null)
    setPreviewUrl(null)
  }, [previewUrl])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const accessToken = getAccessToken()
      if (!accessToken) {
        setSubmitError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        return
      }
      const code = form.code.trim()
      const name = form.name.trim()
      const unit = form.unit.trim()
      const minStockLevel = Number.isFinite(form.minStockLevel) ? Math.max(0, Math.floor(form.minStockLevel)) : 0
      if (!code || !name || !unit) return
      if (!imageFile) {
        setSubmitError('Vui lòng chọn 1 ảnh để tải lên.')
        return
      }

      setSubmitError(null)
      setSubmitting(true)
      try {
        const uploadBody = new FormData()
        uploadBody.append('file', imageFile)
        const uploadRes = await fetch(`${API_BASE_URL}/api/uploadable/image`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: uploadBody,
        })
        const uploadEnvelope = (await uploadRes.json()) as ApiEnvelope<UploadImageResponse>
        if (!uploadRes.ok || !uploadEnvelope.success || !uploadEnvelope.data?.url) {
          throw new Error(uploadEnvelope.message || 'Upload ảnh thất bại')
        }

        const created = await createAdminMaterial({
          code,
          name,
          imageUrl: uploadEnvelope.data.url,
          unit,
          minStockLevel,
          supplierIds: supplierIds.length > 0 ? supplierIds : undefined,
        })
        navigate(adminPaths.manufacturing.material(created.id))
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không thể tạo vật tư')
      } finally {
        setSubmitting(false)
      }
    },
    [form, imageFile, navigate, supplierIds],
  )

  return (
    <div className="th-admin-product-create th-admin-mat-create">
      <div className="th-admin-product-create__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: adminPaths.dashboard },
            { label: 'Vật tư', to: adminPaths.manufacturing.materials },
            { label: 'Thêm vật tư mới' },
          ]}
        />

        <header className="th-admin-product-create__header">
          <div className="th-admin-product-create__header-main">
            <Link
              to={adminPaths.manufacturing.materials}
              className="th-admin-product-create__back"
            >
              <span className="material-symbols-outlined" aria-hidden>
                arrow_back
              </span>
              Quay lại danh sách
            </Link>
            <h1 className="th-admin-product-create__title">Thêm vật tư mới</h1>
            <p className="th-admin-product-create__lead">
              Khai báo thông tin cơ bản, ảnh minh họa và NCC có thể cung cấp vật tư này.
            </p>
            {submitError ? <p className="th-admin-users__api-error">{submitError}</p> : null}
          </div>
        </header>
      </div>

      <form className="th-admin-product-create__form" onSubmit={handleSubmit} noValidate>
        <div className="th-admin-product-create__layout">
          <aside className="th-admin-product-create__aside" aria-label="Thông tin vật tư">
            <section className="th-admin-product-create__card" aria-labelledby="th-amc-sec-basic">
              <h2 id="th-amc-sec-basic" className="th-admin-product-create__sec-title">
                <span className="material-symbols-outlined th-admin-product-create__sec-icon" aria-hidden>
                  badge
                </span>
                Thông tin cơ bản
              </h2>
              <div className="th-admin-product-create__fields th-admin-product-create__fields--aside">
                <label className="th-admin-product-create__field">
                  <span className="th-admin-product-create__label">
                    Mã vật tư <span className="th-admin-product-create__required">*</span>
                  </span>
                  <input
                    className="th-admin-product-create__input"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="VD: VL-MDF18"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="th-admin-product-create__field">
                  <span className="th-admin-product-create__label">
                    Đơn vị tính <span className="th-admin-product-create__required">*</span>
                  </span>
                  <select
                    className="th-admin-product-create__input"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    required
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="th-admin-product-create__field th-admin-product-create__field--full">
                  <span className="th-admin-product-create__label">
                    Tên vật tư <span className="th-admin-product-create__required">*</span>
                  </span>
                  <input
                    className="th-admin-product-create__input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: MDF chống ẩm 18mm"
                    required
                  />
                </label>
                <label className="th-admin-product-create__field th-admin-product-create__field--full">
                  <span className="th-admin-product-create__label">
                    Tồn tối thiểu (cảnh báo) <span className="th-admin-product-create__required">*</span>
                  </span>
                  <input
                    type="number"
                    className="th-admin-product-create__input"
                    value={form.minStockLevel || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minStockLevel: Number(e.target.value) }))
                    }
                    min={0}
                    required
                  />
                  <span className="th-admin-product-create__hint">
                    Ngưỡng cảnh báo khi tồn thấp hơn mức này.
                  </span>
                </label>
              </div>
            </section>

            <section className="th-admin-product-create__card" aria-labelledby="th-amc-sec-media">
              <h2 id="th-amc-sec-media" className="th-admin-product-create__sec-title">
                <span className="material-symbols-outlined th-admin-product-create__sec-icon" aria-hidden>
                  image
                </span>
                Ảnh minh họa
              </h2>
              <div className="th-admin-mat-create__upload">
                <input
                  id={`${fid}-image`}
                  className="th-admin-mat-create__upload-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageChange(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
                <label htmlFor={`${fid}-image`} className="th-admin-mat-create__upload-btn">
                  <span className="material-symbols-outlined" aria-hidden>
                    add_photo_alternate
                  </span>
                  {imageFile ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
                </label>
                {!imageFile ? (
                  <p className="th-admin-mat-create__upload-hint">JPG, PNG — bắt buộc 1 ảnh minh họa.</p>
                ) : null}
              </div>
              {previewUrl && imageFile ? (
                <div className="th-admin-product-create__images-grid" aria-live="polite">
                  <figure className="th-admin-product-create__image-card">
                    <img
                      src={previewUrl}
                      alt="Ảnh vật tư"
                      className="th-admin-product-create__image-preview"
                    />
                    <figcaption className="th-admin-product-create__image-name" title={imageFile.name}>
                      {imageFile.name}
                    </figcaption>
                    <button
                      type="button"
                      className="th-admin-product-create__btn-icon-remove"
                      onClick={clearImage}
                      aria-label={`Xóa ảnh ${imageFile.name}`}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        close
                      </span>
                    </button>
                  </figure>
                </div>
              ) : null}
            </section>
          </aside>

          <div className="th-admin-product-create__main">
            <section
              className="th-admin-product-create__card th-admin-mat-create__suppliers-card"
              aria-labelledby="th-amc-sec-suppliers"
            >
              <div className="th-admin-mat-create__sec-head">
                <h2 id="th-amc-sec-suppliers" className="th-admin-product-create__sec-title">
                  <span className="material-symbols-outlined th-admin-product-create__sec-icon" aria-hidden>
                    local_shipping
                  </span>
                  NCC cung cấp
                </h2>
                <span
                  className={`th-admin-mat-create__count${supplierIds.length === 0 ? ' th-admin-mat-create__count--empty' : ''}`}
                >
                  {supplierIds.length === 0 ? 'Chưa chọn' : `Đã chọn ${supplierIds.length}`}
                </span>
              </div>
              <div className="th-admin-mat-create__callout">
                <span className="material-symbols-outlined" aria-hidden>
                  info
                </span>
                <p>
                  PO chỉ mua được NVL đã gán NCC. Có thể bổ sung sau ở chi tiết vật tư hoặc màn NCC
                  (Director).
                </p>
              </div>
              <SupplierMultiSelect value={supplierIds} onChange={setSupplierIds} disabled={submitting} />
            </section>
          </div>
        </div>

        <footer className="th-admin-product-create__footer">
          <div className="th-admin-product-create__footer-inner">
            <button type="button" className="th-admin-product-create__btn-ghost" onClick={goBack} disabled={submitting}>
              Hủy
            </button>
            <div className="th-admin-product-create__footer-actions">
              <button type="submit" className="th-admin-product-create__btn-primary" disabled={submitting}>
                <span className="material-symbols-outlined" aria-hidden>
                  check_circle
                </span>
                {submitting ? 'Đang tạo...' : 'Thêm vật tư'}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </div>
  )
}
