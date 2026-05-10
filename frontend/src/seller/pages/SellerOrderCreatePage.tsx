import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { CATEGORY_OPTIONS } from '../../admin/catalog/productModel'
import { type SellerAgencyRow } from '../services/sellerAgenciesApi'
import { type SellerStoreProduct } from '../services/sellerProductsApi'
import { sellerPaths } from '../config/sellerPaths'
import { fetchSellerAgencies } from '../services/sellerAgenciesApi'
import {
  buildSellerOrderConcatenatedNote,
  createSellerOrder,
  type CreateSellerOrderItemPayload,
} from '../services/sellerOrdersApi'
import { fetchSellerProducts } from '../services/sellerProductsApi'
import '../../admin/pages/AdminUsersPage.css'
import './SellerOrderCreatePage.css'

const BREADCRUMB_ITEMS: { label: string; to?: string }[] = [
  { label: 'Trang NVBH', to: sellerPaths.dashboard },
  { label: 'Đơn đặt hàng', to: sellerPaths.orders },
  { label: 'Tạo đơn mới' },
]

/** Chỉ đơn sẵn — dòng lấy từ catalog. */
type SellerOrderDraftLine = {
  id: string
  productId?: string
  sku: string
  productName: string
  qty: number
  unitPriceVnd: number
  lineNote: string
}

function newLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ln-${crypto.randomUUID().slice(0, 10)}`
  }
  return `ln-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultDeliveryDateIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 21)
  return d.toISOString().slice(0, 10)
}

function categoryLabel(categoryId: string): string {
  return CATEGORY_OPTIONS.find((c) => c.id === categoryId)?.label ?? categoryId
}

function productCategoryLine(p: SellerStoreProduct): string {
  return p.categoryName ?? categoryLabel(p.categoryId)
}

function productByIdFrom(products: SellerStoreProduct[], id: string): SellerStoreProduct | undefined {
  return products.find((p) => p.id === id)
}

function filterStoreProducts(products: SellerStoreProduct[], query: string): SellerStoreProduct[] {
  const q = query.trim().toLowerCase()
  if (!q) return products
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      productCategoryLine(p).toLowerCase().includes(q),
  )
}

type PanelPos = { top: number; left: number; width: number; maxHeight: number }

type CatalogProductComboProps = {
  instanceId: string
  products: SellerStoreProduct[]
  selectedProductId?: string
  onSelect: (productId: string) => void
  variant: 'toolbar' | 'table'
  disabled?: boolean
}

