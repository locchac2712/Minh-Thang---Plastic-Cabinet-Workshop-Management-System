import { useCallback, useEffect, useId, useMemo, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { sellerPaths } from '../config/sellerPaths'
import {
  type SellerOrderListRow,
} from '../data/sellerOrdersMock'
import { fetchSellerOrders, fetchSellerOrderTabTotals } from '../sellerOrdersApi'
import { formatDateVi } from '../../shared/formatDateVi'
import '../../admin/pages/AdminUsersPage.css'
import './SellerOrdersPage.css'

type StatusTabId = 'Approved' | 'Producing' | 'Done' | 'Canceled'

const STATUS_TABS: { id: StatusTabId; label: string }[] = [
  { id: 'Approved', label: 'Chờ sản xuất' },
  { id: 'Producing', label: 'Sản xuất' },
  { id: 'Done', label: 'Hoàn tất' },
  { id: 'Canceled', label: 'Đã hủy' },
]

const EMPTY_TAB_TOTALS: Record<StatusTabId, number> = {
  Approved: 0,
  Producing: 0,
  Done: 0,
  Canceled: 0,
}

/** CTA tạo đơn — hiển thị cạnh tab trạng thái. */
const SHOW_CREATE_ORDER_CTA = false

function displayOrderRef(r: SellerOrderListRow): string {
  return r.orderCode
}

function quotationProvenanceRef(r: SellerOrderListRow): string | null {
  const code = r.sourceDisplayCode?.trim()
  if (code) return code
  return null
}

/** Đơn đặt hàng NVBH — lọc fulfillment; mặc định Chờ sản xuất (Approved). */
export function SellerOrdersPage() {
  const fid = useId()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTabId>('Approved')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SellerOrderListRow[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tabTotals, setTabTotals] = useState<Record<StatusTabId, number>>(EMPTY_TAB_TOTALS)

  const q = searchQuery.trim().toLowerCase()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const t = await fetchSellerOrderTabTotals()
        if (cancelled) return
        setTabTotals({
          Approved: t.Approved,
          Producing: t.Producing,
          Done: t.Done,
          Canceled: t.Canceled,
        })
      } catch {
        if (!cancelled) setTabTotals(EMPTY_TAB_TOTALS)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setPageIndex(0)
  }, [statusTab])

  useEffect(() => {
    setPageIndex(0)
  }, [q])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await fetchSellerOrders({
          page: pageIndex,
          size: pageSize,
          status: statusTab,
        })
        if (cancelled) return
        setRows(data.content)
        setTotalElements(data.totalElements)
        setTotalPages(data.totalPages)
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách đơn')
        setRows([])
        setTotalElements(0)
        setTotalPages(0)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageIndex, pageSize, statusTab])

  const filteredRows = useMemo(() => {
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.orderCode.toLowerCase().includes(q) ||
        r.agencyCode.toLowerCase().includes(q) ||
        r.agencyShortName.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        (r.sourceDisplayCode?.toLowerCase().includes(q) ?? false),
    )
  }, [rows, q])

  const serverMode = !q
  const totalFiltered = serverMode ? totalElements : filteredRows.length
  const totalPagesComputed = serverMode ? totalPages : filteredRows.length === 0 ? 0 : 1
  const safePage =
    totalPagesComputed === 0 ? 0 : Math.min(pageIndex, Math.max(0, totalPagesComputed - 1))
  const pageRows = serverMode ? rows : filteredRows

  useEffect(() => {
    if (totalPagesComputed === 0) return
    setPageIndex((p) => Math.min(p, totalPagesComputed - 1))
  }, [totalPagesComputed])

  const openOrderDetail = useCallback(
    (r: SellerOrderListRow) => {
      navigate(sellerPaths.order(r.orderCode))
    },
    [navigate],
  )

  const openAgencyProfile = useCallback(
    (r: SellerOrderListRow) => {
      navigate(sellerPaths.agency(r.agencyId))
    },
    [navigate],
  )

  const stopRowClick = useCallback((e: MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div className="th-seller-orders">
      <header className="th-seller-orders__header">
        <div className="th-seller-orders__title-row">
          <span className="material-symbols-outlined th-seller-orders__title-icon" aria-hidden>
            receipt_long
          </span>
          <div>
            <h1 className="th-seller-orders__title">Đơn đặt hàng</h1>
          </div>
        </div>
      </header>

      {loadError ? (
        <p className="th-admin-users__api-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="th-seller-orders__toolbar">
        <div
          className="th-seller-orders__tabs"
          role="tablist"
          aria-label="Lọc theo Chờ sản xuất, Sản xuất, Hoàn tất, Đã hủy"
        >
          {STATUS_TABS.map((t) => {
            const n = tabTotals[t.id]
            const active = statusTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={
                  active
                    ? `th-seller-orders__tab th-seller-orders__tab--active th-seller-orders__tab--${t.id.toLowerCase()}`
                    : `th-seller-orders__tab th-seller-orders__tab--${t.id.toLowerCase()}`
                }
                onClick={() => setStatusTab(t.id)}
              >
                <span className="th-seller-orders__tab-label">{t.label}</span>
                <span className="th-seller-orders__tab-count">{n}</span>
              </button>
            )
          })}
        </div>
        {SHOW_CREATE_ORDER_CTA ? (
          <button
            type="button"
            className="th-seller-orders__btn-create"
            onClick={() => navigate(sellerPaths.orderNew)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Tạo đơn hàng mới
          </button>
        ) : null}
      </div>

      <div className="th-seller-orders-table-wrap">
        <AppFilterBar className="th-seller-orders-toolbar">
          <AppFilterField search className="th-seller-orders-toolbar__search">
            <AppFilterInput
              id={`${fid}-search`}
              placeholder="Tìm trên trang hiện tại (mã, khách, báo giá gốc, tóm tắt)…"
              value={searchQuery}
              onChangeValue={setSearchQuery}
              autoComplete="off"
            />
          </AppFilterField>
        </AppFilterBar>

        <div className="th-seller-orders-table-scroll">
          <table className="th-seller-orders-table">
            <thead>
              <tr>
                <th scope="col">Mã đơn</th>
                <th scope="col">Khách sỉ</th>
                <th scope="col">Từ báo giá</th>
                <th scope="col">Tóm tắt</th>
                <th scope="col" className="th-seller-orders-table__col-money">
                  Giá trị
                </th>
                <th scope="col">Ngày</th>
                <th scope="col" className="th-seller-orders-table__col-actions">
                  Hồ sơ KH
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="th-seller-orders-table__empty">
                    Đang tải…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="th-seller-orders-table__empty">
                    Không có đơn khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const provenanceRef = quotationProvenanceRef(r)
                  return (
                    <tr
                      key={r.id}
                      className="th-seller-orders-table__row th-seller-orders-table__row--click"
                      tabIndex={0}
                      role="button"
                      aria-label={`Mở chi tiết đơn ${displayOrderRef(r)}`}
                      onClick={() => openOrderDetail(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openOrderDetail(r)
                        }
                      }}
                    >
                      <td>
                        <code className="th-seller-orders__code" title={r.orderCode}>
                          {displayOrderRef(r)}
                        </code>
                      </td>
                      <td>
                        <span className="th-seller-orders-table__agency">
                          <span className="th-seller-orders-table__agency-name">{r.agencyShortName}</span>
                          <code className="th-seller-orders-table__agency-code">{r.agencyCode}</code>
                        </span>
                      </td>
                      <td className="th-seller-orders-table__provenance">
                        {provenanceRef ? (
                          <Link
                            to={sellerPaths.quotation(provenanceRef)}
                            className="th-seller-orders-table__provenance-link"
                            title={`Mở báo giá ${provenanceRef}`}
                            onClick={stopRowClick}
                          >
                            {provenanceRef}
                          </Link>
                        ) : (
                          <span className="th-seller-orders-table__muted">—</span>
                        )}
                      </td>
                      <td className="th-seller-orders-table__summary">
                        <span className="th-seller-orders-table__summary-text">{r.summary}</span>
                        <span className="th-seller-orders-table__summary-meta">
                          {r.lineCount} dòng
                        </span>
                      </td>
                      <td className="th-seller-orders-table__money">{formatVND(r.totalVnd)}</td>
                      <td className="th-seller-orders-table__muted">{formatDateVi(r.orderedAt)}</td>
                      <td className="th-seller-orders-table__col-actions">
                        <button
                          type="button"
                          className="th-seller-orders-table__action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAgencyProfile(r)
                          }}
                        >
                          Hồ sơ khách
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalFiltered > 0 ? (
          <AppPagination
            className="th-seller-orders-pagination"
            pageIndex={safePage}
            pageSize={pageSize}
            total={totalFiltered}
            pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
            showSizeChanger={serverMode}
            onPageIndexChange={(nextPage) => {
              if (!serverMode) return
              setPageIndex(nextPage)
            }}
            onPageSizeChange={(nextSize) => {
              if (!serverMode) return
              setPageSize(nextSize as (typeof PAGE_SIZE_OPTIONS)[number])
              setPageIndex(0)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
