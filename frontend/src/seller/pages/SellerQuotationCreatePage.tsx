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
import { App } from 'antd'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  formatVndInputAmount,
  normalizeVndInputTyping,
  parseVndInput,
} from '../../shared/money/vndInput'
import { CATEGORY_OPTIONS } from '../../admin/catalog/productModel'
import { sellerPaths } from '../config/sellerPaths'
import { SELLER_LOGIN_NAME, type SellerAgencyRow } from '../data/sellerAgenciesMock'
import { SELLER_STORE_PRODUCTS, type SellerStoreProduct } from '../data/sellerStoreMock'
import { clearQuickQuotePrefill, readQuickQuotePrefill, type QuickQuotePrefillPayload } from '../quickQuotePrefill'
import { fetchSellerAgencies } from '../sellerAgenciesApi'
import {
  buildSellerOrderConcatenatedNote,
  type CreateSellerOrderItemPayload,
} from '../sellerOrdersApi'
import { orderCodeFromDto } from '../sellerOrderRef'
import { computeAgencyCreditSnapshot } from '../agencyCreditSnapshot'
import { createSellerQuotation } from '../sellerQuotationsApi'
import { fetchSellerProducts } from '../sellerProductsApi'
import { sellerQuotationLineSourceLabel, SELLER_CATALOG_KIND_LABEL, SELLER_CUSTOM_KIND_LABEL } from '../data/sellerOrdersMock'
import { bumpProductLineQty } from '../sellerOrderDraftLines'
import {
  effectiveUnitFromListAndPercent,
  lineSubtotalFromListAndPercent,
  parseDiscountPercentField,
} from '../sellerQuotationLinePricing'
import { todayIsoDate, validateQuotationValidUntilInput } from '../sellerQuotationValidity'
import '../../admin/pages/AdminUsersPage.css'
import './SellerOrderCreatePage.css'

const BREADCRUMB_ITEMS: { label: string; to?: string }[] = [
  { label: 'Trang NVBH', to: sellerPaths.dashboard },
  { label: 'Báo giá', to: sellerPaths.quotations },
  { label: 'Tạo báo giá mới' },
]

type QuotationLineSource = 'standard' | 'agency_custom'

/** Chỉ đơn sẵn — dòng lấy từ catalog. */
type SellerOrderDraftLine = {
  id: string
  /** Catalog chuẩn hay hàng custom theo đại lý đang chọn. */
  lineSource: QuotationLineSource
  productId?: string
  sku: string
  productName: string
  qty: number
  /** Đơn giá niêm yết (khóa theo giá SP). */
  unitPriceVnd: number
  /** Chiết khấu % trên đơn giá dòng (0–100). */
  discountPercent: number
  lineNote: string
}

function lineEffectiveUnitPriceVnd(ln: SellerOrderDraftLine): number {
  return effectiveUnitFromListAndPercent(ln.unitPriceVnd, ln.discountPercent)
}

function lineTotalVnd(ln: SellerOrderDraftLine): number {
  return lineSubtotalFromListAndPercent(ln.unitPriceVnd, ln.discountPercent, ln.qty)
}

function newLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ln-${crypto.randomUUID().slice(0, 10)}`
  }
  return `ln-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type QuickQuoteHydrateResult = {
  lines: SellerOrderDraftLine[]
  droppedAffinityCount: number
}

function hydrateLinesFromQuickQuotePrefill(prefill: QuickQuotePrefillPayload): QuickQuoteHydrateResult {
  let droppedAffinityCount = 0
  const lines: SellerOrderDraftLine[] = []
  for (const item of prefill.items) {
    if (item.lineSource === 'agency_custom' && item.ownerAgencyId !== prefill.agencyId) {
      droppedAffinityCount += 1
      continue
    }
    lines.push({
      id: newLineId(),
      lineSource: item.lineSource,
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      qty: Math.max(1, Math.floor(item.qty) || 1),
      unitPriceVnd: Math.max(0, item.unitPriceVnd),
      discountPercent: 0,
      lineNote: '',
    })
  }
  return { lines, droppedAffinityCount }
}

