import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DEFAULT_MATERIAL_IMAGE_URL, UNIT_OPTIONS, formatQty } from '../manufacturing/materialModel'
import { formatVND } from '../catalog/productModel'
import { adminPaths } from '../config/adminPaths'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AdminUsersPage.css'
import './AdminProductDetailPage.css'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type MaterialDetailDto = {
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

type UploadImageResponse = {
  url: string
  publicId: string
}

type PendingUploadImage = {
  id: string
  file: File
  previewUrl: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function isLowStockApi(m: Pick<MaterialDetailDto, 'stockQuantity' | 'minStockLevel'>): boolean {
  return m.stockQuantity <= m.minStockLevel
}

export function AdminMaterialDetailPage() {
  const { materialId } = useParams<{ materialId: string }>()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<MaterialDetailDto | null>(null)
  const [pendingImage, setPendingImage] = useState<PendingUploadImage | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!materialId) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/materials/${encodeURIComponent(materialId)}`,
        {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<MaterialDetailDto>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được chi tiết vật tư')
      }
      setDraft(envelope.data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được chi tiết vật tư')
      setDraft(null)
    } finally {
      setLoading(false)
    }
  }, [materialId])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const handleSave = useCallback(async () => {
    if (!draft || !materialId || saving) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      let imageUrl: string | null = draft.imageUrl?.trim() ? draft.imageUrl.trim() : null
      if (pendingImage) {
        const uploadBody = new FormData()
        uploadBody.append('file', pendingImage.file)
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
        imageUrl = uploadEnvelope.data.url
      }

      const res = await fetch(
        `${API_BASE_URL}/api/admin/materials/${encodeURIComponent(materialId)}`,
        {
          method: 'PATCH',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({
            code: draft.code.trim(),
            name: draft.name.trim(),
            imageUrl,
            unit: draft.unit.trim(),
            unitCost: draft.unitCost,
            stockQuantity: draft.stockQuantity,
            minStockLevel: draft.minStockLevel,
            isActive: draft.isActive,
          }),
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<MaterialDetailDto>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Cập nhật vật tư thất bại')
      }
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
      setPendingImage(null)
      setDraft(envelope.data)
    setEditing(false)
      setNotice(envelope.message || 'Cập nhật vật tư thành công.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không thể cập nhật vật tư')
    } finally {
      setSaving(false)
    }
  }, [draft, pendingImage, materialId, saving])

  const appendUploadFile = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }
    })
  }, [])

  const removePendingUpload = useCallback(() => {
    setPendingImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
  }, [])

  useEffect(() => {
    if (!editing && pendingImage) {
      URL.revokeObjectURL(pendingImage.previewUrl)
      setPendingImage(null)
    }
  }, [editing, pendingImage])

  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    }
  }, [pendingImage])

  if (!materialId) return <Navigate to={adminPaths.manufacturing.materials} replace />

  if (loading) {
    return (
      <div className="th-admin-product-detail th-admin-product-detail--loading" aria-busy>
        Đang tải…
      </div>
    )
  }

  if (loadError || !draft) {
    return (
      <div className="th-admin-product-detail">
        <div className="th-admin-product-detail__top">
          <AdminBreadcrumb
            items={[
              { label: 'Tổng quan', to: adminPaths.dashboard },
              { label: 'Vật tư', to: adminPaths.manufacturing.materials },
              { label: 'Chi tiết vật tư' },
            ]}
          />
          <div className="th-admin-product-detail__toolbar">
            <Link to={adminPaths.manufacturing.materials} className="th-admin-product-detail__back">
              <span className="material-symbols-outlined" aria-hidden>
                arrow_back
              </span>
              Danh sách
            </Link>
          </div>
        </div>
        <p className="th-admin-users__api-error">{loadError ?? 'Không tìm thấy vật tư.'}</p>
      </div>
    )
  }

  const heroImageSrc = pendingImage?.previewUrl ?? draft.imageUrl ?? DEFAULT_MATERIAL_IMAGE_URL

  return (
    <div className="th-admin-product-detail">
      <div className="th-admin-product-detail__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: adminPaths.dashboard },
            { label: 'Vật tư', to: adminPaths.manufacturing.materials },
            { label: draft.name },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={adminPaths.manufacturing.materials} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
          <div className="th-admin-product-detail__actions">
            {!editing ? (
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={() => setEditing(true)}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    edit
                  </span>
                  Chỉnh sửa
                </button>
            ) : (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-ghost"
                  onClick={() => {
                    setEditing(false)
                    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
                    setPendingImage(null)
                    void fetchDetail()
                  }}
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    save
                  </span>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {notice ? <p className="th-admin-product-detail__hint">{notice}</p> : null}

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-product-detail__thumb-wrap" aria-hidden>
          <img
            src={heroImageSrc}
            alt=""
            className="th-admin-product-detail__thumb"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = DEFAULT_MATERIAL_IMAGE_URL
            }}
          />
        </div>
        <div className="th-admin-product-detail__hero-text">
          <p className="th-admin-product-detail__sku">{draft.code}</p>
          <h1 className="th-admin-product-detail__title">{draft.name}</h1>
          <div className="th-admin-product-detail__hero-meta">
            <span className="th-admin-badge th-admin-badge--role">{draft.unit}</span>
            <span
              className={`th-admin-badge ${draft.isActive ? 'th-admin-badge--active' : 'th-admin-badge--locked'}`}
            >
              <span className="th-admin-badge__dot" aria-hidden />
              {draft.isActive ? 'Đang dùng' : 'Ngưng'}
            </span>
            <span className="th-admin-product-detail__price">
              {formatQty(draft.stockQuantity, draft.unit)}
              <span className="th-admin-material-detail__hero-unit"> tồn</span>
            </span>
          </div>
        </div>
      </header>

      {draft.isActive && isLowStockApi(draft) ? (
        <div className="th-admin-material-detail__alert-banner" role="status">
            <span className="material-symbols-outlined" aria-hidden>
            warning
            </span>
          <div>
            <strong>Cảnh báo tồn thấp:</strong> hiện tại{' '}
            {formatQty(draft.stockQuantity, draft.unit)} không vượt ngưỡng tối thiểu{' '}
            {formatQty(draft.minStockLevel, draft.unit)}.
          </div>
      </div>
      ) : null}

      <div className="th-admin-product-detail__panel">
        {!editing ? (
          <dl className="th-admin-product-detail__dl">
            <div className="th-admin-product-detail__dl-row">
              <dt>ID</dt>
              <dd>
                <span className="th-admin-product-detail__mono">#{draft.id}</span>
              </dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Mã vật tư</dt>
              <dd>{draft.code}</dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Đơn vị</dt>
              <dd>{draft.unit}</dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Giá vốn đơn vị</dt>
              <dd>
                <strong>{formatVND(draft.unitCost)}</strong>
              </dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Tồn kho</dt>
              <dd>{draft.stockQuantity}</dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Tồn tối thiểu</dt>
              <dd>{draft.minStockLevel}</dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Ảnh (URL)</dt>
              <dd>{draft.imageUrl ? draft.imageUrl : '—'}</dd>
            </div>
            <div className="th-admin-product-detail__dl-row">
              <dt>Ngày tạo</dt>
              <dd>{new Date(draft.createdAt).toLocaleString('vi-VN')}</dd>
            </div>
          </dl>
        ) : (
              <form
                className="th-admin-product-detail__form"
                onSubmit={(e) => {
                  e.preventDefault()
              void handleSave()
                }}
              >
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Mã vật tư</span>
                    <input
                      className="th-admin-product-detail__input"
                  value={draft.code}
                  onChange={(e) => setDraft((d) => (d ? { ...d, code: e.target.value } : d))}
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Đơn vị</span>
                    <select
                      className="th-admin-product-detail__input"
                      value={draft.unit}
                  onChange={(e) => setDraft((d) => (d ? { ...d, unit: e.target.value } : d))}
                    >
                  {Array.from(new Set([draft.unit, ...UNIT_OPTIONS])).map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Tên vật tư</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.name}
                onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Giá vốn đơn vị (VND)</span>
                <input
                  type="number"
                      className="th-admin-product-detail__input"
                  value={draft.unitCost || ''}
                      onChange={(e) =>
                    setDraft((d) => (d ? { ...d, unitCost: Number(e.target.value) } : d))
                  }
                  min={0}
                />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Trạng thái</span>
                    <select
                      className="th-admin-product-detail__input"
                  value={draft.isActive ? 'active' : 'inactive'}
                      onChange={(e) =>
                        setDraft((d) =>
                      d ? { ...d, isActive: e.target.value === 'active' } : d,
                    )
                  }
                >
                  <option value="active">Đang dùng</option>
                  <option value="inactive">Ngưng</option>
                    </select>
                  </label>
                </div>
            <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Tồn kho</span>
                    <input
                      type="number"
                      className="th-admin-product-detail__input"
                  value={draft.stockQuantity || ''}
                      onChange={(e) =>
                    setDraft((d) => (d ? { ...d, stockQuantity: Number(e.target.value) } : d))
                      }
                      min={0}
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Tồn tối thiểu</span>
                    <input
                      type="number"
                      className="th-admin-product-detail__input"
                  value={draft.minStockLevel || ''}
                      onChange={(e) =>
                    setDraft((d) => (d ? { ...d, minStockLevel: Number(e.target.value) } : d))
                      }
                      min={0}
                    />
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
              <span className="th-admin-product-detail__label">URL ảnh (để trống nếu không dùng)</span>
                  <input
                type="url"
                    className="th-admin-product-detail__input"
                value={draft.imageUrl ?? ''}
                    onChange={(e) =>
                  setDraft((d) => (d ? { ...d, imageUrl: e.target.value.trim() || null } : d))
                    }
                placeholder="https://…"
                  />
                </label>
              <label className="th-admin-product-detail__field">
              <span className="th-admin-product-detail__label">Hoặc ảnh mới từ máy</span>
              <input
                className="th-admin-product-detail__input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  appendUploadFile(e.target.files)
                  e.currentTarget.value = ''
                }}
              />
              </label>
            {pendingImage ? (
              <div className="th-admin-product-detail__images-grid" aria-live="polite">
                <figure className="th-admin-product-detail__image-card">
                  <img
                    src={pendingImage.previewUrl}
                    alt="Ảnh mới"
                    className="th-admin-product-detail__image-preview"
                  />
                  <figcaption className="th-admin-product-detail__image-name" title={pendingImage.file.name}>
                    {pendingImage.file.name}
                  </figcaption>
                  <button
                    type="button"
                    className="th-admin-product-detail__btn-icon-remove"
                    onClick={removePendingUpload}
                    aria-label={`Xóa ảnh ${pendingImage.file.name}`}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      close
                    </span>
                  </button>
                </figure>
              </div>
            ) : null}
          </form>
        )}
      </div>
    </div>
  )
}
