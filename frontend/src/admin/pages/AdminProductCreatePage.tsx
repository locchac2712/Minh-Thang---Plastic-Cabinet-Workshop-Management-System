import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CategorySearchSelect,
  type CategoryOption,
} from '../components/CategorySearchSelect/CategorySearchSelect'
import { formatVND } from '../partners/agencyModel'
import { adminPaths } from '../config/adminPaths'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import { getAccessToken, getTokenType } from '../../auth/storage'
import '../../production/pages/ProductionCustomProductCreatePage.css'
import './AdminProductCreatePage.css'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type CategoryDto = {
  id: string
  name: string
}

type CategoryListResponse = {
  content: CategoryDto[]
}

type UploadImageResponse = {
  url: string
  publicId: string
}

type ProductCreateResponse = {
  id: string
  categoryId: string
  categoryName: string
  sku: string
  name: string
  imageUrls: string[]
  costPrice: number
  suggestedPrice: number
  stockQuantity: number
  isActive: boolean
  createdAt: string
}

type AdminCreateProductBomItemPayload = {
  materialId: string
  quantity: number
  note?: string
}

type AdminCreateProductPayload = {
  categoryId: string
  sku: string
  name: string
  imageUrls: string[]
  costPrice: number
  suggestedPrice: number
  bomItems: AdminCreateProductBomItemPayload[]
}

type PendingUploadImage = {
  id: string
  file: File
  previewUrl: string
}

type ProductFormState = {
  sku: string
  name: string
  categoryId: string
  costPrice: string
  suggestedPrice: string
}

type AdminMaterialRow = {
  id: string
  code: string
  name: string
  unit: string
  isActive: boolean
  unitCost: number
}

