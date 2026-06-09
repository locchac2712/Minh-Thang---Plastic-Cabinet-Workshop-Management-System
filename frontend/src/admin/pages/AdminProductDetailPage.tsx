import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DEFAULT_PRODUCT_IMAGE_URL, formatVND } from '../catalog/productModel'
import { CategorySearchSelect } from '../components/CategorySearchSelect/CategorySearchSelect'
import { adminPaths } from '../config/adminPaths'
import {
  bomLineCostVnd,
  buildBomUnitCostMap,
  resolveMaterialUnitCost,
  trySumBomCostVnd,
} from '../manufacturing/bomCostUtils'
import { AdminBreadcrumb } from '../components/AdminBreadcrumb/AdminBreadcrumb'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AdminProductDetailPage.css'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type ProductDetailDto = {
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

type UploadImageResponse = {
  url: string
  publicId: string
}

type PendingUploadImage = {
  id: string
  file: File
  previewUrl: string
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

type CategoryListRow = {
  id: string
  name: string
  isActive: boolean
}

type CategoryListResponse = {
  content: CategoryListRow[]
}

type BomDraftRow = {
  localId: string
  materialId: string
  quantity: number
  note: string
}

type ProductDetailTab = 'overview' | 'bom'

type BomCostStatus =
  | { kind: 'no_bom' }
  | { kind: 'incomplete' }
  | { kind: 'ok'; total: number }
  | { kind: 'suggest'; total: number; current: number }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function formatBomQuantity(n: number): string {
  if (Number.isInteger(n)) return String(n)
  const s = n.toFixed(4).replace(/\.?0+$/, '')
  return s
}

function buildUnitCostMap(rows: MaterialRow[], extra: Record<string, number>): Record<string, number> {
  const m: Record<string, number> = {}
  for (const r of rows) m[r.id] = r.unitCost ?? 0
  for (const [k, v] of Object.entries(extra)) m[k] = v
  return m
}

export function AdminProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDetailDto | null>(null)
  const [pendingImageUploads, setPendingImageUploads] = useState<PendingUploadImage[]>([])
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('overview')
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
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; label: string }>>([])
  const [categoryLoading, setCategoryLoading] = useState(false)
  /** unitCost từ GET lẻ khi materialId không nằm trong trang list đã tải */
  const [supplementalUnitCosts, setSupplementalUnitCosts] = useState<Record<string, number>>({})
  const [supplementalFetchInFlight, setSupplementalFetchInFlight] = useState(0)

  const fetchDetail = useCallback(async () => {
    if (!productId) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<ProductDetailDto>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được chi tiết sản phẩm')
      }
      setDraft(envelope.data)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được chi tiết sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  const fetchCategoryOptions = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    setCategoryLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories?page=0&size=200`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<CategoryListResponse>
      if (!res.ok || !envelope.success || !envelope.data) return
      setCategoryOptions(envelope.data.content.map((c) => ({ id: c.id, label: c.name })))
    } catch {
      // form vẫn hiển thị nhãn từ draft.categoryName
    } finally {
      setCategoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCategoryOptions()
  }, [fetchCategoryOptions])

  useEffect(() => {
    setSupplementalUnitCosts({})
  }, [productId])

  const fetchBom = useCallback(async () => {
    if (!productId) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setBomError('Thiếu access token. Vui lòng đăng nhập lại.')
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
  }, [productId])

  useEffect(() => {
    if (!productId) return
    void fetchBom()
  }, [productId, fetchBom])

  const fetchMaterialOptions = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setMaterialError('Thiếu access token. Vui lòng đăng nhập lại.')
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
        throw new Error(envelope.message || 'Không tải được danh mục vật tư')
      }
      setMaterialOptions(envelope.data.content)
    } catch (err) {
      setMaterialError(err instanceof Error ? err.message : 'Không tải được danh mục vật tư')
      setMaterialOptions([])
    } finally {
      setMaterialLoading(false)
    }
  }, [])

  const fetchOneMaterialUnitCost = useCallback(async (materialId: string): Promise<number | null> => {
    if (!materialId) return null
    const accessToken = getAccessToken()
    if (!accessToken) return null
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/materials/${encodeURIComponent(materialId)}`,
        { headers: { accept: '*/*', Authorization: `${getTokenType()} ${accessToken}` } },
      )
      const envelope = (await res.json()) as ApiEnvelope<{
        id: string
        unitCost: number
      }>
      if (!res.ok || !envelope.success || !envelope.data) return null
      return envelope.data.unitCost
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!productId) return
    if (materialOptions.length > 0 || materialLoading) return
    void fetchMaterialOptions()
  }, [productId, fetchMaterialOptions, materialLoading, materialOptions.length])

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
    if (!draft) return { kind: 'no_bom' }
    const lines = bomEditing
      ? bomDraftRows
          .filter((r) => r.materialId && r.quantity > 0)
          .map((r) => ({ materialId: r.materialId, quantity: r.quantity }))
      : bomRows.map((r) => ({ materialId: r.materialId, quantity: r.quantity }))
    if (lines.length === 0) return { kind: 'no_bom' }
    const s = trySumBomCostVnd(lines, costById)
    if (s.ok === false) {
      if (s.reason === 'incomplete') return { kind: 'incomplete' }
      return { kind: 'no_bom' }
    }
    if (s.total > draft.costPrice) {
      return { kind: 'suggest', total: s.total, current: draft.costPrice }
    }
    return { kind: 'ok', total: s.total }
  }, [draft, bomEditing, bomDraftRows, bomRows, costById])

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

  const materialPickerOptions = useMemo(
    () =>
      materialOptions.map((m) => ({
        id: m.id,
        label: `${m.code} · ${m.name} (${m.unit})`,
      })),
    [materialOptions],
  )

  const categoryPickerOptions = useMemo(() => {
    if (!draft?.categoryId) return categoryOptions
    if (categoryOptions.some((o) => o.id === draft.categoryId)) return categoryOptions
    return [{ id: draft.categoryId, label: draft.categoryName || draft.categoryId }, ...categoryOptions]
  }, [categoryOptions, draft?.categoryId, draft?.categoryName])

  const patchDraftCategory = useCallback((categoryId: string) => {
    setDraft((d) => {
      if (!d) return d
      const label = categoryOptions.find((o) => o.id === categoryId)?.label ?? d.categoryName
      return { ...d, categoryId, categoryName: label }
    })
  }, [categoryOptions])

  const applyBomCostSuggestion = useCallback(() => {
    if (bomCostStatus.kind !== 'suggest') return
    setActiveTab('overview')
    setEditing(true)
    setDraft((d) => (d ? { ...d, costPrice: bomCostStatus.total } : d))
  }, [bomCostStatus])

  const openBomEditor = useCallback(() => {
    setBomNotice(null)
    if (bomRows.length === 0) {
      setBomDraftRows([
        {
          localId: crypto.randomUUID?.() ?? `${Date.now()}-0`,
          materialId: '',
          quantity: 1,
          note: '',
        },
      ])
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

  const addBomDraftLine = useCallback(() => {
    setBomDraftRows((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID?.() ?? `${Date.now()}-${prev.length}`,
        materialId: '',
        quantity: 1,
        note: '',
      },
    ])
  }, [])

  const patchBomDraftLine = useCallback((localId: string, patch: Partial<BomDraftRow>) => {
    setBomDraftRows((prev) => prev.map((r) => (r.localId === localId ? { ...r, ...patch } : r)))
  }, [])

  const removeBomDraftLine = useCallback((localId: string) => {
    setBomDraftRows((prev) => prev.filter((r) => r.localId !== localId))
  }, [])

  const saveBom = useCallback(async () => {
    if (!productId || bomSaving) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setBomNotice('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      return
    }
    if (bomDraftRows.length === 0) {
      setBomNotice('Vui lòng thêm ít nhất 1 dòng vật tư.')
      return
    }
    const invalid = bomDraftRows.find((r) => !r.materialId || !Number.isFinite(r.quantity) || r.quantity <= 0)
    if (invalid) {
      setBomNotice('Mỗi dòng cần chọn vật tư và nhập số lượng > 0.')
      return
    }
    const uniqueMaterialIds = new Set(bomDraftRows.map((r) => r.materialId))
    if (uniqueMaterialIds.size !== bomDraftRows.length) {
      setBomNotice('Không được chọn trùng vật tư trong BOM.')
      return
    }
    setBomSaving(true)
    setBomNotice(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}/bom`, {
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
      setBomNotice(envelope.message || 'Cập nhật BOM thành công.')
    } catch (err) {
      setBomNotice(err instanceof Error ? err.message : 'Không lưu được BOM')
    } finally {
      setBomSaving(false)
    }
  }, [bomDraftRows, bomSaving, productId])

  useEffect(() => {
    setActiveTab('overview')
    setBomRows([])
    setBomError(null)
  }, [productId])

  const handleSave = useCallback(async () => {
    if (!draft || !productId || saving) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      return
    }

    if (!draft.name.trim()) {
      setNotice('Tên sản phẩm không được để trống.')
      return
    }
    if (!draft.categoryId) {
      setNotice('Vui lòng chọn ngành hàng.')
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      const uploadedUrls: string[] = []
      for (const item of pendingImageUploads) {
        const uploadBody = new FormData()
        uploadBody.append('file', item.file)
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
        uploadedUrls.push(uploadEnvelope.data.url)
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          categoryId: draft.categoryId,
          imageUrls: [...draft.imageUrls, ...uploadedUrls],
          costPrice: draft.costPrice,
          suggestedPrice: draft.suggestedPrice,
        }),
      })
      const envelope = (await res.json()) as ApiEnvelope<ProductDetailDto>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Cập nhật sản phẩm thất bại')
      }
      setDraft(envelope.data)
      pendingImageUploads.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setPendingImageUploads([])
      setEditing(false)
      setNotice(envelope.message || 'Cập nhật sản phẩm thành công.')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm')
    } finally {
      setSaving(false)
    }
  }, [draft, pendingImageUploads, productId, saving])

  const appendUploadFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const nextItems: PendingUploadImage[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPendingImageUploads((prev) => [...prev, ...nextItems])
  }, [])

  const removePendingUpload = useCallback((id: string) => {
    setPendingImageUploads((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }, [])

  useEffect(() => {
    if (!editing) {
      pendingImageUploads.forEach((item) => URL.revokeObjectURL(item.previewUrl))
      setPendingImageUploads([])
    }
  }, [editing])

  useEffect(() => {
    return () => {
      pendingImageUploads.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    }
  }, [pendingImageUploads])

  if (!productId) return <Navigate to={adminPaths.catalog.products} replace />
  if (loading || !draft) {
    return (
      <div className="th-admin-product-detail th-admin-product-detail--loading" aria-busy>
        Đang tải…
      </div>
    )
  }

  return (
    <div className="th-admin-product-detail">
      <div className="th-admin-product-detail__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: adminPaths.dashboard },
            { label: 'Danh mục', to: adminPaths.catalog.root },
            { label: 'Sản phẩm', to: adminPaths.catalog.products },
            { label: draft.name },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={adminPaths.catalog.products} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>arrow_back</span>
            Danh sách
          </Link>
          <div className="th-admin-product-detail__actions">
            {!editing ? (
              <button
                type="button"
                className="th-admin-product-detail__btn-primary"
                onClick={() => setEditing(true)}
              >
                <span className="material-symbols-outlined" aria-hidden>edit</span>
                Chỉnh sửa
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-ghost"
                  onClick={() => {
                    setEditing(false)
                    pendingImageUploads.forEach((item) => URL.revokeObjectURL(item.previewUrl))
                    setPendingImageUploads([])
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
                  <span className="material-symbols-outlined" aria-hidden>save</span>
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {loadError ? <p className="th-admin-users__api-error">{loadError}</p> : null}
      {notice ? <p className="th-admin-product-detail__hint">{notice}</p> : null}

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-product-detail__thumb-wrap" aria-hidden>
          <img
            src={draft.imageUrls[0] || DEFAULT_PRODUCT_IMAGE_URL}
            alt=""
            className="th-admin-product-detail__thumb"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE_URL }}
          />
        </div>
        <div className="th-admin-product-detail__hero-text">
          <p className="th-admin-product-detail__sku">{draft.sku}</p>
          <h1 className="th-admin-product-detail__title">{draft.name}</h1>
          <div className="th-admin-product-detail__hero-meta">
            <span className="th-admin-badge th-admin-badge--role">{draft.categoryName}</span>
            <span className={`th-admin-badge ${draft.isActive ? 'th-admin-badge--active' : 'th-admin-badge--locked'}`}>
              <span className="th-admin-badge__dot" aria-hidden />
              {draft.isActive ? 'Đang bán' : 'Ngừng bán'}
            </span>
            <span className="th-admin-product-detail__price">{formatVND(draft.suggestedPrice)}</span>
          </div>
        </div>
      </header>

      <div
        className="th-admin-product-detail__tabs"
        role="tablist"
        aria-label="Phần thông tin sản phẩm"
      >
        {(
          [
            { id: 'overview' as const, label: 'Tổng quan', icon: 'dashboard' },
            { id: 'bom' as const, label: 'BOM', icon: 'account_tree' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`th-admin-product-detail__tab${activeTab === t.id ? ' th-admin-product-detail__tab--active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {bomCostStatus.kind === 'suggest' ? (
        <div
          className="th-admin-material-detail__alert-banner th-admin-product-detail__bom-cost-banner"
          role="status"
        >
          <span className="material-symbols-outlined" aria-hidden>
            price_change
          </span>
          <div>
            <strong>Đề xuất cập nhật giá vốn.</strong> Tổng chi phí NVL theo BOM (ước tính:{' '}
            {formatVND(bomCostStatus.total)}) <strong> cao hơn </strong> giá vốn hiện tại (
            {formatVND(bomCostStatus.current)}). Có thể ghi nhận giá vốn theo định mức rồi lưu ở Tổng
            quan.
            <div className="th-admin-product-detail__bom-cost-actions">
              <button
                type="button"
                className="th-admin-product-detail__btn-primary"
                onClick={() => applyBomCostSuggestion()}
              >
                Ghi {formatVND(bomCostStatus.total)} vào form &amp; mở chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {bomCostStatus.kind === 'incomplete' &&
      (bomRows.length > 0 || (bomEditing && bomDraftRows.some((r) => r.materialId))) &&
      (materialLoading || supplementalFetchInFlight > 0) ? (
        <p className="th-admin-product-detail__hint th-admin-product-detail__hint--inline">
          Đang ước tính chi phí NVL từ định mức…
        </p>
      ) : null}
      {bomCostStatus.kind === 'incomplete' &&
      (bomRows.length > 0 || (bomEditing && bomDraftRows.some((r) => r.materialId))) &&
      !materialLoading &&
      supplementalFetchInFlight === 0 ? (
        <p className="th-admin-product-detail__hint th-admin-product-detail__hint--warn" role="status">
          Chưa đủ <strong>giá vốn (đơn giá NVL)</strong> cho toàn bộ dòng trong BOM — không ước tính được
          tổng. Kiểm tra mã vật tư hoặc tải lại trang.
        </p>
      ) : null}

      <div className="th-admin-product-detail__panel">
        {activeTab === 'overview' ? (
          !editing ? (
            <dl className="th-admin-product-detail__dl">
              <div className="th-admin-product-detail__dl-row">
                <dt>ID</dt>
                <dd><span className="th-admin-product-detail__mono">#{draft.id}</span></dd>
              </div>
              <div className="th-admin-product-detail__dl-row">
                <dt>Ngành hàng</dt>
                <dd>{draft.categoryName?.trim() || '—'}</dd>
              </div>
              <div className="th-admin-product-detail__dl-row">
                <dt>Giá vốn</dt>
                <dd><strong>{formatVND(draft.costPrice)}</strong></dd>
              </div>
              <div className="th-admin-product-detail__dl-row">
                <dt>Giá đề xuất</dt>
                <dd><strong>{formatVND(draft.suggestedPrice)}</strong></dd>
              </div>
              <div className="th-admin-product-detail__dl-row">
                <dt>Tồn kho</dt>
                <dd>{draft.stockQuantity}</dd>
              </div>
              <div className="th-admin-product-detail__dl-row">
                <dt>Ngày tạo</dt>
                <dd>{new Date(draft.createdAt).toLocaleString('vi-VN')}</dd>
              </div>
            </dl>
          ) : (
            <form className="th-admin-product-detail__form" onSubmit={(e) => { e.preventDefault(); void handleSave() }}>
              <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Tên sản phẩm</span>
                <input
                  className="th-admin-product-detail__input"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  required
                />
              </label>
              <div className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Ngành hàng</span>
                <CategorySearchSelect
                  variant="field"
                  options={categoryPickerOptions}
                  value={draft.categoryId}
                  onChange={patchDraftCategory}
                  placeholder={categoryLoading ? 'Đang tải ngành hàng…' : 'Chọn ngành hàng…'}
                />
              </div>
              <div className="th-admin-product-detail__form-row">
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Giá vốn</span>
                  <input
                    type="number"
                    className="th-admin-product-detail__input"
                    value={draft.costPrice || ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, costPrice: Number(e.target.value) } : d))}
                    min={0}
                  />
                </label>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Giá đề xuất</span>
                  <input
                    type="number"
                    className="th-admin-product-detail__input"
                    value={draft.suggestedPrice || ''}
                    onChange={(e) => setDraft((d) => (d ? { ...d, suggestedPrice: Number(e.target.value) } : d))}
                    min={0}
                  />
                </label>
              </div>
              <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Ảnh từ máy (nhiều ảnh)</span>
                <input
                  className="th-admin-product-detail__input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    appendUploadFiles(e.target.files)
                    e.currentTarget.value = ''
                  }}
                />
                <span className="th-admin-product-detail__hint">
                  Đã chọn thêm {pendingImageUploads.length} ảnh mới.
                </span>
              </label>

              <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Ảnh hiện tại</span>
                <div className="th-admin-product-detail__images-list">
                  {draft.imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="th-admin-product-detail__images-item">
                      <img src={url} alt={`Ảnh hiện tại ${index + 1}`} className="th-admin-product-detail__images-thumb" />
                      <span className="th-admin-product-detail__images-item-url">{url}</span>
                      <button
                        type="button"
                        className="th-admin-product-detail__btn-icon-remove"
                        onClick={() => setDraft((d) => (d
                          ? { ...d, imageUrls: d.imageUrls.filter((_, i) => i !== index) }
                          : d))}
                        aria-label={`Xóa ảnh ${index + 1}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </label>

              <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Ảnh mới đã chọn</span>
                <div className="th-admin-product-detail__images-grid" aria-live="polite">
                  {pendingImageUploads.map((item, index) => (
                    <figure key={item.id} className="th-admin-product-detail__image-card">
                      <img
                        src={item.previewUrl}
                        alt={`Ảnh mới ${index + 1}`}
                        className="th-admin-product-detail__image-preview"
                      />
                      <figcaption className="th-admin-product-detail__image-name" title={item.file.name}>
                        {item.file.name}
                      </figcaption>
                      <button
                        type="button"
                        className="th-admin-product-detail__btn-icon-remove"
                        onClick={() => removePendingUpload(item.id)}
                        aria-label={`Xóa ảnh mới ${item.file.name}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden>close</span>
                      </button>
                    </figure>
                  ))}
                </div>
              </label>
            </form>
          )
        ) : (
          <div role="tabpanel" aria-label="Định mức BOM">
            <div className="th-admin-product-detail__bom-head">
              <p className="th-admin-product-detail__tab-lead">
                {bomCostStatus.kind === 'ok' || bomCostStatus.kind === 'suggest' ? (
                  <span className="th-admin-product-detail__bom-est">
                    Ước tính chi phí NVL: <strong>{formatVND(bomCostStatus.total)}</strong>
                    {bomCostStatus.kind === 'suggest' ? (
                      <span className="th-admin-mat-inline-warn"> (vượt giá vốn kho)</span>
                    ) : null}
                  </span>
                ) : null}
              </p>
              <div className="th-admin-product-detail__actions">
                {!bomEditing ? (
                  <button type="button" className="th-admin-product-detail__btn-primary" onClick={openBomEditor}>
                    <span className="material-symbols-outlined" aria-hidden>
                      {bomRows.length ? 'edit' : 'add'}
                    </span>
                    {bomRows.length ? 'Sửa BOM' : 'Tạo BOM'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="th-admin-product-detail__btn-ghost"
                      onClick={() => setBomEditing(false)}
                      disabled={bomSaving}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="th-admin-product-detail__btn-primary"
                      onClick={() => void saveBom()}
                      disabled={bomSaving}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        save
                      </span>
                      {bomSaving ? 'Đang lưu…' : 'Lưu BOM'}
                    </button>
                  </>
                )}
              </div>
            </div>
            {bomError ? <p className="th-admin-users__api-error">{bomError}</p> : null}
            {bomNotice ? <p className="th-admin-product-detail__hint">{bomNotice}</p> : null}
            {materialError && bomEditing ? <p className="th-admin-users__api-error">{materialError}</p> : null}
            {bomLoading ? (
              <p className="th-admin-product-detail__tab-lead" aria-busy>
                Đang tải BOM…
              </p>
            ) : bomEditing ? (
              <div className="th-admin-product-detail__bom-edit">
                <div className="th-admin-product-detail__table-wrap">
                  <table className="th-admin-product-detail__table th-admin-product-detail__table--bom-edit">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Vật tư</th>
                        <th>SL / TP</th>
                        <th className="th-admin-product-detail__money-col">Đơn giá NVL</th>
                        <th className="th-admin-product-detail__money-col">Thành tiền</th>
                        <th>Ghi chú</th>
                        <th>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomDraftRows.map((row, idx) => {
                        const unitCost = resolveMaterialUnitCost(row.materialId, costById)
                        const lineCost = bomLineCostVnd(row.quantity, unitCost)
                        return (
                        <tr key={row.localId}>
                          <td>{idx + 1}</td>
                          <td>
                            <CategorySearchSelect
                              variant="field"
                              value={row.materialId}
                              onChange={(id) => patchBomDraftLine(row.localId, { materialId: id })}
                              options={materialPickerOptions}
                              placeholder={materialLoading ? 'Đang tải vật tư…' : 'Chọn vật tư…'}
                              searchPlaceholder="Tìm mã / tên vật tư..."
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="th-admin-product-detail__input"
                              value={row.quantity}
                              min={0.0001}
                              step={0.0001}
                              onChange={(e) =>
                                patchBomDraftLine(row.localId, { quantity: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td className="th-admin-product-detail__money-col">
                            {unitCost != null ? formatVND(unitCost) : '—'}
                          </td>
                          <td className="th-admin-product-detail__money-col">
                            {lineCost != null ? formatVND(lineCost) : '—'}
                          </td>
                          <td>
                            <input
                              className="th-admin-product-detail__input"
                              value={row.note}
                              onChange={(e) => patchBomDraftLine(row.localId, { note: e.target.value })}
                              placeholder="Ghi chú (tuỳ chọn)"
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="th-admin-product-detail__btn-danger"
                              onClick={() => removeBomDraftLine(row.localId)}
                              disabled={bomDraftRows.length <= 1}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="th-admin-product-detail__btn-ghost" onClick={addBomDraftLine}>
                  <span className="material-symbols-outlined" aria-hidden>
                    add
                  </span>
                  Thêm dòng vật tư
                </button>
              </div>
            ) : bomRows.length === 0 ? (
              <p className="th-admin-product-detail__tab-lead">Chưa có dòng BOM cho sản phẩm này.</p>
            ) : (
              <div className="th-admin-product-detail__table-wrap">
                <table className="th-admin-product-detail__table">
                  <thead>
                    <tr>
                      <th>Mã NVL</th>
                      <th>Tên vật tư</th>
                      <th>Định mức</th>
                      <th className="th-admin-product-detail__money-col">Đơn giá NVL</th>
                      <th className="th-admin-product-detail__money-col">Thành tiền</th>
                      <th>Ghi chú</th>
                      <th>Liên kết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomRows.map((row) => {
                      const unitCost = row.materialUnitCost ?? resolveMaterialUnitCost(row.materialId, costById)
                      const lineCost = bomLineCostVnd(row.quantity, unitCost)
                      return (
                      <tr key={row.id}>
                        <td>
                          <code className="th-admin-product-detail__mono">{row.materialCode}</code>
                        </td>
                        <td>{row.materialName}</td>
                        <td>
                          {formatBomQuantity(row.quantity)} {row.materialUnit}
                        </td>
                        <td className="th-admin-product-detail__money-col">
                          {unitCost != null ? formatVND(unitCost) : '—'}
                        </td>
                        <td className="th-admin-product-detail__money-col">
                          {lineCost != null ? formatVND(lineCost) : '—'}
                        </td>
                        <td>{row.note ?? '—'}</td>
                        <td>
                          <Link
                            to={adminPaths.manufacturing.material(row.materialId)}
                            className="th-admin-product-detail__link"
                          >
                            Chi tiết vật tư
                          </Link>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                  {bomCostStatus.kind === 'ok' || bomCostStatus.kind === 'suggest' ? (
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="th-admin-product-detail__money-col th-admin-product-detail__money-foot-label">
                          Tổng NVL (ước tính)
                        </td>
                        <td className="th-admin-product-detail__money-col th-admin-product-detail__money-foot-total">
                          {formatVND(bomCostStatus.total)}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
