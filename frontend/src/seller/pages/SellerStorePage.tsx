import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Badge, Checkbox, Drawer } from 'antd'
import { useNavigate } from 'react-router-dom'
import { formatVND, htmlToPlainText, PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { fetchSellerAgencies, type SellerAgencyRow } from '../sellerAgenciesApi'
import { fetchSellerProducts, type SellerStoreProduct } from '../sellerProductsApi'
import { sellerPaths } from '../config/sellerPaths'
import {
  type QuickQuoteLineSource,
  type QuickQuotePrefillPayload,
  writeQuickQuotePrefill,
} from '../quickQuotePrefill'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import '../../admin/pages/AdminUsersPage.css'
import './SellerStorePage.css'

type StoreSourceMode = 'standard' | 'custom'
type QuickQuoteDraftItem = {
  productId: string
  sku: string
  productName: string
  unitPriceVnd: number
  qty: number
  lineSource: QuickQuoteLineSource
  ownerAgencyId?: string
  status: SellerStoreProduct['status']
}

/** Menu hàng hóa NVBH — catalog chuẩn + mẫu custom theo khách sỉ (API is_custom + agency_id). */
export function SellerStorePage() {
  const fid = useId()
  const navigate = useNavigate()
  const [sourceMode, setSourceMode] = useState<StoreSourceMode>('standard')
  const [agencyId, setAgencyId] = useState('')
  const [agencyComboOpen, setAgencyComboOpen] = useState(false)
  const [agencyPanelSearch, setAgencyPanelSearch] = useState('')
  const [debouncedAgencyPanelSearch, setDebouncedAgencyPanelSearch] = useState('')
  const [agencyRows, setAgencyRows] = useState<SellerAgencyRow[]>([])
  const [agencyLoading, setAgencyLoading] = useState(false)
  const [agencyLoadError, setAgencyLoadError] = useState<string | null>(null)
  const [agencyPickCache, setAgencyPickCache] = useState<Record<string, SellerAgencyRow>>({})
  const agencyComboRef = useRef<HTMLDivElement>(null)
  const agencyPanelSearchInputRef = useRef<HTMLInputElement>(null)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'' | 'active' | 'inactive'>('active')
  const [inStockOnly, setInStockOnly] = useState(false)

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SellerStoreProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [quickQuoteItems, setQuickQuoteItems] = useState<QuickQuoteDraftItem[]>([])
  const [quickQuoteDrawerOpen, setQuickQuoteDrawerOpen] = useState(false)
  const [quickQuoteError, setQuickQuoteError] = useState<string | null>(null)
  /** Khách sỉ gắn với báo giá nhanh (trong drawer) — tách khỏi khách dùng để lọc lưới. */
  const [quoteAgencyId, setQuoteAgencyId] = useState('')
  const [quoteAgencyComboOpen, setQuoteAgencyComboOpen] = useState(false)
  const [quoteAgencyPanelSearch, setQuoteAgencyPanelSearch] = useState('')
  const [debouncedQuoteAgencyPanelSearch, setDebouncedQuoteAgencyPanelSearch] = useState('')
  const [quoteAgencyRows, setQuoteAgencyRows] = useState<SellerAgencyRow[]>([])
  const [quoteAgencyLoading, setQuoteAgencyLoading] = useState(false)
  const [quoteAgencyLoadError, setQuoteAgencyLoadError] = useState<string | null>(null)
  const quoteAgencyComboRef = useRef<HTMLDivElement>(null)
  const quoteAgencyPanelSearchInputRef = useRef<HTMLInputElement>(null)

  const productsAbortRef = useRef<AbortController | null>(null)
  const prevQuickQuoteLenRef = useRef(0)

  useEffect(() => {
    const len = quickQuoteItems.length
    if (len === 0 && prevQuickQuoteLenRef.current > 0) {
      setQuoteAgencyId('')
      setQuickQuoteError(null)
    }
    prevQuickQuoteLenRef.current = len
  }, [quickQuoteItems.length])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedAgencyPanelSearch(agencyPanelSearch.trim()), 320)
    return () => window.clearTimeout(t)
  }, [agencyPanelSearch])

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuoteAgencyPanelSearch(quoteAgencyPanelSearch.trim()), 320)
    return () => window.clearTimeout(t)
  }, [quoteAgencyPanelSearch])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch, filterActive, inStockOnly, sourceMode, agencyId, pageSize])

  useEffect(() => {
    if (sourceMode !== 'custom' || !agencyComboOpen) return
    let cancelled = false
    void (async () => {
      setAgencyLoading(true)
      setAgencyLoadError(null)
      try {
        const data = await fetchSellerAgencies({
          page: 0,
          size: 100,
          search: debouncedAgencyPanelSearch || undefined,
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
  }, [sourceMode, agencyComboOpen, debouncedAgencyPanelSearch])

  useEffect(() => {
    if (!agencyComboOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const el = agencyComboRef.current
      if (el && !el.contains(e.target as Node)) setAgencyComboOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAgencyComboOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [agencyComboOpen])

  useEffect(() => {
    if (!quoteAgencyComboOpen) return
    let cancelled = false
    void (async () => {
      setQuoteAgencyLoading(true)
      setQuoteAgencyLoadError(null)
      try {
        const data = await fetchSellerAgencies({
          page: 0,
          size: 100,
          search: debouncedQuoteAgencyPanelSearch || undefined,
          is_active: true,
        })
        if (cancelled) return
        setQuoteAgencyRows(data.content)
      } catch (e) {
        if (cancelled) return
        setQuoteAgencyLoadError(e instanceof Error ? e.message : 'Không tải được danh sách khách sỉ')
        setQuoteAgencyRows([])
      } finally {
        if (!cancelled) setQuoteAgencyLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [quoteAgencyComboOpen, debouncedQuoteAgencyPanelSearch])

  useEffect(() => {
    if (!quoteAgencyComboOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      const el = quoteAgencyComboRef.current
      if (el && !el.contains(e.target as Node)) setQuoteAgencyComboOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuoteAgencyComboOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [quoteAgencyComboOpen])

  useEffect(() => {
    if (quoteAgencyComboOpen) {
      window.setTimeout(() => quoteAgencyPanelSearchInputRef.current?.focus(), 0)
    }
  }, [quoteAgencyComboOpen])

  useEffect(() => {
    if (sourceMode !== 'custom') {
      setAgencyComboOpen(false)
      setAgencyPanelSearch('')
    }
  }, [sourceMode])

  useEffect(() => {
    if (agencyComboOpen) {
      window.setTimeout(() => agencyPanelSearchInputRef.current?.focus(), 0)
    }
  }, [agencyComboOpen])

  const selectedAgency = useMemo(() => {
    if (!agencyId.trim()) return undefined
    return agencyRows.find((a) => a.id === agencyId) ?? agencyPickCache[agencyId]
  }, [agencyId, agencyRows, agencyPickCache])

  const selectedQuoteAgency = useMemo(() => {
    if (!quoteAgencyId.trim()) return undefined
    return (
      quoteAgencyRows.find((a) => a.id === quoteAgencyId) ??
      agencyPickCache[quoteAgencyId]
    )
  }, [quoteAgencyId, quoteAgencyRows, agencyPickCache])

  const loadProducts = useCallback(async () => {
    if (sourceMode === 'custom' && !agencyId.trim()) {
      productsAbortRef.current?.abort()
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      setLoadError(null)
      setLoading(false)
      return
    }

    productsAbortRef.current?.abort()
    const ac = new AbortController()
    productsAbortRef.current = ac

    setLoading(true)
    setLoadError(null)
    try {
      const isCustom = sourceMode === 'custom'
      const data = await fetchSellerProducts({
        page: pageIndex,
        size: pageSize,
        search: debouncedSearch || undefined,
        is_active: filterActive === '' ? undefined : filterActive === 'active',
        in_stock: inStockOnly ? true : undefined,
        is_custom: isCustom,
        ...(isCustom && agencyId.trim() ? { agency_id: agencyId.trim() } : {}),
        signal: ac.signal,
      })
      setRows(data.content)
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) && (err as Error).name === 'AbortError'
      if (aborted) return
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách sản phẩm')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [pageIndex, pageSize, debouncedSearch, filterActive, inStockOnly, sourceMode, agencyId])

  useEffect(() => {
    void loadProducts()
    return () => {
      productsAbortRef.current?.abort()
    }
  }, [loadProducts])

  const safePage = totalPages === 0 ? 0 : Math.min(pageIndex, Math.max(0, totalPages - 1))

  const pickAgencyRow = useCallback(
    (a: SellerAgencyRow) => {
      setAgencyId(a.id)
      setAgencyPickCache((prev) => ({ ...prev, [a.id]: a }))
      setAgencyComboOpen(false)
      const hasForeignCustomInCart = quickQuoteItems.some(
        (item) => item.lineSource === 'agency_custom' && item.ownerAgencyId && item.ownerAgencyId !== a.id,
      )
      if (hasForeignCustomInCart) {
        setQuickQuoteError(
          'Bạn đã đổi khách sỉ xem mẫu, nhưng giỏ báo giá vẫn có hàng custom của khách khác. Xóa các dòng custom không khớp hoặc chỉnh khách trong giỏ báo giá.',
        )
      } else {
        setQuickQuoteError(null)
      }
    },
    [quickQuoteItems],
  )

  const pickQuoteAgencyRow = useCallback(
    (a: SellerAgencyRow) => {
      const hasBlockingCustom = quickQuoteItems.some(
        (item) =>
          item.lineSource === 'agency_custom' && item.ownerAgencyId && item.ownerAgencyId !== a.id,
      )
      if (hasBlockingCustom) {
        setQuickQuoteError(
          'Không thể đổi khách trong giỏ báo giá: vẫn còn hàng custom thuộc khách sỉ khác. Hãy xóa các dòng custom đó trước.',
        )
        return
      }
      setQuoteAgencyId(a.id)
      setAgencyPickCache((prev) => ({ ...prev, [a.id]: a }))
      setQuoteAgencyComboOpen(false)
      setQuickQuoteError(null)
    },
    [quickQuoteItems],
  )

  const toggleQuoteAgencyCombo = useCallback(() => {
    setQuoteAgencyComboOpen((open) => {
      const next = !open
      if (next) {
        setQuoteAgencyPanelSearch('')
        setDebouncedQuoteAgencyPanelSearch('')
        setQuoteAgencyRows([])
        setQuoteAgencyLoadError(null)
      }
      return next
    })
  }, [])

  const toggleAgencyCombo = useCallback(() => {
    setAgencyComboOpen((open) => {
      const next = !open
      if (next) {
        setAgencyPanelSearch('')
        setDebouncedAgencyPanelSearch('')
        setAgencyRows([])
        setAgencyLoadError(null)
      }
      return next
    })
  }, [])

  const handleQuickQuote = useCallback(
    (p: SellerStoreProduct) => {
      const lineSource: QuickQuoteLineSource = sourceMode === 'custom' ? 'agency_custom' : 'standard'

      if (lineSource === 'agency_custom') {
        if (!selectedAgency) {
          setQuickQuoteError('Ở chế độ hàng custom, cần chọn khách sỉ trên lưới để tải đúng mẫu.')
          return
        }
        if (quoteAgencyId.trim() && selectedAgency.id !== quoteAgencyId) {
          const qLabel =
            selectedQuoteAgency?.shortName ||
            selectedQuoteAgency?.legalName ||
            selectedQuoteAgency?.code ||
            'khách trong giỏ'
          setQuickQuoteError(
            `Khách trong giỏ báo giá (${qLabel}) không trùng khách bạn đang xem mẫu (${selectedAgency.shortName || selectedAgency.legalName}). Chỉnh khách trong giỏ hoặc xóa các dòng custom không khớp.`,
          )
          return
        }
        const customOwners = new Set(
          quickQuoteItems
            .filter((item) => item.lineSource === 'agency_custom' && item.ownerAgencyId)
            .map((item) => item.ownerAgencyId!),
        )
        if (customOwners.size > 0 && !customOwners.has(selectedAgency.id)) {
          setQuickQuoteError(
            'Giỏ đang có hàng custom của khách sỉ khác. Không thể thêm mẫu custom của khách hiện tại — xóa các dòng custom không khớp trước.',
          )
          return
        }
      }

      setQuickQuoteError(null)
      const ownerForLine =
        lineSource === 'agency_custom' ? selectedAgency!.id : undefined

      setQuickQuoteItems((prev) => {
        const next = [...prev]
        const existingIndex = next.findIndex(
          (item) =>
            item.productId === p.id &&
            item.lineSource === lineSource &&
            (item.ownerAgencyId ?? '') === (ownerForLine ?? ''),
        )
        if (existingIndex >= 0) {
          const current = next[existingIndex]!
          next[existingIndex] = {
            ...current,
            qty: current.qty + 1,
            unitPriceVnd: p.price,
            status: p.status,
          }
          return next
        }
        next.push({
          productId: p.id,
          sku: p.sku,
          productName: p.name,
          unitPriceVnd: p.price,
          qty: 1,
          lineSource,
          ownerAgencyId: ownerForLine,
          status: p.status,
        })
        return next
      })

      if (lineSource === 'agency_custom' && !quickQuoteItems.some((i) => i.lineSource === 'agency_custom')) {
        setQuoteAgencyId(selectedAgency!.id)
        setAgencyPickCache((prev) => ({ ...prev, [selectedAgency!.id]: selectedAgency! }))
      }

      setQuickQuoteDrawerOpen(true)
    },
    [quickQuoteItems, quoteAgencyId, selectedAgency, selectedQuoteAgency, sourceMode],
  )

  const updateQuickQuoteQty = useCallback(
    (
      productId: string,
      lineSource: QuickQuoteLineSource,
      ownerAgencyId: string | undefined,
      nextQty: number,
    ) => {
      setQuickQuoteItems((prev) =>
        prev.map((item) =>
          item.productId === productId &&
          item.lineSource === lineSource &&
          (item.ownerAgencyId ?? '') === (ownerAgencyId ?? '')
            ? { ...item, qty: Math.max(1, Math.floor(nextQty) || 1) }
            : item,
        ),
      )
    },
    [],
  )

  const removeQuickQuoteItem = useCallback(
    (productId: string, lineSource: QuickQuoteLineSource, ownerAgencyId: string | undefined) => {
      setQuickQuoteItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.productId === productId &&
              item.lineSource === lineSource &&
              (item.ownerAgencyId ?? '') === (ownerAgencyId ?? '')
            ),
        ),
      )
    },
    [],
  )

  const clearQuickQuoteItems = useCallback(() => {
    setQuickQuoteItems([])
    setQuoteAgencyId('')
    setQuickQuoteError(null)
  }, [])

  const quickQuoteSubtotal = useMemo(
    () =>
      quickQuoteItems.reduce(
        (sum, item) => sum + Math.max(0, item.qty) * Math.max(0, item.unitPriceVnd),
        0,
      ),
    [quickQuoteItems],
  )

  const quickQuoteHasMismatchCustom = useMemo(() => {
    const qid = quoteAgencyId.trim()
    if (!qid) {
      return quickQuoteItems.some((item) => item.lineSource === 'agency_custom')
    }
    return quickQuoteItems.some(
      (item) =>
        item.lineSource === 'agency_custom' && (!item.ownerAgencyId || item.ownerAgencyId !== qid),
    )
  }, [quickQuoteItems, quoteAgencyId])

  const quickQuoteHasInactiveItem = useMemo(
    () => quickQuoteItems.some((item) => item.status !== 'active'),
    [quickQuoteItems],
  )

  const quickQuoteCanConfirm =
    Boolean(selectedQuoteAgency && quoteAgencyId.trim()) &&
    quickQuoteItems.length > 0 &&
    !quickQuoteHasMismatchCustom &&
    !quickQuoteHasInactiveItem

  const handleConfirmQuickQuote = useCallback(() => {
    if (!selectedQuoteAgency || !quoteAgencyId.trim()) {
      setQuickQuoteError('Chọn khách sỉ trong giỏ báo giá nhanh trước khi xác nhận.')
      return
    }
    if (quickQuoteItems.length === 0) {
      setQuickQuoteError('Giỏ báo giá nhanh đang trống.')
      return
    }
    if (quickQuoteHasMismatchCustom) {
      setQuickQuoteError(
        'Có dòng custom không khớp khách sỉ đã chọn trong giỏ báo giá. Xóa dòng lệch hoặc chọn đúng khách trong giỏ.',
      )
      return
    }
    if (quickQuoteHasInactiveItem) {
      setQuickQuoteError('Giỏ đang có sản phẩm ngừng bán. Vui lòng xóa trước khi tiếp tục.')
      return
    }

    const payload: QuickQuotePrefillPayload = {
      source: 'store_quick_quote',
      createdAt: Date.now(),
      agencyId: selectedQuoteAgency.id,
      agency: {
        id: selectedQuoteAgency.id,
        code: selectedQuoteAgency.code,
        shortName: selectedQuoteAgency.shortName || selectedQuoteAgency.legalName,
        legalName: selectedQuoteAgency.legalName,
      },
      items: quickQuoteItems.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        unitPriceVnd: item.unitPriceVnd,
        qty: Math.max(1, Math.floor(item.qty) || 1),
        lineSource: item.lineSource,
        ownerAgencyId: item.lineSource === 'agency_custom' ? selectedQuoteAgency.id : undefined,
      })),
    }

    writeQuickQuotePrefill(payload)
    setQuickQuoteError(null)
    setQuickQuoteDrawerOpen(false)
    navigate(`${sellerPaths.quotationNew}?quickQuote=1`, { state: { quickQuotePrefill: payload } })
  }, [
    navigate,
    quickQuoteHasInactiveItem,
    quickQuoteHasMismatchCustom,
    quickQuoteItems,
    quoteAgencyId,
    selectedQuoteAgency,
  ])

  const categoryLine = (p: SellerStoreProduct) => p.categoryName ?? p.categoryId

  const needAgency = sourceMode === 'custom' && !agencyId.trim()
  const emptyMessage = needAgency
    ? 'Chọn khách sỉ trực thuộc (dropdown bên dưới) để tải mẫu custom theo đại lý đó.'
    : sourceMode === 'custom'
      ? 'Không có sản phẩm custom khớp bộ lọc.'
      : 'Không có sản phẩm khớp bộ lọc.'

  return (
    <div className="th-seller-store">
      <header className="th-seller-store__header">
        <div className="th-seller-store__title-row">
          <span className="material-symbols-outlined th-seller-store__title-icon" aria-hidden>
            storefront
          </span>
          <div>
            <h1 className="th-seller-store__title">Menu hàng hóa</h1>
            {sourceMode === 'custom' && selectedAgency ? (
              <p className="th-seller-store__agency-pill" role="status">
                Đang xem mẫu: <strong>{selectedAgency.shortName || selectedAgency.legalName}</strong>
                {selectedAgency.code ? <span> · {selectedAgency.code}</span> : null}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {loadError ? (
        <p className="th-admin-users__api-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {quickQuoteError ? (
        <p className="th-admin-users__api-error" role="alert">
          {quickQuoteError}
        </p>
      ) : null}

      <div className="th-seller-store__toolbar">
        <div className="th-seller-store__toolbar-block th-seller-store__toolbar-block--source">
          <p className="th-seller-store__toolbar-block-title" id={`${fid}-source-label`}>
            Nguồn
          </p>
          <div
            className="th-seller-store__source-row"
            role="group"
            aria-labelledby={`${fid}-source-label`}
          >
            <label className="th-seller-store__field th-seller-store__field--grow">
              <span className="th-seller-store__field-label">Xem theo</span>
              <select
                className="th-seller-store__select th-seller-store__select--wide"
                value={sourceMode}
                onChange={(e) => {
                  setSourceMode(e.target.value as StoreSourceMode)
                }}
              >
                <option value="standard">Catalog chuẩn (toàn mạng lưới)</option>
                <option value="custom">Hàng custom theo khách sỉ (đại lý)</option>
              </select>
            </label>
            {sourceMode === 'custom' ? (
              <div className="th-seller-store__agency-block">
                <div
                  className="th-seller-store__agency-combo"
                  ref={agencyComboRef}
                  data-open={agencyComboOpen ? 'true' : undefined}
                >
                  <span className="th-seller-store__field-label" id={`${fid}-agency-combo-label`}>
                    Khách sỉ
                  </span>
                  <div className="th-seller-store__agency-combo-inner">
                    <button
                      type="button"
                      id={`${fid}-agency-trigger`}
                      className="th-seller-store__agency-combo-trigger"
                      aria-labelledby={`${fid}-agency-combo-label`}
                      aria-haspopup="listbox"
                      aria-expanded={agencyComboOpen}
                      aria-controls={`${fid}-agency-listbox`}
                      onClick={() => toggleAgencyCombo()}
                    >
                      <span className="th-seller-store__agency-combo-trigger-text">
                        {selectedAgency
                          ? `${selectedAgency.shortName || selectedAgency.legalName} (${selectedAgency.code})`
                          : '— Chọn khách sỉ trực thuộc —'}
                      </span>
                      <span className="material-symbols-outlined th-seller-store__agency-combo-chevron" aria-hidden>
                        expand_more
                      </span>
                    </button>
                    {agencyComboOpen ? (
                      <div
                        className="th-seller-store__agency-combo-panel"
                        id={`${fid}-agency-panel`}
                        role="presentation"
                      >
                        <div className="th-seller-store__agency-combo-search">
                          <span className="material-symbols-outlined th-seller-store__agency-combo-search-icon" aria-hidden>
                            search
                          </span>
                          <input
                            ref={agencyPanelSearchInputRef}
                            id={`${fid}-agency-panel-q`}
                            className="th-seller-store__agency-combo-search-input"
                            type="search"
                            placeholder="Tìm mã, tên, SĐT…"
                            value={agencyPanelSearch}
                            onChange={(e) => setAgencyPanelSearch(e.target.value)}
                            autoComplete="off"
                            aria-label="Tìm trong danh sách khách sỉ"
                          />
                        </div>
                        <ul
                          className="th-seller-store__agency-combo-list"
                          id={`${fid}-agency-listbox`}
                          role="listbox"
                          aria-label="Khách sỉ trực thuộc"
                        >
                          {agencyLoading ? (
                            <li className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--muted">
                              Đang tải…
                            </li>
                          ) : null}
                          {!agencyLoading && agencyLoadError ? (
                            <li className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--err" role="alert">
                              {agencyLoadError}
                            </li>
                          ) : null}
                          {!agencyLoading && !agencyLoadError && agencyRows.length === 0 ? (
                            <li className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--muted">
                              Không có khách khớp tìm kiếm.
                            </li>
                          ) : null}
                          {!agencyLoading &&
                            !agencyLoadError &&
                            agencyRows.map((a) => (
                              <li key={a.id} role="none">
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={agencyId === a.id}
                                  className={`th-seller-store__agency-combo-option${agencyId === a.id ? ' is-selected' : ''}`}
                                  onClick={() => pickAgencyRow(a)}
                                >
                                  <span className="th-seller-store__agency-combo-option-name">
                                    {a.shortName || a.legalName}
                                  </span>
                                  <span className="th-seller-store__agency-combo-option-meta">{a.code}</span>
                                </button>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="th-seller-store__toolbar-row">
          <AppFilterBar>
            <AppFilterField search className="th-seller-store__search">
              <AppFilterInput
                id={`${fid}-q`}
                placeholder="Tìm SKU, tên…"
                value={searchInput}
                onChangeValue={setSearchInput}
                autoComplete="off"
                disabled={needAgency}
              />
            </AppFilterField>
            <div className="th-seller-store__filters">
              <AppFilterField label="Trạng thái" className="th-seller-store__field">
                <AppFilterSelect
                  value={filterActive}
                  onChangeValue={(value) => setFilterActive(value as '' | 'active' | 'inactive')}
                  options={[
                    { value: '', label: 'Tất cả' },
                    { value: 'active', label: 'Đang bán' },
                    { value: 'inactive', label: 'Ngừng bán' },
                  ]}
                />
              </AppFilterField>
              <label className="th-seller-store__chip">
                <Checkbox
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  disabled={needAgency}
                >
                  Chỉ còn hàng
                </Checkbox>
              </label>
            </div>
          </AppFilterBar>
          <p className="th-seller-store__count" aria-live="polite">
            <strong>{needAgency ? 0 : totalElements}</strong> mẫu
          </p>
          <button
            type="button"
            className="th-seller-store__quick-open"
            onClick={() => {
              if (!selectedAgency) {
                setQuickQuoteError('Cần chọn khách sỉ trên Store trước khi dùng báo giá nhanh.')
                return
              }
              setQuickQuoteError(null)
              setQuickQuoteDrawerOpen(true)
            }}
          >
            <Badge count={quickQuoteItems.length} size="small" offset={[6, -1]}>
              <span className="th-seller-store__quick-open-text">Giỏ báo giá nhanh</span>
            </Badge>
          </button>
        </div>
      </div>

      {loading && !needAgency ? <p className="th-seller-store__empty">Đang tải…</p> : null}

      {!loading && (needAgency || rows.length === 0) ? (
        <p className="th-seller-store__empty">{emptyMessage}</p>
      ) : null}

      {!loading && !needAgency && rows.length > 0 ? (
        <>
          <ul
            className="th-seller-store__grid"
            aria-label={sourceMode === 'custom' ? 'Danh sách mẫu custom theo đại lý' : 'Danh sách mẫu tủ'}
          >
            {rows.map((p) => (
              <li key={p.id} className="th-seller-store__card">
                <div className="th-seller-store__card-visual">
                  <img
                    className="th-seller-store__img"
                    src={p.imageUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  {sourceMode === 'custom' ? (
                    <span className="th-seller-store__tag th-seller-store__tag--custom" aria-label="Hàng custom">
                      Custom
                    </span>
                  ) : null}
                  <span
                    className={
                      p.stockQty > 0
                        ? 'th-seller-store__stock th-seller-store__stock--ok'
                        : 'th-seller-store__stock th-seller-store__stock--zero'
                    }
                  >
                    Tồn kho: {p.stockQty}
                  </span>
                </div>
                <div className="th-seller-store__card-body">
                  <p className="th-seller-store__sku">{p.sku}</p>
                  <h2 className="th-seller-store__name">{p.name}</h2>
                  <p className="th-seller-store__cat">{categoryLine(p)}</p>
                  <p className="th-seller-store__desc">
                    {htmlToPlainText(p.description).slice(0, 120)}
                    {htmlToPlainText(p.description).length > 120 ? '…' : ''}
                  </p>
                  <p className="th-seller-store__material">{p.material}</p>
                  <div className="th-seller-store__price-row">
                    <span className="th-seller-store__price">{formatVND(p.price)}</span>
                    <span className="th-seller-store__price-hint">Giá niêm yết</span>
                  </div>
                  <button type="button" className="th-seller-store__btn" onClick={() => handleQuickQuote(p)}>
                    Báo giá nhanh
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <AppPagination
            className="th-seller-store-pagination"
            pageIndex={safePage}
            pageSize={pageSize}
            total={totalElements}
            pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
            showSizeChanger={!needAgency}
            onPageIndexChange={setPageIndex}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize as (typeof PAGE_SIZE_OPTIONS)[number])
              setPageIndex(0)
            }}
          />
        </>
      ) : null}

      <Drawer
        title="Báo giá nhanh"
        placement="right"
        width="clamp(320px, 33vw, 520px)"
        open={quickQuoteDrawerOpen}
        onClose={() => setQuickQuoteDrawerOpen(false)}
        className="th-seller-store-quick-drawer"
      >
        <div className="th-seller-store-quick__body">
          <div className="th-seller-store-quick__agency-field">
            <span className="th-seller-store__field-label" id={`${fid}-qq-agency-label`}>
              Khách sỉ (báo giá)
            </span>
            <div
              className="th-seller-store__agency-combo th-seller-store-quick__agency-combo"
              ref={quoteAgencyComboRef}
              data-open={quoteAgencyComboOpen ? 'true' : undefined}
            >
              <div className="th-seller-store__agency-combo-inner">
                <button
                  type="button"
                  id={`${fid}-qq-agency-trigger`}
                  className="th-seller-store__agency-combo-trigger"
                  aria-labelledby={`${fid}-qq-agency-label`}
                  aria-haspopup="listbox"
                  aria-expanded={quoteAgencyComboOpen}
                  aria-controls={`${fid}-qq-agency-listbox`}
                  onClick={() => toggleQuoteAgencyCombo()}
                >
                  <span className="th-seller-store__agency-combo-trigger-text">
                    {selectedQuoteAgency
                      ? `${selectedQuoteAgency.shortName || selectedQuoteAgency.legalName} (${selectedQuoteAgency.code})`
                      : '— Chọn khách sỉ —'}
                  </span>
                  <span className="material-symbols-outlined th-seller-store__agency-combo-chevron" aria-hidden>
                    expand_more
                  </span>
                </button>
                {quoteAgencyComboOpen ? (
                  <div
                    className="th-seller-store__agency-combo-panel"
                    id={`${fid}-qq-agency-panel`}
                    role="presentation"
                  >
                    <div className="th-seller-store__agency-combo-search">
                      <span className="material-symbols-outlined th-seller-store__agency-combo-search-icon" aria-hidden>
                        search
                      </span>
                      <input
                        ref={quoteAgencyPanelSearchInputRef}
                        id={`${fid}-qq-agency-panel-q`}
                        className="th-seller-store__agency-combo-search-input"
                        type="search"
                        placeholder="Tìm mã, tên, SĐT…"
                        value={quoteAgencyPanelSearch}
                        onChange={(e) => setQuoteAgencyPanelSearch(e.target.value)}
                        autoComplete="off"
                        aria-label="Tìm khách sỉ trong giỏ báo giá"
                      />
                    </div>
                    <ul
                      className="th-seller-store__agency-combo-list"
                      id={`${fid}-qq-agency-listbox`}
                      role="listbox"
                      aria-label="Danh sách khách sỉ"
                    >
                      {quoteAgencyLoading ? (
                        <li className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--muted">
                          Đang tải…
                        </li>
                      ) : null}
                      {!quoteAgencyLoading && quoteAgencyLoadError ? (
                        <li
                          className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--err"
                          role="alert"
                        >
                          {quoteAgencyLoadError}
                        </li>
                      ) : null}
                      {!quoteAgencyLoading && !quoteAgencyLoadError && quoteAgencyRows.length === 0 ? (
                        <li className="th-seller-store__agency-combo-item th-seller-store__agency-combo-item--muted">
                          Không có khách khớp tìm kiếm.
                        </li>
                      ) : null}
                      {!quoteAgencyLoading &&
                        !quoteAgencyLoadError &&
                        quoteAgencyRows.map((a) => (
                          <li key={a.id} role="none">
                            <button
                              type="button"
                              role="option"
                              aria-selected={quoteAgencyId === a.id}
                              className={`th-seller-store__agency-combo-option${quoteAgencyId === a.id ? ' is-selected' : ''}`}
                              onClick={() => pickQuoteAgencyRow(a)}
                            >
                              <span className="th-seller-store__agency-combo-option-name">
                                {a.shortName || a.legalName}
                              </span>
                              <span className="th-seller-store__agency-combo-option-meta">{a.code}</span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {quickQuoteItems.length === 0 ? (
            <p className="th-seller-store-quick__empty">
              Chưa có item nào. Bấm “Báo giá nhanh” trên card để thêm.
            </p>
          ) : (
            <ul className="th-seller-store-quick__list">
              {quickQuoteItems.map((item) => {
                const itemKey = `${item.productId}::${item.lineSource}::${item.ownerAgencyId ?? ''}`
                return (
                  <li key={itemKey} className="th-seller-store-quick__item">
                    <div className="th-seller-store-quick__item-head">
                      <p className="th-seller-store-quick__item-name">{item.productName}</p>
                      <button
                        type="button"
                        className="th-seller-store-quick__remove"
                        onClick={() =>
                          removeQuickQuoteItem(item.productId, item.lineSource, item.ownerAgencyId)
                        }
                      >
                        Xóa
                      </button>
                    </div>
                    <p className="th-seller-store-quick__item-meta">
                      <code>{item.sku}</code> ·{' '}
                      {item.lineSource === 'agency_custom' ? 'Custom theo đại lý' : 'Catalog chuẩn'}
                    </p>
                    <div className="th-seller-store-quick__item-row">
                      <div className="th-seller-store-quick__qty">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuickQuoteQty(
                              item.productId,
                              item.lineSource,
                              item.ownerAgencyId,
                              item.qty - 1,
                            )
                          }
                          disabled={item.qty <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.qty}
                          onChange={(e) =>
                            updateQuickQuoteQty(
                              item.productId,
                              item.lineSource,
                              item.ownerAgencyId,
                              Number(e.target.value),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateQuickQuoteQty(
                              item.productId,
                              item.lineSource,
                              item.ownerAgencyId,
                              item.qty + 1,
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <p className="th-seller-store-quick__price">
                        {formatVND(Math.max(0, item.qty) * Math.max(0, item.unitPriceVnd))}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="th-seller-store-quick__footer">
            <p className="th-seller-store-quick__subtotal">
              Tạm tính <strong>{formatVND(quickQuoteSubtotal)}</strong>
            </p>
            <div className="th-seller-store-quick__actions">
              <button
                type="button"
                className="th-seller-store-quick__btn th-seller-store-quick__btn--ghost"
                onClick={clearQuickQuoteItems}
                disabled={quickQuoteItems.length === 0}
              >
                Xóa hết
              </button>
              <button
                type="button"
                className="th-seller-store-quick__btn th-seller-store-quick__btn--primary"
                onClick={handleConfirmQuickQuote}
                disabled={!quickQuoteCanConfirm}
              >
                Xác nhận sang báo giá
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