/** Combobox chọn SP catalog — thanh tìm trong panel; portal để không bị cắt bởi overflow bảng. */
function CatalogProductCombo({
  instanceId,
  products,
  selectedProductId,
  onSelect,
  variant,
  disabled,
}: CatalogProductComboProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = selectedProductId ? productByIdFrom(products, selectedProductId) : undefined
  const list = useMemo(() => filterStoreProducts(products, query), [products, query])

  const close = useCallback(() => {
    setOpen(false)
    setPanelPos(null)
    setQuery('')
  }, [])

  const updatePanelPos = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(280, rect.width)
    const gap = 6
    const below = rect.bottom + gap
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - below - 12 : 360
    const maxBelow = Math.max(140, Math.min(360, spaceBelow))
    let top = below
    let maxHeight = maxBelow
    if (spaceBelow < 160 && rect.top > 200) {
      const aboveSpace = rect.top - 12
      maxHeight = Math.max(140, Math.min(360, aboveSpace - gap))
      top = rect.top - gap - maxHeight
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const left = Math.min(Math.max(8, rect.left), vw - width - 8)

    setPanelPos({
      top,
      left,
      width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onWin = () => close()
    window.addEventListener('resize', onWin)
    return () => window.removeEventListener('resize', onWin)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return
      close()
    }
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const toggle = () => {
    if (disabled) return
    if (open) {
      close()
    } else {
      setQuery('')
      setOpen(true)
    }
  }

  const pick = (productId: string) => {
    onSelect(productId)
    close()
  }

  const listboxId = `${instanceId}-listbox`
  const searchId = `${instanceId}-search`

  const panel =
    open &&
    panelPos &&
    createPortal(
      <div
        ref={panelRef}
        id={listboxId}
        className="th-seller-order-create__combo-panel"
        role="listbox"
        aria-labelledby={searchId}
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          maxHeight: panelPos.maxHeight,
        }}
      >
        <div className="th-seller-order-create__combo-search">
          <span className="material-symbols-outlined th-seller-order-create__combo-search-icon" aria-hidden>
            search
          </span>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            className="th-seller-order-create__combo-search-input"
            placeholder="Tìm mã hàng, tên, nhóm…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            autoComplete="off"
          />
        </div>
        <ul className="th-seller-order-create__combo-list" role="none">
          {list.length === 0 ? (
            <li className="th-seller-order-create__combo-empty">Không có sản phẩm khớp.</li>
          ) : (
            list.map((p) => (
              <li key={p.id} role="none">
                <button
                  type="button"
                  role="option"
                  className="th-seller-order-create__combo-option"
                  onClick={() => pick(p.id)}
                >
                  <span className="th-seller-order-create__combo-option-name">{p.name}</span>
                  <span className="th-seller-order-create__combo-option-meta">
                    <code>{p.sku}</code>
                    <span>{productCategoryLine(p)}</span>
                    <strong>{formatVND(p.price)}</strong>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>,
      document.body,
    )

  const btnLabel =
    variant === 'toolbar'
      ? 'Chọn sản phẩm…'
      : selected
        ? selected.name
        : 'Chọn sản phẩm…'

  return (
    <div className="th-seller-order-create__combo">
      <button
        ref={btnRef}
        type="button"
        className={
          variant === 'toolbar'
            ? 'th-seller-order-create__combo-trigger th-seller-order-create__combo-trigger--toolbar'
            : 'th-seller-order-create__combo-trigger th-seller-order-create__combo-trigger--table'
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={toggle}
      >
        <span className="th-seller-order-create__combo-trigger-label">{btnLabel}</span>
        <span className="material-symbols-outlined th-seller-order-create__combo-chevron" aria-hidden>
          expand_more
        </span>
      </button>
      {panel}
    </div>
  )
}

type AgencyComboProps = {
  instanceId: string
  triggerId: string
  selectedAgency: SellerAgencyRow | undefined
  agencies: SellerAgencyRow[]
  loading?: boolean
  searchQuery: string
  onSearchQueryChange: (q: string) => void
  onSelectAgency: (agency: SellerAgencyRow) => void
  disabled?: boolean
}

/** Combobox chọn khách sỉ (ô tìm, debounce ở parent). */
function AgencyCombo({
  instanceId,
  triggerId,
  selectedAgency,
  agencies,
  loading,
  searchQuery,
  onSearchQueryChange,
  onSelectAgency,
  disabled,
}: AgencyComboProps) {
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const list = agencies

  const close = useCallback(() => {
    setOpen(false)
    setPanelPos(null)
    onSearchQueryChange('')
  }, [onSearchQueryChange])

  const updatePanelPos = useCallback(() => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(300, rect.width)
    const gap = 6
    const below = rect.bottom + gap
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - below - 12 : 360
    const maxBelow = Math.max(160, Math.min(400, spaceBelow))
    let top = below
    let maxHeight = maxBelow
    if (spaceBelow < 180 && rect.top > 200) {
      const aboveSpace = rect.top - 12
      maxHeight = Math.max(160, Math.min(400, aboveSpace - gap))
      top = rect.top - gap - maxHeight
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const left = Math.min(Math.max(8, rect.left), vw - width - 8)

    setPanelPos({
      top,
      left,
      width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPos()
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onWin = () => close()
    window.addEventListener('resize', onWin)
    return () => window.removeEventListener('resize', onWin)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      if (panelRef.current?.contains(e.target as Node)) return
      close()
    }
    document.addEventListener('scroll', onScroll, true)
    return () => document.removeEventListener('scroll', onScroll, true)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const toggle = () => {
    if (disabled) return
    if (open) {
      close()
    } else {
      onSearchQueryChange('')
      setOpen(true)
    }
  }

  const pick = (a: SellerAgencyRow) => {
    onSelectAgency(a)
    close()
  }

  const listboxId = `${instanceId}-agency-listbox`
  const searchId = `${instanceId}-agency-search`

  const panel =
    open &&
    panelPos &&
    createPortal(
      <div
        ref={panelRef}
        id={listboxId}
        className="th-seller-order-create__combo-panel th-seller-order-create__combo-panel--agency"
        role="listbox"
        aria-labelledby={searchId}
        style={{
          position: 'fixed',
          top: panelPos.top,
          left: panelPos.left,
          width: panelPos.width,
          maxHeight: panelPos.maxHeight,
        }}
      >
        <div className="th-seller-order-create__combo-search">
          <span className="material-symbols-outlined th-seller-order-create__combo-search-icon" aria-hidden>
            search
          </span>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            className="th-seller-order-create__combo-search-input"
            placeholder="Tìm tên, MST, SĐT, địa chỉ…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            autoComplete="off"
          />
        </div>
        <ul className="th-seller-order-create__combo-list" role="none">
          {loading ? (
            <li className="th-seller-order-create__combo-empty">Đang tải…</li>
          ) : list.length === 0 ? (
            <li className="th-seller-order-create__combo-empty">Không có khách sỉ khớp.</li>
          ) : (
            list.map((a) => (
              <li key={a.id} role="none">
                <button
                  type="button"
                  role="option"
                  className="th-seller-order-create__combo-option th-seller-order-create__combo-option--agency"
                  onClick={() => pick(a)}
                >
                  <span className="th-seller-order-create__combo-option-name">
                    {a.shortName}
                    <code className="th-seller-order-create__agency-code-chip">{a.code}</code>
                  </span>
                  <span className="th-seller-order-create__combo-option-meta">
                    <span>{a.legalName}</span>
                    <span>
                      {a.city} · {a.phone}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>,
      document.body,
    )

  const btnLabel = selectedAgency ? `${selectedAgency.shortName} · ${selectedAgency.code}` : 'Chọn khách sỉ…'

  return (
    <div className="th-seller-order-create__combo">
      <button
        id={triggerId}
        ref={btnRef}
        type="button"
        className="th-seller-order-create__combo-trigger th-seller-order-create__combo-trigger--agency"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        disabled={disabled}
        onClick={toggle}
      >
        <span className="th-seller-order-create__combo-trigger-label">{btnLabel}</span>
        <span className="material-symbols-outlined th-seller-order-create__combo-chevron" aria-hidden>
          expand_more
        </span>
      </button>
      {panel}
    </div>
  )
}

/** Tạo đơn NVBH (đơn sẵn). */
export function SellerOrderCreatePage() {
  const fid = useId()
  const navigate = useNavigate()
  const [agencyId, setAgencyId] = useState('')
  const [agencyRows, setAgencyRows] = useState<SellerAgencyRow[]>([])
  const [agencyLoading, setAgencyLoading] = useState(false)
  const [agencyLoadError, setAgencyLoadError] = useState<string | null>(null)
  const [agencySearchQuery, setAgencySearchQuery] = useState('')
  const [debouncedAgencySearch, setDebouncedAgencySearch] = useState('')
  const [agencyPickCache, setAgencyPickCache] = useState<Record<string, SellerAgencyRow>>({})
  const [expectedDelivery, setExpectedDelivery] = useState(defaultDeliveryDateIso)
  const [discountVnd, setDiscountVnd] = useState(0)
  const [shippingFeeVnd, setShippingFeeVnd] = useState(0)
  const [internalNote, setInternalNote] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [lines, setLines] = useState<SellerOrderDraftLine[]>([])
  const [catalogProducts, setCatalogProducts] = useState<SellerStoreProduct[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await fetchSellerProducts({
          page: 0,
          size: 200,
          is_active: true,
        })
        if (!cancelled && data.content.length > 0) {
          setCatalogProducts(data.content)
        }
      } catch {
        if (!cancelled) setCatalogProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedAgencySearch(agencySearchQuery.trim()), 400)
    return () => window.clearTimeout(t)
  }, [agencySearchQuery])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setAgencyLoading(true)
      setAgencyLoadError(null)
      try {
        const data = await fetchSellerAgencies({
          page: 0,
          size: 100,
          search: debouncedAgencySearch || undefined,
          is_active: true,
        })
        if (cancelled) return
        setAgencyRows(data.content)
      } catch (e) {
        if (cancelled) return
        setAgencyLoadError(e instanceof Error ? e.message : 'Không tải được danh sách khách sỉ')
        setAgencyRows([])
      } finally {
        if (!cancelled) setAgencyLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [debouncedAgencySearch])

  const handleSelectAgency = useCallback((a: SellerAgencyRow) => {
    setAgencyId(a.id)
    setAgencyPickCache((prev) => ({ ...prev, [a.id]: a }))
  }, [])

  const selectedAgency = useMemo(() => {
    if (!agencyId) return undefined
    return agencyRows.find((x) => x.id === agencyId) ?? agencyPickCache[agencyId]
  }, [agencyId, agencyRows, agencyPickCache])

  const subtotalVnd = useMemo(
    () => lines.reduce((s, ln) => s + Math.max(0, ln.qty) * Math.max(0, ln.unitPriceVnd), 0),
    [lines],
  )

  const grandTotalVnd = useMemo(() => {
    const raw = subtotalVnd - Math.max(0, discountVnd) + Math.max(0, shippingFeeVnd)
    return Math.max(0, raw)
  }, [subtotalVnd, discountVnd, shippingFeeVnd])

  const addFromCatalog = useCallback(
    (productId: string) => {
      const p = catalogProducts.find((x) => x.id === productId)
      if (!p) return
      setLines((prev) => [
        ...prev,
        {
          id: newLineId(),
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          qty: 1,
          unitPriceVnd: p.price,
          lineNote: '',
        },
      ])
    },
    [catalogProducts],
  )

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const patchLine = useCallback((id: string, patch: Partial<SellerOrderDraftLine>) => {
    setLines((prev) => prev.map((ln) => (ln.id === id ? { ...ln, ...patch } : ln)))
  }, [])

  const onChangeCatalogProduct = useCallback(
    (lineId: string, productId: string) => {
      const p = catalogProducts.find((x) => x.id === productId)
      if (!p) return
      patchLine(lineId, {
        productId: p.id,
        sku: p.sku,
        productName: p.name,
        unitPriceVnd: p.price,
      })
    },
    [catalogProducts, patchLine],
  )

  const linesMatchingKind = useMemo(
    () =>
      lines.filter(
        (ln) => Boolean(ln.productId) && ln.qty > 0 && ln.unitPriceVnd >= 0,
      ),
    [lines],
  )

  const canSubmitOrder = Boolean(agencyId) && linesMatchingKind.length > 0

  const saveDraftOrder = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!canSubmitOrder || !selectedAgency || submitting) return
      setSubmitting(true)
      setSubmitError(null)
      try {
        const items: CreateSellerOrderItemPayload[] = linesMatchingKind.map((ln) => ({
          productId: ln.productId!,
          quantity: ln.qty,
          unitPrice: ln.unitPriceVnd,
        }))
        const noteRaw = buildSellerOrderConcatenatedNote(linesMatchingKind, {
          internalNote,
        }).trim()
        const shippingAddressParts = [selectedAgency.address?.trim(), selectedAgency.city?.trim()].filter(
          Boolean,
        ) as string[]
        const shippingAddress =
          shippingAddressParts.length > 0 ? shippingAddressParts.join(', ') : '—'

        const data = await createSellerOrder({
          agencyId: selectedAgency.id,
          discountAmount: Math.max(0, discountVnd),
          shippingFee: Math.max(0, shippingFeeVnd),
          shippingAddress,
          expectedDeliveryDate: expectedDelivery.trim() || null,
          note: noteRaw.length > 0 ? noteRaw : null,
          items,
        })
        navigate(sellerPaths.order(data.id))
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không lưu được đơn nháp')
      } finally {
        setSubmitting(false)
      }
    },
    [
      canSubmitOrder,
      selectedAgency,
      submitting,
      linesMatchingKind,
      discountVnd,
      shippingFeeVnd,
      expectedDelivery,
      internalNote,
      navigate,
    ],
  )

  const firstCatalogId = catalogProducts[0]?.id

  return (
    <div className="th-seller-order-create">
      <nav className="th-seller-order-create__breadcrumb" aria-label="Breadcrumb">
        <ol className="th-seller-order-create__breadcrumb-list">
          {BREADCRUMB_ITEMS.map((item, i) => {
            const last = i === BREADCRUMB_ITEMS.length - 1
            return (
              <li key={`${item.label}-${i}`} className="th-seller-order-create__breadcrumb-item">
                {item.to && !last ? (
                  <Link to={item.to} className="th-seller-order-create__breadcrumb-link">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last
                        ? 'th-seller-order-create__breadcrumb-current'
                        : 'th-seller-order-create__breadcrumb-text'
                    }
                    aria-current={last ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}
                {!last ? (
                  <span className="th-seller-order-create__breadcrumb-sep" aria-hidden>
                    <span className="material-symbols-outlined">chevron_right</span>
                  </span>
                ) : null}
              </li>
            )
          })}
        </ol>
      </nav>

      <header className="th-seller-order-create__header">
        <div className="th-seller-order-create__title-row">
          <span className="material-symbols-outlined th-seller-order-create__title-icon" aria-hidden>
            post_add
          </span>
          <div>
            <h1 className="th-seller-order-create__title">Tạo đơn hàng mới</h1>
            
          </div>
        </div>
        <p className="th-seller-order-create__seller-note">
          NVBH: <strong>NVBH</strong>
          {' · '}
          <Link className="th-seller-order-create__store-link" to={sellerPaths.store}>
            Danh mục hàng
          </Link>
        </p>
      </header>

      <form className="th-seller-order-create__form" onSubmit={saveDraftOrder} noValidate>
        <div className="th-seller-order-create__layout">
          <div className="th-seller-order-create__main">
            <section className="th-seller-order-create__card" aria-labelledby={`${fid}-sec-party`}>
              <h2 id={`${fid}-sec-party`} className="th-seller-order-create__sec-title">
                <span className="material-symbols-outlined th-seller-order-create__sec-icon" aria-hidden>
                  handshake
                </span>
                Khách sỉ &amp; giao hàng
              </h2>
              <div className="th-seller-order-create__grid">
                <div className="th-seller-order-create__party-date-row">
                  <div className="th-seller-order-create__field th-seller-order-create__field--party">
                    <label className="th-seller-order-create__label" htmlFor={`${fid}-agency`}>
                      Khách sỉ <abbr title="bắt buộc">*</abbr>
                    </label>
                    <div className="th-seller-order-create__agency-combo-wrap">
                      <AgencyCombo
                        instanceId={`${fid}-agency-cb`}
                        triggerId={`${fid}-agency`}
                        selectedAgency={selectedAgency}
                        agencies={agencyRows}
                        loading={agencyLoading}
                        searchQuery={agencySearchQuery}
                        onSearchQueryChange={setAgencySearchQuery}
                        onSelectAgency={handleSelectAgency}
                      />
                    </div>
                    {agencyLoadError ? (
                      <p className="th-admin-users__api-error" role="alert" style={{ marginTop: '0.35rem' }}>
                        {agencyLoadError}
                      </p>
                    ) : null}
                  </div>
                  <div className="th-seller-order-create__field th-seller-order-create__field--delivery-date">
                    <label className="th-seller-order-create__label" htmlFor={`${fid}-eta`}>
                      Ngày giao dự kiến
                    </label>
                    <input
                      id={`${fid}-eta`}
                      className="th-seller-order-create__input th-seller-order-create__input--date-inline"
                      type="date"
                      value={expectedDelivery}
                      onChange={(e) => setExpectedDelivery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="th-seller-order-create__card" aria-labelledby={`${fid}-sec-lines`}>
              <h2 id={`${fid}-sec-lines`} className="th-seller-order-create__sec-title">
                <span className="material-symbols-outlined th-seller-order-create__sec-icon" aria-hidden>
                  inventory_2
                </span>
                Sản phẩm trong đơn
              </h2>

              <div className="th-seller-order-create__line-toolbar">
                <div className="th-seller-order-create__quick-add">
                  <span className="th-seller-order-create__label" id={`${fid}-quick-cat-label`}>
                    Chọn sản phẩm
                  </span>
                  <div className="th-seller-order-create__quick-add-combo">
                    <CatalogProductCombo
                      instanceId={`${fid}-quick-cat`}
                      products={catalogProducts}
                      variant="toolbar"
                      onSelect={(productId) => addFromCatalog(productId)}
                    />
                  </div>
                </div>
                <div className="th-seller-order-create__line-actions">
                  <button
                    type="button"
                    className="th-seller-order-create__btn-ghost"
                    disabled={!firstCatalogId}
                    onClick={() => firstCatalogId && addFromCatalog(firstCatalogId)}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      add_shopping_cart
                    </span>
                    Thêm dòng đầu tiên
                  </button>
                </div>
              </div>

              <div className="th-seller-order-create__table-wrap">
                <table className="th-seller-order-create__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Loại</th>
                      <th scope="col">Sản phẩm / mô tả</th>
                      <th scope="col">Mã hàng</th>
                      <th scope="col" className="th-seller-order-create__col-num">
                        SL
                      </th>
                      <th scope="col" className="th-seller-order-create__col-money">
                        Đơn giá
                      </th>
                      <th scope="col" className="th-seller-order-create__col-money">
                        Thành tiền
                      </th>
                      <th scope="col">Ghi chú dòng</th>
                      <th scope="col" className="th-seller-order-create__col-actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="th-seller-order-create__empty">
                          Chưa có sản phẩm. Chọn ở ô trên hoặc bấm Thêm dòng đầu tiên.
                        </td>
                      </tr>
                    ) : (
                      lines.map((ln, idx) => {
                        const lineTotal = Math.max(0, ln.qty) * Math.max(0, ln.unitPriceVnd)
                        return (
                          <tr key={ln.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <span className="th-seller-order-create__badge th-seller-order-create__badge--cat">
                                Catalog
                              </span>
                            </td>
                            <td className="th-seller-order-create__cell-name">
                              <CatalogProductCombo
                                instanceId={`${fid}-line-${ln.id}`}
                                products={catalogProducts}
                                variant="table"
                                selectedProductId={ln.productId}
                                onSelect={(productId) => onChangeCatalogProduct(ln.id, productId)}
                              />
                            </td>
                            <td>
                              <code className="th-seller-order-create__sku">{ln.sku}</code>
                            </td>
                            <td className="th-seller-order-create__col-num">
                              <input
                                className="th-seller-order-create__input th-seller-order-create__input--num"
                                type="number"
                                min={1}
                                step={1}
                                value={ln.qty}
                                onChange={(e) =>
                                  patchLine(ln.id, { qty: Math.max(1, Number(e.target.value) || 1) })
                                }
                                aria-label={`Số lượng dòng ${idx + 1}`}
                              />
                            </td>
                            <td className="th-seller-order-create__col-money">
                              <input
                                className="th-seller-order-create__input th-seller-order-create__input--num"
                                type="number"
                                min={0}
                                step={1000}
                                value={ln.unitPriceVnd}
                                onChange={(e) =>
                                  patchLine(ln.id, {
                                    unitPriceVnd: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                                aria-label={`Đơn giá dòng ${idx + 1}`}
                              />
                            </td>
                            <td className="th-seller-order-create__col-money">
                              <strong>{formatVND(lineTotal)}</strong>
                            </td>
                            <td>
                              <input
                                className="th-seller-order-create__input th-seller-order-create__input--in-table"
                                type="text"
                                value={ln.lineNote}
                                onChange={(e) => patchLine(ln.id, { lineNote: e.target.value })}
                                aria-label={`Ghi chú dòng ${idx + 1}`}
                              />
                            </td>
                            <td className="th-seller-order-create__col-actions">
                              <button
                                type="button"
                                className="th-seller-order-create__btn-icon"
                                onClick={() => removeLine(ln.id)}
                                aria-label={`Xóa dòng ${idx + 1}`}
                              >
                                <span className="material-symbols-outlined" aria-hidden>
                                  delete
                                </span>
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="th-seller-order-create__card" aria-labelledby={`${fid}-sec-money`}>
              <h2 id={`${fid}-sec-money`} className="th-seller-order-create__sec-title">
                <span className="material-symbols-outlined th-seller-order-create__sec-icon" aria-hidden>
                  payments
                </span>
                Chiết khấu, phí &amp; ghi chú
              </h2>
              <div className="th-seller-order-create__grid">
                <div className="th-seller-order-create__field">
                  <label className="th-seller-order-create__label" htmlFor={`${fid}-disc`}>
                    Chiết khấu đơn (VND)
                  </label>
                  <input
                    id={`${fid}-disc`}
                    className="th-seller-order-create__input"
                    type="number"
                    min={0}
                    step={100_000}
                    value={discountVnd}
                    onChange={(e) => setDiscountVnd(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="th-seller-order-create__field">
                  <label className="th-seller-order-create__label" htmlFor={`${fid}-ship`}>
                    Phí giao (VND)
                  </label>
                  <input
                    id={`${fid}-ship`}
                    className="th-seller-order-create__input"
                    type="number"
                    min={0}
                    step={100_000}
                    value={shippingFeeVnd}
                    onChange={(e) => setShippingFeeVnd(Math.max(0, Number(e.target.value) || 0))}
                  />
                </div>
                <div className="th-seller-order-create__field th-seller-order-create__field--full">
                  <label className="th-seller-order-create__label" htmlFor={`${fid}-inote`}>
                    Ghi chú nội bộ
                  </label>
                  <textarea
                    id={`${fid}-inote`}
                    className="th-seller-order-create__textarea"
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                  />
                </div>
                <div className="th-seller-order-create__field th-seller-order-create__field--full">
                  <label className="th-seller-order-create__label" htmlFor={`${fid}-dnote`}>
                    Ghi chú giao hàng
                  </label>
                  <textarea
                    id={`${fid}-dnote`}
                    className="th-seller-order-create__textarea"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {submitError ? (
              <p className="th-admin-users__api-error" role="alert" style={{ margin: '0 0 0.5rem' }}>
                {submitError}
              </p>
            ) : null}

            <div className="th-seller-order-create__actions th-seller-order-create__actions--footer">
              <Link className="th-seller-order-create__btn-secondary" to={sellerPaths.orders}>
                Hủy
              </Link>
              <button
                type="submit"
                className="th-seller-order-create__btn-primary"
                disabled={!canSubmitOrder || submitting}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  save
                </span>
                {submitting ? 'Đang lưu…' : 'Lưu đơn nháp'}
              </button>
            </div>
          </div>

          <aside className="th-seller-order-create__aside" aria-labelledby={`${fid}-aside-sum`}>
            <div className="th-seller-order-create__summary">
              <h2 id={`${fid}-aside-sum`} className="th-seller-order-create__summary-title">
                Tóm tắt
              </h2>
              <p className="th-seller-order-create__summary-kind">
                <span className="th-seller-order-create__summary-kind-label">Loại đơn</span>
                <span className="th-seller-order-create__summary-kind-badge th-seller-order-create__summary-kind-badge--ready_made">
                  Đơn sẵn
                </span>
              </p>
              {selectedAgency ? (
                <dl className="th-seller-order-create__agency-dl">
                  <dt>Khách</dt>
                  <dd>{selectedAgency.shortName}</dd>
                  <dt>Mã</dt>
                  <dd>
                    <code>{selectedAgency.code}</code>
                  </dd>
                  <dt>Hạn mức</dt>
                  <dd>{formatVND(selectedAgency.creditLimitVnd)}</dd>
                  <dt>Công nợ hiện tại</dt>
                  <dd>{formatVND(selectedAgency.totalDebtVnd)}</dd>
                </dl>
              ) : (
                <p className="th-seller-order-create__summary-muted">Chọn khách sỉ để xem hạn mức.</p>
              )}
              <ul className="th-seller-order-create__sum-list">
                <li>
                  <span>Tạm tính</span>
                  <strong>{formatVND(subtotalVnd)}</strong>
                </li>
                <li>
                  <span>Chiết khấu</span>
                  <strong>−{formatVND(discountVnd)}</strong>
                </li>
                <li>
                  <span>Phí giao</span>
                  <strong>+{formatVND(shippingFeeVnd)}</strong>
                </li>
                <li className="th-seller-order-create__sum-total">
                  <span>Tổng sau giảm</span>
                  <strong>{formatVND(grandTotalVnd)}</strong>
                </li>
              </ul>
              <p className="th-seller-order-create__sum-foot">
                {linesMatchingKind.length} dòng hợp lệ
                {!canSubmitOrder ? (
                  <>
                    <br />
                    <span className="th-seller-order-create__sum-warn">
                      {!agencyId
                        ? 'Chọn khách sỉ.'
                        : linesMatchingKind.length === 0
                          ? 'Thêm ít nhất một dòng sản phẩm.'
                          : 'Kiểm tra lại thông tin.'}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
