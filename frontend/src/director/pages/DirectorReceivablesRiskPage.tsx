import { useEffect, useId, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import {
  fetchReceivableWarningsAgencies,
  fetchReceivableWarningsAgencyDetail,
  formatReceivableAgencyCode,
  type ReceivableAgingBucketApi,
  type ReceivableWarningsAgencyDetailDto,
  type ReceivableWarningsAgencyRowDto,
  orderedAgingBuckets,
  receivableBucketLabel,
  receivableRiskLabel,
} from '../directorReceivableWarningsApi'
import './DirectorReceivablesRiskPage.css'

function detailBarPercent(
  detail: ReceivableWarningsAgencyDetailDto,
  key: ReceivableAgingBucketApi,
): number {
  const p = detail.agingBucketPercents?.[key]
  if (typeof p === 'number' && !Number.isNaN(p)) return Math.min(100, Math.max(0, p))
  const rows = orderedAgingBuckets(detail.agingBuckets)
  const sum = rows.reduce((s, x) => s + x.amount, 0)
  if (sum <= 0) return 0
  const amt = rows.find((x) => x.key === key)?.amount ?? 0
  return Math.min(100, (amt / sum) * 100)
}

function riskBadgeClass(band: string): string {
  if (band === 'SERIOUS') return 'th-director-ar__risk th-director-ar__risk--critical'
  if (band === 'HIGH') return 'th-director-ar__risk th-director-ar__risk--high'
  return 'th-director-ar__risk th-director-ar__risk--watch'
}

export function DirectorReceivablesRiskPage() {
  const fid = useId()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const [rows, setRows] = useState<ReceivableWarningsAgencyRowDto[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ReceivableWarningsAgencyDetailDto | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery])

  useEffect(() => {
    const ac = new AbortController()
    setListLoading(true)
    setListError(null)
    void (async () => {
      try {
        const page = await fetchReceivableWarningsAgencies({
          search: searchQuery || undefined,
          page: pageIndex,
          size: pageSize,
          signal: ac.signal,
        })
        if (ac.signal.aborted) return
        setRows(page.content)
        setTotalElements(page.totalElements)
        setSelectedId((prev) => {
          const ids = new Set(page.content.map((r) => r.agencyId))
          if (page.content.length === 0) return null
          if (prev && ids.has(prev)) return prev
          return page.content[0].agencyId
        })
      } catch (e) {
        if (ac.signal.aborted) return
        setRows([])
        setTotalElements(0)
        setSelectedId(null)
        setListError(e instanceof Error ? e.message : 'Không tải được danh sách')
      } finally {
        if (!ac.signal.aborted) setListLoading(false)
      }
    })()
    return () => ac.abort()
  }, [searchQuery, pageIndex, pageSize])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setDetailError(null)
      return
    }
    const ac = new AbortController()
    setDetailLoading(true)
    setDetailError(null)
    void (async () => {
      try {
        const d = await fetchReceivableWarningsAgencyDetail(selectedId, { signal: ac.signal })
        if (ac.signal.aborted) return
        setDetail(d)
      } catch (e) {
        if (ac.signal.aborted) return
        setDetail(null)
        setDetailError(e instanceof Error ? e.message : 'Không tải chi tiết đại lý')
      } finally {
        if (!ac.signal.aborted) setDetailLoading(false)
      }
    })()
    return () => ac.abort()
  }, [selectedId])

  return (
    <div className="th-director-ar">
      <header className="th-director-ar__header">
        <div>
          <h1 className="th-director-ar__title">Nợ phải thu cảnh báo</h1>
        </div>
      </header>

      <div className="th-director-ar__toolbar">
        <AppFilterBar className="th-director-ar__search">
          <AppFilterField search>
            <AppFilterInput
              id={`${fid}-search`}
              placeholder="Tìm đại lý…"
              value={searchInput}
              onChangeValue={setSearchInput}
              autoComplete="off"
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {listError ? (
        <div className="th-director-ar__banner th-director-ar__banner--error" role="alert">
          {listError}
        </div>
      ) : null}

      <div className="th-director-ar__split">
        <div className="th-director-ar__table-panel">
          <div className="th-director-ar__table-wrap">
            <table className="th-director-ar-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Khách sỉ</th>
                  <th scope="col">NVBH</th>
                  <th scope="col" className="th-director-ar-table__col-num">
                    Dư nợ
                  </th>
                  <th scope="col" className="th-director-ar-table__col-num">
                    Ước QH đơn
                  </th>
                  <th scope="col">Bucket chính</th>
                  <th scope="col" className="th-director-ar-table__col-num">
                    Trễ tối đa
                  </th>
                  <th scope="col">Rủi ro</th>
                </tr>
              </thead>
              <tbody>
                {listLoading ? (
                  <tr>
                    <td colSpan={8} className="th-director-ar-table__empty">
                      Đang tải danh sách…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="th-director-ar-table__empty">
                      Không có đại lý khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const active = r.agencyId === selectedId
                    const rank = pageIndex * pageSize + idx + 1
                    const debtBase = r.computedDebtFromOrders ?? 0
                    const odRatio = debtBase > 0 ? r.estimatedOverdueAmount / debtBase : 0
                    const code = formatReceivableAgencyCode(r)
                    return (
                      <tr
                        key={r.agencyId}
                        className={
                          active
                            ? 'th-director-ar-table__row th-director-ar-table__row--active'
                            : 'th-director-ar-table__row'
                        }
                        tabIndex={0}
                        role="button"
                        aria-selected={active}
                        aria-label={`Chọn ${r.name}`}
                        onClick={() => setSelectedId(r.agencyId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setSelectedId(r.agencyId)
                          }
                        }}
                      >
                        <td className="th-director-ar-table__rank">{rank}</td>
                        <td>
                          <code className="th-director-ar__code">{code}</code>
                          <span className="th-director-ar-table__name">{r.name}</span>
                          <span className="th-director-ar-table__city">{r.address?.trim() || '—'}</span>
                        </td>
                        <td className="th-director-ar-table__muted">{r.assignedSellerName?.trim() || '—'}</td>
                        <td className="th-director-ar-table__money">
                          {formatVND(r.computedDebtFromOrders ?? 0)}
                        </td>
                        <td className="th-director-ar-table__money">
                          <span className={odRatio >= 0.5 ? 'th-director-ar__od--bad' : undefined}>
                            {formatVND(r.estimatedOverdueAmount)}
                          </span>
                        </td>
                        <td>{receivableBucketLabel(r.primaryAgingBucket)}</td>
                        <td className="th-director-ar-table__money">
                          {r.maxOverdueDays > 0 ? `${r.maxOverdueDays} ngày` : '—'}
                        </td>
                        <td>
                          <span className={riskBadgeClass(r.riskBand)}>{receivableRiskLabel(r.riskBand)}</span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <AppPagination
            className="th-director-ar__pagination"
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={totalElements}
            pageSizeOptions={[10, 20, 50, 100]}
            onPageIndexChange={setPageIndex}
            onPageSizeChange={(s) => {
              setPageSize(s)
              setPageIndex(0)
            }}
          />
        </div>

        <aside className="th-director-ar__detail" aria-label="Chi tiết tuổi nợ">
          {!selectedId ? (
            <p className="th-director-ar__detail-empty">Chọn một dòng để xem chi tiết.</p>
          ) : detailLoading ? (
            <p className="th-director-ar__detail-empty">Đang tải chi tiết…</p>
          ) : detailError ? (
            <p className="th-director-ar__detail-empty th-director-ar__detail-error">{detailError}</p>
          ) : detail ? (
            <>
              <h2 className="th-director-ar__detail-title">Chi tiết</h2>
              <p className="th-director-ar__detail-sub">
                {detail.legalCompanyName?.trim() || detail.name}
              </p>
              <dl className="th-director-ar__dl">
                <dt>Dư nợ</dt>
                <dd>{formatVND(detail.computedDebtFromOrders ?? 0)}</dd>
                <dt>Rủi ro</dt>
                <dd>
                  <span className={riskBadgeClass(detail.riskBand)}>{receivableRiskLabel(detail.riskBand)}</span>
                </dd>
                <dt>% QH / nợ</dt>
                <dd>
                  {detail.overdueRatioVsRecordedDebt != null
                    ? `${detail.overdueRatioVsRecordedDebt.toFixed(1)}%`
                    : '—'}
                </dd>
                <dt>Mốc cũ nhất</dt>
                <dd>{detail.oldestAnchorDateAmongOrders?.trim() || '—'}</dd>
                <dt>Trễ tối đa</dt>
                <dd>{detail.maxOverdueDays > 0 ? `${detail.maxOverdueDays} ngày` : '—'}</dd>
              </dl>

              <div className="th-director-ar__stack" aria-label="Phân bổ bucket">
                {orderedAgingBuckets(detail.agingBuckets).map(({ key, amount }) => {
                  const pct = detailBarPercent(detail, key)
                  return (
                    <div key={key} className="th-director-ar__stack-row">
                      <div className="th-director-ar__stack-head">
                        <span>{receivableBucketLabel(key)}</span>
                        <span className="th-director-ar__stack-amt">{formatVND(amount)}</span>
                      </div>
                      <div className="th-director-ar__stack-bar" role="presentation">
                        <span
                          className={
                            key === 'CURRENT'
                              ? 'th-director-ar__stack-fill th-director-ar__stack-fill--ok'
                              : key === 'DAYS_OVER_90'
                                ? 'th-director-ar__stack-fill th-director-ar__stack-fill--bad'
                                : 'th-director-ar__stack-fill'
                          }
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {detail.contributingOrders?.length ? (
                <div className="th-director-ar-orders">
                  <h3 className="th-director-ar-orders__title">Đơn liên quan</h3>
                  <div className="th-director-ar-orders__scroll">
                    <table className="th-director-ar-orders-table">
                      <thead>
                        <tr>
                          <th>Đơn</th>
                          <th className="th-director-ar-orders-table__num">Dư</th>
                          <th>Hạn ước</th>
                          <th>Trễ</th>
                          <th>Bucket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.contributingOrders.map((o) => (
                          <tr key={o.orderId}>
                            <td>
                              <code className="th-director-ar-orders__oid">{o.orderId.slice(0, 8)}…</code>
                            </td>
                            <td className="th-director-ar-orders-table__num">{formatVND(o.remainingAmount)}</td>
                            <td>{o.dueDate}</td>
                            <td>{o.overdueDays > 0 ? `${o.overdueDays} ngày` : '—'}</td>
                            <td>{receivableBucketLabel(o.agingBucket)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
