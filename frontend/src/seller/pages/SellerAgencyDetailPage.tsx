import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { formatVND, isDebtRisk, levelLabel, type AgencyLevel } from '../../admin/partners/agencyModel'
import { sellerPaths } from '../config/sellerPaths'
import { getSellerAgencyById } from '../data/sellerAgenciesMock'
import type { SellerAgencyRow } from '../data/sellerAgenciesMock'
import { getAccessToken, getTokenType } from '../../auth/storage'
import '../../admin/pages/AdminUsersPage.css'
import './SellerAgencyDetailPage.css'

const TAB_IDS = ['overview', 'legal', 'credit'] as const
type TabId = (typeof TAB_IDS)[number]

function isTabId(s: string | null): s is TabId {
  return s !== null && (TAB_IDS as readonly string[]).includes(s)
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type AgencyApiDto = {
  id: string
  name: string
  assignedSellerId: string
  assignedSellerName: string
  level: string
  phone: string
  address: string
  taxCode: string
  legalCompanyName: string
  totalDebt: number
  maxDebtLimit: number
  isActive: boolean
  createdAt: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function apiLevelToAgencyLevel(level: string): AgencyLevel {
  const x = level.trim().toLowerCase()
  if (x === 'gold') return 'gold'
  if (x === 'vip') return 'vip'
  return 'standard'
}

function guessCityFromAddress(address: string): string {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : address.slice(0, 40)
}

function mapApiToSellerRow(d: AgencyApiDto): SellerAgencyRow {
  return {
    id: d.id,
    code: d.taxCode || `KS-${d.id.slice(0, 8)}`,
    legalName: d.legalCompanyName,
    shortName: d.name,
    taxCode: d.taxCode,
    level: apiLevelToAgencyLevel(d.level),
    phone: d.phone,
    email: '',
    city: guessCityFromAddress(d.address),
    address: d.address,
    assignedSellerName: d.assignedSellerName,
    totalDebtVnd: d.totalDebt,
    creditLimitVnd: d.maxDebtLimit,
    isActive: d.isActive,
    note: '',
    createdAt: d.createdAt,
    recentCabinetOrders90d: 0,
  }
}

export function SellerAgencyDetailPage() {
  const { agencyId } = useParams<{ agencyId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [agency, setAgency] = useState<SellerAgencyRow | undefined>(undefined)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null)

  const tabParam = searchParams.get('tab')
  const legacyTab = tabParam === 'orders' || tabParam === 'contact'

  useEffect(() => {
    if (tabParam !== 'orders' && tabParam !== 'contact') return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tab')
        return next
      },
      { replace: true },
    )
  }, [tabParam, setSearchParams])

  const activeTab: TabId = isTabId(tabParam) && !legacyTab ? tabParam : 'overview'

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
            Khách sỉ trực thuộc
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

  function setTab(tab: TabId) {
    const next = new URLSearchParams(searchParams)
    if (tab === 'overview') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="th-seller-agency-detail">
      <nav className="th-seller-agency-detail__crumb" aria-label="Breadcrumb">
        <Link to={sellerPaths.agencies} className="th-seller-agency-detail__crumb-link">
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Khách sỉ trực thuộc
        </Link>
      </nav>

      <header className="th-seller-agency-detail__header">
        <div className="th-seller-agency-detail__title-block">
          <span className="material-symbols-outlined th-seller-agency-detail__icon" aria-hidden>
            domain
          </span>
          <div>
            <h1 className="th-seller-agency-detail__title">{agency.shortName}</h1>
            <p className="th-seller-agency-detail__meta">
              <code className="th-seller-agency-detail__code">{agency.code}</code>
              <span aria-hidden> · </span>
              <span>{agency.legalName}</span>
            </p>
            <div className="th-seller-agency-detail__badges">
              <span className="th-seller-agency-detail__badge th-seller-agency-detail__badge--level">
                {levelLabel(agency.level)}
              </span>
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
      </header>

      <div className="th-seller-agency-detail__tabs" role="tablist" aria-label="Thông tin đại lý">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={
            activeTab === 'overview'
              ? 'th-seller-agency-detail__tab th-seller-agency-detail__tab--active'
              : 'th-seller-agency-detail__tab'
          }
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'legal'}
          className={
            activeTab === 'legal'
              ? 'th-seller-agency-detail__tab th-seller-agency-detail__tab--active'
              : 'th-seller-agency-detail__tab'
          }
          onClick={() => setTab('legal')}
        >
          Pháp nhân &amp; thuế
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'credit'}
          className={
            activeTab === 'credit'
              ? 'th-seller-agency-detail__tab th-seller-agency-detail__tab--active'
              : 'th-seller-agency-detail__tab'
          }
          onClick={() => setTab('credit')}
        >
          Hạn mức &amp; công nợ
        </button>
      </div>

      <div className="th-seller-agency-detail__panels" role="tabpanel">
        {activeTab === 'overview' ? (
          <section className="th-seller-agency-detail__panel" aria-labelledby="tab-overview">
            <h2 id="tab-overview" className="th-seller-agency-detail__panel-title">
              Tổng quan
            </h2>
            <ul className="th-seller-agency-detail__kpis">
              <li className="th-seller-agency-detail__kpi">
                <span className="th-seller-agency-detail__kpi-label">NVBH phụ trách</span>
                <span className="th-seller-agency-detail__kpi-value">{agency.assignedSellerName}</span>
              </li>
              <li className="th-seller-agency-detail__kpi">
                <span className="th-seller-agency-detail__kpi-label">Dư nợ hiện tại</span>
                <span className="th-seller-agency-detail__kpi-value">{formatVND(agency.totalDebtVnd)}</span>
              </li>
              <li className="th-seller-agency-detail__kpi">
                <span className="th-seller-agency-detail__kpi-label">Hạn mức công nợ</span>
                <span className="th-seller-agency-detail__kpi-value">
                  {formatVND(agency.creditLimitVnd)}
                </span>
              </li>
              <li className="th-seller-agency-detail__kpi">
                <span className="th-seller-agency-detail__kpi-label">Ngày mở hồ sơ</span>
                <span className="th-seller-agency-detail__kpi-value">{agency.createdAt}</span>
              </li>
            </ul>

            <h3 className="th-seller-agency-detail__subheading">Liên hệ</h3>
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
          </section>
        ) : null}

        {activeTab === 'legal' ? (
          <section className="th-seller-agency-detail__panel" aria-labelledby="tab-legal">
            <h2 id="tab-legal" className="th-seller-agency-detail__panel-title">
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
                <dd>
                  {agency.address}
                  <br />
                  <span className="th-seller-agency-detail__muted">{agency.city}</span>
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        {activeTab === 'credit' ? (
          <section className="th-seller-agency-detail__panel" aria-labelledby="tab-credit">
            <h2 id="tab-credit" className="th-seller-agency-detail__panel-title">
              Hạn mức &amp; công nợ
            </h2>
            <div className="th-seller-agency-detail__credit-grid">
              <div className="th-seller-agency-detail__credit-card">
                <span className="th-seller-agency-detail__credit-label">Dư nợ</span>
                <span className="th-seller-agency-detail__credit-num">{formatVND(agency.totalDebtVnd)}</span>
              </div>
              <div className="th-seller-agency-detail__credit-card">
                <span className="th-seller-agency-detail__credit-label">Hạn mức được cấp</span>
                <span className="th-seller-agency-detail__credit-num">{formatVND(agency.creditLimitVnd)}</span>
              </div>
              <div className="th-seller-agency-detail__credit-card th-seller-agency-detail__credit-card--wide">
                <span className="th-seller-agency-detail__credit-label">Sử dụng hạn mức</span>
                <div className="th-seller-agency-detail__meter" aria-hidden>
                  <span
                    className={
                      risk
                        ? 'th-seller-agency-detail__meter-fill th-seller-agency-detail__meter-fill--risk'
                        : 'th-seller-agency-detail__meter-fill'
                    }
                    style={{ width: `${Math.min(100, debtRatio * 100)}%` }}
                  />
                </div>
                <span className="th-seller-agency-detail__credit-sub">
                  {(debtRatio * 100).toFixed(1)}% —{' '}
                  {overLimit
                    ? 'Đã vượt hạn mức: cần thu nợ hoặc nới hạn trước khi bán thêm.'
                    : risk
                      ? 'Gần ngưỡng 80%: nhắc khách tất toán / cọc.'
                      : 'Còn room an toàn cho đơn mới.'}
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
