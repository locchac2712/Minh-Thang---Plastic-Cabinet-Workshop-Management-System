import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatVND, isDebtRisk } from '../../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../../admin/catalog/productModel'
import { directorPaths } from '../../config/directorPaths'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppPagination,
} from '../../../shared/ui/listing'
import {
  AdminAgencyApiError,
  type AgencyResponse,
  fetchAdminAgencies,
} from '../../../admin/partners/adminAgenciesApi'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminUsersPage.css'
import './DirectorAgenciesPage.css'

function debtRatioRow(row: Pick<AgencyResponse, 'totalDebt' | 'maxDebtLimit'>): number {
  if (row.maxDebtLimit <= 0) return row.totalDebt > 0 ? 1 : 0
  return Math.min(1, row.totalDebt / row.maxDebtLimit)
}

function isDebtRiskRow(row: Pick<AgencyResponse, 'totalDebt' | 'maxDebtLimit'>): boolean {
  return isDebtRisk({
    totalDebtVnd: row.totalDebt,
    creditLimitVnd: row.maxDebtLimit,
  })
}

export function DirectorAgenciesPage() {
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<AgencyResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 380)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch])

  const fetchAgencies = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchAdminAgencies({
        page: pageIndex,
        size: pageSize,
        search: debouncedSearch || undefined,
      })
      setRows(data.content)
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (err) {
      const message =
        err instanceof AdminAgencyApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Không tải được danh sách đại lý'
      setLoadError(message)
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, debouncedSearch])

  useEffect(() => {
    void fetchAgencies()
  }, [fetchAgencies])

  const goToDetail = useCallback(
    (id: string) => {
      navigate(directorPaths.partners.agency(id))
    },
    [navigate],
  )

  const safePage = totalPages === 0 ? 0 : Math.min(pageIndex, Math.max(0, totalPages - 1))
  return (
    <div className="th-admin-agency">
      <header className="th-admin-agency__header">
        <div className="th-admin-agency__heading">
          <div className="th-admin-agency__title-row">
            <span className="material-symbols-outlined th-admin-agency__title-icon" aria-hidden>
              store
            </span>
            <div>
              <h1 className="th-admin-agency__title">Khách sỉ</h1>
            </div>
          </div>
        </div>
      </header>

      {loadError ? (
        <p className="th-admin-users__api-error" role="alert">
          {loadError}
        </p>
      ) : null}

      <section className="th-director-partners__filter-bar" aria-label="Tìm khách sỉ">
        <div className="th-admin-list-toolbar__head">
          <AppFilterBar className="th-admin-list-toolbar__bar">
            <AppFilterField search className="th-admin-list-toolbar__search">
              <AppFilterInput
                value={searchInput}
                onChangeValue={setSearchInput}
                placeholder="Tên, MST, địa chỉ, NVBH…"
                autoComplete="off"
              />
            </AppFilterField>
          </AppFilterBar>
        </div>
      </section>

      <div className="th-admin-agency-table-wrap">
        <div className="th-admin-agency-table-scroll">
          <table className="th-admin-agency-table" aria-label="Bảng khách sỉ">
            <thead>
              <tr>
                <th scope="col">MST</th>
                <th scope="col">Khách hàng</th>
                <th scope="col">Địa chỉ</th>
                <th scope="col">NVBH</th>
                <th scope="col">Dư nợ / Hạn mức</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="th-admin-agency-table__empty">
                    Đang tải…
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="th-admin-agency-table__empty">
                    Không có đại lý phù hợp. Thử đổi từ khóa hoặc bộ lọc.
                  </td>
                </tr>
              ) : null}
              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`th-admin-agency-table__row${
                      row.isActive && (isDebtRiskRow(row) || row.totalDebt > row.maxDebtLimit)
                        ? ' th-admin-agency-table__row--warn'
                        : ''
                    }`}
                    onClick={() => goToDetail(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToDetail(row.id)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Chi tiết ${row.name}`}
                  >
                    <td data-label="MST">
                      <code className="th-admin-agency__mono">{row.taxCode || '—'}</code>
                    </td>
                    <td data-label="Khách">
                      <div className="th-admin-agency-table__name">
                        {row.legalCompanyName && row.legalCompanyName.length > 0
                          ? row.legalCompanyName
                          : '—'}
                      </div>
                      <div className="th-admin-agency-table__sub">{row.name}</div>
                    </td>
                    <td data-label="Địa chỉ">{row.address || '—'}</td>
                    <td data-label="NVBH">{row.assignedSellerName || '—'}</td>
                    <td data-label="Công nợ">
                      <div className="th-admin-agency-debt">
                        <div className="th-admin-agency-debt__nums">
                          <span
                            className={
                              row.totalDebt > row.maxDebtLimit
                                ? 'th-admin-agency__debt-bad'
                                : isDebtRiskRow(row)
                                  ? 'th-admin-agency__debt-warn'
                                  : ''
                            }
                          >
                            {formatVND(row.totalDebt)}
                          </span>
                          <span className="th-admin-agency-debt__sep">/</span>
                          <span className="th-admin-agency-debt__limit">
                            {formatVND(row.maxDebtLimit)}
                          </span>
                        </div>
                        <div className="th-admin-agency-debt__bar" role="presentation" aria-hidden>
                          <span
                            className="th-admin-agency-debt__fill"
                            style={{ width: `${Math.round(debtRatioRow(row) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td data-label="Trạng thái">
                      <span
                        className={`th-admin-agency-status-btn th-admin-agency-status-btn--${
                          row.isActive ? 'active' : 'locked'
                        }`}
                        style={{ pointerEvents: 'none' }}
                      >
                        <span className="th-admin-agency-status-btn__dot" aria-hidden />
                        {row.isActive ? 'Đang mở' : 'Đang khóa'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <AppPagination
          className="th-admin-agency-pagination"
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
      </div>
    </div>
  )
}
