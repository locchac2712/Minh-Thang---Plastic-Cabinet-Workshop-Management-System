import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND, isDebtRisk } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { sellerPaths } from '../config/sellerPaths'
import { fetchSellerAgencies, type SellerAgencyRow } from '../sellerAgenciesApi'
import { getAccessToken } from '../../auth/storage'
import {
  AppFilterActions,
  AppFilterBar,
  AppFilterClearButton,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import '../../admin/pages/AdminUsersPage.css'
import './SellerAgenciesPage.css'

/**
 * Khách sỉ trực thuộc NVBH (phân trang).
 */
export function SellerAgenciesPage() {
  const navigate = useNavigate()
  const fid = useId()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'' | 'active' | 'inactive'>('')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SellerAgencyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch, filterActive])

  const fetchAgencies = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchSellerAgencies({
        page: pageIndex,
        size: pageSize,
        search: debouncedSearch || undefined,
        is_active: filterActive === 'active' ? true : filterActive === 'inactive' ? false : undefined,
      })
      setRows(data.content)
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách khách sỉ')
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, debouncedSearch, filterActive])

  useEffect(() => {
    void fetchAgencies()
  }, [fetchAgencies])

  const filtersApplied = !!filterActive

  const clearFilters = useCallback(() => {
    setFilterActive('')
  }, [])

  const debtRatio = useCallback((a: SellerAgencyRow) => {
    if (a.creditLimitVnd <= 0) return a.totalDebtVnd > 0 ? 1 : 0
    return Math.min(1, a.totalDebtVnd / a.creditLimitVnd)
  }, [])

  const safePage = totalPages === 0 ? 0 : Math.min(pageIndex, Math.max(0, totalPages - 1))

  const goToOrderHistory = useCallback(
    (a: SellerAgencyRow) => {
      navigate(sellerPaths.agency(a.id))
    },
    [navigate],
  )

  return (
    <div className="th-seller-agency">
      <header className="th-seller-agency__header">
        <div className="th-seller-agency__heading">
          <div className="th-seller-agency__title-row">
            <span className="material-symbols-outlined th-seller-agency__title-icon" aria-hidden>
              domain
            </span>
            <div>
              <h1 className="th-seller-agency__title">Khách sỉ trực thuộc</h1>
            </div>
          </div>
          <Link to={sellerPaths.agencyNew} className="th-seller-agency__btn-primary">
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Thêm đại lý mới
          </Link>
        </div>
      </header>

      {loadError ? (
        <p className="th-admin-users__api-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="th-seller-agency-table-wrap">
        <div className="th-seller-agency-toolbar__head">
          <AppFilterBar className="th-seller-agency-toolbar__bar">
            <AppFilterField search className="th-seller-agency-toolbar__search">
              <AppFilterInput
                id={`${fid}-search`}
                placeholder="Tìm theo tên, mã, địa chỉ…"
                value={searchInput}
                onChangeValue={setSearchInput}
                autoComplete="off"
              />
            </AppFilterField>
            <AppFilterField label="Trạng thái" className="th-seller-agency-toolbar__filter">
              <AppFilterSelect
                value={filterActive}
                onChangeValue={(value) => setFilterActive(value as '' | 'active' | 'inactive')}
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Tạm khóa' },
                ]}
              />
            </AppFilterField>
            {filtersApplied ? (
              <AppFilterActions>
                <AppFilterClearButton onClick={clearFilters} />
              </AppFilterActions>
            ) : null}
          </AppFilterBar>
        </div>

        <div className="th-seller-agency-table-scroll">
          <table className="th-seller-agency-table">
            <thead>
              <tr>
                <th scope="col">Mã</th>
                <th scope="col">Tên gọi</th>
                <th scope="col">MST</th>
                <th scope="col">Khu vực</th>
                <th scope="col">Dư nợ / Hạn mức</th>
                <th scope="col">Cảnh báo</th>
                <th scope="col" className="th-seller-agency-table__col-actions">
                  Lịch sử
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="th-seller-agency-table__empty">
                    Đang tải…
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="th-seller-agency-table__empty">
                    Không có khách sỉ khớp bộ lọc.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                rows.map((a) => {
                  const risk = isDebtRisk(a) || a.totalDebtVnd > a.creditLimitVnd
                  const ratio = debtRatio(a)
                  const overLimit = a.totalDebtVnd > a.creditLimitVnd && a.creditLimitVnd > 0
                  return (
                    <tr
                      key={a.id}
                      className="th-seller-agency-table__row th-seller-agency-table__row--click"
                      tabIndex={0}
                      role="button"
                      aria-label={`Mở chi tiết ${a.shortName}`}
                      onClick={() => navigate(sellerPaths.agency(a.id))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(sellerPaths.agency(a.id))
                        }
                      }}
                    >
                      <td>
                        <code className="th-seller-agency__code">{a.code}</code>
                      </td>
                      <td>
                        <span className="th-seller-agency-table__name">
                          <span className="th-seller-agency-table__name-text">{a.shortName}</span>
                          {!a.isActive ? (
                            <span className="th-seller-agency-table__badge th-seller-agency-table__badge--off">
                              Tạm khóa
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="th-seller-agency-table__muted">{a.taxCode}</td>
                      <td>{a.city}</td>
                      <td>
                        <div className="th-seller-agency-debt">
                          <div className="th-seller-agency-debt__nums">
                            <span>{formatVND(a.totalDebtVnd)}</span>
                            <span className="th-seller-agency-debt__sep">/</span>
                            <span>{formatVND(a.creditLimitVnd)}</span>
                          </div>
                          <div
                            className={
                              risk
                                ? 'th-seller-agency-debt__bar th-seller-agency-debt__bar--risk'
                                : 'th-seller-agency-debt__bar'
                            }
                            aria-hidden
                          >
                            <span style={{ width: `${ratio * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        {overLimit ? (
                          <span className="th-seller-agency-table__risk th-seller-agency-table__risk--bad">
                            Vượt HM
                          </span>
                        ) : risk ? (
                          <span className="th-seller-agency-table__risk th-seller-agency-table__risk--warn">
                            Gần ngưỡng
                          </span>
                        ) : (
                          <span className="th-seller-agency-table__risk th-seller-agency-table__risk--ok">
                            Ổn
                          </span>
                        )}
                      </td>
                      <td className="th-seller-agency-table__col-actions">
                        <button
                          type="button"
                          className="th-seller-agency-table__action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            goToOrderHistory(a)
                          }}
                        >
                          Lịch sử đặt tủ
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {totalElements > 0 ? (
          <AppPagination
            className="th-seller-agency-pagination"
            pageIndex={safePage}
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