type BomFormRow = {
  key: string
  materialId: string
  quantity: string
  note: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function newBomKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bom-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const emptyBomRow = (): BomFormRow => ({
  key: newBomKey(),
  materialId: '',
  quantity: '1',
  note: '',
})

type BomLineLike = { materialId: string; quantity: number }

function trySumBomCostVnd(
  lines: BomLineLike[],
  costById: Record<string, number | undefined>,
): { ok: true; total: number } | { ok: false; reason: 'empty' | 'incomplete' } {
  if (lines.length === 0) return { ok: false, reason: 'empty' }
  let t = 0
  for (const ln of lines) {
    if (!ln.materialId) return { ok: false, reason: 'incomplete' }
    const c = costById[ln.materialId]
    if (c == null) return { ok: false, reason: 'incomplete' }
    t += ln.quantity * c
  }
  return { ok: true, total: Math.round(t) }
}

function mergeMaterialSelectOptions(
  base: CategoryOption[],
  selectedId: string,
  cache: Record<string, AdminMaterialRow>,
): CategoryOption[] {
  if (!selectedId || base.some((o) => o.id === selectedId)) return base
  const m = cache[selectedId]
  if (!m) return base
  return [{ id: m.id, label: `${m.code} · ${m.name} (${m.unit})` }, ...base]
}

const emptyDraft = (): ProductFormState => ({
  sku: '',
  name: '',
  categoryId: '',
  costPrice: '',
  suggestedPrice: '',
})

export function AdminProductCreatePage() {
  const fid = useId()
  const navigate = useNavigate()
  const materialSearchSeq = useRef(0)

  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; label: string }>>([])
  const [form, setForm] = useState<ProductFormState>(emptyDraft)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [imageItems, setImageItems] = useState<PendingUploadImage[]>([])

  const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([])
  const [materialCache, setMaterialCache] = useState<Record<string, AdminMaterialRow>>({})
  const [materialLoading, setMaterialLoading] = useState(false)
  const [bomRows, setBomRows] = useState<BomFormRow[]>(() => [emptyBomRow()])

  useEffect(() => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories?page=0&size=200`, {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        })
        const envelope = (await res.json()) as ApiEnvelope<CategoryListResponse>
        if (!res.ok || !envelope.success || !envelope.data) return
        const options = envelope.data.content.map((c) => ({ id: c.id, label: c.name }))
        setCategoryOptions(options)
        setForm((prev) => ({
          ...prev,
          categoryId: prev.categoryId || options[0]?.id || '',
        }))
      } catch {
        // keep UI usable even when category filter API fails
      }
    }
    void run()
  }, [])

  const loadMaterialOptionsForPicker = useCallback(async (query: string) => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    const seq = ++materialSearchSeq.current
    setMaterialLoading(true)
    try {
      const q = new URLSearchParams()
      q.set('page', '0')
      q.set('size', '50')
      q.set('is_active', 'true')
      const t = query.trim()
      if (t) q.set('search', t)
      const res = await fetch(`${API_BASE_URL}/api/admin/materials?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<{
        content: AdminMaterialRow[]
      }>
      if (seq !== materialSearchSeq.current) return
      if (!res.ok || !envelope.success || !envelope.data) {
        setMaterialOptions([])
        return
      }
      const rows = envelope.data.content
      setMaterialOptions(
        rows.map((m) => ({
          id: m.id,
          label: `${m.code} · ${m.name} (${m.unit})`,
        })),
      )
      setMaterialCache((prev) => {
        const next = { ...prev }
        for (const m of rows) next[m.id] = m
        return next
      })
    } catch {
      if (seq !== materialSearchSeq.current) return
      setMaterialOptions([])
    } finally {
      if (seq === materialSearchSeq.current) setMaterialLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMaterialOptionsForPicker('')
  }, [loadMaterialOptionsForPicker])

  const costNum = Number(form.costPrice)
  const suggestedNum = Number(form.suggestedPrice)

  const pricePreview = useMemo(() => {
    if (!Number.isFinite(costNum) || !Number.isFinite(suggestedNum)) return null
    if (costNum < 0 || suggestedNum < 0) return null
    return { cost: costNum, suggested: suggestedNum }
  }, [costNum, suggestedNum])

  const costById = useMemo(() => {
    const m: Record<string, number | undefined> = {}
    for (const mat of Object.values(materialCache)) {
      m[mat.id] = mat.unitCost
    }
    return m
  }, [materialCache])

  const bomCostStatus = useMemo(() => {
    const lines: BomLineLike[] = bomRows
      .map((r) => ({
        materialId: r.materialId.trim(),
        quantity: Number(r.quantity),
      }))
      .filter((r) => r.materialId && Number.isFinite(r.quantity) && r.quantity > 0)

    if (lines.length === 0) return { kind: 'no_bom' as const }

    const s = trySumBomCostVnd(lines, costById)
    if (!s.ok) {
      if (s.reason === 'incomplete') return { kind: 'incomplete' as const }
      return { kind: 'no_bom' as const }
    }

    if (!Number.isFinite(costNum) || costNum < 0) {
      return { kind: 'ok' as const, total: s.total }
    }
    if (s.total > costNum) {
      return { kind: 'suggest' as const, total: s.total, current: costNum }
    }
    return { kind: 'ok' as const, total: s.total }
  }, [bomRows, costById, costNum])

  const addBomRow = useCallback(() => {
    setBomRows((prev) => [...prev, emptyBomRow()])
  }, [])

  const removeBomRow = useCallback((key: string) => {
    setBomRows((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((r) => r.key !== key)
    })
  }, [])

  const patchBomRow = useCallback((key: string, patch: Partial<BomFormRow>) => {
    setBomRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }, [])

  const applyBomCostToCostPrice = useCallback(() => {
    if (bomCostStatus.kind !== 'suggest') return
    setForm((f) => ({ ...f, costPrice: String(Math.round(bomCostStatus.total)) }))
  }, [bomCostStatus])

  const goBack = useCallback(() => {
    navigate(adminPaths.catalog.products)
  }, [navigate])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const accessToken = getAccessToken()
      if (!accessToken) {
        setSubmitError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        return
      }
      const sku = form.sku.trim()
      const name = form.name.trim()
      if (!sku || !name || !form.categoryId) return

      setSubmitError(null)

      if (!Number.isFinite(costNum) || costNum < 0) {
        setSubmitError('Giá vốn không hợp lệ.')
        return
      }
      if (!Number.isFinite(suggestedNum) || suggestedNum < 0) {
        setSubmitError('Giá đề xuất không hợp lệ.')
        return
      }

      const bomItems: AdminCreateProductBomItemPayload[] = bomRows
        .map((r) => ({
          materialId: r.materialId.trim(),
          quantity: Number(r.quantity),
          note: r.note.trim() ? r.note.trim() : undefined,
        }))
        .filter((b) => b.materialId && Number.isFinite(b.quantity) && b.quantity > 0)

      if (bomItems.length === 0) {
        setSubmitError('Thêm ít nhất một dòng BOM: chọn vật tư và số lượng lớn hơn 0.')
        return
      }

      const uniq = new Set(bomItems.map((b) => b.materialId))
      if (uniq.size !== bomItems.length) {
        setSubmitError('Không được chọn trùng vật tư trong BOM.')
        return
      }

      if (imageItems.length === 0) {
        setSubmitError('Vui lòng chọn ít nhất 1 ảnh để tải lên.')
        return
      }

      setSubmitting(true)
      try {
        const finalImageUrls: string[] = []
        for (const imageItem of imageItems) {
          const uploadBody = new FormData()
          uploadBody.append('file', imageItem.file)
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
          finalImageUrls.push(uploadEnvelope.data.url)
        }

        const payload: AdminCreateProductPayload = {
          categoryId: form.categoryId,
          sku,
          name,
          imageUrls: finalImageUrls,
          costPrice: costNum,
          suggestedPrice: suggestedNum,
          bomItems,
        }

        const createRes = await fetch(`${API_BASE_URL}/api/admin/products`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify(payload),
        })
        const createEnvelope = (await createRes.json()) as ApiEnvelope<ProductCreateResponse>
        if (!createRes.ok || !createEnvelope.success || !createEnvelope.data) {
          throw new Error(createEnvelope.message || 'Tạo sản phẩm thất bại')
        }
        navigate(adminPaths.catalog.products)
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không thể tạo sản phẩm')
      } finally {
        setSubmitting(false)
      }
    },
    [form, imageItems, navigate, bomRows, costNum, suggestedNum],
  )

  const appendUploadFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const nextItems: PendingUploadImage[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImageItems((prev) => [...prev, ...nextItems])
  }, [])

  const removeUploadImage = useCallback((id: string) => {
    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }, [])

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [imageItems])

  const requiredMark = (
    <span className="th-admin-product-create__required" aria-hidden="true">
      *
    </span>
  )

  return (
    <div className="th-admin-product-create">
      <div className="th-admin-product-create__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: adminPaths.dashboard },
            { label: 'Danh mục', to: adminPaths.catalog.root },
            { label: 'Sản phẩm', to: adminPaths.catalog.products },
            { label: 'Tạo sản phẩm mới' },
          ]}
        />

        <header className="th-admin-product-create__header">
          <div className="th-admin-product-create__header-main">
            <Link
              to={adminPaths.catalog.products}
              className="th-admin-product-create__back"
            >
              <span className="material-symbols-outlined" aria-hidden>
                arrow_back
              </span>
              Quay lại danh sách
            </Link>
            <h1 className="th-admin-product-create__title">Tạo sản phẩm mới</h1>
            {submitError ? <p className="th-admin-users__api-error">{submitError}</p> : null}
          </div>
        </header>
      </div>

      <form
        className="th-admin-product-create__form th-prod-cpc__form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="th-admin-product-create__cpc-wrap th-prod-cpc">
          <div className="th-prod-cpc__layout">
            <div className="th-prod-cpc__main">
              <section className="th-prod-cpc__card" aria-labelledby={`${fid}-info`}>
                <h2 id={`${fid}-info`} className="th-prod-cpc__card-title">
                  <span className="material-symbols-outlined" aria-hidden>
                    inventory_2
                  </span>
                  Thông tin sản phẩm
                </h2>
                <div className="th-prod-cpc__grid2">
                  <div className="th-prod-cpc__field">
                    <label className="th-prod-cpc__label" htmlFor={`${fid}-sku`}>
                      Mã SKU <abbr title="bắt buộc">*</abbr>
                    </label>
                    <input
                      id={`${fid}-sku`}
                      className="th-prod-cpc__input"
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                      placeholder="VD: KB-005"
                      required
                      autoComplete="off"
                    />
                  </div>
                  <div className="th-prod-cpc__field">
                    <label className="th-prod-cpc__label" htmlFor={`${fid}-name`}>
                      Tên sản phẩm <abbr title="bắt buộc">*</abbr>
                    </label>
                    <input
                      id={`${fid}-name`}
                      className="th-prod-cpc__input"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="VD: Tủ bếp chữ L gỗ MDF"
                      required
                    />
                  </div>
                  <div className="th-prod-cpc__field th-prod-cpc__field--full">
                    <span className="th-prod-cpc__label">Ngành hàng *</span>
                    <CategorySearchSelect
                      variant="field"
                      options={categoryOptions}
                      value={form.categoryId}
                      onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
                    />
                  </div>
                </div>
              </section>

              <section className="th-prod-cpc__card" aria-labelledby={`${fid}-price`}>
                <h2 id={`${fid}-price`} className="th-prod-cpc__card-title">
                  <span className="material-symbols-outlined" aria-hidden>
                    payments
                  </span>
                  Giá
                </h2>
                <div className="th-prod-cpc__grid2">
                  <div className="th-prod-cpc__field">
                    <label className="th-prod-cpc__label" htmlFor={`${fid}-cost`}>
                      Giá vốn (VND) <abbr title="bắt buộc">*</abbr>
                    </label>
                    <input
                      id={`${fid}-cost`}
                      className="th-prod-cpc__input"
                      type="number"
                      min={0}
                      step={1000}
                      inputMode="numeric"
                      value={form.costPrice}
                      onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="th-prod-cpc__field">
                    <label className="th-prod-cpc__label" htmlFor={`${fid}-sug`}>
                      Giá đề xuất (VND) <abbr title="bắt buộc">*</abbr>
                    </label>
                    <input
                      id={`${fid}-sug`}
                      className="th-prod-cpc__input"
                      type="number"
                      min={0}
                      step={10000}
                      inputMode="numeric"
                      value={form.suggestedPrice}
                      onChange={(e) => setForm((f) => ({ ...f, suggestedPrice: e.target.value }))}
                      required
                    />
                  </div>
                  {pricePreview ? (
                    <div className="th-prod-cpc__field th-prod-cpc__field--full">
                      <p className="th-prod-cpc__preview">
                        So sánh nhanh: vốn <strong>{formatVND(pricePreview.cost)}</strong> → đề xuất{' '}
                        <strong>{formatVND(pricePreview.suggested)}</strong>
                        {pricePreview.suggested > 0 && pricePreview.cost >= 0 ? (
                          <>
                            {' '}
                            (biên gộp ~{Math.round((1 - pricePreview.cost / pricePreview.suggested) * 100)}%)
                          </>
                        ) : null}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="th-prod-cpc__card" aria-labelledby={`${fid}-media`}>
                <h2 id={`${fid}-media`} className="th-prod-cpc__card-title">
                  <span className="material-symbols-outlined" aria-hidden>
                    image
                  </span>
                  Ảnh đại diện
                </h2>
                <div className="th-prod-cpc__grid2">
                  <label className="th-prod-cpc__field th-prod-cpc__field--full">
                    <span className="th-prod-cpc__label">
                      Ảnh từ máy (nhiều ảnh){requiredMark}
                    </span>
                    <input
                      className="th-prod-cpc__input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        appendUploadFiles(e.target.files)
                        e.currentTarget.value = ''
                      }}
                      required
                    />
                    <span className="th-prod-cpc__hint">
                      Đã chọn {imageItems.length} ảnh.
                    </span>
                  </label>
                  <div className="th-prod-cpc__field th-prod-cpc__field--full">
                    <div className="th-admin-product-create__images-grid" aria-live="polite">
                      {imageItems.map((item, index) => (
                        <figure key={item.id} className="th-admin-product-create__image-card">
                          <img
                            src={item.previewUrl}
                            alt={`Ảnh sản phẩm ${index + 1}`}
                            className="th-admin-product-create__image-preview"
                          />
                          <figcaption className="th-admin-product-create__image-name" title={item.file.name}>
                            {item.file.name}
                          </figcaption>
                          <button
                            type="button"
                            className="th-admin-product-create__btn-icon-remove"
                            onClick={() => removeUploadImage(item.id)}
                            aria-label={`Xóa ảnh ${item.file.name}`}
                          >
                            <span className="material-symbols-outlined" aria-hidden>
                              close
                            </span>
                          </button>
                        </figure>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <aside className="th-prod-cpc__aside">
              <section className="th-prod-cpc__card" aria-labelledby={`${fid}-bom`}>
                <h2 id={`${fid}-bom`} className="th-prod-cpc__card-title">
                  <span className="material-symbols-outlined" aria-hidden>
                    precision_manufacturing
                  </span>
                  BOM vật tư
                </h2>

                {bomCostStatus.kind === 'ok' || bomCostStatus.kind === 'suggest' ? (
                  <p className="th-prod-cpc__bom-summary">
                    Ước tính NVL theo định mức: <strong>{formatVND(bomCostStatus.total)}</strong>
                    {Number.isFinite(costNum) && costNum >= 0 ? (
                      <>
                        {' '}
                        · Giá vốn nhập: <strong>{formatVND(costNum)}</strong>
                      </>
                    ) : null}
                  </p>
                ) : null}

                {bomCostStatus.kind === 'suggest' ? (
                  <div className="th-prod-cpc__cost-warn" role="status">
                    <span className="material-symbols-outlined" aria-hidden>
                      price_change
                    </span>
                    <div>
                      <strong>Tổng chi phí NVL ước tính cao hơn giá vốn đã nhập.</strong> NVL ~{' '}
                      {formatVND(bomCostStatus.total)} so với giá vốn {formatVND(bomCostStatus.current)}.
                      <div className="th-prod-cpc__cost-warn-actions">
                        <button
                          type="button"
                          className="th-prod-cpc__btn-warn"
                          onClick={applyBomCostToCostPrice}
                        >
                          Đặt giá vốn = {formatVND(bomCostStatus.total)}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {bomCostStatus.kind === 'incomplete' ? (
                  <p className="th-prod-cpc__est-warn" role="status">
                    Chưa đủ <strong>đơn giá NVL</strong> cho toàn bộ dòng đã chọn — không ước tính được tổng BOM (đang tải
                    chi tiết vật tư hoặc thiếu dữ liệu).
                  </p>
                ) : null}

                <div className="th-prod-cpc__bom">
                  {bomRows.map((row, idx) => (
                    <div key={row.key} className="th-prod-cpc__bom-row">
                      <div className="th-prod-cpc__field th-prod-cpc__field--material-select">
                        <label className="th-prod-cpc__label" id={`${fid}-ml-${row.key}`}>
                          Vật tư #{idx + 1}
                        </label>
                        <CategorySearchSelect
                          variant="field"
                          aria-labelledby={`${fid}-ml-${row.key}`}
                          options={mergeMaterialSelectOptions(materialOptions, row.materialId, materialCache)}
                          value={row.materialId}
                          onChange={(id) => patchBomRow(row.key, { materialId: id })}
                          placeholder={materialLoading ? 'Đang tải danh mục…' : 'Chọn vật tư…'}
                          searchPlaceholder="Tìm mã / tên vật tư…"
                          remoteSearch
                          onRemoteSearch={loadMaterialOptionsForPicker}
                        />
                      </div>
                      <div className="th-prod-cpc__field">
                        <label className="th-prod-cpc__label" htmlFor={`${fid}-q-${row.key}`}>
                          SL
                        </label>
                        <input
                          id={`${fid}-q-${row.key}`}
                          className="th-prod-cpc__input"
                          type="number"
                          min={0.0001}
                          step="any"
                          inputMode="decimal"
                          value={row.quantity}
                          onChange={(e) => patchBomRow(row.key, { quantity: e.target.value })}
                        />
                      </div>
                      <div className="th-prod-cpc__field">
                        <label className="th-prod-cpc__label" htmlFor={`${fid}-n-${row.key}`}>
                          Ghi chú
                        </label>
                        <input
                          id={`${fid}-n-${row.key}`}
                          className="th-prod-cpc__input"
                          placeholder="Tùy chọn"
                          value={row.note}
                          onChange={(e) => patchBomRow(row.key, { note: e.target.value })}
                        />
                      </div>
                      <div className="th-prod-cpc__bom-actions">
                        <button
                          type="button"
                          className="th-prod-cpc__icon-btn"
                          disabled={bomRows.length <= 1}
                          onClick={() => removeBomRow(row.key)}
                          aria-label={`Xóa dòng BOM ${idx + 1}`}
                        >
                          <span className="material-symbols-outlined" aria-hidden>
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="th-prod-cpc__add-bom" onClick={addBomRow}>
                  <span className="material-symbols-outlined" aria-hidden style={{ fontSize: '1.1rem' }}>
                    add
                  </span>
                  Thêm dòng BOM
                </button>
              </section>
            </aside>
          </div>

          <div className="th-prod-cpc__foot">
            <button type="button" className="th-admin-product-create__btn-ghost" onClick={goBack}>
              Hủy
            </button>
            <button type="submit" className="th-prod-cpc__submit" disabled={submitting}>
              <span className="material-symbols-outlined" aria-hidden>
                check_circle
              </span>
              {submitting ? 'Đang tạo…' : 'Tạo sản phẩm'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
