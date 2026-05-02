import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import {
  debtUseRatio,
  type DirectorDebtApprovalRow,
} from '../data/directorDebtApprovalsMock'
import {
  fetchDirectorAgencies,
  mapAgencyResponseToDirectorDebtRow,
  overrideDirectorAgencyDebt,
} from '../directorAgenciesApi'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorDebtApprovalPage.css'

const SLIDER_MIN_VND = 0
const SLIDER_MAX_VND = 2_000_000_000
const SLIDER_STEP_VND = 1_000_000

function clampProposedVnd(v: number): number {
  const s = Math.round(v / SLIDER_STEP_VND) * SLIDER_STEP_VND
  return Math.min(SLIDER_MAX_VND, Math.max(SLIDER_MIN_VND, s))
}

/** Phê duyệt hạn mức nợ đại lý ưu tiên. */
export function DirectorDebtApprovalPage() {
  const fid = useId()
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [rows, setRows] = useState<DirectorDebtApprovalRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [proposedLimitVnd, setProposedLimitVnd] = useState<number>(SLIDER_MIN_VND)
  const [saving, setSaving] = useState<'idle' | 'approving'>('idle')
  const [actionNotice, setActionNotice] = useState<null | { type: 'ok' | 'err'; text: string }>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearchQuery(searchInput.trim())
    }, 300)
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
        const data = await fetchDirectorAgencies({
          page: pageIndex,
          size: pageSize,
          search: searchQuery || undefined,
          signal: ac.signal,
        })
        if (ac.signal.aborted) return
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
        setRows(data.content.map(mapAgencyResponseToDirectorDebtRow))
      } catch (err) {
        if (ac.signal.aborted) return
        setRows([])
        setTotalPages(0)
        setTotalElements(0)
        setListError(
          err instanceof Error ? err.message : 'Không tải được danh sách đại lý (Giám đốc)',
        )
      } finally {
        if (!ac.signal.aborted) setListLoading(false)
      }
    })()
    return () => ac.abort()
  }, [pageIndex, pageSize, searchQuery])

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  )

  useEffect(() => {
    if (listLoading) return
    if (rows.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) => (prev && rows.some((r) => r.id === prev) ? prev : rows[0]!.id))
  }, [rows, listLoading])

  useEffect(() => {
    if (selected) {
      setProposedLimitVnd(clampProposedVnd(selected.currentCreditLimitVnd))
    }
  }, [selected])

  const refreshList = useCallback(async () => {
    const data = await fetchDirectorAgencies({
      page: pageIndex,
      size: pageSize,
      search: searchQuery || undefined,
    })
    setTotalPages(data.totalPages)
    setTotalElements(data.totalElements)
    setRows(data.content.map(mapAgencyResponseToDirectorDebtRow))
  }, [pageIndex, pageSize, searchQuery])

  const handleReject = useCallback(
    (row: DirectorDebtApprovalRow) => {
      setActionNotice({
        type: 'ok',
        text: `Đã bỏ qua — hạn mức hệ thống giữ nguyên cho ${row.shortName} (${row.agencyCode}).`,
      })
    },
    [],
  )

  const handleApprove = useCallback(
    async (row: DirectorDebtApprovalRow, newLimitVnd: number) => {
      if (saving !== 'idle') return
      setActionNotice(null)
      setSaving('approving')
      try {
        await overrideDirectorAgencyDebt(row.agencyId, { maxDebtLimit: newLimitVnd })
        await refreshList()
        setActionNotice({
          type: 'ok',
          text: `Đã cập nhật hạn mức ${formatVND(newLimitVnd)} cho ${row.shortName} (${row.agencyCode}).`,
        })
      } catch (e) {
        setActionNotice({
          type: 'err',
          text: e instanceof Error ? e.message : 'Không ghi được hạn mức mới',
        })
      } finally {
        setSaving('idle')
      }
    },
    [saving, refreshList],
  )

  const onRejectClick = useCallback(() => {
    if (!selected || saving !== 'idle') return
    setActionNotice(null)
    handleReject(selected)
  }, [handleReject, saving, selected])

  const ratioPct = selected ? debtUseRatio(selected) * 100 : 0
  const proposedRatio = selected && proposedLimitVnd > 0 ? selected.totalDebtVnd / proposedLimitVnd : 0
  const isBusy = saving !== 'idle'

  return (
    <div className="th-director-debt">
      <header className="th-director-debt__header">
        <div>
          <h1 className="th-director-debt__title">Hạn mức nợ khách ưu tiên</h1>
        </div>
      </header>

      <div className="th-director-debt__toolbar">
        <AppFilterBar className="th-director-debt__search">
          <AppFilterField search>
            <AppFilterInput
              id={`${fid}-search`}
              placeholder="Tên hoặc mã số thuế…"
              value={searchInput}
              onChangeValue={setSearchInput}
              autoComplete="off"
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {listError ? (
        <p className="th-admin-users__api-error" role="alert" style={{ margin: '0 0 0.75rem' }}>
          {listError}
        </p>
      ) : null}

      {actionNotice ? (
        <p
          className="th-admin-users__api-error"
          role="status"
          style={
            actionNotice.type === 'ok'
              ? { margin: '0 0 0.75rem', borderColor: 'rgba(15, 118, 110, 0.35)', background: '#f0fdfa' }
              : { margin: '0 0 0.75rem' }
          }
        >
          {actionNotice.text}
        </p>
      ) : null}

      <div className="th-director-debt__split">
        <div className="th-director-debt__table-wrap">
          <table className="th-director-debt-table">
            <thead>
              <tr>
                <th scope="col">Mã / Tên</th>
                <th scope="col">NVBH</th>
                <th scope="col" className="th-director-debt-table__col-num">
                  Dư nợ
                </th>
                <th scope="col" className="th-director-debt-table__col-num">
                  HM hiện tại
                </th>
                <th scope="col" className="th-director-debt-table__col-num">
                  Đề xuất
                </th>
                <th scope="col" className="th-director-debt-table__col-num">
                  % dùng HM
                </th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="th-director-debt-table__empty">
                    Đang tải danh sách…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="th-director-debt-table__empty">
                    Không có bản ghi.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const active = r.id === selectedId
                  const ratio = debtUseRatio(r)
                  return (
                    <tr
                      key={r.id}
                      className={
                        active
                          ? 'th-director-debt-table__row th-director-debt-table__row--active'
                          : 'th-director-debt-table__row'
                      }
                      tabIndex={0}
                      role="button"
                      aria-selected={active}
                      aria-label={`Chọn ${r.shortName}`}
                      onClick={() => setSelectedId(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(r.id)
                        }
                      }}
                    >
                      <td>
                        <code className="th-director-debt__code">{r.agencyCode}</code>
                        <span className="th-director-debt-table__name">{r.shortName}</span>
                        {r.priority === 'high' ? (
                          <span className="th-director-debt__pill th-director-debt__pill--urgent">Ưu tiên</span>
                        ) : null}
                      </td>
                      <td className="th-director-debt-table__muted">{r.sellerName}</td>
                      <td className="th-director-debt-table__money">{formatVND(r.totalDebtVnd)}</td>
                      <td className="th-director-debt-table__money">{formatVND(r.currentCreditLimitVnd)}</td>
                      <td className="th-director-debt-table__money">{formatVND(r.requestedCreditLimitVnd)}</td>
                      <td className="th-director-debt-table__money">
                        <span className={ratio >= 0.8 ? 'th-director-debt__ratio--bad' : undefined}>
                          {ratio * 100 >= 100 ? '≥100%' : `${(ratio * 100).toFixed(1)}%`}
                        </span>
                      </td>
                      <td>
                        {r.isOrderingBlocked ? (
                          <span className="th-director-debt__freeze">Đóng băng</span>
                        ) : (
                          <span className="th-director-debt__ok">Hoạt động</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 ? (
            <AppPagination
              className="th-director-debt__pager"
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalElements}
              simple
              showSizeChanger={false}
              onPageIndexChange={setPageIndex}
            />
          ) : null}
        </div>

        <aside className="th-director-debt__detail" aria-label="Chi tiết hồ sơ chọn">
          {selected ? (
            <>
              <h2 className="th-director-debt__detail-title">Điều chỉnh hạn mức</h2>
              <p className="th-director-debt__detail-sub">{selected.legalName}</p>
              <dl className="th-director-debt__dl">
                <dt>Mã khách</dt>
                <dd>
                  <code>{selected.agencyCode}</code>
                </dd>
                <dt>Dư nợ hiện tại</dt>
                <dd>{formatVND(selected.totalDebtVnd)}</dd>
                <dt>Hạn mức đang áp dụng</dt>
                <dd>{formatVND(selected.currentCreditLimitVnd)}</dd>
                <dt>HM đang cấu hình (trước khi bạn sửa)</dt>
                <dd>{formatVND(selected.requestedCreditLimitVnd)}</dd>
                <dt>Sử dụng hạn mức</dt>
                <dd>
                  <span className={ratioPct >= 80 ? 'th-director-debt__ratio--bad' : undefined}>
                    {ratioPct >= 100 ? '≥100%' : `${ratioPct.toFixed(1)}%`}
                  </span>
                </dd>
                <dt>Hạn xử lý</dt>
                <dd>{selected.slaDueAt}</dd>
              </dl>
              <div className="th-director-debt__slider-block">
                <label className="th-director-debt__slider-label" htmlFor={`${fid}-slider`}>
                  Hạn mức mới khi duyệt
                </label>
                <input
                  id={`${fid}-slider`}
                  type="range"
                  className="th-director-debt__slider"
                  min={SLIDER_MIN_VND}
                  max={SLIDER_MAX_VND}
                  step={SLIDER_STEP_VND}
                  value={proposedLimitVnd}
                  onChange={(e) => setProposedLimitVnd(clampProposedVnd(Number(e.target.value)))}
                  disabled={isBusy}
                />
                <div className="th-director-debt__slider-readout">
                  <strong>{formatVND(proposedLimitVnd)}</strong>
                  <span className="th-director-debt__slider-hint">
                    Dư nợ / hạn mức mới ≈{' '}
                    <span className={proposedRatio >= 0.8 ? 'th-director-debt__ratio--bad' : undefined}>
                      {(proposedRatio * 100).toFixed(1)}%
                    </span>
                  </span>
                </div>
              </div>
              <div className="th-director-debt__reason">
                <p className="th-director-debt__reason-kicker">Gợi ý rủi ro (theo tỷ lệ dư nợ)</p>
                <p className="th-director-debt__reason-text">{selected.reasonSummary}</p>
              </div>
              <p className="th-director-debt__detail-note">
                <span className="material-symbols-outlined" aria-hidden>
                  info
                </span>
                Phê duyệt: ghi đè hạn mức tối đa theo số bạn chọn. Nếu từ chối, hạn mức trên hệ thống giữ nguyên.
              </p>
              <div className="th-director-debt__actions">
                <button
                  type="button"
                  className="th-director-debt__btn th-director-debt__btn--danger"
                  onClick={onRejectClick}
                  disabled={isBusy}
                >
                  Từ chối
                </button>
                <button
                  type="button"
                  className="th-director-debt__btn th-director-debt__btn--primary"
                  onClick={() => void handleApprove(selected, proposedLimitVnd)}
                  disabled={isBusy}
                >
                  {saving === 'approving' ? 'Đang cập nhật…' : 'Phê duyệt & ghi hạn mức'}
                </button>
              </div>
            </>
          ) : (
            <p className="th-director-debt__detail-empty">Chọn một dòng trong bảng để xem chi tiết.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
