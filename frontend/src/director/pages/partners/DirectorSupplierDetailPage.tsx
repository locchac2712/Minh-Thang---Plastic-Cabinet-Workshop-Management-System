import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatQty } from '../../../admin/manufacturing/materialModel'
import { formatVND } from '../../../admin/partners/supplierModel'
import { formatPoAmount, mockPurchaseOrdersForSupplier } from '../../../admin/partners/supplierDetailMock'
import { PAGE_SIZE_OPTIONS } from '../../../admin/catalog/productModel'
import {
  AdminSupplierApiError,
  type SupplierMaterialResponse,
  type SupplierResponse,
  buildSupplierPatchPayload,
  fetchAdminSupplierById,
  fetchAdminSupplierMaterials,
  patchAdminSupplier,
  replaceSupplierLinkedMaterials,
  toggleAdminSupplierActive,
  unlinkMaterialFromSupplier,
} from '../../../admin/partners/adminSuppliersApi'
import { fetchAdminMaterials, type MaterialResponse } from '../../../admin/manufacturing/adminMaterialsApi'
import { adminPaths } from '../../../admin/config/adminPaths'
import { directorPaths } from '../../config/directorPaths'
import { AdminBreadcrumb } from '../../../admin/components/AdminBreadcrumb/AdminBreadcrumb'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminProductDetailPage.css'
import './DirectorSuppliersPage.css'
import './DirectorSupplierDetailPage.css'

type TabId = 'overview' | 'catalog' | 'ap'

type FormDraft = {
  name: string
  phone: string
  address: string
  taxCode: string
}

function formFromResponse(s: SupplierResponse): FormDraft {
  return {
    name: s.name,
    phone: s.phone ?? '',
    address: s.address ?? '',
    taxCode: s.taxCode ?? '',
  }
}

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || 'NCC'
}

function formatAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN')
  } catch {
    return iso
  }
}

