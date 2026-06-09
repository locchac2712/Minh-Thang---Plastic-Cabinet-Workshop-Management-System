import { useCallback, useEffect, useId, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { sellerPaths } from '../config/sellerPaths'
import { formatDateVi } from '../../shared/formatDateVi'
import { isQuotationExpired } from '../sellerQuotationValidity'
import {
  buildFromOrderDto,
  writeQuotationOrderCopyPrefill,
} from '../quotationOrderCopyPrefill'
import { canCopyQuotationToOrder, quotationStatusLabel } from '../sellerOrderDetailPhase'
import {
  fetchSellerQuotationById,
  fetchSellerQuotations,
  type SellerQuotationListDto,
  type SellerQuotationStatus,
} from '../sellerQuotationsApi'
import { isQuotationRecord, orderCodeFromDto } from '../sellerOrderRef'
import '../../admin/pages/AdminUsersPage.css'
import './SellerQuotationsPage.css'

type StatusFilter = 'all' | SellerQuotationStatus

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Draft', label: 'Nháp' },
  { id: 'Pending', label: 'Chờ duyệt' },
  { id: 'Approved', label: 'Đã duyệt' },
  { id: 'Rejected', label: 'Từ chối' },
  { id: 'Canceled', label: 'Đã hủy' },
]

const QUOTATION_BADGE_CLASS: Record<SellerQuotationStatus, string> = {
  Draft: 'th-seller-qt__badge--draft',
  Pending: 'th-seller-qt__badge--pending',
  Approved: 'th-seller-qt__badge--approved',
  Rejected: 'th-seller-qt__badge--rejected',
  Canceled: 'th-seller-qt__badge--canceled',
}

/** Danh sách báo giá */
export function SellerQuotationsPage() {
  const fid = useId()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SellerQuotationListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const apiStatus: SellerQuotationStatus | undefined =
    statusFilter === 'all' ? undefined : statusFilter

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [statusFilter, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await fetchSellerQuotations({
          page: pageIndex,
          size: pageSize,
          status: apiStatus,
          search: debouncedSearch || undefined,
        })
        if (cancelled) return
        setRows(data.content.filter(isQuotationRecord))
        setTotalElements(data.totalElements)
      } catch (e) {
        if (cancelled) return
        setRows([])
        setTotalElements(0)
        setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách báo giá')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageIndex, pageSize, apiStatus, debouncedSearch])

  const openQuotation = useCallback(
    (row: SellerQuotationListDto) => {
      navigate(sellerPaths.quotation(orderCodeFromDto(row)))
    },
    [navigate],
  )

  const showCopyColumn = statusFilter === 'Approved'

  const handleCopyToOrder = useCallback(
    async (e: MouseEvent, row: SellerQuotationListDto) => {
      e.stopPropagation()
      if (!canCopyQuotationToOrder(row.status, row.quotationValidUntil)) return
      try {
        const full = await fetchSellerQuotationById(orderCodeFromDto(row))
        const payload = buildFromOrderDto(full)
        if (!payload) return
        writeQuotationOrderCopyPrefill(payload)
        navigate(sellerPaths.orderNew, { state: { quotationOrderCopyPrefill: payload } })
      } catch (err) {
        console.error(err)
      }
    },
    [navigate],
  )

  return (
    <div className="th-seller-qt">
      <header className="th-seller-qt__head">
        <div className="th-seller-qt__title-row">
          <span className="material-symbols-outlined th-seller-qt__title-icon" aria-hidden>
            request_quote
          </span>
          <div>
            <h1 className="th-seller-qt__title">Báo giá</h1>
          </div>
        </div>
        {loadError ? (
          <p className="th-seller-qt__error" role="alert">
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="th-seller-qt__toolbar">
        <div className="th-seller-qt__toolbar-main">
          <div className="th-seller-qt__tabs" role="tablist" aria-label="Lọc trạng thái báo giá">
            {STATUS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === t.id}
                className={`th-seller-qt__tab${statusFilter === t.id ? ' is-active' : ''}`}
                onClick={() => setStatusFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <AppFilterBar className="th-seller-qt__search-bar">
            <AppFilterField search className="th-seller-qt__search">
              <AppFilterInput
                id={`${fid}-search`}
                placeholder="Tìm mã báo giá (BG-2026-00001)…"
                value={searchInput}
                onChangeValue={setSearchInput}
                autoComplete="off"
              />
            </AppFilterField>
          </AppFilterBar>
        </div>
        <Link to={sellerPaths.quotationNew} className="th-seller-qt__btn-create">
          <span className="material-symbols-outlined" aria-hidden>
            add
          </span>
          Tạo báo giá
        </Link>
      </div>

      <div className="th-seller-qt__table-panel">
        <div className="th-seller-qt__table-scroll">
          <table className="th-seller-qt-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Đại lý</th>
              <th>Trạng thái báo giá</th>
              <th className="th-seller-qt-table__num">Tổng phải thu</th>
              <th>Hạn báo giá</th>
              <th>Ngày tạo</th>
              {showCopyColumn ? <th aria-label="Thao tác"> </th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showCopyColumn ? 7 : 6} className="th-seller-qt-table__empty">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={showCopyColumn ? 7 : 6} className="th-seller-qt-table__empty">
                  Không có báo giá phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expired = isQuotationExpired(row.quotationValidUntil)
                const statusLabel = expired
                  ? 'Hết hạn'
                  : quotationStatusLabel(row.quotationStatus)
                const statusBadgeClass = expired
                  ? 'th-seller-qt__badge--expired'
                  : QUOTATION_BADGE_CLASS[row.quotationStatus]

                return (
                <tr
                  key={row.id}
                  className="th-seller-qt-table__row"
                  onClick={() => openQuotation(row)}
                >
                  <td>
                    <code className="th-seller-qt__mono">{orderCodeFromDto(row)}</code>
                  </td>
                  <td>{row.agencyName}</td>
                  <td>
                    <span className={`th-seller-qt__badge ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="th-seller-qt-table__num">{formatVND(row.totalPayable)}</td>
                  <td className="th-seller-qt-table__validity">
                    {row.quotationValidUntil?.trim() ? (
                      formatDateVi(row.quotationValidUntil)
                    ) : (
                      <span className="th-seller-qt-table__validity-empty">—</span>
                    )}
                  </td>
                  <td>
                    {row.createdAt.includes('T')
                      ? row.createdAt.replace('T', ' ').slice(0, 16)
                      : row.createdAt}
                  </td>
                  {showCopyColumn ? (
                    <td>
                      {canCopyQuotationToOrder(row.status, row.quotationValidUntil) ? (
                        <button
                          type="button"
                          className="th-seller-qt__row-action"
                          onClick={(e) => void handleCopyToOrder(e, row)}
                        >
                          Tạo đơn
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
                )
              })
            )}
          </tbody>
          </table>
        </div>

        {!loading && totalElements > 0 ? (
          <AppPagination
            className="th-seller-qt-pagination"
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={totalElements}
            pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
            onPageIndexChange={setPageIndex}
            onPageSizeChange={(nextSize) => {
              setPageSize(nextSize as (typeof PAGE_SIZE_OPTIONS)[number])
              setPageIndex(0)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
