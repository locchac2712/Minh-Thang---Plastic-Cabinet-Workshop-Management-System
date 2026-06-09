import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CategorySearchSelect, type CategoryOption } from '../../admin/components/CategorySearchSelect/CategorySearchSelect'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  formatVndInputAmount,
  normalizeVndInputTyping,
  parseVndInput,
} from '../../shared/money/vndInput'
import { ProductionAgencyPickSelect } from '../components/ProductionAgencyPickSelect'
import { productionPaths } from '../config/productionPaths'
import {
  fetchProductionCustomProductBom,
  fetchProductionCustomProductById,
  isPdfUploadFile,
  updateProductionCustomProduct,
  uploadProductionDocumentFile,
  type ProductionCustomProductBomLineDto,
  type ProductionCustomProductDto,
} from '../productionCustomProductsApi'
import {
  fetchProductionMaterialById,
  fetchProductionMaterials,
  uploadProductionImageFile,
  type ProductionMaterialDto,
} from '../productionTasksApi'
import './ProductionCustomProductCreatePage.css'
import './ProductionCustomProductDetailPage.css'

function newBomKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `bom-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type BomFormRow = { key: string; materialId: string; quantity: string; note: string }
type PendingUploadImage = { id: string; file: File; previewUrl: string }
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

function materialUnitLabel(materialId: string, cache: Record<string, ProductionMaterialDto>): string {
  return cache[materialId.trim()]?.unit?.trim() || '—'
}

function bomToFormRows(lines: ProductionCustomProductBomLineDto[]): BomFormRow[] {
  if (lines.length === 0) {
    return [{ key: newBomKey(), materialId: '', quantity: '1', note: '' }]
  }
  return lines.map((l) => ({
    key: l.id || newBomKey(),
    materialId: l.materialId,
    quantity: String(l.quantity),
    note: l.note ?? '',
  }))
}

const DEFAULT_IMAGE = 'https://res.cloudinary.com/demo/image/upload/sample.jpg'

export function ProductionCustomProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const fid = useId()
  const materialSearchSeq = useRef(0)

  const [product, setProduct] = useState<ProductionCustomProductDto | null>(null)
  const [bomLines, setBomLines] = useState<ProductionCustomProductBomLineDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [agencyId, setAgencyId] = useState('')
  const [agencyLabel, setAgencyLabel] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [suggestedPrice, setSuggestedPrice] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [resourceUrl, setResourceUrl] = useState<string | null>(null)
  const [imageItems, setImageItems] = useState<PendingUploadImage[]>([])
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [bomRows, setBomRows] = useState<BomFormRow[]>([])

  const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([])
  const [materialCache, setMaterialCache] = useState<Record<string, ProductionMaterialDto>>({})
  const [materialLoading, setMaterialLoading] = useState(false)

  const load = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    setLoadError(null)
    try {
      const [p, bom] = await Promise.all([
        fetchProductionCustomProductById(productId),
        fetchProductionCustomProductBom(productId),
      ])
      setProduct(p)
      setBomLines(bom)
    } catch (e) {
      setProduct(null)
      setBomLines([])
      setLoadError(e instanceof Error ? e.message : 'Không tải được sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void load()
  }, [load])

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
      setMaterialOptions(data.content.map((m) => ({ id: m.id, label: materialOptionLabel(m) })))
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
    if (editing) void loadMaterialOptionsForPicker('')
  }, [editing, loadMaterialOptionsForPicker])

  const beginEdit = useCallback(() => {
    if (!product) return
    setAgencyId(product.agencyId)
    setAgencyLabel(product.agencyName)
    setName(product.name)
    setCostPrice(formatVndInputAmount(product.costPrice))
    setSuggestedPrice(formatVndInputAmount(product.suggestedPrice))
    setImageUrls([...product.imageUrls])
    setResourceUrl(product.resourceUrl)
    setImageItems([])
    setResourceFile(null)
    setBomRows(bomToFormRows(bomLines))
    setSaveError(null)
    setNotice(null)
    setEditing(true)

    const ids = [...new Set(bomLines.map((l) => l.materialId.trim()).filter(Boolean))]
    if (ids.length > 0) {
      void Promise.all(ids.map((id) => fetchProductionMaterialById(id))).then((materials) => {
        setMaterialCache((prev) => {
          const next = { ...prev }
          for (const m of materials) {
            if (m) next[m.id] = m
          }
          return next
        })
      })
    }
  }, [product, bomLines])

  const cancelEdit = useCallback(() => {
    imageItems.forEach((i) => URL.revokeObjectURL(i.previewUrl))
    setImageItems([])
    setResourceFile(null)
    setEditing(false)
    setSaveError(null)
  }, [imageItems])

  const costNum = parseVndInput(costPrice)
  const suggestedNum = parseVndInput(suggestedPrice)

  const costById = useMemo(() => {
    const m: Record<string, number | undefined> = {}
    for (const mat of Object.values(materialCache)) {
      m[mat.id] = mat.unitCost
    }
    return m
  }, [materialCache])

  const bomCostStatus = useMemo(() => {
    if (!editing) return { kind: 'idle' as const }

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

    if (costNum == null || !Number.isFinite(costNum) || costNum < 0) {
      return { kind: 'ok' as const, total: s.total }
    }
    if (s.total > costNum) {
      return { kind: 'suggest' as const, total: s.total, current: costNum }
    }
    return { kind: 'ok' as const, total: s.total }
  }, [editing, bomRows, costById, costNum])

  const viewBomCostStatus = useMemo(() => {
    if (editing || bomLines.length === 0) return { kind: 'idle' as const }

    const costMap: Record<string, number | undefined> = {}
    for (const l of bomLines) {
      costMap[l.materialId] = l.materialUnitCost ?? undefined
    }
    const lines = bomLines.map((l) => ({ materialId: l.materialId, quantity: l.quantity }))
    const s = trySumBomCostVnd(lines, costMap)
    if (!s.ok) {
      if (s.reason === 'incomplete') return { kind: 'incomplete' as const }
      return { kind: 'idle' as const }
    }
    const current = product?.costPrice
    if (current != null && s.total > current) {
      return { kind: 'suggest' as const, total: s.total, current }
    }
    return { kind: 'ok' as const, total: s.total }
  }, [editing, bomLines, product?.costPrice])

  const applyBomCostToCostPrice = useCallback(() => {
    if (bomCostStatus.kind !== 'suggest') return
    setCostPrice(formatVndInputAmount(Math.round(bomCostStatus.total)))
  }, [bomCostStatus])

  const pickBomMaterial = useCallback(
    (rowKey: string, materialId: string) => {
      setBomRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, materialId } : r)))
      if (materialId && !materialCache[materialId]) {
        void fetchProductionMaterialById(materialId).then((m) => {
          if (!m) return
          setMaterialCache((prev) => ({ ...prev, [m.id]: m }))
        })
      }
    },
    [materialCache],
  )

  const handleSave = useCallback(async () => {
    if (!productId || !product || saving) return
    const nameT = name.trim()
    const aid = agencyId.trim()
    if (!aid || !nameT) {
      setSaveError('Đại lý và tên sản phẩm là bắt buộc.')
      return
    }
    if (costNum == null || costNum < 0 || suggestedNum == null || suggestedNum < 0) {
      setSaveError('Giá vốn và giá đề xuất không hợp lệ.')
      return
    }

    const bomItems = bomRows
      .map((r) => ({
        materialId: r.materialId.trim(),
        quantity: Number(r.quantity),
        note: r.note.trim() || undefined,
      }))
      .filter((b) => b.materialId && Number.isFinite(b.quantity) && b.quantity > 0)

    if (bomItems.length === 0) {
      setSaveError('BOM cần ít nhất một dòng vật tư hợp lệ.')
      return
    }
    if (new Set(bomItems.map((b) => b.materialId)).size !== bomItems.length) {
      setSaveError('Không được trùng vật tư trong BOM.')
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      const uploadedImages: string[] = []
      for (const item of imageItems) {
        uploadedImages.push(await uploadProductionImageFile(item.file))
      }
      let nextResourceUrl = resourceUrl
      if (resourceFile) {
        nextResourceUrl = isPdfUploadFile(resourceFile)
          ? await uploadProductionDocumentFile(resourceFile)
          : await uploadProductionImageFile(resourceFile)
      }

      const updated = await updateProductionCustomProduct(productId, {
        agencyId: aid,
        name: nameT,
        imageUrls: [...imageUrls, ...uploadedImages],
        resourceUrl: nextResourceUrl,
        costPrice: costNum,
        suggestedPrice: suggestedNum,
        bomItems,
      })

      imageItems.forEach((i) => URL.revokeObjectURL(i.previewUrl))
      setImageItems([])
      setResourceFile(null)
      setProduct(updated)
      const bom = await fetchProductionCustomProductBom(productId)
      setBomLines(bom)
      setEditing(false)
      setNotice('Đã lưu thay đổi.')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Không lưu được')
    } finally {
      setSaving(false)
    }
  }, [
    productId,
    product,
    saving,
    name,
    agencyId,
    costNum,
    suggestedNum,
    bomRows,
    imageItems,
    imageUrls,
    resourceUrl,
    resourceFile,
  ])

  if (!productId) return <Navigate to={productionPaths.customProducts.list} replace />

  if (loading) {
    return <div className="th-prod-cp-detail th-prod-cp-detail--loading">Đang tải…</div>
  }

  if (!product) {
    return (
      <div className="th-prod-cp-detail">
        <p className="th-prod-cpc__err" role="alert">
          {loadError ?? 'Không tìm thấy sản phẩm.'}
        </p>
        <Link to={productionPaths.customProducts.list} className="th-prod-cp-detail__back">
          ← Danh sách
        </Link>
      </div>
    )
  }

  return (
    <div className="th-prod-cp-detail">
      <div className="th-prod-cp-detail__top">
        <Link to={productionPaths.customProducts.list} className="th-prod-cp-detail__back">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Danh sách sản phẩm custom
        </Link>
      </div>

      {notice ? <p className="th-prod-cpc__ok" role="status">{notice}</p> : null}
      {saveError ? <p className="th-prod-cpc__err" role="alert">{saveError}</p> : null}

      <header className="th-prod-cp-detail__hero">
        <img
          src={product.imageUrls[0] || DEFAULT_IMAGE}
          alt=""
          className="th-prod-cp-detail__hero-img"
        />
        <div className="th-prod-cp-detail__hero-body">
          <p className="th-prod-cp-detail__sku">{product.sku}</p>
          <h1 className="th-prod-cp-detail__title">{editing ? name || product.name : product.name}</h1>
          <div className="th-prod-cp-detail__meta">
            <span>{product.agencyName?.trim() || '—'}</span>
            <span>{formatVND(product.suggestedPrice)}</span>
            <span className={product.isActive ? 'th-prod-cp-detail__badge--ok' : 'th-prod-cp-detail__badge--off'}>
              {product.isActive ? 'Đang bán' : 'Ngừng bán'}
            </span>
          </div>
        </div>
        {!editing ? (
          <div className="th-prod-cpc__section-actions th-prod-cpc__section-actions--hero">
            <button type="button" className="th-prod-cp-detail__btn-primary" onClick={beginEdit}>
              <span className="material-symbols-outlined" aria-hidden>
                edit
              </span>
              Chỉnh sửa
            </button>
          </div>
        ) : null}
      </header>

      {!editing ? (
        <>
          <dl className="th-prod-cp-detail__dl">
            <div className="th-prod-cp-detail__dl-row">
              <dt>Đại lý</dt>
              <dd>{product.agencyName?.trim() || product.agencyId}</dd>
            </div>
            <div className="th-prod-cp-detail__dl-row">
              <dt>Giá vốn</dt>
              <dd>{formatVND(product.costPrice)}</dd>
            </div>
            <div className="th-prod-cp-detail__dl-row">
              <dt>Giá đề xuất</dt>
              <dd>{formatVND(product.suggestedPrice)}</dd>
            </div>
            <div className="th-prod-cp-detail__dl-row">
              <dt>Tồn kho</dt>
              <dd>{product.stockQuantity}</dd>
            </div>
            <div className="th-prod-cp-detail__dl-row">
              <dt>Ngày tạo</dt>
              <dd>{new Date(product.createdAt).toLocaleString('vi-VN')}</dd>
            </div>
            {product.resourceUrl ? (
              <div className="th-prod-cp-detail__dl-row">
                <dt>Tài liệu</dt>
                <dd>
                  <a href={product.resourceUrl} target="_blank" rel="noreferrer" className="th-prod-cp-detail__link">
                    Mở bản vẽ / PDF
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <section className="th-prod-cpc__card" aria-labelledby={`${fid}-bom-view`}>
            <h2 id={`${fid}-bom-view`} className="th-prod-cpc__card-title">
              <span className="material-symbols-outlined" aria-hidden>
                precision_manufacturing
              </span>
              BOM vật tư
            </h2>
            {bomLines.length === 0 ? (
              <p className="th-prod-cpc__hint">Chưa có dòng BOM.</p>
            ) : (
              <>
                {viewBomCostStatus.kind === 'ok' || viewBomCostStatus.kind === 'suggest' ? (
                  <p className="th-prod-cpc__bom-summary">
                    Ước tính NVL theo định mức: <strong>{formatVND(viewBomCostStatus.total)}</strong>
                    {product.costPrice >= 0 ? (
                      <>
                        {' '}
                        · Giá vốn: <strong>{formatVND(product.costPrice)}</strong>
                      </>
                    ) : null}
                  </p>
                ) : null}
                {viewBomCostStatus.kind === 'suggest' ? (
                  <div className="th-prod-cpc__cost-warn" role="status">
                    <span className="material-symbols-outlined" aria-hidden>
                      price_change
                    </span>
                    <div>
                      <strong>Tổng chi phí NVL ước tính cao hơn giá vốn.</strong> NVL ~{' '}
                      {formatVND(viewBomCostStatus.total)} so với giá vốn {formatVND(viewBomCostStatus.current)}.
                    </div>
                  </div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {bomLines.map((l, idx) => (
                        <tr key={l.id}>
                          <td className="th-prod-cpc__bom-muted">{idx + 1}</td>
                          <td className="th-prod-cpc__bom-cell-material-view">
                            <code>{l.materialCode}</code> {l.materialName}
                          </td>
                          <td className="th-prod-cpc__bom-unit">{l.materialUnit}</td>
                          <td className="th-prod-cpc__bom-muted">{l.quantity}</td>
                          <td>{l.note?.trim() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      ) : (
        <div className="th-prod-cpc__layout">
          <div className="th-prod-cpc__main">
            <section className="th-prod-cpc__card">
              <h2 className="th-prod-cpc__card-title">
                <span className="material-symbols-outlined" aria-hidden>
                  handshake
                </span>
                Đại lý &amp; thông tin
              </h2>
              <div className="th-prod-cpc__grid2">
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <span className="th-prod-cpc__label">Mã hàng (không đổi)</span>
                  <input className="th-prod-cpc__input" value={product.sku} readOnly disabled />
                </div>
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <label className="th-prod-cpc__label">Đại lý *</label>
                  <ProductionAgencyPickSelect
                    value={agencyId}
                    onChangeValue={(id, agency) => {
                      setAgencyId(id)
                      setAgencyLabel(agency?.name?.trim() || null)
                    }}
                  />
                  {agencyLabel ? <p className="th-prod-cpc__field-hint">Đã chọn: {agencyLabel}</p> : null}
                </div>
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-name`}>
                    Tên hiển thị *
                  </label>
                  <input
                    id={`${fid}-name`}
                    className="th-prod-cpc__input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-cost`}>
                    Giá vốn (VND) *
                  </label>
                  <input
                    id={`${fid}-cost`}
                    className="th-prod-cpc__input th-prod-cpc__input--money"
                    value={costPrice}
                    onChange={(e) => setCostPrice(normalizeVndInputTyping(e.target.value))}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-sug`}>
                    Giá đề xuất (VND) *
                  </label>
                  <input
                    id={`${fid}-sug`}
                    className="th-prod-cpc__input th-prod-cpc__input--money"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(normalizeVndInputTyping(e.target.value))}
                  />
                </div>
              </div>
              <div className="th-prod-cpc__section-actions">
                <button type="button" className="th-prod-cp-detail__btn-ghost" onClick={cancelEdit} disabled={saving}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="th-prod-cp-detail__btn-primary"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    save
                  </span>
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </button>
              </div>
            </section>

            <section className="th-prod-cpc__card">
              <h2 className="th-prod-cpc__card-title">
                <span className="material-symbols-outlined" aria-hidden>
                  upload_file
                </span>
                Ảnh &amp; tài liệu
              </h2>
              {imageUrls.length > 0 ? (
                <ul className="th-prod-cp-detail__url-list">
                  {imageUrls.map((url, i) => (
                    <li key={`${url}-${i}`}>
                      <a href={url} target="_blank" rel="noreferrer">
                        Ảnh {i + 1}
                      </a>
                      <button type="button" onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}>
                        Gỡ
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="th-prod-cpc__upload">
                <input
                  id={`${fid}-new-imgs`}
                  className="th-prod-cpc__upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files) return
                    setImageItems((prev) => [
                      ...prev,
                      ...Array.from(files).map((file) => ({
                        id: `${file.name}-${file.size}`,
                        file,
                        previewUrl: URL.createObjectURL(file),
                      })),
                    ])
                    e.currentTarget.value = ''
                  }}
                />
                <label htmlFor={`${fid}-new-imgs`} className="th-prod-cpc__upload-btn">
                  Thêm ảnh
                </label>
              </div>
              {resourceUrl && !resourceFile ? (
                <p className="th-prod-cpc__hint">
                  Tài liệu hiện tại:{' '}
                  <a href={resourceUrl} target="_blank" rel="noreferrer">
                    mở link
                  </a>
                </p>
              ) : null}
              <div className="th-prod-cpc__upload">
                <input
                  id={`${fid}-res`}
                  className="th-prod-cpc__upload-input"
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
                />
                <label htmlFor={`${fid}-res`} className="th-prod-cpc__upload-btn">
                  {resourceFile ? 'Đổi tài liệu' : 'Chọn tài liệu mới'}
                </label>
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
                  {costNum != null && Number.isFinite(costNum) && costNum >= 0 ? (
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
                      <button type="button" className="th-prod-cpc__btn-warn" onClick={applyBomCostToCostPrice}>
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
                        <td className="th-prod-cpc__bom-unit">{materialUnitLabel(row.materialId, materialCache)}</td>
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
                            onChange={(e) =>
                              setBomRows((prev) =>
                                prev.map((r) => (r.key === row.key ? { ...r, quantity: e.target.value } : r)),
                              )
                            }
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
                            onChange={(e) =>
                              setBomRows((prev) =>
                                prev.map((r) => (r.key === row.key ? { ...r, note: e.target.value } : r)),
                              )
                            }
                          />
                        </td>
                        <td className="th-prod-cpc__bom-cell-act">
                          <button
                            type="button"
                            className="th-prod-cpc__icon-btn"
                            disabled={bomRows.length <= 1}
                            onClick={() => setBomRows((prev) => prev.filter((r) => r.key !== row.key))}
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
              <button
                type="button"
                className="th-prod-cpc__add-bom"
                onClick={() =>
                  setBomRows((prev) => [
                    ...prev,
                    { key: newBomKey(), materialId: '', quantity: '1', note: '' },
                  ])
                }
              >
                <span className="material-symbols-outlined" aria-hidden style={{ fontSize: '1.1rem' }}>
                  add
                </span>
                Thêm dòng BOM
              </button>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
