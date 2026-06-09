import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import { directorPaths } from '../config/directorPaths'
import {
  approveDirectorApprovalOrder,
  directorOrderStatusLabel,
  fetchDirectorApprovalOrders,
  isDirectorBackendOrderId,
  rejectDirectorApprovalOrder,
  requestRevisionDirectorApprovalOrder,
  type DirectorApprovalStatusFilter,
} from '../directorApprovalsApi'
import {
  caseKindLabel,
  type DirectorPricingApprovalRow,
} from '../data/directorPricingApprovalsMock'
import { DirectorOrderCustomerPanel } from '../components/DirectorOrderCustomerPanel'
import { DirectorPricingDecisionDialog } from '../components/DirectorPricingDecisionDialog'
import { formatDateVi } from '../../shared/formatDateVi'
import {
  isQuotationExpired,
} from '../../seller/sellerQuotationValidity'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorPricingApprovalPage.css'

const STATUS_TABS: { id: DirectorApprovalStatusFilter; label: string }[] = [
  { id: 'pending', label: 'Chờ duyệt' },
  { id: 'Approved', label: 'Đã duyệt' },
  { id: 'Rejected', label: 'Từ chối' },
  { id: 'all', label: 'Tất cả' },
]

function statusBadgeClass(status: string | undefined): string {
  switch (status) {
    case 'Pending':
      return 'th-director-pricing__status th-director-pricing__status--pending'
    case 'Approved':
      return 'th-director-pricing__status th-director-pricing__status--approved'
    case 'Rejected':
      return 'th-director-pricing__status th-director-pricing__status--rejected'
    default:
      return 'th-director-pricing__status'
  }
}

/**
 * Duyệt đơn — danh sách hàng chờ giám đốc.
 */
export function DirectorPricingApprovalPage() {
  const fid = useId()
  const location = useLocation()
  const initialTab =
    (location.state as { tab?: DirectorApprovalStatusFilter } | null)?.tab ?? 'pending'
  const [statusFilter, setStatusFilter] = useState<DirectorApprovalStatusFilter>(initialTab)
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
    setPageIndex(0)
  }, [statusFilter])

  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)
    void (async () => {
      try {
        const data = await fetchDirectorApprovalOrders({
          page: pageIndex,
          size: pageSize,
          statusFilter,
        })
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
  }, [pageIndex, pageSize, statusFilter])

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
  const selectedPending = selected?.orderStatus === 'Pending' || selected?.orderStatus == null

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
        const data = await fetchDirectorApprovalOrders({
          page: pageIndex,
          size: pageSize,
          statusFilter,
        })
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
    [decisionDialog, pageIndex, pageSize, statusFilter],
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
        <div className="th-director-pricing__tabs" role="tablist" aria-label="Lọc trạng thái đơn">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.id}
              className={
                statusFilter === tab.id
                  ? 'th-director-pricing__tab th-director-pricing__tab--active'
                  : 'th-director-pricing__tab'
              }
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
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
        validityHint={
          decisionDialog?.variant === 'approve' &&
          decisionDialog.row.quotationValidUntil &&
          isQuotationExpired(decisionDialog.row.quotationValidUntil)
            ? 'Báo giá đã quá hạn hiệu lực — vẫn có thể phê duyệt theo quy trình.'
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
                {statusFilter !== 'pending' ? <th scope="col">Trạng thái</th> : null}
                <th scope="col">Khách sỉ</th>
                <th scope="col">NVBH</th>
                <th scope="col">Ngày gửi</th>
                <th scope="col">Hạn BG</th>
                <th scope="col" className="th-director-pricing-table__col-num">
                  Giá trị
                </th>
                <th scope="col">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td colSpan={statusFilter !== 'pending' ? 8 : 7} className="th-director-pricing-table__empty">
                    Đang tải danh sách…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={statusFilter !== 'pending' ? 8 : 7} className="th-director-pricing-table__empty">
                    Không có đơn khớp tìm kiếm hoặc danh sách trống.
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
                      {statusFilter !== 'pending' ? (
                        <td>
                          <span className={statusBadgeClass(r.orderStatus)}>
                            {directorOrderStatusLabel(r.orderStatus)}
                          </span>
                        </td>
                      ) : null}
                      <td>
                        <span className="th-director-pricing-table__agency">{r.agencyShortName}</span>
                        <code className="th-director-pricing-table__agency-code">{r.agencyCode}</code>
                      </td>
                      <td className="th-director-pricing-table__muted">{r.sellerName}</td>
                      <td className="th-director-pricing-table__muted">{r.submittedAt}</td>
                      <td
                        className={
                          isQuotationExpired(r.quotationValidUntil)
                            ? 'th-director-pricing-table__muted th-director-pricing-table__validity is-expired'
                            : 'th-director-pricing-table__muted th-director-pricing-table__validity'
                        }
                      >
                        {r.quotationValidUntil?.trim()
                          ? formatDateVi(r.quotationValidUntil)
                          : '—'}
                      </td>
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
              <h2 className="th-director-pricing__detail-title">
                {selectedPending ? 'Duyệt đơn' : 'Chi tiết đơn'}
              </h2>
              <dl className="th-director-pricing__dl">
                <dt>Mã đơn</dt>
                <dd>
                  <code>{selected.orderCode}</code>
                </dd>
                {selected.orderStatus ? (
                  <>
                    <dt>Trạng thái</dt>
                    <dd>
                      <span className={statusBadgeClass(selected.orderStatus)}>
                        {directorOrderStatusLabel(selected.orderStatus)}
                      </span>
                    </dd>
                  </>
                ) : null}
                {selected.approverName?.trim() ? (
                  <>
                    <dt>Người duyệt</dt>
                    <dd>{selected.approverName.trim()}</dd>
                  </>
                ) : null}
                <dt>Loại case</dt>
                <dd>{caseKindLabel(selected.caseKind)}</dd>
                <dt>Giá trị đơn</dt>
                <dd>{formatVND(selected.orderValueVnd)}</dd>
                <dt>Chiết khấu đang xin</dt>
                <dd>
                  {selected.discountRequestVnd > 0 ? formatVND(selected.discountRequestVnd) : '—'}
                </dd>
                <dt>NVBH</dt>
                <dd>{selected.sellerName}</dd>
                <dt>Hạn báo giá</dt>
                <dd>
                  {selected.quotationValidUntil?.trim()
                    ? formatDateVi(selected.quotationValidUntil)
                    : '—'}
                  {isQuotationExpired(selected.quotationValidUntil) ? (
                    <span className="th-director-pricing__validity-warn">Hết hạn</span>
                  ) : null}
                </dd>
              </dl>
              {selectedPending &&
              selected.quotationValidUntil &&
              isQuotationExpired(selected.quotationValidUntil) ? (
                <p className="th-director-pricing__validity-note" role="status">
                  Báo giá đã quá hạn hiệu lực ({formatDateVi(selected.quotationValidUntil)}). Vẫn có thể phê
                  duyệt theo quy trình hiện tại.
                </p>
              ) : null}
              <DirectorOrderCustomerPanel row={selected} compact />
              {selected.requirementExcerpt ? (
                <div className="th-director-pricing__req">
                  <p className="th-director-pricing__req-kicker">Mô tả yêu cầu (tùy chỉnh)</p>
                  <p className="th-director-pricing__req-text">{selected.requirementExcerpt}</p>
                </div>
              ) : null}
              {selectedPending ? (
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
              ) : (
                <p className="th-director-pricing__detail-readonly">
                  Đơn đã xử lý — xem lại hồ sơ và thông tin khách; không thể duyệt lại tại đây.
                </p>
              )}
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