export function DirectorSupplierDetailPage() {
  const fid = useId()
  const { supplierId } = useParams<{ supplierId: string }>()
  const confirmRef = useRef<HTMLDialogElement>(null)

  const [tab, setTab] = useState<TabId>('overview')
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null)
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ok' | 'err' | 'notfound'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FormDraft | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  const [matPageIndex, setMatPageIndex] = useState(0)
  const [matPageSize, setMatPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(15)
  const [matSearch, setMatSearch] = useState('')
  const [matDebounced, setMatDebounced] = useState('')
  const [matFilter, setMatFilter] = useState<'' | 'active' | 'inactive'>('')
  const [matRows, setMatRows] = useState<SupplierMaterialResponse[]>([])
  const [matLoading, setMatLoading] = useState(false)
  const [matError, setMatError] = useState<string | null>(null)
  const [matTotal, setMatTotal] = useState(0)
  const [matTotalPages, setMatTotalPages] = useState(0)

  const [catalogEditOpen, setCatalogEditOpen] = useState(false)
  const [catalogPickIds, setCatalogPickIds] = useState<string[]>([])
  const [catalogPickOptions, setCatalogPickOptions] = useState<MaterialResponse[]>([])
  const [catalogPickQuery, setCatalogPickQuery] = useState('')
  const [catalogPickLoading, setCatalogPickLoading] = useState(false)
  const [catalogSaving, setCatalogSaving] = useState(false)
  const [catalogActionError, setCatalogActionError] = useState<string | null>(null)
  const [matReloadKey, setMatReloadKey] = useState(0)

  const reloadCatalog = useCallback(() => setMatReloadKey((k) => k + 1), [])

  const load = useCallback(async () => {
    if (!supplierId) return
    setLoadStatus('loading')
    setLoadError(null)
    try {
      const s = await fetchAdminSupplierById(supplierId)
      setSupplier(s)
      setLoadStatus('ok')
    } catch (e) {
      if (e instanceof AdminSupplierApiError && e.statusCode === 404) {
        setLoadStatus('notfound')
        setSupplier(null)
      } else {
        setLoadStatus('err')
        setSupplier(null)
        if (e instanceof AdminSupplierApiError) setLoadError(e.message)
        else if (e instanceof Error) setLoadError(e.message)
        else setLoadError('Không tải được hồ sơ nhà cung cấp.')
      }
    }
  }, [supplierId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setEditing(false)
  }, [supplierId])

  useEffect(() => {
    if (supplier && !editing) {
      setDraft(formFromResponse(supplier))
    }
  }, [supplier, editing])

  useEffect(() => {
    const el = confirmRef.current
    if (!el) return
    if (pendingToggle && !el.open) el.showModal()
    else if (!pendingToggle && el.open) el.close()
  }, [pendingToggle])

  useEffect(() => {
    const t = window.setTimeout(() => setMatDebounced(matSearch.trim()), 380)
    return () => window.clearTimeout(t)
  }, [matSearch])

  useEffect(() => {
    setMatPageIndex(0)
  }, [matDebounced, matFilter, supplierId])

  useEffect(() => {
    if (tab !== 'catalog' || !supplierId) return
    const ac = new AbortController()
    setMatLoading(true)
    setMatError(null)
    ;(async () => {
      let aborted = false
      try {
        const p = await fetchAdminSupplierMaterials(supplierId, {
          page: matPageIndex,
          size: matPageSize,
          search: matDebounced || undefined,
          isActive:
            matFilter === 'active' ? true : matFilter === 'inactive' ? false : undefined,
          signal: ac.signal,
        })
        if (ac.signal.aborted) return
        setMatRows(p.content)
        setMatTotal(p.totalElements)
        setMatTotalPages(p.totalPages)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          aborted = true
          return
        }
        if (e instanceof AdminSupplierApiError) setMatError(e.message)
        else if (e instanceof Error) setMatError(e.message)
        else setMatError('Không tải được vật tư liên kết.')
        setMatRows([])
        setMatTotal(0)
        setMatTotalPages(0)
      } finally {
        if (!aborted && !ac.signal.aborted) setMatLoading(false)
      }
    })()
    return () => ac.abort()
  }, [tab, supplierId, matPageIndex, matPageSize, matDebounced, matFilter, matReloadKey])

  const loadAllLinkedMaterialIds = useCallback(async (sid: string): Promise<string[]> => {
    const ids: string[] = []
    let page = 0
    for (;;) {
      const p = await fetchAdminSupplierMaterials(sid, { page, size: 100 })
      ids.push(...p.content.map((m) => m.id))
      if (p.last || p.content.length === 0) break
      page += 1
      if (page > 50) break
    }
    return ids
  }, [])

  const openCatalogEdit = useCallback(async () => {
    if (!supplierId) return
    setCatalogActionError(null)
    setCatalogPickLoading(true)
    setCatalogEditOpen(true)
    try {
      const [linkedIds, allMaterials] = await Promise.all([
        loadAllLinkedMaterialIds(supplierId),
        (async () => {
          const items: MaterialResponse[] = []
          let page = 0
          for (;;) {
            const p = await fetchAdminMaterials({ page, size: 100, isActive: true })
            items.push(...p.content)
            if (p.last || p.content.length === 0) break
            page += 1
            if (page > 50) break
          }
          return items
        })(),
      ])
      setCatalogPickIds(linkedIds)
      setCatalogPickOptions(allMaterials)
    } catch (e) {
      setCatalogActionError(
        e instanceof AdminSupplierApiError ? e.message : 'Không tải được danh mục vật tư.',
      )
      setCatalogEditOpen(false)
    } finally {
      setCatalogPickLoading(false)
    }
  }, [loadAllLinkedMaterialIds, supplierId])

  const saveCatalogEdit = useCallback(async () => {
    if (!supplierId || catalogSaving) return
    setCatalogSaving(true)
    setCatalogActionError(null)
    try {
      await replaceSupplierLinkedMaterials(supplierId, catalogPickIds)
      setCatalogEditOpen(false)
      reloadCatalog()
    } catch (e) {
      setCatalogActionError(
        e instanceof AdminSupplierApiError ? e.message : 'Không lưu được danh mục vật tư.',
      )
    } finally {
      setCatalogSaving(false)
    }
  }, [catalogPickIds, catalogSaving, reloadCatalog, supplierId])

  const handleUnlinkMaterial = useCallback(
    async (materialId: string) => {
      if (!supplierId) return
      setCatalogActionError(null)
      try {
        await unlinkMaterialFromSupplier(supplierId, materialId)
        reloadCatalog()
      } catch (e) {
        setCatalogActionError(
          e instanceof AdminSupplierApiError ? e.message : 'Không gỡ được liên kết vật tư.',
        )
      }
    },
    [reloadCatalog, supplierId],
  )

  const catalogPickFiltered = useMemo(() => {
    const q = catalogPickQuery.trim().toLowerCase()
    if (!q) return catalogPickOptions
    return catalogPickOptions.filter(
      (m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
    )
  }, [catalogPickOptions, catalogPickQuery])

  const poRows = useMemo(() => (supplier ? mockPurchaseOrdersForSupplier(supplier) : []), [supplier])

  const handleSave = useCallback(async () => {
    if (!supplierId || !draft || !supplier) return
    setSaveError(null)
    const partial = buildSupplierPatchPayload(supplier, draft)
    if (Object.keys(partial).length === 0) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await patchAdminSupplier(supplierId, partial)
      setSupplier(await fetchAdminSupplierById(supplierId))
      setEditing(false)
    } catch (e) {
      if (e instanceof AdminSupplierApiError) setSaveError(e.message)
      else if (e instanceof Error) setSaveError(e.message)
      else setSaveError('Không lưu được thay đổi.')
    } finally {
      setSaving(false)
    }
  }, [supplierId, draft, supplier])

  const handleCancelEdit = useCallback(() => {
    if (supplier) setDraft(formFromResponse(supplier))
    setSaveError(null)
    setEditing(false)
  }, [supplier])

  const doToggle = useCallback(async () => {
    if (!supplierId) return
    setToggling(true)
    setToggleError(null)
    try {
      await toggleAdminSupplierActive(supplierId)
      setSupplier(await fetchAdminSupplierById(supplierId))
      setPendingToggle(false)
    } catch (e) {
      if (e instanceof AdminSupplierApiError) setToggleError(e.message)
      else if (e instanceof Error) setToggleError(e.message)
      else setToggleError('Không cập nhật được trạng thái.')
    } finally {
      setToggling(false)
    }
  }, [supplierId])

  if (!supplierId) {
    return <Navigate to={directorPaths.partners.suppliers} replace />
  }
  if (loadStatus === 'notfound') {
    return <Navigate to={directorPaths.partners.suppliers} replace />
  }
  if (loadStatus === 'loading' || (loadStatus === 'ok' && !supplier)) {
    return (
      <div className="th-admin-product-detail th-admin-product-detail--loading" aria-busy>
        Đang tải hồ sơ NCC…
      </div>
    )
  }
  if (loadStatus === 'err' || !supplier || !draft) {
    return (
      <div className="th-admin-product-detail">
        <p className="th-admin-list-toolbar__error" role="alert">
          {loadError ?? 'Không có dữ liệu.'}
        </p>
        <Link to={directorPaths.partners.suppliers} className="th-admin-product-detail__back">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  const letter = initialsFromName(supplier.name)
  const debtTitle =
    'Công nợ cập nhật qua thanh toán và PO — không sửa tay ở màn hình quản trị này.'

  return (
    <div className="th-admin-product-detail th-admin-supplier-detail">
      <div className="th-admin-product-detail__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: directorPaths.dashboard },
            { label: 'Nhà cung cấp', to: directorPaths.partners.suppliers },
            { label: supplier.name },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={directorPaths.partners.suppliers} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
          <div className="th-admin-product-detail__actions">
            {!editing ? (
              <button
                type="button"
                className="th-admin-product-detail__btn-ghost"
                onClick={() => {
                  setSaveError(null)
                  setPendingToggle(true)
                }}
                disabled={toggling}
              >
                {supplier.isActive ? 'Ngừng hợp tác' : 'Kích hoạt lại'}
              </button>
            ) : null}
            {!editing ? (
              <button
                type="button"
                className="th-admin-product-detail__btn-primary"
                onClick={() => {
                  setSaveError(null)
                  setEditing(true)
                }}
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
                  onClick={handleCancelEdit}
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
                  {saving ? 'Đang lưu…' : 'Lưu'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-supplier-detail__avatar" aria-hidden>
          {letter}
        </div>
        <div className="th-admin-product-detail__hero-text">
          <p className="th-admin-product-detail__sku">
            <code className="th-admin-product-detail__mono" title={supplier.id}>
              {supplier.id}
            </code>
          </p>
          <h1 className="th-admin-product-detail__title">{supplier.name}</h1>
          <div className="th-admin-product-detail__hero-meta">
            <span
              className={
                supplier.isActive
                  ? 'th-admin-badge th-admin-badge--active'
                  : 'th-admin-badge th-admin-badge--locked'
              }
            >
              <span className="th-admin-badge__dot" aria-hidden />
              {supplier.isActive ? 'Đang hợp tác' : 'Ngưng hợp tác'}
            </span>
            <span
              className="th-admin-product-detail__price"
              title={debtTitle}
              style={{ cursor: 'help' }}
            >
              {formatVND(supplier.totalDebt)}
              <span className="th-admin-material-detail__hero-unit" title={debtTitle}>
                {' '}
                công nợ
              </span>
            </span>
          </div>
        </div>
      </header>

      <div
        className="th-admin-product-detail__tabs"
        role="tablist"
        aria-label="Phần thông tin nhà cung cấp"
      >
        {(
          [
            { id: 'overview' as const, label: 'Tổng quan', icon: 'dashboard' },
            { id: 'catalog' as const, label: 'Vật tư cung ứng', icon: 'inventory_2' },
            { id: 'ap' as const, label: 'Đặt mua & công nợ', icon: 'payments' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`th-admin-product-detail__tab${tab === t.id ? ' th-admin-product-detail__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {saveError && (
        <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0.25rem 0' }}>
          {saveError}
        </p>
      )}

      <div className="th-admin-product-detail__panel">
        {tab === 'overview' && (
          <div className="th-admin-product-detail__grid" role="tabpanel">
            {editing ? (
              <form
                className="th-admin-product-detail__form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSave()
                }}
              >
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Tên *</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                    maxLength={255}
                    required
                    disabled={saving}
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">SĐT</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.phone}
                      onChange={(e) => setDraft((d) => (d ? { ...d, phone: e.target.value } : d))}
                      maxLength={20}
                      disabled={saving}
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">MST</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.taxCode}
                      onChange={(e) => setDraft((d) => (d ? { ...d, taxCode: e.target.value } : d))}
                      maxLength={50}
                      disabled={saving}
                    />
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Địa chỉ</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.address}
                    onChange={(e) => setDraft((d) => (d ? { ...d, address: e.target.value } : d))}
                    disabled={saving}
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label" title={debtTitle}>
                      Công nợ (chỉ đọc)
                    </span>
                    <input
                      className="th-admin-product-detail__input"
                      value={formatVND(supplier.totalDebt)}
                      readOnly
                      disabled
                      title={debtTitle}
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Tạo lúc</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={formatAt(supplier.createdAt)}
                      readOnly
                      disabled
                    />
                  </label>
                </div>
              </form>
            ) : (
              <>
                <dl className="th-admin-product-detail__dl">
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Số điện thoại</dt>
                    <dd>{supplier.phone && supplier.phone.length > 0 ? supplier.phone : '—'}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>MST</dt>
                    <dd>
                      {supplier.taxCode && supplier.taxCode.length > 0 ? (
                        <code className="th-admin-product-detail__mono">{supplier.taxCode}</code>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Địa chỉ</dt>
                    <dd>
                      {supplier.address && supplier.address.length > 0 ? supplier.address : '—'}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>
                      Công nợ{' '}
                      <span
                        className="material-symbols-outlined th-admin-supplier-help"
                        style={{ fontSize: '0.9rem', verticalAlign: 'middle' }}
                        title={debtTitle}
                        aria-label={debtTitle}
                      >
                        info
                      </span>
                    </dt>
                    <dd title={debtTitle}>{formatVND(supplier.totalDebt)}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Ngày tạo hồ sơ</dt>
                    <dd>{formatAt(supplier.createdAt)}</dd>
                  </div>
                </dl>
              </>
            )}
          </div>
        )}

        {tab === 'catalog' && (
          <div role="tabpanel">
            <p className="th-admin-product-detail__tab-lead">
              Vật tư trong danh mục NCC này — PO chỉ mua được các mã đã gắn. Danh mục tổng:{' '}
              <Link to={adminPaths.manufacturing.materials} className="th-admin-product-detail__link">
                Vật tư
              </Link>
              .
            </p>
            <div className="th-admin-product-detail__actions" style={{ marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="th-admin-product-detail__btn-primary"
                onClick={() => void openCatalogEdit()}
                disabled={!supplier?.isActive || catalogPickLoading}
              >
                Sửa danh mục NVL
              </button>
            </div>
            {catalogActionError ? (
              <p className="th-admin-list-toolbar__error" role="alert">
                {catalogActionError}
              </p>
            ) : null}
            <div className="th-admin-list-toolbar__head" style={{ margin: '0 0 0.75rem' }}>
              <div className="th-admin-list-toolbar__bar" style={{ alignItems: 'flex-end' }}>
                <label className="th-admin-list-toolbar__search" style={{ flex: '1 1 12rem' }}>
                  <span className="material-symbols-outlined th-admin-list-toolbar__search-icon" aria-hidden>
                    search
                  </span>
                  <span className="th-admin-list-toolbar-visually-hidden">Tìm mã, tên vật tư</span>
                  <input
                    type="search"
                    className="th-admin-list-toolbar__search-input"
                    value={matSearch}
                    onChange={(e) => setMatSearch(e.target.value)}
                    placeholder="Tìm theo tên, mã…"
                    autoComplete="off"
                    disabled={matLoading}
                  />
                </label>
                <label className="th-admin-list-toolbar__filter">
                  <span className="th-admin-list-toolbar__filter-label">Trạng thái</span>
                  <select
                    className="th-admin-list-toolbar__filter-select"
                    value={matFilter}
                    onChange={(e) => setMatFilter(e.target.value as '' | 'active' | 'inactive')}
                    disabled={matLoading}
                  >
                    <option value="">Tất cả</option>
                    <option value="active">Còn dùng</option>
                    <option value="inactive">Ngưng</option>
                  </select>
                </label>
              </div>
            </div>
            {matError && (
              <p className="th-admin-list-toolbar__error" role="alert">
                {matError}
              </p>
            )}
            {matLoading && <p className="th-admin-product-detail__tab-lead">Đang tải…</p>}
            {!matLoading && !matError && matTotal === 0 && (
              <p className="th-admin-product-detail__tab-lead">Chưa có vật tư nào theo bộ lọc.</p>
            )}
            {!matLoading && !matError && matRows.length > 0 && (
              <div className="th-admin-product-detail__table-wrap">
                <table className="th-admin-product-detail__table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Tên</th>
                      <th>ĐVT</th>
                      <th>Tồn</th>
                      <th>Trạng thái</th>
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {matRows.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <code className="th-admin-product-detail__mono">{m.code}</code>
                        </td>
                        <td>{m.name}</td>
                        <td>{m.unit}</td>
                        <td>
                          {formatQty(m.stockQuantity, m.unit)}
                          {m.stockQuantity <= m.minStockLevel ? (
                            <span
                              className="th-admin-badge th-admin-badge--role"
                              style={{ marginLeft: '0.35rem' }}
                              title="Dưới hoặc bằng ngưỡng tồn tối thiểu"
                            >
                              tồn thấp
                            </span>
                          ) : null}
                        </td>
                        <td>
                          {m.isActive ? (
                            <span className="th-admin-badge th-admin-badge--active">Đang dùng</span>
                          ) : (
                            <span className="th-admin-badge th-admin-badge--locked">Ngưng</span>
                          )}
                        </td>
                        <td>
                          <Link
                            to={adminPaths.manufacturing.material(m.id)}
                            className="th-admin-product-detail__link"
                          >
                            Chi tiết
                          </Link>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="th-admin-product-detail__btn-ghost"
                            onClick={() => void handleUnlinkMaterial(m.id)}
                            disabled={!supplier?.isActive}
                          >
                            Gỡ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!matLoading && matTotal > 0 && (
              <div
                className="th-admin-supplier-list-pagination"
                style={{ marginTop: '0.75rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                aria-label="Phân trang vật tư"
              >
                <p className="th-admin-supplier-list-pagination__meta" style={{ margin: 0 }}>
                  Hiển thị <strong>
                    {matTotal === 0
                      ? '0'
                      : `${matPageIndex * matPageSize + 1}–${Math.min(
                          (matPageIndex + 1) * matPageSize,
                          matTotal,
                        )}`}
                  </strong>
                  {matTotal > 0 ? ` / ${matTotal} mã` : null}
                </p>
                <div className="th-admin-supplier-list-pagination__controls">
                  <label className="th-admin-supplier-list-pagination__size">
                    <span>Số dòng</span>
                    <select
                      value={matPageSize}
                      onChange={(e) => {
                        setMatPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
                        setMatPageIndex(0)
                      }}
                      disabled={matLoading}
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="th-admin-supplier-list-pagination__btn"
                    disabled={matLoading || matPageIndex <= 0}
                    onClick={() => setMatPageIndex((p) => Math.max(0, p - 1))}
                  >
                    Trước
                  </button>
                  <span className="th-admin-supplier-list-pagination__page">
                    Trang {matTotalPages === 0 ? 0 : matPageIndex + 1}/{matTotalPages || 1}
                  </span>
                  <button
                    type="button"
                    className="th-admin-supplier-list-pagination__btn"
                    disabled={matLoading || matTotalPages === 0 || matPageIndex >= matTotalPages - 1}
                    onClick={() => setMatPageIndex((p) => p + 1)}
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ap' && (
          <div role="tabpanel">
            <p className="th-admin-product-detail__tab-lead">
              Minh hoạ PO theo mã <code className="th-admin-product-detail__mono">{supplier.id}</code> — khi
              tích hợp, lấy từ mô-đun mua hàng / công nợ.
            </p>
            <div className="th-admin-product-detail__cards">
              <div className="th-admin-product-detail__card">
                <h3 className="th-admin-product-detail__card-title">Công nợ (API)</h3>
                <p className="th-admin-product-detail__card-value" title={debtTitle}>
                  {formatVND(supplier.totalDebt)}
                </p>
                <p className="th-admin-product-detail__card-note">{debtTitle}</p>
              </div>
            </div>
            <h3 className="th-admin-material-detail__subheading">Đơn hàng mua gần đây (mock)</h3>
            <div className="th-admin-product-detail__table-wrap">
              <table className="th-admin-product-detail__table">
                <thead>
                  <tr>
                    <th>Số PO</th>
                    <th>Ngày đặt</th>
                    <th>Dự kiến</th>
                    <th>Giá trị</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {poRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <code className="th-admin-product-detail__mono">{r.poNumber}</code>
                      </td>
                      <td>{r.orderDate}</td>
                      <td>{r.expectedDate}</td>
                      <td>{formatPoAmount(r.amountVnd)}</td>
                      <td>{r.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <dialog
        ref={confirmRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${fid}-tgl-title`}
        aria-describedby={`${fid}-tgl-desc`}
        onClose={() => setPendingToggle(false)}
      >
        <div className="th-dlg__panel">
          <button
            type="button"
            className="th-dlg__close"
            onClick={() => {
              setToggleError(null)
              setPendingToggle(false)
            }}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
          <div className="th-dlg__confirm-body">
            <div className="th-dlg__confirm-icon th-dlg__confirm-icon--warn" aria-hidden>
              <span className="material-symbols-outlined">swap_horiz</span>
            </div>
            <h2 id={`${fid}-tgl-title`} className="th-dlg__confirm-title">
              {supplier.isActive ? 'Ngừng hợp tác với NCC này?' : 'Kích hoạt lại hợp tác?'}
            </h2>
            <p id={`${fid}-tgl-desc`} className="th-dlg__confirm-desc">
              {supplier.isActive ? (
                <>Tạm dừng <strong>{supplier.name}</strong> — cân nhắc công nợ và PO.</>
              ) : (
                <>Bật lại <strong>{supplier.name}</strong> trong luồng mua hàng.</>
              )}
            </p>
          </div>
          {toggleError && (
            <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 1.5rem' }}>
              {toggleError}
            </p>
          )}
          <div className="th-dlg__footer th-dlg__footer--confirm">
            <button
              type="button"
              className="th-admin-product-detail__btn-ghost"
              onClick={() => {
                setToggleError(null)
                setPendingToggle(false)
              }}
              disabled={toggling}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-product-detail__btn-primary"
              onClick={() => void doToggle()}
              disabled={toggling}
            >
              {toggling ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </dialog>

      {catalogEditOpen ? (
        <div className="th-dlg-backdrop" role="presentation">
          <div className="th-dlg__panel th-dlg__panel--wide" role="dialog" aria-modal="true" aria-labelledby={`${fid}-cat-title`}>
            <header className="th-dlg__header">
              <h2 id={`${fid}-cat-title`} className="th-dlg__title">
                Sửa danh mục vật tư
              </h2>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => !catalogSaving && setCatalogEditOpen(false)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body">
              {catalogPickLoading ? (
                <p>Đang tải danh sách vật tư…</p>
              ) : (
                <>
                  <label className="th-admin-product-create__field">
                    <span className="th-admin-product-create__label">Tìm vật tư</span>
                    <input
                      type="search"
                      className="th-admin-product-create__input"
                      value={catalogPickQuery}
                      onChange={(e) => setCatalogPickQuery(e.target.value)}
                      placeholder="Mã, tên…"
                      autoComplete="off"
                    />
                  </label>
                  <ul className="th-supplier-multi__list" style={{ maxHeight: '18rem' }}>
                    {catalogPickFiltered.length === 0 ? (
                      <li className="th-supplier-multi__empty">Không có vật tư phù hợp.</li>
                    ) : (
                      catalogPickFiltered.map((m) => {
                        const checked = catalogPickIds.includes(m.id)
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              className={`th-supplier-multi__option${checked ? ' is-selected' : ''}`}
                              onClick={() => {
                                setCatalogPickIds((prev) =>
                                  checked ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                                )
                              }}
                            >
                              <span>
                                {m.code} · {m.name}
                              </span>
                              {checked ? (
                                <span className="material-symbols-outlined" aria-hidden>
                                  check
                                </span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })
                    )}
                  </ul>
                  <p className="th-admin-product-detail__tab-lead">
                    Đã chọn {catalogPickIds.length} vật tư.
                  </p>
                </>
              )}
            </div>
            <div className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-product-detail__btn-ghost"
                onClick={() => setCatalogEditOpen(false)}
                disabled={catalogSaving}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-product-detail__btn-primary"
                onClick={() => void saveCatalogEdit()}
                disabled={catalogSaving || catalogPickLoading}
              >
                {catalogSaving ? 'Đang lưu…' : 'Lưu danh mục'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
