import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { directorPaths } from '../config/directorPaths'
import {
  approveDirectorApprovalOrder,
  fetchDirectorApprovalOrders,
  isDirectorBackendOrderId,
  rejectDirectorApprovalOrder,
  requestRevisionDirectorApprovalOrder,
} from '../directorApprovalsApi'
import {
  caseKindLabel,
  orderKindShortLabel,
  type DirectorPricingApprovalRow,
} from '../data/directorPricingApprovalsMock'
import { DirectorPricingDecisionDialog } from '../components/DirectorPricingDecisionDialog'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorPricingApprovalPage.css'

/**
 * Duyệt đơn — danh sách hàng chờ giám đốc.
 */
export function DirectorPricingApprovalPage() {
  const fid = useId()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rows, setRows] = useState<DirectorPricingApprovalRow[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [decisionPhase, setDecisionPhase] = useState<
    'idle' | 'rejecting' | 'revising' | 'approving'
  >('idle')
  const [decisionDialog, setDecisionDialog] = useState<
    null | { variant: 'reject' | 'revise' | 'approve'; row: DirectorPricingApprovalRow }
  >(null)
  const [decisionDialogError, setDecisionDialogError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)
    void (async () => {
      try {
        const data = await fetchDirectorApprovalOrders({ page: pageIndex, size: pageSize })
        if (cancelled) return
        setRows(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (err) {
        if (!cancelled) {
          setRows([])
          setTotalPages(0)
          setTotalElements(0)
          setListError(err instanceof Error ? err.message : 'Không tải được danh sách')
        }
      } finally {
        if (!cancelled) setListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageIndex, pageSize])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.orderCode.toLowerCase().includes(q) ||
        r.agencyShortName.toLowerCase().includes(q) ||
        r.agencyCode.toLowerCase().includes(q) ||
        r.reasonSummary.toLowerCase().includes(q) ||
        r.sellerName.toLowerCase().includes(q),
    )
  }, [rows, search])

  useEffect(() => {
    if (filtered.length === 0) return
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0]!.id)
    }
  }, [filtered, selectedId])

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId])

  const submitDecisionDialog = useCallback(
    async (note: string) => {
      if (!decisionDialog) return
      const { row, variant } = decisionDialog
      setDecisionPhase(
        variant === 'reject' ? 'rejecting' : variant === 'revise' ? 'revising' : 'approving',
      )
      setDecisionDialogError(null)
      try {
        if (variant === 'approve') {
          await approveDirectorApprovalOrder(row.orderCode)
        } else if (variant === 'reject') {
          await rejectDirectorApprovalOrder(row.orderCode, {
            note,
            existingOrderNote: row.orderNote,
          })
        } else {
          await requestRevisionDirectorApprovalOrder(row.orderCode, {
            note,
            existingOrderNote: row.orderNote,
          })
        }
        setDecisionDialog(null)
        const data = await fetchDirectorApprovalOrders({ page: pageIndex, size: pageSize })
        setRows(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (e) {
        setDecisionDialogError(
          e instanceof Error
            ? e.message
            : variant === 'reject'
              ? 'Không từ chối được đơn'
              : variant === 'revise'
                ? 'Không gửi được yêu cầu chỉnh'
                : 'Không phê duyệt được đơn',
        )
      } finally {
        setDecisionPhase('idle')
      }
    },
    [decisionDialog, pageIndex, pageSize],
  )

  const handleDecision = useCallback(
    async (action: 'approve' | 'reject' | 'revise', row: DirectorPricingApprovalRow) => {
      if (action === 'approve' && isDirectorBackendOrderId(row.orderCode)) {
        setDecisionDialogError(null)
        setDecisionDialog({ variant: 'approve', row })
        return
      }
      if (action === 'reject' && isDirectorBackendOrderId(row.orderCode)) {
        setDecisionDialogError(null)
        setDecisionDialog({ variant: 'reject', row })
        return
      }
      if (action === 'revise' && isDirectorBackendOrderId(row.orderCode)) {
        setDecisionDialogError(null)
        setDecisionDialog({ variant: 'revise', row })
        return
      }
      const labels = {
        approve: 'Phê duyệt',
        reject: 'Từ chối',
        revise: 'Yêu cầu NVBH chỉnh lại giá / hồ sơ',
      }
      window.alert(`${labels[action]} — đơn ${row.orderCode}.`)
    },
    [pageIndex, pageSize],
  )

  return (
    <div className="th-director-pricing">
      <header className="th-director-pricing__header">
        <div>
          <h1 className="th-director-pricing__title">Duyệt đơn</h1>
        </div>
      </header>

      <div className="th-director-pricing__toolbar">
        <AppFilterBar className="th-director-pricing__search">
          <AppFilterField search>
            <AppFilterInput
              id={`${fid}-search`}
              placeholder="Mã đơn, khách, lý do…"
              value={search}
              onChangeValue={setSearch}
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

      <DirectorPricingDecisionDialog
        open={decisionDialog !== null}
        variant={decisionDialog?.variant ?? null}
        orderCode={decisionDialog?.row.orderCode ?? ''}
        contextHint={
          decisionDialog
            ? `${decisionDialog.row.agencyShortName} · NVBH: ${decisionDialog.row.sellerName}`
            : null
        }
        isSubmitting={decisionPhase !== 'idle'}
        submitError={decisionDialogError}
        onClose={() => {
          if (decisionPhase !== 'idle') return
          setDecisionDialog(null)
          setDecisionDialogError(null)
        }}
        onSubmit={(note) => void submitDecisionDialog(note)}
      />

      <div className="th-director-pricing__split">
        <div className="th-director-pricing__table-wrap">
          <table className="th-director-pricing-table">
            <thead>
              <tr>
                <th scope="col">Mã đơn</th>
                <th scope="col">Khách sỉ</th>
                <th scope="col">Loại</th>
                <th scope="col">NVBH</th>
                <th scope="col">Ngày gửi</th>
                <th scope="col" className="th-director-pricing-table__col-num">
                  Giá trị
                </th>
                <th scope="col">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={7} className="th-director-pricing-table__empty">
                    Đang tải danh sách…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="th-director-pricing-table__empty">
                    Không có đơn khớp tìm kiếm hoặc hàng chờ trống.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const active = r.id === selectedId
                  return (
                    <tr
                      key={r.id}
                      className={
                        active
                          ? 'th-director-pricing-table__row th-director-pricing-table__row--active'
                          : 'th-director-pricing-table__row'
                      }
                      tabIndex={0}
                      role="button"
                      aria-selected={active}
                      aria-label={`Chọn đơn ${r.orderCode}`}
                      onClick={() => setSelectedId(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(r.id)
                        }
                      }}
                    >
                      <td>
                        <Link
                          to={directorPaths.approvals.pricingOrder(r.orderCode)}
                          className="th-director-pricing__code-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <code className="th-director-pricing__code">{r.orderCode}</code>
                        </Link>
                        {r.priority === 'high' ? (
                          <span className="th-director-pricing__pill th-director-pricing__pill--urgent">
                            Ưu tiên
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className="th-director-pricing-table__agency">{r.agencyShortName}</span>
                        <code className="th-director-pricing-table__agency-code">{r.agencyCode}</code>
                      </td>
                      <td>
                        <span
                          className={
                            r.orderKind === 'custom'
                              ? 'th-director-pricing__okind th-director-pricing__okind--custom'
                              : 'th-director-pricing__okind th-director-pricing__okind--ready'
                          }
                        >
                          {orderKindShortLabel(r.orderKind)}
                        </span>
                      </td>
                      <td className="th-director-pricing-table__muted">{r.sellerName}</td>
                      <td className="th-director-pricing-table__muted">{r.submittedAt}</td>
                      <td className="th-director-pricing-table__money">{formatVND(r.orderValueVnd)}</td>
                      <td className="th-director-pricing-table__reason">{r.reasonSummary}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 ? (
            <AppPagination
              className="th-director-pricing__pager"
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalElements}
              simple
              showSizeChanger={false}
              onPageIndexChange={setPageIndex}
            />
          ) : null}
        </div>

        <aside className="th-director-pricing__detail" aria-label="Duyệt đơn">
          {selected ? (
            <>
              <h2 className="th-director-pricing__detail-title">Duyệt đơn</h2>
              <dl className="th-director-pricing__dl">
                <dt>Mã đơn</dt>
                <dd>
                  <code>{selected.orderCode}</code>
                </dd>
                <dt>Loại case</dt>
                <dd>{caseKindLabel(selected.caseKind)}</dd>
                <dt>Khách</dt>
                <dd>
                  {selected.agencyShortName} · <code>{selected.agencyCode}</code>
                </dd>
                <dt>Giá trị đơn</dt>
                <dd>{formatVND(selected.orderValueVnd)}</dd>
                <dt>Chiết khấu đang xin</dt>
                <dd>
                  {selected.discountRequestVnd > 0 ? formatVND(selected.discountRequestVnd) : '—'}
                </dd>
                <dt>NVBH</dt>
                <dd>{selected.sellerName}</dd>
              </dl>
              {selected.requirementExcerpt ? (
                <div className="th-director-pricing__req">
                  <p className="th-director-pricing__req-kicker">Mô tả yêu cầu (tùy chỉnh)</p>
                  <p className="th-director-pricing__req-text">{selected.requirementExcerpt}</p>
                </div>
              ) : null}
              <p className="th-director-pricing__detail-note">
                <span className="material-symbols-outlined" aria-hidden>
                  info
                </span>
                Quy trình: NVBH gửi đơn lên hàng chờ → giám đốc duyệt / từ chối / yêu cầu chỉnh → kế toán / xưởng
                xử lý tiếp.
              </p>
              <div className="th-director-pricing__actions">
                <button
                  type="button"
                  className="th-director-pricing__btn th-director-pricing__btn--ghost"
                  onClick={() => void handleDecision('revise', selected)}
                  disabled={decisionPhase !== 'idle'}
                >
                  {decisionPhase === 'revising' ? 'Đang gửi…' : 'Yêu cầu chỉnh'}
                </button>
                <button
                  type="button"
                  className="th-director-pricing__btn th-director-pricing__btn--danger"
                  onClick={() => void handleDecision('reject', selected)}
                  disabled={decisionPhase !== 'idle'}
                >
                  {decisionPhase === 'rejecting' ? 'Đang từ chối…' : 'Từ chối'}
                </button>
                <button
                  type="button"
                  className="th-director-pricing__btn th-director-pricing__btn--primary"
                  onClick={() => void handleDecision('approve', selected)}
                  disabled={decisionPhase !== 'idle'}
                >
                  {decisionPhase === 'approving' ? 'Đang phê duyệt…' : 'Phê duyệt'}
                </button>
              </div>
              <p className="th-director-pricing__seller-link">
                <Link to={directorPaths.approvals.pricingOrder(selected.orderCode)}>Mở chi tiết đơn</Link>
              </p>
            </>
          ) : (
            <p className="th-director-pricing__detail-empty">Chọn một đơn trong bảng để xem và duyệt.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
