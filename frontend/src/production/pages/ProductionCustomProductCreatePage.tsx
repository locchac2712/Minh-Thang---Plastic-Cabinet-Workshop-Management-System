import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CategorySearchSelect, type CategoryOption } from '../../admin/components/CategorySearchSelect/CategorySearchSelect'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  formatVndInputAmount,
  normalizeVndInputTyping,
  parseVndInput,
} from '../../shared/money/vndInput'
import { ProductionAgencyPickSelect } from '../components/ProductionAgencyPickSelect'
import {
  createProductionCustomProduct,
  isPdfUploadFile,
  uploadProductionDocumentFile,
} from '../productionCustomProductsApi'
import { productionPaths } from '../config/productionPaths'
import { fetchProductionMaterials, fetchProductionMaterialById, uploadProductionImageFile, type ProductionMaterialDto } from '../productionTasksApi'
import './ProductionCustomProductCreatePage.css'
import './ProductionCustomProductDetailPage.css'

function newBomKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bom-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type BomFormRow = {
  key: string
  materialId: string
  quantity: string
  note: string
}

type PendingUploadImage = {
  id: string
  file: File
  previewUrl: string
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

function materialOptionLabel(m: Pick<ProductionMaterialDto, 'name' | 'code'>): string {
  const name = m.name.trim()
  const code = m.code.trim()
  if (name && code) return `${name} · ${code}`
  return name || code || '—'
}

function mergeMaterialSelectOptions(
  base: CategoryOption[],
  selectedId: string,
  cache: Record<string, ProductionMaterialDto>,
): CategoryOption[] {
  if (!selectedId || base.some((o) => o.id === selectedId)) return base
  const m = cache[selectedId]
  if (!m) return base
  return [{ id: m.id, label: materialOptionLabel(m) }, ...base]
}

function materialUnitLabel(
  materialId: string,
  cache: Record<string, ProductionMaterialDto>,
): string {
  const u = cache[materialId.trim()]?.unit?.trim()
  return u || '—'
}

export function ProductionCustomProductCreatePage() {
  const navigate = useNavigate()
  const fid = useId()
  const materialSearchSeq = useRef(0)
  const [agencyId, setAgencyId] = useState('')

  const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([])
  const [materialCache, setMaterialCache] = useState<Record<string, ProductionMaterialDto>>({})
  const [materialLoading, setMaterialLoading] = useState(false)

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [imageItems, setImageItems] = useState<PendingUploadImage[]>([])
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [resourcePreview, setResourcePreview] = useState<string | null>(null)
  const [costPrice, setCostPrice] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [bomRows, setBomRows] = useState<BomFormRow[]>(() => [emptyBomRow()])

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadMaterialOptionsForPicker = useCallback(async (query: string) => {
    const seq = ++materialSearchSeq.current
    setMaterialLoading(true)
    try {
      const data = await fetchProductionMaterials({
        page: 0,
        size: 50,
        search: query.trim() || undefined,
        isActive: true,
      })
      if (seq !== materialSearchSeq.current) return
      setMaterialOptions(
        data.content.map((m) => ({
          id: m.id,
          label: materialOptionLabel(m),
        })),
      )
      setMaterialCache((prev) => {
        const next = { ...prev }
        for (const m of data.content) next[m.id] = m
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

  useEffect(() => {
    if (!resourceFile) {
      setResourcePreview(null)
      return
    }
    if (isPdfUploadFile(resourceFile)) {
      setResourcePreview(null)
      return
    }
    const url = URL.createObjectURL(resourceFile)
    setResourcePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [resourceFile])

  useEffect(() => {
    return () => {
      imageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [imageItems])

  const appendImageFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const nextItems: PendingUploadImage[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImageItems((prev) => [...prev, ...nextItems])
  }, [])

  const removeImageFile = useCallback((id: string) => {
    setImageItems((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }, [])

  const costNum = parseVndInput(costPrice) ?? NaN
  const suggestedNum = parseVndInput(suggestedPrice) ?? NaN
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

  const pickBomMaterial = useCallback(
    (rowKey: string, materialId: string) => {
      patchBomRow(rowKey, { materialId })
      const id = materialId.trim()
      if (!id) return
      void fetchProductionMaterialById(id).then((m) => {
        if (!m) return
        setMaterialCache((prev) => (prev[m.id] ? prev : { ...prev, [m.id]: m }))
      })
    },
    [patchBomRow],
  )

  const resetProductFields = useCallback(() => {
    setSku('')
    setName('')
    setImageItems((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      return []
    })
    setResourceFile(null)
    setCostPrice('')
    setSuggestedPrice('')
    setBomRows([emptyBomRow()])
    setSubmitError(null)
  }, [])

  const applyBomCostToCostPrice = useCallback(() => {
    if (bomCostStatus.kind !== 'suggest') return
    setCostPrice(formatVndInputAmount(Math.round(bomCostStatus.total)))
  }, [bomCostStatus])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setSuccessMsg(null)

      const aid = agencyId.trim()
      if (!aid) {
        setSubmitError('Vui lòng chọn đại lý.')
        return
      }
      const skuT = sku.trim()
      const nameT = name.trim()
      if (!skuT || !nameT) {
        setSubmitError('Mã hàng và tên sản phẩm là bắt buộc.')
        return
      }
      if (!Number.isFinite(costNum) || costNum < 0) {
        setSubmitError('Giá vốn không hợp lệ.')
        return
      }
      if (!Number.isFinite(suggestedNum) || suggestedNum < 0) {
        setSubmitError('Giá đề xuất không hợp lệ.')
        return
      }

      const bomItems = bomRows
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

      setSubmitting(true)
      try {
        const imageUrls: string[] = []
        for (const item of imageItems) {
          imageUrls.push(await uploadProductionImageFile(item.file))
        }
        let uploadedResourceUrl: string | null = null
        if (resourceFile) {
          uploadedResourceUrl = isPdfUploadFile(resourceFile)
            ? await uploadProductionDocumentFile(resourceFile)
            : await uploadProductionImageFile(resourceFile)
        }

        const created = await createProductionCustomProduct({
          agencyId: aid,
          sku: skuT,
          name: nameT,
          imageUrls,
          resourceUrl: uploadedResourceUrl,
          costPrice: costNum,
          suggestedPrice: suggestedNum,
          bomItems,
        })
        setSuccessMsg(
          `Đã tạo sản phẩm custom: ${created.name} (mã hàng ${created.sku}).`,
        )
        resetProductFields()
        navigate(productionPaths.customProducts.detail(created.id))
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không gửi được yêu cầu')
      } finally {
        setSubmitting(false)
      }
    },
    [agencyId, sku, name, costNum, suggestedNum, bomRows, imageItems, resourceFile, resetProductFields, navigate],
  )

  return (
    <div className="th-prod-cpc">
      <header className="th-prod-cpc__header">
        <Link to={productionPaths.customProducts.list} className="th-prod-cp-detail__back">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Danh sách sản phẩm custom
        </Link>
        <h1 className="th-prod-cpc__title">
          <span className="material-symbols-outlined" aria-hidden>
            design_services
          </span>
          Tạo sản phẩm custom
        </h1>
      </header>

      {successMsg ? (
        <p className="th-prod-cpc__ok" role="status">
          {successMsg}
        </p>
      ) : null}
      {submitError ? (
        <p className="th-prod-cpc__err" role="alert">
          {submitError}
        </p>
      ) : null}

      <form className="th-prod-cpc__form" onSubmit={(ev) => void handleSubmit(ev)} noValidate>
        <div className="th-prod-cpc__layout">
          <div className="th-prod-cpc__section-actions th-prod-cpc__section-actions--span">
            <button type="submit" className="th-prod-cpc__submit" disabled={submitting}>
              <span className="material-symbols-outlined" aria-hidden>
                save
              </span>
              {submitting ? 'Đang gửi…' : 'Tạo sản phẩm'}
            </button>
          </div>
          <div className="th-prod-cpc__main">
            <section className="th-prod-cpc__card" aria-labelledby={`${fid}-agency`}>
              <h2 id={`${fid}-agency`} className="th-prod-cpc__card-title">
                <span className="material-symbols-outlined" aria-hidden>
                  handshake
                </span>
                Đại lý
              </h2>
              <div className="th-prod-cpc__grid2">
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-agency-id`}>
                    Đại lý <abbr title="bắt buộc">*</abbr>
                  </label>
                  <ProductionAgencyPickSelect
                    id={`${fid}-agency-id`}
                    className="th-prod-cpc__agency-select"
                    value={agencyId}
                    onChangeValue={(id) => setAgencyId(id)}
                  />
                  <p className="th-prod-cpc__field-hint">Gõ trong dropdown để tìm tên hoặc MST.</p>
                </div>
              </div>
            </section>

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
                    Mã hàng <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-sku`}
                    className="th-prod-cpc__input"
                    autoComplete="off"
                    placeholder="san-pham-cus"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-name`}>
                    Tên hiển thị <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-name`}
                    className="th-prod-cpc__input"
                    placeholder="Tủ custom theo bản vẽ…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-cost`}>
                    Giá vốn (VND) <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-cost`}
                    className="th-prod-cpc__input th-prod-cpc__input--money"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(normalizeVndInputTyping(e.target.value))}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-sug`}>
                    Giá đề xuất bán (VND) <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-sug`}
                    className="th-prod-cpc__input th-prod-cpc__input--money"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="0"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(normalizeVndInputTyping(e.target.value))}
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
                  upload_file
                </span>
                Ảnh &amp; tài liệu
              </h2>
              <div className="th-prod-cpc__media-stack">
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <span className="th-prod-cpc__label" id={`${fid}-imgs-label`}>
                    Ảnh sản phẩm
                  </span>
                  <div className="th-prod-cpc__upload">
                    <input
                      id={`${fid}-imgs`}
                      className="th-prod-cpc__upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={submitting}
                      aria-labelledby={`${fid}-imgs-label`}
                      onChange={(e) => {
                        appendImageFiles(e.target.files)
                        e.currentTarget.value = ''
                      }}
                    />
                    <label htmlFor={`${fid}-imgs`} className="th-prod-cpc__upload-btn">
                      <span className="material-symbols-outlined" aria-hidden>
                        add_photo_alternate
                      </span>
                      Chọn ảnh từ máy
                    </label>
                  </div>
                  <p className="th-prod-cpc__hint">
                    {imageItems.length > 0
                      ? `Đã chọn ${imageItems.length} ảnh — JPG, PNG, WebP (tối đa 5MB/ảnh).`
                      : 'Tuỳ chọn — có thể chọn nhiều ảnh.'}
                  </p>
                  {imageItems.length > 0 ? (
                    <div className="th-prod-cpc__images-grid" aria-live="polite">
                      {imageItems.map((item, index) => (
                        <figure key={item.id} className="th-prod-cpc__image-card">
                          <img
                            src={item.previewUrl}
                            alt={`Ảnh sản phẩm ${index + 1}`}
                            className="th-prod-cpc__image-preview"
                          />
                          <figcaption className="th-prod-cpc__image-name" title={item.file.name}>
                            {item.file.name}
                          </figcaption>
                          <button
                            type="button"
                            className="th-prod-cpc__image-remove"
                            disabled={submitting}
                            onClick={() => removeImageFile(item.id)}
                            aria-label={`Gỡ ảnh ${item.file.name}`}
                          >
                            <span className="material-symbols-outlined" aria-hidden>
                              close
                            </span>
                          </button>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <span className="th-prod-cpc__label" id={`${fid}-res-label`}>
                    Bản vẽ / tài liệu tham chiếu
                  </span>
                  <div className="th-prod-cpc__upload">
                    <input
                      id={`${fid}-res`}
                      className="th-prod-cpc__upload-input"
                      type="file"
                      accept="image/*,application/pdf,.pdf"
                      disabled={submitting}
                      aria-labelledby={`${fid}-res-label`}
                      onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
                    />
                    <label htmlFor={`${fid}-res`} className="th-prod-cpc__upload-btn">
                      <span className="material-symbols-outlined" aria-hidden>
                        description
                      </span>
                      {resourceFile ? 'Đổi tệp' : 'Chọn tệp từ máy'}
                    </label>
                    {resourceFile ? (
                      <button
                        type="button"
                        className="th-prod-cpc__upload-clear"
                        disabled={submitting}
                        onClick={() => setResourceFile(null)}
                      >
                        Gỡ tệp
                      </button>
                    ) : null}
                  </div>
                  {resourceFile ? (
                    <p className="th-prod-cpc__hint">{resourceFile.name}</p>
                  ) : (
                    <p className="th-prod-cpc__hint">Tuỳ chọn — ảnh bản vẽ hoặc file PDF (tối đa 10MB).</p>
                  )}
                  {resourceFile && isPdfUploadFile(resourceFile) ? (
                    <div className="th-prod-cpc__resource-pdf">
                      <span className="material-symbols-outlined" aria-hidden>
                        picture_as_pdf
                      </span>
                      <span>{resourceFile.name}</span>
                    </div>
                  ) : resourcePreview ? (
                    <div className="th-prod-cpc__resource-preview">
                      <img src={resourcePreview} alt="Xem trước tài liệu" />
                    </div>
                  ) : null}
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
                    {formatVND(bomCostStatus.total)} so với giá vốn {formatVND(bomCostStatus.current)} (giống cảnh báo
                    admin BOM).
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

              <div className="th-prod-cpc__bom-table-wrap">
                <table className="th-prod-cpc__bom-table">
                  <thead>
                    <tr>
                      <th className="th-prod-cpc__bom-col-idx">#</th>
                      <th className="th-prod-cpc__bom-col-material">Vật tư</th>
                      <th className="th-prod-cpc__bom-col-unit">ĐVT</th>
                      <th className="th-prod-cpc__bom-col-qty">SL</th>
                      <th>Ghi chú</th>
                      <th className="th-prod-cpc__bom-col-act">
                        <span className="th-prod-cpc__sr-only">Thao tác</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomRows.map((row, idx) => (
                      <tr key={row.key}>
                        <td className="th-prod-cpc__bom-muted">{idx + 1}</td>
                        <td className="th-prod-cpc__bom-cell-material">
                          <label className="th-prod-cpc__sr-only" id={`${fid}-ml-${row.key}`}>
                            Vật tư #{idx + 1}
                          </label>
                          <CategorySearchSelect
                            variant="field"
                            aria-labelledby={`${fid}-ml-${row.key}`}
                            options={mergeMaterialSelectOptions(materialOptions, row.materialId, materialCache)}
                            value={row.materialId}
                            onChange={(id) => pickBomMaterial(row.key, id)}
                            placeholder={materialLoading ? 'Đang tải…' : 'Chọn vật tư…'}
                            searchPlaceholder="Tìm mã / tên vật tư…"
                            remoteSearch
                            onRemoteSearch={loadMaterialOptionsForPicker}
                          />
                        </td>
                        <td className="th-prod-cpc__bom-unit">
                          {materialUnitLabel(row.materialId, materialCache)}
                        </td>
                        <td className="th-prod-cpc__bom-cell-qty">
                          <label className="th-prod-cpc__sr-only" htmlFor={`${fid}-q-${row.key}`}>
                            Số lượng dòng {idx + 1}
                          </label>
                          <input
                            id={`${fid}-q-${row.key}`}
                            className="th-prod-cpc__input th-prod-cpc__input--qty"
                            type="number"
                            min={0.0001}
                            step="any"
                            inputMode="decimal"
                            value={row.quantity}
                            onChange={(e) => patchBomRow(row.key, { quantity: e.target.value })}
                          />
                        </td>
                        <td className="th-prod-cpc__bom-cell-note">
                          <label className="th-prod-cpc__sr-only" htmlFor={`${fid}-n-${row.key}`}>
                            Ghi chú dòng {idx + 1}
                          </label>
                          <input
                            id={`${fid}-n-${row.key}`}
                            className="th-prod-cpc__input"
                            placeholder="Tùy chọn"
                            value={row.note}
                            onChange={(e) => patchBomRow(row.key, { note: e.target.value })}
                          />
                        </td>
                        <td className="th-prod-cpc__bom-cell-act">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      </form>
    </div>
  )
}
