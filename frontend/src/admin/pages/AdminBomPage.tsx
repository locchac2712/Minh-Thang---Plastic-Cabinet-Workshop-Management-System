import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../catalog/productModel'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import { CategorySearchSelect } from '../components/CategorySearchSelect/CategorySearchSelect'
import { adminPaths } from '../config/adminPaths'
import {
  bomLineCostVnd,
  buildBomUnitCostMap,
  resolveMaterialUnitCost,
  trySumBomCostVnd,
} from '../manufacturing/bomCostUtils'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AdminBomPage.css'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type ProductRow = {
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

type ProductListResponse = {
  content: ProductRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type ProductBomLineDto = {
  id: string
  productId: string
  materialId: string
  materialCode: string
  materialName: string
  materialUnit: string
  materialUnitCost: number | null
  quantity: number
  note: string | null
  createdAt: string
}

type MaterialRow = {
  id: string
  code: string
  name: string
  unit: string
  isActive: boolean
  unitCost: number
}

type MaterialListResponse = {
  content: MaterialRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type BomDraftRow = {
  localId: string
  materialId: string
  quantity: number
  note: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function formatBomQuantity(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(4).replace(/\.?0+$/, '')
}

function buildUnitCostMap(rows: MaterialRow[], extra: Record<string, number>): Record<string, number> {
  const m: Record<string, number> = {}
  for (const r of rows) m[r.id] = r.unitCost ?? 0
  for (const [k, v] of Object.entries(extra)) m[k] = v
  return m
}

type BomCostStatus =
  | { kind: 'no_bom' }
  | { kind: 'incomplete' }
  | { kind: 'ok'; total: number }
  | { kind: 'suggest'; total: number; current: number }

export function AdminBomPage() {
  const fid = useId()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productPickerOptions, setProductPickerOptions] = useState<Array<{ id: string; label: string }>>([])
  const productSearchSeq = useRef(0)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [productDetailError, setProductDetailError] = useState<string | null>(null)

  const [bomRows, setBomRows] = useState<ProductBomLineDto[]>([])
  const [bomLoading, setBomLoading] = useState(false)
  const [bomError, setBomError] = useState<string | null>(null)
  const [bomEditing, setBomEditing] = useState(false)
  const [bomSaving, setBomSaving] = useState(false)
  const [bomNotice, setBomNotice] = useState<string | null>(null)
  const [bomDraftRows, setBomDraftRows] = useState<BomDraftRow[]>([])
  const [materialOptions, setMaterialOptions] = useState<MaterialRow[]>([])
  const [materialLoading, setMaterialLoading] = useState(false)
  const [materialError, setMaterialError] = useState<string | null>(null)
  const [supplementalUnitCosts, setSupplementalUnitCosts] = useState<Record<string, number>>({})
  const [supplementalFetchInFlight, setSupplementalFetchInFlight] = useState(0)
  const [applyCostLoading, setApplyCostLoading] = useState(false)

  const loadProductOptionsForPicker = useCallback(async (query: string) => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setProductPickerOptions([])
      return
    }
    const seq = ++productSearchSeq.current
    try {
      const q = new URLSearchParams()
      q.set('page', '0')
      q.set('size', '50')
      const s = query.trim()
      if (s) q.set('search', s)
      const res = await fetch(`${API_BASE_URL}/api/admin/products?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<ProductListResponse>
      if (seq !== productSearchSeq.current) return
      if (!res.ok || !envelope.success || !envelope.data) {
        setProductPickerOptions([])
        return
      }
      setProductPickerOptions(
        envelope.data.content.map((p) => ({
          id: p.id,
          label: `${p.sku} · ${p.name} · ${p.categoryName}`,
        })),
      )
    } catch {
      if (seq !== productSearchSeq.current) return
      setProductPickerOptions([])
    }
  }, [])

  useEffect(() => {
    void loadProductOptionsForPicker('')
  }, [loadProductOptionsForPicker])

  useEffect(() => {
    if (selectedProductId || productPickerOptions.length === 0) return
    setSelectedProductId(productPickerOptions[0].id)
  }, [selectedProductId, productPickerOptions])

  const fetchProductDetail = useCallback(async (productId: string) => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setSelectedProduct(null)
      setProductDetailError('Thiếu access token.')
      return
    }
    setProductDetailError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<ProductRow>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được thông tin sản phẩm')
      }
      setSelectedProduct(envelope.data)
    } catch (err) {
      setSelectedProduct(null)
      setProductDetailError(err instanceof Error ? err.message : 'Không tải được thông tin sản phẩm')
    }
  }, [])

  const fetchBom = useCallback(async (productId: string) => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setBomError('Thiếu access token.')
      setBomRows([])
      return
    }
    setBomLoading(true)
    setBomError(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}/bom`,
        {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<ProductBomLineDto[]>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được BOM')
      }
      setBomRows(envelope.data)
    } catch (err) {
      setBomError(err instanceof Error ? err.message : 'Không tải được BOM')
      setBomRows([])
    } finally {
      setBomLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedProductId) {
      setSelectedProduct(null)
      setBomRows([])
      setBomError(null)
      setBomEditing(false)
      setBomDraftRows([])
      setBomNotice(null)
      setSupplementalUnitCosts({})
      return
    }
    void fetchProductDetail(selectedProductId)
    void fetchBom(selectedProductId)
  }, [selectedProductId, fetchProductDetail, fetchBom])

  const fetchMaterials = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setMaterialError('Thiếu access token.')
      setMaterialOptions([])
      return
    }
    setMaterialLoading(true)
    setMaterialError(null)
    try {
      const q = new URLSearchParams()
      q.set('page', '0')
      q.set('size', '800')
      q.set('is_active', 'true')
      const res = await fetch(`${API_BASE_URL}/api/admin/materials?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<MaterialListResponse>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được vật tư')
      }
      setMaterialOptions(envelope.data.content)
    } catch (err) {
      setMaterialError(err instanceof Error ? err.message : 'Không tải được vật tư')
      setMaterialOptions([])
    } finally {
      setMaterialLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedProductId) return
    if (materialOptions.length > 0 || materialLoading) return
    void fetchMaterials()
  }, [fetchMaterials, materialLoading, materialOptions.length, selectedProductId])

  const fetchOneMaterialUnitCost = useCallback(async (materialId: string): Promise<number | null> => {
    if (!materialId) return null
    const accessToken = getAccessToken()
    if (!accessToken) return null
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/materials/${encodeURIComponent(materialId)}`,
        { headers: { accept: '*/*', Authorization: `${getTokenType()} ${accessToken}` } },
      )
      const envelope = (await res.json()) as ApiEnvelope<{ id: string; unitCost: number }>
      if (!res.ok || !envelope.success || !envelope.data) return null
      return envelope.data.unitCost
    } catch {
      return null
    }
  }, [])

  const costById: Record<string, number | undefined> = useMemo(
    () =>
      buildBomUnitCostMap(
        bomRows,
        buildUnitCostMap(materialOptions, supplementalUnitCosts),
        supplementalUnitCosts,
      ),
    [materialOptions, supplementalUnitCosts, bomRows],
  )

  const bomCostStatus: BomCostStatus = useMemo(() => {
    if (!selectedProduct) return { kind: 'no_bom' }
    const lines = bomEditing
      ? bomDraftRows
          .filter((r) => r.materialId && r.quantity > 0)
          .map((r) => ({ materialId: r.materialId, quantity: r.quantity }))
      : bomRows.map((r) => ({ materialId: r.materialId, quantity: r.quantity }))
    if (lines.length === 0) return { kind: 'no_bom' }
    const s = trySumBomCostVnd(lines, costById)
    if (!s.ok) {
      if (s.reason === 'incomplete') return { kind: 'incomplete' }
      return { kind: 'no_bom' }
    }
    if (s.total > selectedProduct.costPrice) {
      return { kind: 'suggest', total: s.total, current: selectedProduct.costPrice }
    }
    return { kind: 'ok', total: s.total }
  }, [selectedProduct, bomEditing, bomDraftRows, bomRows, costById])

  useEffect(() => {
    const inCatalog = (id: string) => materialOptions.some((m) => m.id === id)
    const need: string[] = []
    for (const r of bomRows) {
      if (r.materialId && !inCatalog(r.materialId) && supplementalUnitCosts[r.materialId] == null) {
        if (!need.includes(r.materialId)) need.push(r.materialId)
      }
    }
    if (bomEditing) {
      for (const r of bomDraftRows) {
        if (r.materialId && !inCatalog(r.materialId) && supplementalUnitCosts[r.materialId] == null) {
          if (!need.includes(r.materialId)) need.push(r.materialId)
        }
      }
    }
    if (need.length === 0) return
    let killed = false
    setSupplementalFetchInFlight((c) => c + 1)
    void (async () => {
      const out: Record<string, number> = {}
      for (const id of need) {
        if (killed) return
        const c = await fetchOneMaterialUnitCost(id)
        if (c != null) out[id] = c
      }
      if (killed) return
      if (Object.keys(out).length > 0) {
        setSupplementalUnitCosts((p) => ({ ...p, ...out }))
      }
    })().finally(() => {
      if (!killed) setSupplementalFetchInFlight((c) => Math.max(0, c - 1))
    })
    return () => {
      killed = true
    }
  }, [
    bomRows,
    bomEditing,
    bomDraftRows,
    materialOptions,
    supplementalUnitCosts,
    fetchOneMaterialUnitCost,
  ])

  const productOptionsForSelect = useMemo(() => {
    if (!selectedProductId || !selectedProduct) return productPickerOptions
    if (productPickerOptions.some((o) => o.id === selectedProductId)) return productPickerOptions
    return [
      {
        id: selectedProduct.id,
        label: `${selectedProduct.sku} · ${selectedProduct.name} · ${selectedProduct.categoryName}`,
      },
      ...productPickerOptions,
    ]
  }, [productPickerOptions, selectedProductId, selectedProduct])

  const onProductChange = useCallback((id: string) => {
    setSelectedProductId(id)
  }, [])

  const materialPickerOptions = useMemo(
    () =>
      materialOptions.map((m) => ({
        id: m.id,
        label: `${m.code} · ${m.name} (${m.unit})`,
      })),
    [materialOptions],
  )

  const openEditor = useCallback(() => {
    setBomNotice(null)
    if (bomRows.length === 0) {
      setBomDraftRows([{ localId: `${Date.now()}-0`, materialId: '', quantity: 1, note: '' }])
    } else {
      setBomDraftRows(
        bomRows.map((r, idx) => ({
          localId: `${r.id}-${idx}`,
          materialId: r.materialId,
          quantity: r.quantity,
          note: r.note ?? '',
        })),
      )
    }
    setBomEditing(true)
  }, [bomRows])

  const addDraftLine = useCallback(() => {
    setBomDraftRows((prev) => [
      ...prev,
      { localId: `${Date.now()}-${prev.length}`, materialId: '', quantity: 1, note: '' },
    ])
  }, [])

  const patchDraftLine = useCallback((localId: string, patch: Partial<BomDraftRow>) => {
    setBomDraftRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)))
  }, [])

  const removeDraftLine = useCallback((localId: string) => {
    setBomDraftRows((prev) => prev.filter((r) => r.localId !== localId))
  }, [])

  const saveBom = useCallback(async () => {
    if (!selectedProductId || bomSaving) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setBomNotice('Thiếu access token.')
      return
    }
    if (bomDraftRows.length === 0) {
      setBomNotice('Vui lòng thêm ít nhất 1 dòng vật tư.')
      return
    }
    const invalid = bomDraftRows.find((r) => !r.materialId || r.quantity <= 0 || !Number.isFinite(r.quantity))
    if (invalid) {
      setBomNotice('Mỗi dòng cần chọn vật tư và số lượng > 0.')
      return
    }
    const uniq = new Set(bomDraftRows.map((r) => r.materialId))
    if (uniq.size !== bomDraftRows.length) {
      setBomNotice('Không được chọn trùng vật tư.')
      return
    }
    setBomSaving(true)
    setBomNotice(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(selectedProductId)}/bom`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify({
          items: bomDraftRows.map((r) => ({
            materialId: r.materialId,
            quantity: r.quantity,
            note: r.note.trim() || null,
          })),
        }),
      })
      const envelope = (await res.json()) as ApiEnvelope<ProductBomLineDto[]>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không lưu được BOM')
      }
      setBomRows(envelope.data)
      setBomEditing(false)
      setBomNotice(envelope.message || 'Lưu BOM thành công.')
    } catch (err) {
      setBomNotice(err instanceof Error ? err.message : 'Không lưu được BOM')
    } finally {
      setBomSaving(false)
    }
  }, [bomDraftRows, bomSaving, selectedProductId])

  const applyBomCostToProduct = useCallback(async () => {
    if (!selectedProductId || !selectedProduct) return
    if (applyCostLoading) return
    if (bomCostStatus.kind !== 'suggest') return
    const newCostVnd = bomCostStatus.total
    setApplyCostLoading(true)
    setBomNotice(null)
    try {
      const accessToken = getAccessToken()
      if (!accessToken) {
        setBomNotice('Thiếu access token.')
        return
      }
      const res = await fetch(
        `${API_BASE_URL}/api/admin/products/${encodeURIComponent(selectedProductId)}`,
        {
          method: 'PUT',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({
            name: selectedProduct.name.trim(),
            imageUrls: selectedProduct.imageUrls,
            costPrice: newCostVnd,
            suggestedPrice: selectedProduct.suggestedPrice,
          }),
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<ProductRow>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không cập nhật được giá vốn')
      }
      setSelectedProduct(envelope.data)
      setBomNotice('Đã cập nhật giá vốn theo ước tính BOM.')
    } catch (e) {
      setBomNotice(e instanceof Error ? e.message : 'Không cập nhật được giá vốn')
    } finally {
      setApplyCostLoading(false)
    }
  }, [selectedProductId, selectedProduct, bomCostStatus, applyCostLoading])

  return (
    <div className="th-admin-bom">
      <div className="th-admin-bom__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: adminPaths.dashboard },
            { label: 'Cấu hình BOM' },
          ]}
        />
      </div>

      <header className="th-admin-bom__header">
        <div className="th-admin-bom__title-row">
          <span className="material-symbols-outlined th-admin-bom__title-icon" aria-hidden>
            account_tree
          </span>
          <div>
            <h1 className="th-admin-bom__title">Cấu hình BOM</h1>
          </div>
        </div>
      </header>

      <section className="th-admin-bom__product-bar" aria-label="Chọn thành phẩm">
        <div className="th-admin-bom__product-field">
          <span id={`${fid}-prod-label`} className="th-admin-bom__field-label">
            Thành phẩm
          </span>
          <CategorySearchSelect
            variant="toolbar"
            aria-labelledby={`${fid}-prod-label`}
            options={productOptionsForSelect}
            value={selectedProductId}
            onChange={onProductChange}
            placeholder="Tìm mã hàng, tên hoặc ngành hàng…"
            searchPlaceholder="Gõ để tìm sản phẩm…"
            remoteSearch
            onRemoteSearch={loadProductOptionsForPicker}
          />
        </div>
        {selectedProduct ? (
          <div className="th-admin-bom__product-meta">
            <span className="th-admin-bom__chip">{selectedProduct.categoryName}</span>
            <span className="th-admin-bom__chip th-admin-bom__chip--muted">{selectedProduct.sku}</span>
            <Link
              className="th-admin-bom__link-out"
              to={adminPaths.catalog.product(selectedProduct.id)}
            >
              <span className="material-symbols-outlined" aria-hidden>
                open_in_new
              </span>
              Chi tiết thành phẩm
            </Link>
          </div>
        ) : null}
        {productDetailError ? <p className="th-admin-users__api-error">{productDetailError}</p> : null}
      </section>

      <div className="th-admin-bom__grid">
        <main className="th-admin-bom__main">
          <div className="th-admin-bom__main-head">
            <div>
              <h2 className="th-admin-bom__panel-title">Định mức vật tư (BOM)</h2>
              <p className="th-admin-bom__panel-desc">
                {selectedProductId
                  ? `${bomEditing ? bomDraftRows.length : bomRows.length} dòng${
                      bomCostStatus.kind === 'ok' || bomCostStatus.kind === 'suggest'
                        ? ` · Ước tính NVL: ${formatVND(bomCostStatus.total)}${
                            bomEditing ? ' (theo bảng sửa)' : ''
                          }`
                        : ''
                    }${
                      selectedProduct
                        ? ` · Giá vốn SP: ${formatVND(selectedProduct.costPrice)}`
                        : ''
                    }`
                  : 'Chọn thành phẩm để xem BOM.'}
              </p>
            </div>
            {selectedProductId ? (
              <div className="th-admin-bom__actions">
                {!bomEditing ? (
                  <button type="button" className="th-admin-bom__btn-ghost" onClick={openEditor}>
                    <span className="material-symbols-outlined" aria-hidden>
                      {bomRows.length ? 'edit' : 'add'}
                    </span>
                    {bomRows.length ? 'Sửa BOM' : 'Tạo BOM'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="th-admin-bom__btn-ghost"
                      onClick={() => setBomEditing(false)}
                      disabled={bomSaving}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="th-admin-bom__btn-warn"
                      onClick={() => void saveBom()}
                      disabled={bomSaving}
                    >
                      {bomSaving ? 'Đang lưu…' : 'Lưu BOM'}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {bomError ? (
            <p className="th-admin-users__api-error" role="alert">
              {bomError}
            </p>
          ) : null}
          {selectedProductId && selectedProduct && bomCostStatus.kind === 'suggest' ? (
            <div className="th-admin-bom__cost-warn" role="status">
              <span className="material-symbols-outlined" aria-hidden>
                price_change
              </span>
              <div>
                <strong>Đề xuất cập nhật giá vốn thành phẩm.</strong> Tổng NVL ước tính ({' '}
                {formatVND(bomCostStatus.total)}) <strong> cao hơn</strong> giá vốn lưu hiện tại (
                {formatVND(bomCostStatus.current)}).
                <div className="th-admin-bom__cost-warn-actions">
                  <button
                    type="button"
                    className="th-admin-bom__btn-warn"
                    disabled={applyCostLoading}
                    onClick={() => void applyBomCostToProduct()}
                  >
                    {applyCostLoading ? 'Đang cập nhật…' : `Cập nhật giá vốn = ${formatVND(bomCostStatus.total)}`}
                  </button>
                  <Link className="th-admin-bom__inline-link" to={adminPaths.catalog.product(selectedProductId)}>
                    Sửa trên trang chi tiết sản phẩm
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
          {selectedProductId &&
          (bomRows.length > 0 || (bomEditing && bomDraftRows.some((r) => r.materialId))) &&
          bomCostStatus.kind === 'incomplete' &&
          (materialLoading || supplementalFetchInFlight > 0) ? (
            <p className="th-admin-bom__est-hint">Đang ước tính chi phí NVL từ định mức…</p>
          ) : null}
          {selectedProductId &&
          (bomRows.length > 0 || (bomEditing && bomDraftRows.some((r) => r.materialId))) &&
          bomCostStatus.kind === 'incomplete' &&
          !materialLoading &&
          supplementalFetchInFlight === 0 ? (
            <p className="th-admin-bom__est-warn" role="status">
              Chưa đủ <strong>giá vốn (đơn giá NVL)</strong> cho toàn bộ dòng BOM.
            </p>
          ) : null}
          {bomNotice ? (
            <p className="th-admin-bom__flash th-admin-bom__flash--ok" role="status">
              <span className="material-symbols-outlined" aria-hidden>
                info
              </span>
              {bomNotice}
            </p>
          ) : null}
          {materialError && bomEditing ? (
            <p className="th-admin-users__api-error" role="alert">
              {materialError}
            </p>
          ) : null}

          {selectedProductId && bomLoading ? (
            <p className="th-admin-bom__empty" aria-busy>
              Đang tải BOM…
            </p>
          ) : null}

          {selectedProductId && !bomLoading && bomRows.length === 0 && !bomError ? (
            <p className="th-admin-bom__empty">Chưa có dòng định mức cho thành phẩm này.</p>
          ) : null}

          {selectedProductId && !bomLoading && bomEditing ? (
            <div className="th-admin-bom__table-wrap">
              <table className="th-admin-bom__table">
                <thead>
                  <tr>
                    <th className="th-admin-bom__col-idx">#</th>
                    <th>Vật tư</th>
                    <th className="th-admin-bom__col-qty">Định mức / TP</th>
                    <th className="th-admin-bom__money-col">Đơn giá NVL</th>
                    <th className="th-admin-bom__money-col">Thành tiền</th>
                    <th>Ghi chú</th>
                    <th className="th-admin-bom__col-act">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {bomDraftRows.map((row, idx) => {
                    const unitCost = resolveMaterialUnitCost(row.materialId, costById)
                    const lineCost = bomLineCostVnd(row.quantity, unitCost)
                    return (
                    <tr key={row.localId}>
                      <td className="th-admin-bom__muted">{idx + 1}</td>
                      <td>
                        <CategorySearchSelect
                          variant="field"
                          options={materialPickerOptions}
                          value={row.materialId}
                          onChange={(id) => patchDraftLine(row.localId, { materialId: id })}
                          placeholder={materialLoading ? 'Đang tải vật tư…' : 'Chọn vật tư…'}
                          searchPlaceholder="Tìm mã / tên vật tư..."
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="th-admin-bom__qty-input"
                          value={row.quantity}
                          min={0.0001}
                          step={0.0001}
                          onChange={(e) => patchDraftLine(row.localId, { quantity: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="th-admin-bom__money-col">
                        {unitCost != null ? formatVND(unitCost) : '—'}
                      </td>
                      <td className="th-admin-bom__money-col">
                        {lineCost != null ? formatVND(lineCost) : '—'}
                      </td>
                      <td>
                        <input
                          className="th-admin-bom__note-input"
                          value={row.note}
                          placeholder="Ghi chú (tuỳ chọn)"
                          onChange={(e) => patchDraftLine(row.localId, { note: e.target.value })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="th-admin-bom__icon-btn"
                          onClick={() => removeDraftLine(row.localId)}
                          disabled={bomDraftRows.length <= 1}
                          aria-label="Xóa dòng"
                        >
                          <span className="material-symbols-outlined" aria-hidden>
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {selectedProductId && !bomLoading && bomEditing ? (
            <button type="button" className="th-admin-bom__btn-ghost" onClick={addDraftLine}>
              <span className="material-symbols-outlined" aria-hidden>
                add
              </span>
              Thêm dòng vật tư
            </button>
          ) : null}

          {selectedProductId && !bomLoading && bomRows.length > 0 && !bomEditing ? (
            <div className="th-admin-bom__table-wrap">
              <table className="th-admin-bom__table">
                <thead>
                  <tr>
                    <th className="th-admin-bom__col-idx">#</th>
                    <th>Mã vật tư</th>
                    <th>Tên</th>
                    <th>ĐVT</th>
                    <th className="th-admin-bom__col-qty">Định mức / TP</th>
                    <th className="th-admin-bom__money-col">Đơn giá NVL</th>
                    <th className="th-admin-bom__money-col">Thành tiền</th>
                    <th>Ghi chú</th>
                    <th className="th-admin-bom__col-act">Liên kết</th>
                  </tr>
                </thead>
                <tbody>
                  {bomRows.map((row, idx) => {
                    const unitCost = row.materialUnitCost ?? resolveMaterialUnitCost(row.materialId, costById)
                    const lineCost = bomLineCostVnd(row.quantity, unitCost)
                    return (
                    <tr key={row.id}>
                      <td className="th-admin-bom__muted">{idx + 1}</td>
                      <td>
                        <code className="th-admin-bom__code">{row.materialCode}</code>
                      </td>
                      <td>
                        <span className="th-admin-bom__name">{row.materialName}</span>
                      </td>
                      <td>{row.materialUnit}</td>
                      <td>{formatBomQuantity(row.quantity)}</td>
                      <td className="th-admin-bom__money-col">
                        {unitCost != null ? formatVND(unitCost) : '—'}
                      </td>
                      <td className="th-admin-bom__money-col">
                        {lineCost != null ? formatVND(lineCost) : '—'}
                      </td>
                      <td>{row.note ?? '—'}</td>
                      <td>
                        <Link
                          to={adminPaths.manufacturing.material(row.materialId)}
                          className="th-admin-bom__inline-link"
                        >
                          Vật tư
                        </Link>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
                {bomCostStatus.kind === 'ok' || bomCostStatus.kind === 'suggest' ? (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="th-admin-bom__money-col th-admin-bom__money-foot-label">
                        Tổng NVL (ước tính)
                      </td>
                      <td className="th-admin-bom__money-col th-admin-bom__money-foot-total">
                        {formatVND(bomCostStatus.total)}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          ) : null}
        </main>

        <aside className="th-admin-bom__aside" aria-label="Gợi ý">
          <div className="th-admin-bom__aside-card">
            <h3 className="th-admin-bom__aside-title">
              <span className="material-symbols-outlined" aria-hidden>
                info
              </span>
              Gợi ý
            </h3>
            <p className="th-admin-bom__aside-lead">
              Gõ để lọc nhanh thành phẩm trong panel (có debounce).
            </p>
            <ul className="th-admin-bom__tips">
              <li>
                Danh mục vật tư:{' '}
                <Link className="th-admin-bom__inline-link" to={adminPaths.manufacturing.materials}>
                  Vật tư
                </Link>
              </li>
              <li>
                BOM trên trang chi tiết TP:{' '}
                {selectedProductId ? (
                  <Link
                    className="th-admin-bom__inline-link"
                    to={adminPaths.catalog.product(selectedProductId)}
                  >
                    Mở chi tiết sản phẩm
                  </Link>
                ) : (
                  <span className="th-admin-bom__muted">Chọn sản phẩm trước</span>
                )}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
