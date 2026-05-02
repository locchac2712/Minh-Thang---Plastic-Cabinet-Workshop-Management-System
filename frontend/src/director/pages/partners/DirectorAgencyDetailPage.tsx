import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { formatVND, isDebtRisk, type Agency, type AgencyLevel } from '../../../admin/partners/agencyModel'
import { mockRecentOrdersForAgency, formatOrderAmount } from '../../../admin/partners/agencyDetailMock'
import { directorPaths } from '../../config/directorPaths'
import { useAgenciesCatalog } from '../../../admin/context/AgenciesCatalogContext'
import { AdminBreadcrumb } from '../../../admin/components/AdminBreadcrumb/AdminBreadcrumb'
import {
  AdminAgencyApiError,
  type AgencyResponse,
  buildAgencyUpdatePayload,
  fetchAdminAgencyById,
  fetchAdminActiveSellers,
  patchAdminAgency,
  toggleAgencyActive,
  transferAgencyOwner,
  type UserListItem,
} from '../../../admin/partners/adminAgenciesApi'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminUsersPage.css'
import '../../../admin/pages/AdminProductDetailPage.css'
import './DirectorAgencyDetailPage.css'

type DetailTab = 'overview' | 'credit' | 'orders' | 'notes'

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

function mapAgencyResponseToAgency(d: AgencyResponse): Agency {
  return {
    id: d.id,
    code: d.taxCode || `KS-${d.id.slice(0, 8)}`,
    legalName: d.legalCompanyName?.trim() || d.name,
    shortName: d.name,
    taxCode: d.taxCode || '',
    level: apiLevelToAgencyLevel(d.level),
    phone: d.phone || '',
    email: '',
    city: guessCityFromAddress(d.address || ''),
    address: d.address || '',
    assignedSellerName: d.assignedSellerName || '—',
    assignedSellerId: d.assignedSellerId || undefined,
    apiLevelRaw: d.level,
    totalDebtVnd: d.totalDebt,
    creditLimitVnd: d.maxDebtLimit,
    isActive: d.isActive,
    note: '',
    createdAt: d.createdAt,
  }
}

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean)
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || 'KS'
}

function debtUseRatio(a: Pick<Agency, 'totalDebtVnd' | 'creditLimitVnd'>): number {
  if (a.creditLimitVnd <= 0) return a.totalDebtVnd > 0 ? 1 : 0
  return Math.min(1, a.totalDebtVnd / a.creditLimitVnd)
}

