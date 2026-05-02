import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UNIT_OPTIONS } from '../manufacturing/materialModel'
import { adminPaths } from '../config/adminPaths'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import './AdminProductCreatePage.css'

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

type MaterialCreateResponse = {
  id: string
  code: string
  name: string
  imageUrl: string | null
  unit: string
  unitCost: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
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
  const [form, setForm] = useState<MaterialFormState>(emptyForm)
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

        const createRes = await fetch(`${API_BASE_URL}/api/admin/materials`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({
            code,
            name,
            imageUrl: uploadEnvelope.data.url,
            unit,
            minStockLevel,
          }),
        })
        const createEnvelope = (await createRes.json()) as ApiEnvelope<MaterialCreateResponse>
        if (!createRes.ok || !createEnvelope.success || !createEnvelope.data) {
          throw new Error(createEnvelope.message || 'Tạo vật tư thất bại')
        }
        navigate(adminPaths.manufacturing.material(createEnvelope.data.id))
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không thể tạo vật tư')
      } finally {
        setSubmitting(false)
      }
    },
    [form, imageFile, navigate],
  )

  return (
    <div className="th-admin-product-create">
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
              <div className="th-admin-product-create__fields">
                <label className="th-admin-product-create__field">
                  <span className="th-admin-product-create__label">Mã vật tư *</span>
                  <input
                    className="th-admin-product-create__input"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="VD: VL-MDF18"
                    autoComplete="off"
                  />
                </label>
                <label className="th-admin-product-create__field">
                  <span className="th-admin-product-create__label">Tên vật tư *</span>
                  <input
                    className="th-admin-product-create__input"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: MDF chống ẩm 18mm"
                  />
                </label>
                <label className="th-admin-product-create__field">
                  <span className="th-admin-product-create__label">Đơn vị tính *</span>
                  <select
                    className="th-admin-product-create__input"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="th-admin-product-create__field th-admin-product-create__field--full">
                  <span className="th-admin-product-create__label">Tồn tối thiểu (cảnh báo) *</span>
                  <input
                    type="number"
                    className="th-admin-product-create__input"
                    value={form.minStockLevel || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minStockLevel: Number(e.target.value) }))
                    }
                    min={0}
                  />
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
              <label className="th-admin-product-create__field">
                <span className="th-admin-product-create__label">Ảnh từ máy *</span>
                <input
                  className="th-admin-product-create__input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageChange(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
              </label>
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
              className="th-admin-product-create__card th-admin-product-create__card--editor"
              aria-labelledby="th-amc-sec-note"
            >
              <h2 id="th-amc-sec-note" className="th-admin-product-create__sec-title">
                <span className="material-symbols-outlined th-admin-product-create__sec-icon" aria-hidden>
                  info
                </span>
                Ghi chú
              </h2>
              <p className="th-admin-product-create__sec-desc">
                Các trường như nhóm vật tư, tồn hiện tại, NCC, BOM… sẽ được bổ sung khi backend mở rộng API.
              </p>
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
