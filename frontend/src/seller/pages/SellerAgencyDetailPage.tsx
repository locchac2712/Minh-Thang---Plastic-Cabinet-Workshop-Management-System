import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { formatVND, isDebtRisk } from '../../admin/partners/agencyModel'
import { sellerPaths } from '../config/sellerPaths'
import { getSellerAgencyById } from '../data/sellerAgenciesMock'
import type { SellerAgencyRow } from '../data/sellerAgenciesMock'
import { fetchSellerAgencyOrders, mapApiToSellerRow, type AgencyApiDto } from '../sellerAgenciesApi'
import {
  AgencyOrderHistoryTable,
  mapApiOrderToAgencyOrderRow,
} from '../../admin/partners/AgencyOrderHistoryTable'
import type { AgencyOrderRow } from '../../admin/partners/agencyDetailMock'
import { getAccessToken, getTokenType } from '../../auth/storage'
import '../../admin/pages/AdminUsersPage.css'
import './SellerAgencyDetailPage.css'

const LEGACY_TABS = ['contact', 'legal', 'credit', 'overview'] as const

function isLegacyTab(s: string | null): boolean {
  return s !== null && (LEGACY_TABS as readonly string[]).includes(s)
}

function creditStatusMessage(overLimit: boolean): string | null {
  if (overLimit) return 'Đã vượt hạn mức — cần thu nợ hoặc nới hạn trước khi bán thêm.'
  return null
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export function SellerAgencyDetailPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const ordersSectionRef = useRef<HTMLElement>(null)

  const [agency, setAgency] = useState<SellerAgencyRow | undefined>(undefined)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null)
  const [orderRows, setOrderRows] = useState<AgencyOrderRow[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const initialTabRef = useRef(searchParams.get('tab'))

  useEffect(() => {
    const t = initialTabRef.current
    if (t !== 'orders' && !isLegacyTab(t)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tab')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  useEffect(() => {
    if (!agency || initialTabRef.current !== 'orders') return
    initialTabRef.current = null
    const t = window.requestAnimationFrame(() => {
      ordersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(t)
  }, [agency])

  useEffect(() => {
    if (!agencyId) return
    let cancelled = false
    setDetailLoading(true)
    setDetailLoadError(null)
    setAgency(undefined)
    ;(async () => {
      const accessToken = getAccessToken()
      if (accessToken) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/seller/agencies/${encodeURIComponent(agencyId)}`,
            {
              headers: {
                accept: '*/*',
                Authorization: `${getTokenType()} ${accessToken}`,
              },
            },
          )
          const envelope = (await res.json()) as ApiEnvelope<AgencyApiDto>
          if (cancelled) return
          if (res.ok && envelope.success && envelope.data) {
            setAgency(mapApiToSellerRow(envelope.data))
            setDetailLoading(false)
            return
          }
        } catch {
          if (cancelled) return
        }
      }
      if (cancelled) return
      const mock = getSellerAgencyById(agencyId)
      if (mock) {
        setAgency(mock)
        setDetailLoadError(null)
      } else {
        setAgency(undefined)
        setDetailLoadError('Không tìm thấy đại lý.')
      }
      setDetailLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [agencyId])

  useEffect(() => {
    if (!agencyId) return
    let cancelled = false
    setOrdersLoading(true)
    setOrdersError(null)
    void (async () => {
      try {
        const data = await fetchSellerAgencyOrders(agencyId, { page: 0, size: 50 })
        if (cancelled) return
        setOrderRows(data.content.map(mapApiOrderToAgencyOrderRow))
      } catch (e) {
        if (!cancelled) {
          setOrderRows([])
          setOrdersError(e instanceof Error ? e.message : 'Không tải được lịch sử đơn')
        }
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agencyId])

  if (!agencyId) {
    return <Navigate to={sellerPaths.agencies} replace />
  }
  if (detailLoading && !agency) {
    return (
      <div className="th-seller-agency-detail th-admin-product-detail--loading" aria-busy>
        Đang tải…
      </div>
    )
  }
  if (!detailLoading && detailLoadError && !agency) {
    return (
      <div className="th-seller-agency-detail">
        <nav className="th-seller-agency-detail__crumb" aria-label="Breadcrumb">
          <Link to={sellerPaths.agencies} className="th-seller-agency-detail__crumb-link">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách đại lý
          </Link>
        </nav>
        <p className="th-admin-users__api-error">{detailLoadError}</p>
      </div>
    )
  }
  if (!agency) {
    return <Navigate to={sellerPaths.agencies} replace />
  }

  const debtRatio =
    agency.creditLimitVnd <= 0
      ? agency.totalDebtVnd > 0
        ? 1
        : 0
      : Math.min(1, agency.totalDebtVnd / agency.creditLimitVnd)
  const risk = isDebtRisk(agency) || agency.totalDebtVnd > agency.creditLimitVnd
  const overLimit = agency.totalDebtVnd > agency.creditLimitVnd && agency.creditLimitVnd > 0
  const creditHint = creditStatusMessage(overLimit)

  return (
    <div className="th-seller-agency-detail">
      <nav className="th-seller-agency-detail__crumb" aria-label="Breadcrumb">
        <Link to={sellerPaths.agencies} className="th-seller-agency-detail__crumb-link">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Danh sách đại lý
        </Link>
      </nav>

      <header
        className={`th-seller-agency-detail__hero${overLimit ? ' th-seller-agency-detail__hero--danger' : risk ? ' th-seller-agency-detail__hero--warn' : ''}`}
      >
        <div className="th-seller-agency-detail__hero-top">
          <div className="th-seller-agency-detail__title-block">
            <span className="material-symbols-outlined th-seller-agency-detail__icon" aria-hidden>
              domain
            </span>
            <div className="th-seller-agency-detail__hero-text">
              <h1 className="th-seller-agency-detail__title">{agency.shortName}</h1>
              <p className="th-seller-agency-detail__meta">
                <code className="th-seller-agency-detail__code">{agency.code}</code>
              </p>
              <div className="th-seller-agency-detail__badges">
                {agency.isActive ? (
                  <span className="th-seller-agency-detail__badge th-seller-agency-detail__badge--on">
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="th-seller-agency-detail__badge th-seller-agency-detail__badge--off">
                    Tạm khóa
                  </span>
                )}
                {overLimit ? (
                  <span className="th-seller-agency-detail__badge th-seller-agency-detail__badge--danger">
                    Vượt hạn mức
                  </span>
                ) : risk ? (
                  <span className="th-seller-agency-detail__badge th-seller-agency-detail__badge--warn">
                    Cảnh báo công nợ
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {agency.email.trim() ? (
            <div className="th-seller-agency-detail__quick-actions" aria-label="Thao tác nhanh">
              <a href={`mailto:${agency.email}`} className="th-seller-agency-detail__action-btn">
                <span className="material-symbols-outlined" aria-hidden>
                  mail
                </span>
                Email
              </a>
            </div>
          ) : null}
        </div>

        <div className="th-seller-agency-detail__credit-band" aria-label="Công nợ và hạn mức">
          <div className="th-seller-agency-detail__credit-stat">
            <span className="th-seller-agency-detail__credit-label">Dư nợ</span>
            <span className="th-seller-agency-detail__credit-num">{formatVND(agency.totalDebtVnd)}</span>
            <span className="th-seller-agency-detail__credit-hint th-seller-agency-detail__credit-hint--inline">
              Theo đơn DH (Approved, Producing, Done)
            </span>
          </div>
          <div className="th-seller-agency-detail__credit-stat">
            <span className="th-seller-agency-detail__credit-label">Hạn mức</span>
            <span className="th-seller-agency-detail__credit-num">{formatVND(agency.creditLimitVnd)}</span>
          </div>
          <div className="th-seller-agency-detail__credit-meter-wrap">
            <div className="th-seller-agency-detail__credit-meter-head">
              <span className="th-seller-agency-detail__credit-label">Sử dụng hạn mức</span>
              <span className="th-seller-agency-detail__credit-pct">{(debtRatio * 100).toFixed(1)}%</span>
            </div>
            <div
              className="th-seller-agency-detail__meter"
              role="progressbar"
              aria-valuenow={Math.round(debtRatio * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                className={
                  overLimit || risk
                    ? 'th-seller-agency-detail__meter-fill th-seller-agency-detail__meter-fill--risk'
                    : 'th-seller-agency-detail__meter-fill'
                }
                style={{ width: `${Math.min(100, debtRatio * 100)}%` }}
              />
            </div>
            {creditHint ? (
              <p className="th-seller-agency-detail__credit-hint">{creditHint}</p>
            ) : null}
          </div>
        </div>
      </header>

      <section className="th-seller-agency-detail__panel" aria-label="Thông tin chi tiết">
        <div className="th-seller-agency-detail__info-grid">
          <article className="th-seller-agency-detail__info-card">
            <h2 className="th-seller-agency-detail__info-title">
              <span className="material-symbols-outlined" aria-hidden>
                contact_phone
              </span>
              Liên hệ
            </h2>
            <dl className="th-seller-agency-detail__dl th-seller-agency-detail__dl--contact">
              <div>
                <dt>Điện thoại</dt>
                <dd>
                  {agency.phone.trim() ? (
                    <a href={`tel:${agency.phone.replace(/\s/g, '')}`} className="th-seller-agency-detail__a">
                      {agency.phone}
                    </a>
                  ) : (
                    <span className="th-seller-agency-detail__muted">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  {agency.email.trim() ? (
                    <a href={`mailto:${agency.email}`} className="th-seller-agency-detail__a">
                      {agency.email}
                    </a>
                  ) : (
                    <span className="th-seller-agency-detail__muted">—</span>
                  )}
                </dd>
              </div>
              <div className="th-seller-agency-detail__dl--full">
                <dt>Ghi chú</dt>
                <dd className={agency.note ? undefined : 'th-seller-agency-detail__muted'}>
                  {agency.note || '—'}
                </dd>
              </div>
            </dl>
          </article>

          <article className="th-seller-agency-detail__info-card">
            <h2 className="th-seller-agency-detail__info-title">
              <span className="material-symbols-outlined" aria-hidden>
                gavel
              </span>
              Pháp nhân &amp; thuế
            </h2>
            <dl className="th-seller-agency-detail__dl">
              <div>
                <dt>Tên đầy đủ</dt>
                <dd>{agency.legalName}</dd>
              </div>
              <div>
                <dt>Mã số thuế</dt>
                <dd>
                  <code className="th-seller-agency-detail__mono">{agency.taxCode}</code>
                </dd>
              </div>
              <div>
                <dt>Địa chỉ giao dịch</dt>
                <dd className={agency.address?.trim() ? undefined : 'th-seller-agency-detail__muted'}>
                  {agency.address?.trim() || '—'}
                </dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section
        ref={ordersSectionRef}
        id="agency-orders"
        className="th-seller-agency-detail__panel th-seller-agency-detail__panel--orders"
        aria-labelledby="agency-orders-title"
      >
        <div className="th-seller-agency-detail__panel-head">
          <div>
            <h2 id="agency-orders-title" className="th-seller-agency-detail__panel-title">
              Lịch sử mua hàng
            </h2>
            <p className="th-seller-agency-detail__panel-lead">
              Đơn bán sỉ (DH) bạn đã lập cho khách này — không gồm báo giá (BG).
            </p>
          </div>
          {!ordersLoading && !ordersError && orderRows.length > 0 ? (
            <span className="th-seller-agency-detail__count-pill">{orderRows.length} đơn</span>
          ) : null}
        </div>
        <AgencyOrderHistoryTable
          rows={orderRows}
          loading={ordersLoading}
          error={ordersError}
          emptyMessage="Chưa có đơn hàng bán sỉ (DH)."
          showQuotationBadge={false}
          orderLink={(id) => sellerPaths.order(id)}
        />
      </section>
    </div>
  )
}
