import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { CategorySearchSelect, type CategoryOption } from '../../admin/components/CategorySearchSelect/CategorySearchSelect'
import { formatVND } from '../../admin/partners/agencyModel'
import { createProductionCustomProduct } from '../productionCustomProductsApi'
import { fetchProductionMaterials, type ProductionMaterialDto } from '../productionTasksApi'
import './ProductionCustomProductCreatePage.css'

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

function parseImageUrls(raw: string): string[] {
  const lines = raw.split(/\r?\n/).flatMap((line) => line.split(','))
  return lines.map((s) => s.trim()).filter(Boolean)
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
  cache: Record<string, ProductionMaterialDto>,
): CategoryOption[] {
  if (!selectedId || base.some((o) => o.id === selectedId)) return base
  const m = cache[selectedId]
  if (!m) return base
  return [{ id: m.id, label: `${m.code} · ${m.name} (${m.unit})` }, ...base]
}

export function ProductionCustomProductCreatePage() {
  const fid = useId()
  const materialSearchSeq = useRef(0)
  const [agencyId, setAgencyId] = useState('')

  const [materialOptions, setMaterialOptions] = useState<CategoryOption[]>([])
  const [materialCache, setMaterialCache] = useState<Record<string, ProductionMaterialDto>>({})
  const [materialLoading, setMaterialLoading] = useState(false)

  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [imageUrlsText, setImageUrlsText] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
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
          label: `${m.code} · ${m.name} (${m.unit})`,
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

  const costNum = Number(costPrice)
  const suggestedNum = Number(suggestedPrice)
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

  const resetProductFields = useCallback(() => {
    setSku('')
    setName('')
    setImageUrlsText('')
    setResourceUrl('')
    setCostPrice('')
    setSuggestedPrice('')
    setBomRows([emptyBomRow()])
    setSubmitError(null)
  }, [])

  const applyBomCostToCostPrice = useCallback(() => {
    if (bomCostStatus.kind !== 'suggest') return
    setCostPrice(String(Math.round(bomCostStatus.total)))
  }, [bomCostStatus])

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setSubmitError(null)
      setSuccessMsg(null)

      const aid = agencyId.trim()
      if (!aid) {
        setSubmitError('Vui lòng chọn đại lý hoặc nhập UUID đại lý.')
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

      const imageUrls = parseImageUrls(imageUrlsText)
      setSubmitting(true)
      try {
        const created = await createProductionCustomProduct({
          agencyId: aid,
          sku: skuT,
          name: nameT,
          imageUrls,
          resourceUrl: resourceUrl.trim() || null,
          costPrice: costNum,
          suggestedPrice: suggestedNum,
          bomItems,
        })
        setSuccessMsg(
          `Đã tạo sản phẩm custom: ${created.name} (mã hàng ${created.sku}) · mã ${created.id}. Có thể tạo tiếp bên dưới.`,
        )
        resetProductFields()
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không gửi được yêu cầu')
      } finally {
        setSubmitting(false)
      }
    },
    [agencyId, sku, name, costNum, suggestedNum, bomRows, imageUrlsText, resourceUrl, resetProductFields],
  )

  return (
    <div className="th-prod-cpc">
      <header className="th-prod-cpc__header">
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
                    Mã đại lý (UUID) <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-agency-id`}
                    className="th-prod-cpc__input th-prod-cpc__mono"
                    type="text"
                    autoComplete="off"
                    placeholder="11000000-0000-0000-0000-000000000001"
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                  />
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
                    className="th-prod-cpc__input"
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>
                <div className="th-prod-cpc__field">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-sug`}>
                    Giá đề xuất bán (VND) <abbr title="bắt buộc">*</abbr>
                  </label>
                  <input
                    id={`${fid}-sug`}
                    className="th-prod-cpc__input"
                    type="number"
                    min={0}
                    step={10000}
                    inputMode="numeric"
                    value={suggestedPrice}
                    onChange={(e) => setSuggestedPrice(e.target.value)}
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
                  link
                </span>
                Ảnh &amp; tài liệu
              </h2>
              <div className="th-prod-cpc__grid2">
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-imgs`}>
                    URL ảnh (mỗi dòng một link, hoặc cách nhau bởi dấu phẩy)
                  </label>
                  <textarea
                    id={`${fid}-imgs`}
                    className="th-prod-cpc__textarea th-prod-cpc__textarea--sm"
                    placeholder="https://…"
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                  />
                </div>
                <div className="th-prod-cpc__field th-prod-cpc__field--full">
                  <label className="th-prod-cpc__label" htmlFor={`${fid}-res`}>
                    Resource / bản vẽ (URL)
                  </label>
                  <input
                    id={`${fid}-res`}
                    className="th-prod-cpc__input"
                    type="url"
                    placeholder="https://…"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
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
                        placeholder={
                          materialLoading ? 'Đang tải danh mục…' : 'Chọn vật tư…'
                        }
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
          <button type="button" className="th-prod-cpc__reset" onClick={resetProductFields}>
            Xóa nội dung form (giữ đại lý)
          </button>
          <button type="submit" className="th-prod-cpc__submit" disabled={submitting}>
            <span className="material-symbols-outlined" aria-hidden>
              save
            </span>
            {submitting ? 'Đang gửi…' : 'Tạo sản phẩm'}
          </button>
        </div>
      </form>
    </div>
  )
}
