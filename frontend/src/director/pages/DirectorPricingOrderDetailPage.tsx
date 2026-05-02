import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { directorPaths } from '../config/directorPaths'
import {
  approveDirectorApprovalOrder,
  fetchDirectorApprovalOrderById,
  isDirectorBackendOrderId,
  rejectDirectorApprovalOrder,
  requestRevisionDirectorApprovalOrder,
} from '../directorApprovalsApi'
import {
  caseKindLabel,
  findPricingApprovalByOrderCode,
  orderKindShortLabel,
  type DirectorPricingApprovalRow,
} from '../data/directorPricingApprovalsMock'
import { getSellerOrderDetail } from '../../seller/data/sellerOrdersMock'
import { DirectorPricingDecisionDialog } from '../components/DirectorPricingDecisionDialog'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorPricingOrderDetailPage.css'

/** Chi tiết đơn chờ giám đốc duyệt — mã minh hoạ hoặc đơn từ hàng chờ. */
export function DirectorPricingOrderDetailPage() {
  const navigate = useNavigate()
  const { orderCode: orderCodeParam } = useParams<{ orderCode: string }>()
  const orderCode = orderCodeParam ? decodeURIComponent(orderCodeParam) : ''
  const isApiId = Boolean(orderCode && isDirectorBackendOrderId(orderCode))

  const [apiApproval, setApiApproval] = useState<DirectorPricingApprovalRow | null>(null)
  const [apiLoading, setApiLoading] = useState(() => isApiId)
  const [apiError, setApiError] = useState<string | null>(null)
  const [decisionPhase, setDecisionPhase] = useState<
    'idle' | 'rejecting' | 'revising' | 'approving'
  >('idle')
  const [decisionDialogVariant, setDecisionDialogVariant] = useState<
    null | 'reject' | 'revise' | 'approve'
  >(null)
  const [decisionDialogError, setDecisionDialogError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiId || !orderCode) {
      setApiApproval(null)
      setApiError(null)
      setApiLoading(false)
      return
    }
    let cancelled = false
    setApiLoading(true)
    setApiError(null)
    void (async () => {
      try {
        const row = await fetchDirectorApprovalOrderById(orderCode)
        if (!cancelled) setApiApproval(row)
      } catch (e) {
        if (!cancelled) {
          setApiApproval(null)
          setApiError(e instanceof Error ? e.message : 'Không tải được đơn')
        }
      } finally {
        if (!cancelled) setApiLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isApiId, orderCode])

  const mockApproval = useMemo(
    () => (orderCode && !isApiId ? findPricingApprovalByOrderCode(orderCode) : undefined),
    [orderCode, isApiId],
  )

  const approval = apiApproval ?? mockApproval ?? null

  const sellerDetail = useMemo(
    () => (orderCode && !isApiId ? getSellerOrderDetail(orderCode) : undefined),
    [orderCode, isApiId],
  )

  const lineItems = approval?.apiItems ?? sellerDetail?.items ?? []

  const itemsSumVnd = useMemo(
    () => lineItems.reduce((s, x) => s + x.lineTotalVnd, 0),
    [lineItems],
  )

  const submitDetailDecisionDialog = useCallback(
    async (note: string) => {
      if (!decisionDialogVariant || !approval) return
      const variant = decisionDialogVariant
      setDecisionPhase(
        variant === 'reject' ? 'rejecting' : variant === 'revise' ? 'revising' : 'approving',
      )
      setDecisionDialogError(null)
      try {
        if (variant === 'approve') {
          await approveDirectorApprovalOrder(orderCode)
        } else if (variant === 'reject') {
          await rejectDirectorApprovalOrder(orderCode, {
            note,
            existingOrderNote: approval.orderNote,
          })
        } else {
          await requestRevisionDirectorApprovalOrder(orderCode, {
            note,
            existingOrderNote: approval.orderNote,
          })
        }
        setDecisionDialogVariant(null)
        navigate(directorPaths.approvals.pricing, { replace: true })
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
    [approval, decisionDialogVariant, navigate, orderCode],
  )

  const handleDecision = useCallback(
    async (action: 'approve' | 'reject' | 'revise') => {
      if (!approval) return
      if (action === 'approve' && isApiId) {
        setDecisionDialogError(null)
        setDecisionDialogVariant('approve')
        return
      }
      if (action === 'reject' && isApiId) {
        setDecisionDialogError(null)
        setDecisionDialogVariant('reject')
        return
      }
      if (action === 'revise' && isApiId) {
        setDecisionDialogError(null)
        setDecisionDialogVariant('revise')
        return
      }
      const labels = {
        approve: 'Phê duyệt',
        reject: 'Từ chối',
        revise: 'Yêu cầu NVBH chỉnh lại giá / hồ sơ',
      }
      window.alert(`${labels[action]} — ${approval.orderCode}.`)
    },
    [approval, isApiId, navigate, orderCode],
  )

  if (!orderCode) {
    return <Navigate to={directorPaths.approvals.pricing} replace />
  }

  if (isApiId && apiLoading) {
    return (
      <div className="th-director-pricing-detail" style={{ padding: '2rem 1rem' }}>
        <p className="th-director-pricing-detail__muted">Đang tải đơn chờ duyệt…</p>
      </div>
    )
  }

  if (isApiId && apiError) {
    return (
      <div className="th-director-pricing-detail" style={{ padding: '1rem' }}>
        <p className="th-admin-users__api-error" role="alert">
          {apiError}
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link to={directorPaths.approvals.pricing} className="th-director-pricing-detail__btn th-director-pricing-detail__btn--ghost">
            ← Về danh sách
          </Link>
        </p>
      </div>
    )
  }

  if (!approval) {
    return <Navigate to={directorPaths.approvals.pricing} replace />
  }

  const marginDelta = approval.metricsPlaceholder
    ? 0
    : approval.marginPct - approval.floorMarginPct

  return (
    <div className="th-director-pricing-detail">
      <DirectorPricingDecisionDialog
        open={Boolean(isApiId && decisionDialogVariant)}
        variant={decisionDialogVariant}
        orderCode={orderCode}
        contextHint={`${approval.agencyShortName} · NVBH: ${approval.sellerName}`}
        isSubmitting={decisionPhase !== 'idle'}
        submitError={decisionDialogError}
        onClose={() => {
          if (decisionPhase !== 'idle') return
          setDecisionDialogVariant(null)
          setDecisionDialogError(null)
        }}
        onSubmit={(note) => void submitDetailDecisionDialog(note)}
      />
      <nav className="th-director-pricing-detail__breadcrumb" aria-label="Breadcrumb">
        <ol className="th-director-pricing-detail__breadcrumb-list">
          <li className="th-director-pricing-detail__breadcrumb-item">
            <Link to={directorPaths.dashboard} className="th-director-pricing-detail__crumb">
              Ban Giám đốc
            </Link>
          </li>
          <li className="th-director-pricing-detail__sep" aria-hidden>
            <span className="material-symbols-outlined">chevron_right</span>
          </li>
          <li className="th-director-pricing-detail__breadcrumb-item">
            <Link to={directorPaths.approvals.pricing} className="th-director-pricing-detail__crumb">
              Duyệt đơn
            </Link>
          </li>
          <li className="th-director-pricing-detail__sep" aria-hidden>
            <span className="material-symbols-outlined">chevron_right</span>
          </li>
          <li className="th-director-pricing-detail__breadcrumb-item">
            <span className="th-director-pricing-detail__crumb th-director-pricing-detail__crumb--current">
              {approval.orderCode}
            </span>
          </li>
        </ol>
      </nav>

      <header className="th-director-pricing-detail__header">
        <div>
          <h1 className="th-director-pricing-detail__title">Chi tiết duyệt đơn</h1>
        </div>
        <div className="th-director-pricing-detail__header-actions">
          <Link
            to={directorPaths.approvals.pricing}
            className="th-director-pricing-detail__btn th-director-pricing-detail__btn--ghost"
          >
            ← Về danh sách
          </Link>
        </div>
      </header>

      <div className="th-director-pricing-detail__split">
        <section
          className="th-director-pricing-detail__card th-director-pricing-detail__card--approval"
          aria-labelledby="gd-approval-h"
        >
          <div className="th-director-pricing-detail__card-head">
            <span className="th-director-pricing-detail__card-kicker">Hồ sơ</span>
            <h2 id="gd-approval-h" className="th-director-pricing-detail__card-title">
              Nội dung xin phê duyệt (Giám đốc)
            </h2>
          </div>
          <dl className="th-director-pricing-detail__dl">
            <dt>Mã đơn</dt>
            <dd>
              <code>{approval.orderCode}</code>
              {approval.priority === 'high' ? (
                <span className="th-director-pricing-detail__pill th-director-pricing-detail__pill--urgent">
                  Ưu tiên
                </span>
              ) : null}
            </dd>
            <dt>Loại case</dt>
            <dd>{caseKindLabel(approval.caseKind)}</dd>
            <dt>Loại đơn</dt>
            <dd>
              <span
                className={
                  approval.orderKind === 'custom'
                    ? 'th-director-pricing-detail__okind th-director-pricing-detail__okind--custom'
                    : 'th-director-pricing-detail__okind th-director-pricing-detail__okind--ready'
                }
              >
                {orderKindShortLabel(approval.orderKind)}
              </span>
            </dd>
            <dt>Khách sỉ</dt>
            <dd>
              {approval.agencyShortName} · <code>{approval.agencyCode}</code>
            </dd>
            <dt>NVBH</dt>
            <dd>{approval.sellerName}</dd>
            <dt>Ngày gửi</dt>
            <dd>{approval.submittedAt}</dd>
            <dt>Giá trị (hồ sơ phê duyệt)</dt>
            <dd>{formatVND(approval.orderValueVnd)}</dd>
            <dt>Chiết khấu đang xin</dt>
            <dd>
              {approval.discountRequestVnd > 0 ? formatVND(approval.discountRequestVnd) : '—'}
            </dd>
            <dt>Biên LN so với ngưỡng</dt>
            <dd>
              {approval.metricsPlaceholder ? (
                '— (chưa có chỉ số biên)'
              ) : (
                <>
                  <span className={marginDelta < 0 ? 'th-director-pricing-detail__delta--bad' : undefined}>
                    {approval.marginPct.toFixed(1)}%
                  </span>{' '}
                  so với ngưỡng {approval.floorMarginPct}% (
                  {marginDelta < 0 ? (
                    <strong>thiếu {Math.abs(marginDelta).toFixed(1)} điểm %</strong>
                  ) : (
                    'đạt ngưỡng'
                  )}
                  )
                </>
              )}
            </dd>
            <dt>Hạn xử lý</dt>
            <dd>{approval.metricsPlaceholder ? '—' : approval.slaDueAt}</dd>
            <dt>Lý do tóm tắt</dt>
            <dd className="th-director-pricing-detail__reason">{approval.reasonSummary}</dd>
          </dl>
          {approval.requirementExcerpt ? (
            <div className="th-director-pricing-detail__req">
              <p className="th-director-pricing-detail__req-kicker">Trích yêu cầu (custom)</p>
              <p className="th-director-pricing-detail__req-text">{approval.requirementExcerpt}</p>
            </div>
          ) : null}
          <p className="th-director-pricing-detail__note">
            <span className="material-symbols-outlined" aria-hidden>
              info
            </span>
            Quy trình: NVBH gửi đơn lên hàng chờ → giám đốc duyệt / từ chối / yêu cầu chỉnh → kế toán / xưởng xử lý
            tiếp.
          </p>
          <div className="th-director-pricing-detail__actions">
            <button
              type="button"
              className="th-director-pricing-detail__btn th-director-pricing-detail__btn--ghost"
              onClick={() => void handleDecision('revise')}
              disabled={decisionPhase !== 'idle'}
            >
              {decisionPhase === 'revising' ? 'Đang gửi…' : 'Yêu cầu chỉnh'}
            </button>
            <button
              type="button"
              className="th-director-pricing-detail__btn th-director-pricing-detail__btn--danger"
              onClick={() => void handleDecision('reject')}
              disabled={decisionPhase !== 'idle'}
            >
              {decisionPhase === 'rejecting' ? 'Đang từ chối…' : 'Từ chối'}
            </button>
            <button
              type="button"
              className="th-director-pricing-detail__btn th-director-pricing-detail__btn--primary"
              onClick={() => void handleDecision('approve')}
              disabled={decisionPhase !== 'idle'}
            >
              {decisionPhase === 'approving' ? 'Đang phê duyệt…' : 'Phê duyệt'}
            </button>
          </div>
        </section>

        <section
          className="th-director-pricing-detail__card th-director-pricing-detail__card--lines"
          aria-labelledby="gd-lines-h"
        >
          <div className="th-director-pricing-detail__card-head">
            <span className="th-director-pricing-detail__card-kicker">BOM &amp; giá</span>
            <h2 id="gd-lines-h" className="th-director-pricing-detail__card-title">
              Dòng hạng mục
            </h2>
          </div>
          {lineItems.length > 0 ? (
            <>
              <div className="th-director-pricing-detail__table-wrap">
                <table className="th-director-pricing-detail__table">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Loại</th>
                      <th scope="col">Mã hàng</th>
                      <th scope="col">Tên hạng mục</th>
                      <th scope="col" className="th-director-pricing-detail__th-num">
                        SL
                      </th>
                      <th scope="col" className="th-director-pricing-detail__th-num">
                        Đơn giá
                      </th>
                      <th
                        scope="col"
                        className="th-director-pricing-detail__th-num"
                        title="Giá vốn đơn vị tại thời điểm lập đơn"
                      >
                        Giá vốn
                      </th>
                      <th scope="col" className="th-director-pricing-detail__th-num">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((line) => (
                      <tr key={line.lineNo}>
                        <td className="th-director-pricing-detail__td-num">{line.lineNo}</td>
                        <td>
                          <span
                            className={
                              line.kind === 'custom'
                                ? 'th-director-pricing-detail__line-kind th-director-pricing-detail__line-kind--custom'
                                : 'th-director-pricing-detail__line-kind'
                            }
                          >
                            {line.kind === 'custom' ? 'Tùy chỉnh' : 'Danh mục'}
                          </span>
                        </td>
                        <td>
                          <code className="th-director-pricing-detail__sku">{line.sku}</code>
                        </td>
                        <td>
                          {line.productName}
                          {line.lineNote ? (
                            <span className="th-director-pricing-detail__line-note">{line.lineNote}</span>
                          ) : null}
                        </td>
                        <td className="th-director-pricing-detail__td-num">{line.qty}</td>
                        <td className="th-director-pricing-detail__td-num">{formatVND(line.unitPriceVnd)}</td>
                        <td className="th-director-pricing-detail__td-num">
                          {line.unitCostAtTimeVnd != null ? formatVND(line.unitCostAtTimeVnd) : '—'}
                        </td>
                        <td className="th-director-pricing-detail__td-num">{formatVND(line.lineTotalVnd)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="th-director-pricing-detail__table-foot">
                      <td colSpan={7} className="th-director-pricing-detail__table-foot-label">
                        Cộng các dòng
                      </td>
                      <td className="th-director-pricing-detail__td-num th-director-pricing-detail__table-foot-sum">
                        {formatVND(itemsSumVnd)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : (
            <div className="th-director-pricing-detail__lines-empty" role="status">
              <span className="material-symbols-outlined" aria-hidden>
                inventory_2
              </span>
              <p>Chưa có dòng hạng mục kèm hồ sơ này.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