export function DirectorAgencyDetailPage() {
  const fid = useId()
  const { agencyId } = useParams<{ agencyId: string }>()
  const navigate = useNavigate()
  const { getAgencyById, updateAgency, removeAgency } = useAgenciesCatalog()

  const [baseAgency, setBaseAgency] = useState<Agency | undefined>(undefined)
  const [fromApi, setFromApi] = useState(false)
  const [serverAgency, setServerAgency] = useState<AgencyResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailLoadError, setDetailLoadError] = useState<string | null>(null)

  const [apiEdit, setApiEdit] = useState<{
    name: string
    phone: string
    address: string
    taxCode: string
    legalCompanyName: string
  } | null>(null)
  const [apiSaveError, setApiSaveError] = useState<string | null>(null)
  const [apiSaving, setApiSaving] = useState(false)
  const [sellers, setSellers] = useState<UserListItem[]>([])
  const [transferToId, setTransferToId] = useState('')
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)
  const [pendingApiToggle, setPendingApiToggle] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [toggleErr, setToggleErr] = useState<string | null>(null)
  const toggleRef = useRef<HTMLDialogElement>(null)

  const agency = baseAgency

  const [tab, setTab] = useState<DetailTab>('overview')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Agency | null>(null)

  const confirmRef = useRef<HTMLDialogElement>(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  useEffect(() => {
    if (!agencyId) return
    let cancelled = false
    setDetailLoading(true)
    setDetailLoadError(null)
    setBaseAgency(undefined)
    setFromApi(false)
    setServerAgency(null)
    setApiEdit(null)
    ;(async () => {
      try {
        const data = await fetchAdminAgencyById(agencyId)
        if (cancelled) return
        setServerAgency(data)
        const mapped = mapAgencyResponseToAgency(data)
        setBaseAgency(mapped)
        setDraft({ ...mapped })
        setFromApi(true)
        setDetailLoadError(null)
      } catch (e) {
        if (cancelled) return
        const mock = getAgencyById(agencyId)
        if (mock) {
          setBaseAgency(mock)
          setDraft({ ...mock })
          setFromApi(false)
          setServerAgency(null)
          setDetailLoadError(null)
        } else {
          setBaseAgency(undefined)
          setDetailLoadError(
            e instanceof AdminAgencyApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : 'Không tìm thấy đại lý.',
          )
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agencyId, getAgencyById])

  useLayoutEffect(() => {
    if (!agency) {
      setDraft(null)
      return
    }
    setDraft({ ...agency })
    setEditing(false)
  }, [agency])

  useEffect(() => {
    const el = confirmRef.current
    if (!el) return
    if (pendingDelete && !el.open) el.showModal()
    else if (!pendingDelete && el.open) el.close()
  }, [pendingDelete])

  useEffect(() => {
    if (!fromApi) {
      setSellers([])
      return
    }
    let ok = true
    ;(async () => {
      try {
        const list = await fetchAdminActiveSellers(200)
        if (ok) setSellers(list)
      } catch {
        if (ok) setSellers([])
      }
    })()
    return () => {
      ok = false
    }
  }, [fromApi])

  useEffect(() => {
    const el = toggleRef.current
    if (!el) return
    if (pendingApiToggle && !el.open) el.showModal()
    else if (!pendingApiToggle && el.open) el.close()
  }, [pendingApiToggle])

  const orderRows = useMemo(() => {
    if (!draft || fromApi) return []
    return mockRecentOrdersForAgency(draft)
  }, [draft, fromApi])

  const startApiEdit = useCallback(() => {
    if (!serverAgency) return
    setApiEdit({
      name: serverAgency.name,
      phone: serverAgency.phone ?? '',
      address: serverAgency.address ?? '',
      taxCode: serverAgency.taxCode ?? '',
      legalCompanyName: serverAgency.legalCompanyName ?? '',
    })
    setApiSaveError(null)
    setEditing(true)
  }, [serverAgency])

  const handleApiSave = useCallback(async () => {
    if (!agencyId || !serverAgency || !apiEdit) return
    setApiSaving(true)
    setApiSaveError(null)
    try {
      const partial = buildAgencyUpdatePayload(serverAgency, apiEdit)
      if (Object.keys(partial).length === 0) {
        setEditing(false)
        setApiEdit(null)
        return
      }
      await patchAdminAgency(agencyId, partial)
      const next = await fetchAdminAgencyById(agencyId)
      setServerAgency(next)
      setBaseAgency(mapAgencyResponseToAgency(next))
      setEditing(false)
      setApiEdit(null)
    } catch (e) {
      if (e instanceof AdminAgencyApiError) setApiSaveError(e.message)
      else if (e instanceof Error) setApiSaveError(e.message)
      else setApiSaveError('Không lưu được.')
    } finally {
      setApiSaving(false)
    }
  }, [agencyId, serverAgency, apiEdit])

  const handleApiCancel = useCallback(() => {
    setApiEdit(null)
    setApiSaveError(null)
    setEditing(false)
  }, [])

  const handleSave = useCallback(() => {
    if (!draft || fromApi) return
    updateAgency({ ...draft })
    setEditing(false)
  }, [draft, updateAgency, fromApi])

  const handleCancelEdit = useCallback(() => {
    if (fromApi) {
      handleApiCancel()
    } else if (agency) {
      setDraft({ ...agency })
      setEditing(false)
    }
  }, [agency, fromApi, handleApiCancel])

  const doTransfer = useCallback(async () => {
    if (!agencyId || !serverAgency || !transferToId) return
    if (transferToId === (serverAgency.assignedSellerId ?? '')) return
    setTransferring(true)
    setTransferError(null)
    try {
      const next = await transferAgencyOwner(agencyId, transferToId)
      setServerAgency(next)
      setBaseAgency(mapAgencyResponseToAgency(next))
      setTransferToId('')
    } catch (e) {
      setTransferError(
        e instanceof AdminAgencyApiError ? e.message : 'Không chuyển được NVBH.',
      )
    } finally {
      setTransferring(false)
    }
  }, [agencyId, serverAgency, transferToId])

  const doApiToggle = useCallback(async () => {
    if (!agencyId) return
    setToggling(true)
    setToggleErr(null)
    try {
      const next = await toggleAgencyActive(agencyId)
      setServerAgency(next)
      setBaseAgency(mapAgencyResponseToAgency(next))
      setPendingApiToggle(false)
    } catch (e) {
      setToggleErr(e instanceof AdminAgencyApiError ? e.message : 'Không cập nhật được trạng thái.')
    } finally {
      setToggling(false)
    }
  }, [agencyId])

  const handleDelete = useCallback(() => {
    if (!agency || fromApi) return
    removeAgency(agency.id)
    navigate(directorPaths.partners.agencies)
  }, [agency, fromApi, removeAgency, navigate])

  if (!agencyId) {
    return <Navigate to={directorPaths.partners.agencies} replace />
  }
  if (detailLoading && !draft) {
    return (
      <div className="th-admin-product-detail th-admin-product-detail--loading" aria-busy>
        Đang tải…
      </div>
    )
  }
  if (!detailLoading && detailLoadError && !draft) {
    return (
      <div className="th-admin-product-detail">
        <div className="th-admin-product-detail__top">
          <AdminBreadcrumb
            items={[
              { label: 'Tổng quan', to: directorPaths.dashboard },
              { label: 'Khách sỉ', to: directorPaths.partners.agencies },
              { label: 'Lỗi' },
            ]}
          />
          <Link to={directorPaths.partners.agencies} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
        </div>
        <p className="th-admin-users__api-error">{detailLoadError}</p>
      </div>
    )
  }
  if (!baseAgency) {
    return <Navigate to={directorPaths.partners.agencies} replace />
  }
  if (!draft) {
    return (
      <div className="th-admin-product-detail th-admin-product-detail--loading" aria-busy>
        Đang tải…
      </div>
    )
  }

  const letter = initialsFromName(draft.shortName)
  const ratio = debtUseRatio(draft)
  const overLimit = draft.totalDebtVnd > draft.creditLimitVnd
  const risk = isDebtRisk(draft) || overLimit

  return (
    <div className="th-admin-product-detail th-admin-agency-detail">
      <div className="th-admin-product-detail__top">
        <AdminBreadcrumb
          items={[
            { label: 'Tổng quan', to: directorPaths.dashboard },
            { label: 'Khách sỉ', to: directorPaths.partners.agencies },
            { label: draft.shortName },
          ]}
        />
        <div className="th-admin-product-detail__toolbar">
          <Link to={directorPaths.partners.agencies} className="th-admin-product-detail__back">
            <span className="material-symbols-outlined" aria-hidden>
              arrow_back
            </span>
            Danh sách
          </Link>
          <div className="th-admin-product-detail__actions">
            {fromApi && !editing ? (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-ghost"
                  onClick={() => {
                    setToggleErr(null)
                    setPendingApiToggle(true)
                  }}
                >
                  {draft.isActive ? 'Khóa đại lý' : 'Mở lại đại lý'}
                </button>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={startApiEdit}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    edit
                  </span>
                  Chỉnh sửa
                </button>
              </>
            ) : null}
            {fromApi && editing ? (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-ghost"
                  onClick={handleCancelEdit}
                  disabled={apiSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={() => void handleApiSave()}
                  disabled={apiSaving}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    save
                  </span>
                  {apiSaving ? 'Đang lưu…' : 'Lưu'}
                </button>
              </>
            ) : null}
            {!fromApi && !editing ? (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-danger"
                  onClick={() => setPendingDelete(true)}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    delete
                  </span>
                  Xóa
                </button>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={() => setEditing(true)}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    edit
                  </span>
                  Chỉnh sửa
                </button>
              </>
            ) : null}
            {!fromApi && editing ? (
              <>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-ghost"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="th-admin-product-detail__btn-primary"
                  onClick={handleSave}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    save
                  </span>
                  Lưu
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <header className="th-admin-product-detail__hero">
        <div className="th-admin-agency-detail__avatar" aria-hidden>
          {letter}
        </div>
        <div className="th-admin-product-detail__hero-text">
          <p className="th-admin-product-detail__sku">{draft.code}</p>
          <h1 className="th-admin-product-detail__title">{draft.legalName}</h1>
          <div className="th-admin-product-detail__hero-meta">
            <span
              className={
                draft.isActive
                  ? 'th-admin-badge th-admin-badge--active'
                  : 'th-admin-badge th-admin-badge--locked'
              }
            >
              <span className="th-admin-badge__dot" aria-hidden />
              {draft.isActive ? 'Đang mở đơn' : 'Đang khóa'}
            </span>
            <span className="th-admin-product-detail__price">
              {formatVND(draft.totalDebtVnd)}
              <span className="th-admin-material-detail__hero-unit"> dư nợ</span>
            </span>
          </div>
        </div>
      </header>

      <div
        className="th-admin-product-detail__tabs"
        role="tablist"
        aria-label="Phần thông tin khách sỉ"
      >
        {(
          [
            { id: 'overview' as const, label: 'Tổng quan', icon: 'badge' },
            { id: 'credit' as const, label: 'Tín dụng & công nợ', icon: 'account_balance_wallet' },
            { id: 'orders' as const, label: 'Đơn hàng bán sỉ', icon: 'shopping_cart' },
            { id: 'notes' as const, label: 'Ghi chú nghiệp vụ', icon: 'policy' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`th-admin-product-detail__tab${tab === t.id ? ' th-admin-product-detail__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="material-symbols-outlined" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="th-admin-product-detail__panel">
        {tab === 'overview' && (
          <div className="th-admin-product-detail__grid" role="tabpanel">
            {fromApi && editing && apiEdit ? (
              <form
                className="th-admin-product-detail__form"
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleApiSave()
                }}
              >
                {apiSaveError && (
                  <p className="th-admin-list-toolbar__error" role="alert">
                    {apiSaveError}
                  </p>
                )}
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Tên đại lý *</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={apiEdit.name}
                    onChange={(e) =>
                      setApiEdit((x) => (x ? { ...x, name: e.target.value } : x))
                    }
                    maxLength={255}
                    required
                    disabled={apiSaving}
                  />
                </label>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Tên công ty (pháp nhân)</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={apiEdit.legalCompanyName}
                    onChange={(e) =>
                      setApiEdit((x) => (x ? { ...x, legalCompanyName: e.target.value } : x))
                    }
                    maxLength={255}
                    disabled={apiSaving}
                  />
                </label>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">MST</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={apiEdit.taxCode}
                    onChange={(e) =>
                      setApiEdit((x) => (x ? { ...x, taxCode: e.target.value } : x))
                    }
                    maxLength={50}
                    disabled={apiSaving}
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Điện thoại</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={apiEdit.phone}
                      onChange={(e) =>
                        setApiEdit((x) => (x ? { ...x, phone: e.target.value } : x))
                      }
                      maxLength={20}
                      disabled={apiSaving}
                    />
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Địa chỉ</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={apiEdit.address}
                    onChange={(e) =>
                      setApiEdit((x) => (x ? { ...x, address: e.target.value } : x))
                    }
                    disabled={apiSaving}
                  />
                </label>
              </form>
            ) : null}
            {fromApi && !editing && serverAgency ? (
              <>
                <dl className="th-admin-product-detail__dl">
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Tên gọi</dt>
                    <dd>{serverAgency.name}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Tên công ty</dt>
                    <dd>
                      {serverAgency.legalCompanyName && serverAgency.legalCompanyName.length > 0
                        ? serverAgency.legalCompanyName
                        : '—'}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>MST</dt>
                    <dd>
                      <code className="th-admin-product-detail__mono">
                        {serverAgency.taxCode && serverAgency.taxCode.length > 0
                          ? serverAgency.taxCode
                          : '—'}
                      </code>
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Cấp (BE)</dt>
                    <dd>
                      <code className="th-admin-product-detail__mono">{serverAgency.level}</code>
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Liên hệ</dt>
                    <dd>{serverAgency.phone && serverAgency.phone.length > 0 ? serverAgency.phone : '—'}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Địa chỉ</dt>
                    <dd>
                      {serverAgency.address && serverAgency.address.length > 0
                        ? serverAgency.address
                        : '—'}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>NVBH phụ trách</dt>
                    <dd>
                      {serverAgency.assignedSellerName || '—'}{' '}
                      {serverAgency.assignedSellerId && (
                        <code className="th-admin-product-detail__mono" style={{ fontSize: '0.8rem' }}>
                          ({serverAgency.assignedSellerId.slice(0, 8)}…)
                        </code>
                      )}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Ngày tạo hồ sơ</dt>
                    <dd>{serverAgency.createdAt}</dd>
                  </div>
                </dl>
                <div
                  className="th-admin-product-detail__card"
                  style={{ marginTop: '1rem', textAlign: 'left' as const }}
                >
                  <h3 className="th-admin-product-detail__card-title">Chuyển NVBH phụ trách</h3>
                  <p className="th-admin-product-detail__card-note" style={{ marginTop: 0 }}>
                    Chọn nhân viên bán hàng đang hoạt động để gán phụ trách đại lý.
                  </p>
                  {transferError && (
                    <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0.5rem 0' }}>
                      {transferError}
                    </p>
                  )}
                  <div
                    className="th-admin-product-detail__form-row"
                    style={{ alignItems: 'flex-end', gap: '0.5rem' }}
                  >
                    <label className="th-admin-product-detail__field" style={{ flex: 1, minWidth: '12rem' }}>
                      <span className="th-admin-product-detail__label">Chuyển sang</span>
                      <select
                        className="th-admin-product-detail__input"
                        value={transferToId}
                        onChange={(e) => setTransferToId(e.target.value)}
                        disabled={transferring}
                      >
                        <option value="">-- Chọn NVBH --</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} — {s.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="th-admin-product-detail__btn-primary"
                      disabled={
                        !transferToId ||
                        transferToId === (serverAgency.assignedSellerId ?? '') ||
                        transferring
                      }
                      onClick={() => void doTransfer()}
                    >
                      {transferring ? 'Đang xử lý…' : 'Chuyển'}
                    </button>
                  </div>
                </div>
              </>
            ) : null}
            {!fromApi && editing ? (
              <form
                className="th-admin-product-detail__form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSave()
                }}
              >
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Mã khách</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.code}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, code: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Tên gọi tắt</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.shortName}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, shortName: e.target.value } : d))
                      }
                    />
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Pháp nhân</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.legalName}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, legalName: e.target.value } : d))
                    }
                  />
                </label>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">MST</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.taxCode}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, taxCode: e.target.value } : d))
                    }
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Điện thoại</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.phone}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, phone: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Email</span>
                    <input
                      type="email"
                      className="th-admin-product-detail__input"
                      value={draft.email}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, email: e.target.value } : d))
                      }
                    />
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Địa chỉ</span>
                  <input
                    className="th-admin-product-detail__input"
                    value={draft.address}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, address: e.target.value } : d))
                    }
                  />
                </label>
                <div className="th-admin-product-detail__form-row">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Tỉnh / TP</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.city}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, city: e.target.value } : d))
                      }
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">NVBH phụ trách</span>
                    <input
                      className="th-admin-product-detail__input"
                      value={draft.assignedSellerName}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, assignedSellerName: e.target.value } : d,
                        )
                      }
                    />
                  </label>
                </div>
                <div className="th-admin-product-detail__form-row th-admin-product-detail__form-row--triple">
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Dư nợ</span>
                    <input
                      type="number"
                      className="th-admin-product-detail__input"
                      value={draft.totalDebtVnd || ''}
                      min={0}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, totalDebtVnd: Number(e.target.value) } : d,
                        )
                      }
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Hạn mức</span>
                    <input
                      type="number"
                      className="th-admin-product-detail__input"
                      value={draft.creditLimitVnd || ''}
                      min={0}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, creditLimitVnd: Number(e.target.value) } : d,
                        )
                      }
                    />
                  </label>
                  <label className="th-admin-product-detail__field">
                    <span className="th-admin-product-detail__label">Trạng thái</span>
                    <select
                      className="th-admin-product-detail__input"
                      value={draft.isActive ? '1' : '0'}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, isActive: e.target.value === '1' } : d,
                        )
                      }
                    >
                      <option value="1">Đang mở</option>
                      <option value="0">Đang khóa</option>
                    </select>
                  </label>
                </div>
                <label className="th-admin-product-detail__field">
                  <span className="th-admin-product-detail__label">Ghi chú</span>
                  <textarea
                    className="th-admin-product-detail__input th-admin-material-detail__textarea"
                    value={draft.note}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, note: e.target.value } : d))
                    }
                    rows={5}
                  />
                </label>
              </form>
            ) : !fromApi && !editing ? (
              <>
                <dl className="th-admin-product-detail__dl">
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Tên gọi</dt>
                    <dd>{draft.shortName}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>MST</dt>
                    <dd>
                      <code className="th-admin-product-detail__mono">{draft.taxCode}</code>
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Liên hệ</dt>
                    <dd>
                      {draft.phone} · {draft.email}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Địa chỉ</dt>
                    <dd>
                      {draft.address}, {draft.city}
                    </dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>NVBH phụ trách</dt>
                    <dd>{draft.assignedSellerName}</dd>
                  </div>
                  <div className="th-admin-product-detail__dl-row">
                    <dt>Ngày tạo hồ sơ</dt>
                    <dd>{draft.createdAt}</dd>
                  </div>
                </dl>
              </>
            ) : null}
          </div>
        )}

        {tab === 'credit' && (
          <div role="tabpanel">
            {risk && (
              <div className="th-admin-agency-detail__alert" role="status">
                <span className="material-symbols-outlined" aria-hidden>
                  warning
                </span>
                <div>
                  {overLimit ? (
                    <strong>Vượt hạn mức tín dụng.</strong>
                  ) : (
                    <strong>Dư nợ gần ngưỡng cảnh báo (≥80% hạn mức).</strong>
                  )}{' '}
                  Cần thu hồi nợ hoặc điều chỉnh hạn mức trước khi mở đơn lớn.
                </div>
              </div>
            )}
            <div className="th-admin-product-detail__cards">
              <div className="th-admin-product-detail__card">
                <h3 className="th-admin-product-detail__card-title">Dư nợ hiện tại</h3>
                <p
                  className={`th-admin-product-detail__card-value${
                    overLimit ? ' th-admin-agency-detail__num-warn' : ''
                  }`}
                >
                  {formatVND(draft.totalDebtVnd)}
                </p>
                <p className="th-admin-product-detail__card-note">Công nợ phải thu.</p>
              </div>
              <div className="th-admin-product-detail__card">
                <h3 className="th-admin-product-detail__card-title">Hạn mức</h3>
                <p className="th-admin-product-detail__card-value">
                  {formatVND(draft.creditLimitVnd)}
                </p>
                <p className="th-admin-product-detail__card-note">Giới hạn tín dụng đã duyệt.</p>
              </div>
              <div className="th-admin-product-detail__card">
                <h3 className="th-admin-product-detail__card-title">Sử dụng HM</h3>
                <p className="th-admin-product-detail__card-value">
                  {Math.round(ratio * 100)}%
                </p>
                <p className="th-admin-product-detail__card-note">Dư nợ / Hạn mức.</p>
              </div>
            </div>
            <div className="th-admin-agency-detail__meter" aria-label="Mức sử dụng hạn mức">
              <div className="th-admin-agency-detail__meter-track">
                <span
                  className={`th-admin-agency-detail__meter-fill${risk ? ' th-admin-agency-detail__meter-fill--risk' : ''}`}
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div role="tabpanel">
            <p className="th-admin-product-detail__tab-lead">
              NVBH phụ trách: <strong>{draft.assignedSellerName}</strong>.
            </p>
            <div className="th-admin-product-detail__table-wrap">
              <table className="th-admin-product-detail__table">
                <thead>
                  <tr>
                    <th>Số đơn</th>
                    <th>Ngày</th>
                    <th>Giá trị</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {orderRows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <code className="th-admin-product-detail__mono">{r.orderRef}</code>
                      </td>
                      <td>{r.orderDate}</td>
                      <td>{formatOrderAmount(r.amountVnd)}</td>
                      <td>{r.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div role="tabpanel">
            {editing ? (
              <label className="th-admin-product-detail__field">
                <span className="th-admin-product-detail__label">Ghi chú nội bộ</span>
                <textarea
                  className="th-admin-product-detail__input th-admin-material-detail__textarea"
                  value={draft.note}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, note: e.target.value } : d))
                  }
                  rows={12}
                  placeholder="Chính sách giá, giao hàng, hạn thanh toán riêng…"
                />
              </label>
            ) : (
              <div className="th-admin-product-detail__desc-panel">
                {draft.note ? (
                  <p className="th-admin-material-detail__note-plain">{draft.note}</p>
                ) : (
                  <p className="th-admin-product-detail__tab-lead">Chưa có ghi chú.</p>
                )}
                <ul className="th-admin-agency-detail__policy-list">
                  <li>Kiểm tra hạn mức trước khi xác nhận SO có giá trị lớn.</li>
                  <li>Ưu tiên giao hàng theo khung đã thỏa thuận trong hợp đồng khung.</li>
                  <li>Thu hồi nợ quá hạn: nhắc NVBH phụ trách và kế toán theo quy trình thu nợ.</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <dialog
        ref={confirmRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${fid}-del-title`}
        aria-describedby={`${fid}-del-desc`}
        onClose={() => setPendingDelete(false)}
      >
        <div className="th-dlg__panel">
          <button
            type="button"
            className="th-dlg__close"
            onClick={() => setPendingDelete(false)}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
          <div className="th-dlg__confirm-body">
            <div className="th-dlg__confirm-icon th-dlg__confirm-icon--danger" aria-hidden>
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h2 id={`${fid}-del-title`} className="th-dlg__confirm-title">
              Xóa khách sỉ?
            </h2>
            <p id={`${fid}-del-desc`} className="th-dlg__confirm-desc">
              Hồ sơ <strong>{draft.shortName}</strong> sẽ bị xóa. Kiểm tra công nợ và hợp đồng trước khi
              xóa thật.
            </p>
          </div>
          <div className="th-dlg__footer th-dlg__footer--confirm">
            <button
              type="button"
              className="th-admin-product-detail__btn-ghost"
              onClick={() => setPendingDelete(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-product-detail__btn-danger"
              onClick={handleDelete}
            >
              Xóa vĩnh viễn
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={toggleRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${fid}-tg-title`}
        onClose={() => {
          setToggleErr(null)
          setPendingApiToggle(false)
        }}
      >
        <div className="th-dlg__panel">
          <button
            type="button"
            className="th-dlg__close"
            onClick={() => {
              setToggleErr(null)
              setPendingApiToggle(false)
            }}
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined" aria-hidden>
              close
            </span>
          </button>
          <div className="th-dlg__confirm-body">
            <div
              className={`th-dlg__confirm-icon th-dlg__confirm-icon--${serverAgency?.isActive ? 'warn' : 'safe'}`}
              aria-hidden
            >
              <span className="material-symbols-outlined">
                {serverAgency?.isActive ? 'lock' : 'lock_open'}
              </span>
            </div>
            <h2 id={`${fid}-tg-title`} className="th-dlg__confirm-title">
              {serverAgency?.isActive
                ? 'Khóa đại lý — tạm ngừng mở đơn?'
                : 'Mở lại đại lý cho phép bán?'}
            </h2>
            <p className="th-dlg__confirm-desc">
              {serverAgency?.isActive
                ? 'Cân nhắc đơn hàng và công nợ đang mở.'
                : 'Đại lý sẽ hiển thị trở lại trong luồng bán sỉ khi tích hợp.'}
            </p>
          </div>
          {toggleErr && (
            <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 1.5rem' }}>
              {toggleErr}
            </p>
          )}
          <div className="th-dlg__footer th-dlg__footer--confirm">
            <button
              type="button"
              className="th-admin-product-detail__btn-ghost"
              onClick={() => {
                setToggleErr(null)
                setPendingApiToggle(false)
              }}
              disabled={toggling}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-product-detail__btn-primary"
              onClick={() => void doApiToggle()}
              disabled={toggling}
            >
              {toggling ? 'Đang xử lý…' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