function buildFallbackAgencyFromPrefill(prefill: QuickQuotePrefillPayload): SellerAgencyRow {
  return {
    id: prefill.agencyId,
    code: prefill.agency.code,
    legalName: prefill.agency.legalName,
    shortName: prefill.agency.shortName,
    taxCode: '',
    level: 'standard',
    phone: '',
    email: '',
    city: '',
    address: '',
    assignedSellerName: SELLER_LOGIN_NAME,
    totalDebtVnd: 0,
    creditLimitVnd: 0,
    isActive: true,
    note: '',
    createdAt: new Date(prefill.createdAt).toISOString().slice(0, 10),
    recentCabinetOrders90d: 0,
  }
}

function vndInputDisplay(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return ''
  return formatVndInputAmount(n)
}

function parseVndField(raw: string): number {
  return Math.max(0, parseVndInput(raw) ?? 0)
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

/** Tạo báo giá NVBH. */
export function SellerQuotationCreatePage() {
  const { modal, message } = App.useApp()
  const fid = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const quickQuoteMode = useMemo(
    () => new URLSearchParams(location.search).get('quickQuote') === '1',
    [location.search],
  )
  const quickQuotePrefill = useMemo(
    () => (quickQuoteMode || location.state ? readQuickQuotePrefill(location.state) : null),
    [location.state, quickQuoteMode],
  )
  const quickQuoteHydrate = useMemo(
    () => (quickQuotePrefill ? hydrateLinesFromQuickQuotePrefill(quickQuotePrefill) : null),
    [quickQuotePrefill],
  )
  const isAgencyLockedByQuickQuote = Boolean(quickQuotePrefill?.agencyId)
  const quickQuoteAffinityWarn =
    quickQuoteHydrate && quickQuoteHydrate.droppedAffinityCount > 0
      ? `Đã loại ${quickQuoteHydrate.droppedAffinityCount} item custom không thuộc đại lý đã khóa.`
      : null

  const [agencyId, setAgencyId] = useState(() => quickQuotePrefill?.agencyId ?? '')
  const [agencyRows, setAgencyRows] = useState<SellerAgencyRow[]>([])
  const [agencyLoading, setAgencyLoading] = useState(false)
  const [agencyLoadError, setAgencyLoadError] = useState<string | null>(null)
  const [agencySearchQuery, setAgencySearchQuery] = useState('')
  const [debouncedAgencySearch, setDebouncedAgencySearch] = useState('')
  const [agencyPickCache, setAgencyPickCache] = useState<Record<string, SellerAgencyRow>>(() => {
    if (!quickQuotePrefill) return {}
    const fallback = buildFallbackAgencyFromPrefill(quickQuotePrefill)
    return { [fallback.id]: fallback }
  })
  const [quotationValidUntil, setQuotationValidUntil] = useState('')
  const [discountVnd, setDiscountVnd] = useState(0)
  const [shippingFeeVnd, setShippingFeeVnd] = useState(0)
  const [internalNote, setInternalNote] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [lines, setLines] = useState<SellerOrderDraftLine[]>(() => quickQuoteHydrate?.lines ?? [])
  const [standardProducts, setStandardProducts] = useState<SellerStoreProduct[]>(() => [
    ...SELLER_STORE_PRODUCTS,
  ])
  const [customProducts, setCustomProducts] = useState<SellerStoreProduct[]>([])
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
          is_custom: false,
        })
        if (!cancelled && data.content.length > 0) {
          setStandardProducts(data.content)
        }
      } catch {
        if (!cancelled) {
          setStandardProducts([...SELLER_STORE_PRODUCTS])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const aid = agencyId.trim()
    if (!aid) {
      setCustomProducts([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const data = await fetchSellerProducts({
          page: 0,
          size: 200,
          is_active: true,
          is_custom: true,
          agency_id: aid,
        })
        if (!cancelled) {
          setCustomProducts(data.content.length > 0 ? data.content : [])
        }
      } catch {
        if (!cancelled) setCustomProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agencyId])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedAgencySearch(agencySearchQuery.trim()), 400)
    return () => window.clearTimeout(t)
  }, [agencySearchQuery])

  /** Báo giá nhanh: bổ sung nợ / hạn mức thật từ API (fallback prefill trước đó là 0₫). */
  const quickQuoteAgencyHydrateId = quickQuotePrefill?.agencyId ?? ''
  useEffect(() => {
    if (!quickQuotePrefill || !quickQuoteAgencyHydrateId) return
    let cancelled = false
    const queries = [
      quickQuotePrefill.agency.code?.trim(),
      quickQuotePrefill.agency.shortName?.trim(),
      quickQuotePrefill.agency.legalName?.trim(),
    ].filter((q): q is string => Boolean(q && q.length > 1))
    const uniq = [...new Set(queries)]
    void (async () => {
      for (const search of uniq.length ? uniq : ['']) {
        if (cancelled) return
        try {
          const data = await fetchSellerAgencies({
            page: 0,
            size: 80,
            search: search || undefined,
            is_active: true,
          })
          const hit = data.content.find((r) => r.id === quickQuoteAgencyHydrateId)
          if (hit) {
            if (!cancelled) setAgencyPickCache((prev) => ({ ...prev, [hit.id]: hit }))
            return
          }
        } catch {
          /* thử từ khóa tiếp theo */
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quickQuotePrefill, quickQuoteAgencyHydrateId])

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

  const handleSelectAgency = useCallback(
    (a: SellerAgencyRow) => {
      if (isAgencyLockedByQuickQuote) return
      const nextId = a.id.trim()
      if (!nextId) return
      const prevId = agencyId.trim()
      const mergeCache = () => setAgencyPickCache((prev) => ({ ...prev, [a.id]: a }))

      if (nextId === prevId) {
        mergeCache()
        return
      }

      const hasCustomLines = lines.some((ln) => ln.lineSource === 'agency_custom')
      const applyChange = () => {
        setLines((prev) => prev.filter((ln) => ln.lineSource !== 'agency_custom'))
        setAgencyId(a.id)
        mergeCache()
      }

      if (hasCustomLines) {
        modal.confirm({
          title: 'Đổi khách sỉ?',
          content:
            'Đổi khách sỉ sẽ gỡ tất cả dòng hàng custom theo đại lý hiện tại. Các dòng catalog chuẩn giữ nguyên.',
          okText: 'Tiếp tục',
          cancelText: 'Hủy',
          onOk: applyChange,
        })
        return
      }

      setAgencyId(a.id)
      mergeCache()
    },
    [agencyId, isAgencyLockedByQuickQuote, lines, modal],
  )

  const selectedAgency = useMemo(() => {
    if (!agencyId) return undefined
    return agencyRows.find((x) => x.id === agencyId) ?? agencyPickCache[agencyId]
  }, [agencyId, agencyRows, agencyPickCache])

  const subtotalVnd = useMemo(
    () => lines.reduce((s, ln) => s + lineTotalVnd(ln), 0),
    [lines],
  )

  const grandTotalVnd = useMemo(() => {
    const raw = subtotalVnd - Math.max(0, discountVnd) + Math.max(0, shippingFeeVnd)
    return Math.max(0, raw)
  }, [subtotalVnd, discountVnd, shippingFeeVnd])

  const agencyCredit = useMemo(() => {
    if (!selectedAgency) return null
    return computeAgencyCreditSnapshot(selectedAgency, grandTotalVnd, 'quotation')
  }, [selectedAgency, grandTotalVnd])

  const addProductLine = useCallback(
    (productId: string, source: QuotationLineSource) => {
      const pool = source === 'agency_custom' ? customProducts : standardProducts
      const p = pool.find((x) => x.id === productId)
      if (!p) return
      if (source === 'agency_custom' && !agencyId.trim()) return
      setLines((prev) => {
        const bumped = bumpProductLineQty(prev, productId, 1, (ln) => ln.lineSource === source)
        if (bumped.merged) {
          message.info(`Đã cộng thêm 1 vào "${bumped.mergedLine!.productName}"`)
          return bumped.next
        }
        return [
          ...prev,
          {
            id: newLineId(),
            lineSource: source,
            productId: p.id,
            sku: p.sku,
            productName: p.name,
            qty: 1,
            unitPriceVnd: p.price,
            discountPercent: 0,
            lineNote: '',
          },
        ]
      })
    },
    [agencyId, customProducts, message, standardProducts],
  )

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const patchLine = useCallback((id: string, patch: Partial<SellerOrderDraftLine>) => {
    setLines((prev) => prev.map((ln) => (ln.id === id ? { ...ln, ...patch } : ln)))
  }, [])

  const linesMatchingKind = useMemo(
    () =>
      lines.filter(
        (ln) => Boolean(ln.productId) && ln.qty > 0 && ln.unitPriceVnd >= 0,
      ),
    [lines],
  )

  const quotationValidUntilError = useMemo(() => {
    if (!quotationValidUntil.trim()) return null
    return validateQuotationValidUntilInput(quotationValidUntil)
  }, [quotationValidUntil])

  const canSubmitOrder =
    Boolean(agencyId) &&
    linesMatchingKind.length > 0 &&
    Boolean(quotationValidUntil.trim()) &&
    !quotationValidUntilError

  const saveDraftOrder = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      if (!canSubmitOrder || !selectedAgency || submitting) return
      const validityError = !quotationValidUntil.trim()
        ? 'Vui lòng chọn hạn báo giá.'
        : validateQuotationValidUntilInput(quotationValidUntil)
      if (validityError) {
        setSubmitError(validityError)
        return
      }
      setSubmitting(true)
      setSubmitError(null)
      try {
        const items: CreateSellerOrderItemPayload[] = linesMatchingKind.map((ln) => ({
          productId: ln.productId!,
          quantity: ln.qty,
          unitPrice: lineEffectiveUnitPriceVnd(ln),
        }))
        const noteRaw = buildSellerOrderConcatenatedNote(linesMatchingKind, {
          internalNote,
        }).trim()
        const shippingAddressParts = [selectedAgency.address?.trim(), selectedAgency.city?.trim()].filter(
          Boolean,
        ) as string[]
        const shippingAddress =
          shippingAddressParts.length > 0 ? shippingAddressParts.join(', ') : '—'

        const data = await createSellerQuotation({
          agencyId: selectedAgency.id,
          discountAmount: Math.max(0, discountVnd),
          shippingFee: Math.max(0, shippingFeeVnd),
          shippingAddress,
          quotationValidUntil: quotationValidUntil.trim(),
          note: noteRaw.length > 0 ? noteRaw : null,
          items,
        })
        clearQuickQuotePrefill()
        navigate(sellerPaths.quotation(orderCodeFromDto(data)))
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không lưu được báo giá nháp')
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
      quotationValidUntil,
      internalNote,
      navigate,
    ],
  )

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
            request_quote
          </span>
          <div>
            <h1 className="th-seller-order-create__title">Tạo báo giá mới</h1>
          </div>
        </div>
      </header>

      {quickQuotePrefill ? (
        <p className="th-seller-order-create__quick-quote-note" role="status">
          Đang tạo báo giá nhanh từ Store cho đại lý{' '}
          <strong>{quickQuotePrefill.agency.shortName || quickQuotePrefill.agency.legalName}</strong>. Khách sỉ
          đã được khóa để giữ đúng luồng custom theo đại lý.
        </p>
      ) : null}
      {quickQuoteAffinityWarn ? (
        <p className="th-admin-users__api-error" role="alert">
          {quickQuoteAffinityWarn}
        </p>
      ) : null}

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
                        disabled={isAgencyLockedByQuickQuote}
                      />
                    </div>
                    {agencyLoadError ? (
                      <p className="th-admin-users__api-error" role="alert" style={{ marginTop: '0.35rem' }}>
                        {agencyLoadError}
                      </p>
                    ) : null}
                  </div>
                  <div className="th-seller-order-create__field th-seller-order-create__field--validity-date">
                    <label
                      className="th-seller-order-create__label"
                      htmlFor={`${fid}-valid-until`}
                    >
                      Hạn báo giá <abbr title="bắt buộc">*</abbr>
                    </label>
                    <input
                      id={`${fid}-valid-until`}
                      className={`th-seller-order-create__input th-seller-order-create__input--date-inline${
                        quotationValidUntilError ? ' th-seller-order-create__input--invalid' : ''
                      }`}
                      type="date"
                      min={todayIsoDate()}
                      value={quotationValidUntil}
                      onChange={(e) => setQuotationValidUntil(e.target.value)}
                      required
                      aria-required="true"
                      aria-invalid={quotationValidUntilError ? true : undefined}
                      aria-describedby={
                        quotationValidUntilError ? `${fid}-valid-until-error` : undefined
                      }
                    />
                    {quotationValidUntilError ? (
                      <p
                        id={`${fid}-valid-until-error`}
                        className="th-seller-order-create__field-error"
                        role="alert"
                      >
                        {quotationValidUntilError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="th-seller-order-create__card" aria-labelledby={`${fid}-sec-lines`}>
              <h2 id={`${fid}-sec-lines`} className="th-seller-order-create__sec-title">
                <span className="material-symbols-outlined th-seller-order-create__sec-icon" aria-hidden>
                  inventory_2
                </span>
                Sản phẩm trong báo giá
              </h2>

              <div className="th-seller-order-create__line-toolbar">
                <div className="th-seller-order-create__quick-add">
                  <span className="th-seller-order-create__label" id={`${fid}-quick-std-label`}>
                    Thêm {SELLER_CATALOG_KIND_LABEL.toLowerCase()}
                  </span>
                  <div className="th-seller-order-create__quick-add-combo">
                    <CatalogProductCombo
                      instanceId={`${fid}-quick-std`}
                      products={standardProducts}
                      variant="toolbar"
                      onSelect={(productId) => addProductLine(productId, 'standard')}
                    />
                  </div>
                </div>
                <div className="th-seller-order-create__quick-add">
                  <span className="th-seller-order-create__label" id={`${fid}-quick-cus-label`}>
                    Thêm {SELLER_CUSTOM_KIND_LABEL.toLowerCase()} theo đại lý
                  </span>
                  <div className="th-seller-order-create__quick-add-combo">
                    <CatalogProductCombo
                      instanceId={`${fid}-quick-cus`}
                      products={customProducts}
                      variant="toolbar"
                      disabled={!agencyId.trim()}
                      onSelect={(productId) => addProductLine(productId, 'agency_custom')}
                    />
                  </div>
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
                      <th scope="col" className="th-seller-order-create__col-num">
                        CK %
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
                        <td colSpan={10} className="th-seller-order-create__empty">
                          Chưa có sản phẩm. Chọn {SELLER_CATALOG_KIND_LABEL.toLowerCase()} hoặc{' '}
                          {SELLER_CUSTOM_KIND_LABEL.toLowerCase()} ở ô thêm phía trên.
                        </td>
                      </tr>
                    ) : (
                      lines.map((ln, idx) => {
                        const lineTotal = lineTotalVnd(ln)
                        const effectiveUnit = lineEffectiveUnitPriceVnd(ln)
                        return (
                          <tr key={ln.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <span
                                className={
                                  ln.lineSource === 'agency_custom'
                                    ? 'th-seller-order-create__badge th-seller-order-create__badge--cus'
                                    : 'th-seller-order-create__badge th-seller-order-create__badge--cat'
                                }
                              >
                                {sellerQuotationLineSourceLabel(ln.lineSource)}
                              </span>
                            </td>
                            <td className="th-seller-order-create__cell-name">
                              <span className="th-seller-order-create__line-name">{ln.productName}</span>
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
                              <span
                                className="th-seller-order-create__money-readonly"
                                title="Đơn giá niêm yết — chỉnh qua chiết khấu %"
                              >
                                {formatVND(ln.unitPriceVnd)}
                              </span>
                              {ln.discountPercent > 0 ? (
                                <span className="th-seller-order-create__price-effective">
                                  Sau CK: {formatVND(effectiveUnit)}
                                </span>
                              ) : null}
                            </td>
                            <td className="th-seller-order-create__col-num">
                              <input
                                className="th-seller-order-create__input th-seller-order-create__input--num th-seller-order-create__input--pct"
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={ln.discountPercent === 0 ? '' : ln.discountPercent}
                                onChange={(e) =>
                                  patchLine(ln.id, {
                                    discountPercent: parseDiscountPercentField(e.target.value),
                                  })
                                }
                                aria-label={`Chiết khấu % dòng ${idx + 1}`}
                                placeholder="0"
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
                    Chiết khấu thêm (VND)
                  </label>
                  <input
                    id={`${fid}-disc`}
                    className="th-seller-order-create__input th-seller-order-create__input--money"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={vndInputDisplay(discountVnd)}
                    onChange={(e) =>
                      setDiscountVnd(parseVndField(normalizeVndInputTyping(e.target.value)))
                    }
                    placeholder="0"
                  />
                </div>
                <div className="th-seller-order-create__field">
                  <label className="th-seller-order-create__label" htmlFor={`${fid}-ship`}>
                    Phí giao (VND)
                  </label>
                  <input
                    id={`${fid}-ship`}
                    className="th-seller-order-create__input th-seller-order-create__input--money"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={vndInputDisplay(shippingFeeVnd)}
                    onChange={(e) =>
                      setShippingFeeVnd(parseVndField(normalizeVndInputTyping(e.target.value)))
                    }
                    placeholder="0"
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
              <Link className="th-seller-order-create__btn-secondary" to={sellerPaths.quotations}>
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
                {submitting ? 'Đang lưu…' : 'Lưu báo giá nháp'}
              </button>
            </div>
          </div>

          <aside className="th-seller-order-create__aside" aria-labelledby={`${fid}-aside-sum`}>
            <div className="th-seller-order-create__summary">
              <h2 id={`${fid}-aside-sum`} className="th-seller-order-create__summary-title">
                Tóm tắt
              </h2>
              {selectedAgency ? (
                <>
                  <dl className="th-seller-order-create__agency-dl">
                    <dt>Khách</dt>
                    <dd>{selectedAgency.shortName}</dd>
                    <dt>Mã</dt>
                    <dd>
                      <code>{selectedAgency.code}</code>
                    </dd>
                  </dl>
                  {agencyCredit ? (
                    <div
                      className={`th-seller-order-create__credit-snapshot th-seller-order-create__credit-snapshot--${agencyCredit.tone}`}
                      role="status"
                    >
                      <div className="th-seller-order-create__credit-snapshot-kpis">
                        <div>
                          <span className="th-seller-order-create__credit-snapshot-kpi-label">
                            Công nợ hiện tại
                          </span>
                          <strong className="th-seller-order-create__credit-snapshot-kpi-val">
                            {formatVND(selectedAgency.totalDebtVnd)}
                          </strong>
                        </div>
                        <div>
                          <span className="th-seller-order-create__credit-snapshot-kpi-label">
                            Hạn mức
                          </span>
                          <strong className="th-seller-order-create__credit-snapshot-kpi-val">
                            {formatVND(selectedAgency.creditLimitVnd)}
                          </strong>
                        </div>
                      </div>
                      <div className="th-seller-order-create__credit-snapshot-head">
                        <span className="th-seller-order-create__credit-snapshot-label">
                          Dùng hạn mức
                        </span>
                        <span className="th-seller-order-create__credit-snapshot-pct">
                          {(agencyCredit.ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div
                        className="th-seller-order-create__credit-snapshot-track"
                        aria-hidden
                        role="presentation"
                      >
                        <span style={{ width: `${Math.min(100, agencyCredit.ratio * 100)}%` }} />
                      </div>
                      <p className="th-seller-order-create__credit-snapshot-hint">
                        {agencyCredit.hintCurrent}
                      </p>
                      {agencyCredit.showProj ? (
                        <>
                          <div className="th-seller-order-create__credit-snapshot-head th-seller-order-create__credit-snapshot-head--proj">
                            <span className="th-seller-order-create__credit-snapshot-label">
                              Ước sau báo giá (+{formatVND(grandTotalVnd)})
                            </span>
                            <span className="th-seller-order-create__credit-snapshot-pct">
                              {(agencyCredit.projRatio * 100).toFixed(1)}% HM
                              {' · '}
                              {formatVND(agencyCredit.projDebt)}
                            </span>
                          </div>
                          <div
                            className="th-seller-order-create__credit-snapshot-track th-seller-order-create__credit-snapshot-track--proj"
                            aria-hidden
                            role="presentation"
                          >
                            <span
                              style={{ width: `${Math.min(100, agencyCredit.projRatio * 100)}%` }}
                            />
                          </div>
                          {agencyCredit.hintProj ? (
                            <p className="th-seller-order-create__credit-snapshot-hint th-seller-order-create__credit-snapshot-hint--proj">
                              {agencyCredit.hintProj}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="th-seller-order-create__summary-muted">Chọn khách sỉ để xem hạn mức.</p>
              )}
              <ul className="th-seller-order-create__sum-list">
                <li>
                  <span>Tạm tính</span>
                  <strong>{formatVND(subtotalVnd)}</strong>
                </li>
                <li>
                  <span>Chiết khấu thêm</span>
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
              {!canSubmitOrder ? (
                <p className="th-seller-order-create__sum-foot">
                  <span className="th-seller-order-create__sum-warn">
                    {!agencyId
                      ? 'Chọn khách sỉ.'
                      : !quotationValidUntil.trim()
                        ? 'Chọn hạn báo giá.'
                        : linesMatchingKind.length === 0
                          ? 'Thêm ít nhất một dòng sản phẩm.'
                          : quotationValidUntilError ?? 'Kiểm tra lại thông tin.'}
                  </span>
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
