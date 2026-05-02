import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  AppFilterActions,
  AppFilterBar,
  AppFilterClearButton,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AdminUsersPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

const STAFF_ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Quản trị' },
  { value: 'DIRECTOR', label: 'Giám đốc' },
  { value: 'SELLER', label: 'Kinh doanh' },
  { value: 'PRODUCTION', label: 'Sản xuất' },
  { value: 'ACCOUNTANT', label: 'Kế toán' },
] as const

type StaffRole = (typeof STAFF_ROLE_OPTIONS)[number]['value']

type StaffRow = {
  id: string
  username: string
  fullName: string
  email: string
  role: StaffRole
  isActive: boolean
  createdAt: string
}

type UserListResponse = {
  content: Array<{
    id: string
    username: string
    email: string
    fullName: string
    role: string
    isActive: boolean
    createdAt: string
  }>
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type AdminUserDto = {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  createdAt: string
}

function mapUserDtoToRow(u: AdminUserDto): StaffRow {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    role:
      STAFF_ROLE_OPTIONS.find((r) => r.value === u.role.toUpperCase())?.value ?? 'SELLER',
    isActive: u.isActive,
    createdAt: u.createdAt,
  }
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const

function roleLabel(role: StaffRole): string {
  return STAFF_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

type PendingConfirm =
  | null
  | { kind: 'resetPassword'; email: string; name: string }
  | { kind: 'toggleActive'; userId: string; name: string; newActive: boolean }
  | { kind: 'saveDetail' }

type Notice = {
  type: 'success' | 'error'
  message: string
}

/**
 * Nhân sự & quyền — bảng danh sách, gán role, khóa/mở, reset mật khẩu.
 * @see documents/ui/admin_sidebar.md §2
 */
export function AdminUsersPage() {
  const formId = useId()
  const addDialogRef = useRef<HTMLDialogElement>(null)
  const detailDialogRef = useRef<HTMLDialogElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const [rows, setRows] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detailEdit, setDetailEdit] = useState(false)
  const [detailDraft, setDetailDraft] = useState<StaffRow | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null)
  const [draft, setDraft] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'SELLER' as StaffRole,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'' | StaffRole>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<number>(15)
  const [reloadNonce, setReloadNonce] = useState(0)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [confirmWorking, setConfirmWorking] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const fetchUsers = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setRows([])
      setTotalElements(0)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const q = new URLSearchParams()
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      if (filterRole) q.set('role', filterRole)
      if (filterStatus !== 'all') q.set('status', filterStatus === 'active' ? 'true' : 'false')

      const res = await fetch(`${API_BASE_URL}/api/admin/users?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })

      const envelope = (await res.json()) as ApiEnvelope<UserListResponse>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách nhân sự')
      }

      const data = envelope.data
      setRows(data.content.map((u) => mapUserDtoToRow(u)))
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách nhân sự')
      setRows([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [filterRole, filterStatus, pageIndex, pageSize])

  const applyToggleActive = useCallback((userId: string, newActive: boolean) => {
    setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, isActive: newActive } : r)))
  }, [])

  const requestPasswordReset = useCallback((email: string) => {
    // Gắn API gửi email reset
    void email
  }, [])

  const openUserDetail = useCallback(
    (id: string) => {
      const u = rows.find((r) => r.id === id)
      if (!u) return
      setSelectedUserId(id)
      setDetailDraft({ ...u })
      setDetailEdit(false)
    },
    [rows],
  )

  const closeUserDetail = useCallback(() => {
    setSelectedUserId(null)
    setDetailDraft(null)
    setDetailEdit(false)
  }, [])

  const handleConfirmAction = useCallback(async () => {
    if (!pendingConfirm || confirmWorking) return

    if (pendingConfirm.kind === 'resetPassword') {
      requestPasswordReset(pendingConfirm.email)
      setPendingConfirm(null)
      return
    }

    if (pendingConfirm.kind === 'toggleActive') {
      applyToggleActive(pendingConfirm.userId, pendingConfirm.newActive)
      setPendingConfirm(null)
      return
    }

    if (pendingConfirm.kind !== 'saveDetail') {
      setPendingConfirm(null)
      return
    }

    if (!selectedUserId || !detailDraft) {
      setPendingConfirm(null)
      return
    }

    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
      setPendingConfirm(null)
      return
    }

    const email = detailDraft.email.trim()
    const fullName = detailDraft.fullName.trim()
    if (!email || !fullName) {
      setNotice({ type: 'error', message: 'Vui lòng nhập đủ họ tên và email.' })
      setPendingConfirm(null)
      return
    }

    setConfirmWorking(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${encodeURIComponent(selectedUserId)}`, {
        method: 'PUT',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify({
          email,
          fullName,
          role: detailDraft.role,
        }),
      })

      const envelope = (await res.json()) as ApiEnvelope<AdminUserDto>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Cập nhật nhân sự thất bại')
      }

      const next = mapUserDtoToRow(envelope.data)
      setRows((prev) => prev.map((r) => (r.id === selectedUserId ? next : r)))
      setDetailDraft(next)
      setDetailEdit(false)
      setNotice({ type: 'success', message: envelope.message || 'Đã cập nhật thông tin nhân sự.' })
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể cập nhật nhân sự',
      })
    } finally {
      setConfirmWorking(false)
      setPendingConfirm(null)
    }
  }, [
    pendingConfirm,
    confirmWorking,
    selectedUserId,
    detailDraft,
    requestPasswordReset,
    applyToggleActive,
  ])

  const handleConfirmDialogClose = useCallback(() => {
    setPendingConfirm(null)
    setConfirmWorking(false)
  }, [])

  useEffect(() => {
    if (!selectedUserId || detailEdit) return
    const u = rows.find((r) => r.id === selectedUserId)
    if (u) setDetailDraft({ ...u })
  }, [rows, selectedUserId, detailEdit])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers, reloadNonce])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(t)
  }, [notice])

  const filteredRows = rows.filter((r) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.username.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, filterRole, filterStatus])

  useEffect(() => {
    const el = addDialogRef.current
    if (!el) return
    if (addOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [addOpen])

  useEffect(() => {
    const el = detailDialogRef.current
    if (!el) return
    if (selectedUserId) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [selectedUserId])

  useEffect(() => {
    const el = confirmDialogRef.current
    if (!el) return
    if (pendingConfirm) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [pendingConfirm])

  const filtersApplied = filterRole !== '' || filterStatus !== 'all'

  const clearFilters = () => {
    setFilterRole('')
    setFilterStatus('all')
  }

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const accessToken = getAccessToken()
    if (!accessToken) {
      setNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' })
      return
    }
    if (!draft.username.trim() || !draft.fullName.trim() || !draft.email.trim() || !draft.password) return

    setAddSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify({
          username: draft.username.trim(),
          email: draft.email.trim(),
          password: draft.password,
          fullName: draft.fullName.trim(),
          role: draft.role,
        }),
      },
      )

      const envelope = (await res.json()) as ApiEnvelope<{
        id: string
        username: string
        email: string
        fullName: string
        role: string
        isActive: boolean
        createdAt: string
      }>

      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Tạo nhân sự thất bại')
      }

      setNotice({ type: 'success', message: `Đã tạo tài khoản ${envelope.data.username} thành công.` })
      setDraft({ username: '', fullName: '', email: '', password: '', role: 'SELLER' })
      setAddOpen(false)
      setPageIndex(0)
      setReloadNonce((n) => n + 1)
    } catch (err) {
      setNotice({
        type: 'error',
        message: err instanceof Error ? err.message : 'Không thể tạo nhân sự',
      })
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleAddDialogClose = () => {
    setAddOpen(false)
    setDraft({ username: '', fullName: '', email: '', password: '', role: 'SELLER' })
  }

  return (
    <div className="th-admin-users">
      <header className="th-admin-users__header">
        <div className="th-admin-users__heading">
          <h1 className="th-admin-users__title">Nhân sự &amp; quyền</h1>
          {loadError ? <p className="th-admin-users__api-error">{loadError}</p> : null}
        </div>
        <div className="th-admin-users__toolbar">
          <button
            type="button"
            className="th-admin-users__btn-primary"
            onClick={() => setAddOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={addOpen}
          >
            <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>
              person_add
            </span>
            Thêm nhân sự
          </button>
        </div>
      </header>
      {notice ? (
        <div
          className={`th-admin-users-notice th-admin-users-notice--${notice.type}`}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      ) : null}

      {/* ── Dialog: Thêm nhân sự ── */}
      <dialog
        ref={addDialogRef}
        className="th-dlg"
        aria-labelledby={`${formId}-add-title`}
        onClose={handleAddDialogClose}
        onClick={(e) => { if (e.target === addDialogRef.current) addDialogRef.current?.close() }}
      >
        <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
          <div className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>person_add</span>
            </div>
            <h2 id={`${formId}-add-title`} className="th-dlg__title">Cấp tài khoản mới</h2>
            <button type="button" className="th-dlg__close" onClick={() => addDialogRef.current?.close()} aria-label="Đóng">
              <span className="material-symbols-outlined" aria-hidden>close</span>
            </button>
          </div>
          <form id={`${formId}-form`} onSubmit={handleAddSubmit}>
            <div className="th-dlg__body">
              <label className="th-admin-users-field">
                <span className="th-admin-users-field__label">Username</span>
                <input
                  className="th-admin-users-field__input"
                  name="username"
                  autoComplete="username"
                  value={draft.username}
                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                  placeholder="vd. annv"
                  required
                />
              </label>
              <label className="th-admin-users-field">
                <span className="th-admin-users-field__label">Họ và tên</span>
                <input className="th-admin-users-field__input" name="fullName" autoComplete="name"
                  value={draft.fullName} onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  placeholder="Ví dụ: Nguyễn Văn A" required />
              </label>
              <label className="th-admin-users-field">
                <span className="th-admin-users-field__label">Email đăng nhập</span>
                <input className="th-admin-users-field__input" type="email" name="email" autoComplete="email"
                  value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  placeholder="ten@congty.com" required />
              </label>
              <label className="th-admin-users-field">
                <span className="th-admin-users-field__label">Mật khẩu tạm</span>
                <input
                  className="th-admin-users-field__input"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                />
              </label>
              <label className="th-admin-users-field">
                <span className="th-admin-users-field__label">Vai trò</span>
                <select className="th-admin-users-field__select" name="role" value={draft.role}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as StaffRole }))}>
                  {STAFF_ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
            <div className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                onClick={() => addDialogRef.current?.close()}
                disabled={addSubmitting}
              >
                Hủy
              </button>
              <button type="submit" className="th-admin-users__btn-primary" disabled={addSubmitting}>
                <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>save</span>
                {addSubmitting ? 'Đang tạo...' : 'Lưu & cấp quyền'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ── Dialog: Chi tiết nhân sự ── */}
      <dialog
        ref={detailDialogRef}
        className="th-dlg"
        aria-labelledby={`${formId}-detail-title`}
        onClose={closeUserDetail}
        onClick={(e) => { if (e.target === detailDialogRef.current) detailDialogRef.current?.close() }}
      >
        {selectedUserId && detailDraft ? (
          <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
            <div className="th-dlg__head th-dlg__head--detail">
              <div className="th-dlg__avatar">{getInitials(detailDraft.fullName)}</div>
              <div className="th-dlg__identity">
                <h2 id={`${formId}-detail-title`} className="th-dlg__identity-name">{detailDraft.fullName}</h2>
                <span className="th-dlg__identity-email">{detailDraft.email}</span>
              </div>
              <button type="button" className="th-dlg__close" onClick={() => detailDialogRef.current?.close()} aria-label="Đóng">
                <span className="material-symbols-outlined" aria-hidden>close</span>
              </button>
            </div>

            {!detailEdit ? (
              <>
                <div className="th-dlg__body">
                  <dl className="th-admin-users-detail__dl">
                    <div className="th-admin-users-detail__row">
                      <dt>Vai trò</dt>
                      <dd><span className="th-admin-badge th-admin-badge--role">{roleLabel(detailDraft.role)}</span></dd>
                    </div>
                    <div className="th-admin-users-detail__row">
                      <dt>Trạng thái</dt>
                      <dd>
                        <span className={`th-admin-badge ${detailDraft.isActive ? 'th-admin-badge--active' : 'th-admin-badge--locked'}`}>
                          <span className="th-admin-badge__dot" aria-hidden />
                          {detailDraft.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                      </dd>
                    </div>
                    <div className="th-admin-users-detail__row">
                      <dt>ID</dt>
                      <dd><span className="th-admin-users-table__email">#{detailDraft.id}</span></dd>
                    </div>
                  </dl>
                </div>
                <div className="th-dlg__footer">
                  <button type="button" className="th-admin-users__btn-ghost"
                    onClick={() => detailDialogRef.current?.close()}>Đóng</button>
                  <button type="button" className="th-admin-users__btn-primary" onClick={() => setDetailEdit(true)}>
                    <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>edit</span>
                    Chỉnh sửa
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setPendingConfirm({ kind: 'saveDetail' }) }}>
                <div className="th-dlg__body">
                  <label className="th-admin-users-field">
                    <span className="th-admin-users-field__label">Username</span>
                    <input
                      className="th-admin-users-field__input"
                      value={detailDraft.username}
                      readOnly
                      disabled
                      aria-readonly
                    />
                  </label>
                  <label className="th-admin-users-field">
                    <span className="th-admin-users-field__label">Họ và tên</span>
                    <input className="th-admin-users-field__input" value={detailDraft.fullName}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, fullName: e.target.value } : d))} required />
                  </label>
                  <label className="th-admin-users-field">
                    <span className="th-admin-users-field__label">Email</span>
                    <input className="th-admin-users-field__input" type="email" value={detailDraft.email}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, email: e.target.value } : d))} required />
                  </label>
                  <label className="th-admin-users-field">
                    <span className="th-admin-users-field__label">Vai trò</span>
                    <select className="th-admin-users-field__select" value={detailDraft.role}
                      onChange={(e) => setDetailDraft((d) => (d ? { ...d, role: e.target.value as StaffRole } : d))}>
                      {STAFF_ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </label>
                  <div className="th-admin-users-field th-admin-users-field--readonly-status">
                    <span className="th-admin-users-field__label">Trạng thái đăng nhập</span>
                    <div className="th-admin-users-field__readonly-value">
                      <span className={`th-admin-badge ${detailDraft.isActive ? 'th-admin-badge--active' : 'th-admin-badge--locked'}`}>
                        <span className="th-admin-badge__dot" aria-hidden />
                        {detailDraft.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="th-dlg__footer">
                  <button type="button" className="th-admin-users__btn-ghost" onClick={() => {
                    const u = rows.find((r) => r.id === selectedUserId)
                    if (u) setDetailDraft({ ...u })
                    setDetailEdit(false)
                  }}>Hủy</button>
                  <button type="submit" className="th-admin-users__btn-primary">
                    <span className="material-symbols-outlined th-admin-users__btn-icon" aria-hidden>save</span>
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : null}
      </dialog>

      {/* ── Dialog: Xác nhận ── */}
      <dialog
        ref={confirmDialogRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${formId}-confirm-title`}
        aria-describedby={pendingConfirm ? `${formId}-confirm-desc` : undefined}
        onClose={handleConfirmDialogClose}
        onClick={(e) => { if (e.target === confirmDialogRef.current) confirmDialogRef.current?.close() }}
      >
        {pendingConfirm ? (
          <div className="th-dlg__panel" onClick={(e) => e.stopPropagation()}>
            <div className="th-dlg__body th-dlg__body--confirm">
              <div className={`th-dlg__confirm-icon ${
                pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive ? 'th-dlg__confirm-icon--danger'
                : pendingConfirm.kind === 'toggleActive' && pendingConfirm.newActive ? 'th-dlg__confirm-icon--success'
                : pendingConfirm.kind === 'resetPassword' ? 'th-dlg__confirm-icon--warn'
                : 'th-dlg__confirm-icon--info'
              }`}>
                <span className="material-symbols-outlined" aria-hidden>
                  {pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive && 'lock'}
                  {pendingConfirm.kind === 'toggleActive' && pendingConfirm.newActive && 'lock_open'}
                  {pendingConfirm.kind === 'resetPassword' && 'mail'}
                  {pendingConfirm.kind === 'saveDetail' && 'save'}
                </span>
              </div>
              <h2 id={`${formId}-confirm-title`} className="th-dlg__confirm-title">
                {pendingConfirm.kind === 'resetPassword' && 'Gửi email đặt lại mật khẩu?'}
                {pendingConfirm.kind === 'toggleActive' && (pendingConfirm.newActive ? 'Kích hoạt tài khoản?' : 'Khóa tài khoản?')}
                {pendingConfirm.kind === 'saveDetail' && 'Lưu thay đổi?'}
              </h2>
              <p id={`${formId}-confirm-desc`} className="th-dlg__confirm-desc">
                {pendingConfirm.kind === 'resetPassword' && (
                  <>Gửi liên kết đặt lại mật khẩu tới <strong>{pendingConfirm.email}</strong><br />({pendingConfirm.name}).</>
                )}
                {pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive && (
                  <><strong>{pendingConfirm.name}</strong> sẽ không thể đăng nhập cho đến khi được mở lại.</>
                )}
                {pendingConfirm.kind === 'toggleActive' && pendingConfirm.newActive && (
                  <>Cho phép <strong>{pendingConfirm.name}</strong> đăng nhập trở lại.</>
                )}
                {pendingConfirm.kind === 'saveDetail' && <>Cập nhật thông tin nhân sự đã chỉnh sửa lên hệ thống.</>}
              </p>
            </div>
            <div className="th-dlg__footer th-dlg__footer--confirm">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                onClick={() => confirmDialogRef.current?.close()}
                disabled={confirmWorking}
              >
                Hủy
              </button>
              <button
                type="button"
                className={pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive
                  ? 'th-admin-users__btn-danger'
                  : 'th-admin-users__btn-primary'}
                onClick={() => void handleConfirmAction()}
                disabled={confirmWorking}
              >
                {confirmWorking && pendingConfirm.kind === 'saveDetail'
                  ? 'Đang lưu...'
                  : pendingConfirm.kind === 'toggleActive' && !pendingConfirm.newActive
                    ? 'Khóa tài khoản'
                    : 'Xác nhận'}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <div className="th-admin-users-table-wrap">
        <div className="th-admin-users-table-head">
          <AppFilterBar className="th-admin-users-table-bar">
            <AppFilterField search className="th-admin-users-search">
              <span className="th-admin-users-visually-hidden">Tìm theo tên hoặc email</span>
              <AppFilterInput
                value={searchQuery}
                onChangeValue={setSearchQuery}
                placeholder="Tìm theo tên, email…"
                autoComplete="off"
              />
            </AppFilterField>

            <AppFilterField label="Vai trò" className="th-admin-users-filter-field">
              <AppFilterSelect
                value={filterRole}
                onChangeValue={(value) => setFilterRole(value as '' | StaffRole)}
                options={[
                  { value: '', label: 'Tất cả' },
                  ...STAFF_ROLE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
                ]}
              />
            </AppFilterField>

            <AppFilterField label="Trạng thái" className="th-admin-users-filter-field">
              <AppFilterSelect
                value={filterStatus}
                onChangeValue={(value) => setFilterStatus(value as 'all' | 'active' | 'inactive')}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Đã khóa' },
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

        <div className="th-admin-users-table-scroll">
          <table className="th-admin-users-table" aria-label="Bảng danh sách nhân sự">
            <thead>
              <tr>
                <th scope="col">Họ tên</th>
                <th scope="col">Email</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="th-admin-users-table__empty">
                    Đang tải danh sách nhân sự...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="th-admin-users-table__empty">
                    Không có nhân sự phù hợp. Thử đổi từ khóa hoặc bộ lọc.
                  </td>
                </tr>
              ) : null}
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className={`th-admin-users-table__row${selectedUserId === row.id ? ' th-admin-users-table__row--selected' : ''}`}
                  onClick={() => openUserDetail(row.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openUserDetail(row.id)
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Xem chi tiết ${row.fullName}`}
                >
                  <td data-label="Họ tên">{row.fullName}</td>
                  <td data-label="Email">
                    <span className="th-admin-users-table__email">{row.email}</span>
                  </td>
                  <td data-label="Vai trò">{roleLabel(row.role)}</td>
                  <td data-label="Trạng thái">
                    <button
                      type="button"
                      className={`th-admin-toggle${row.isActive ? ' th-admin-toggle--on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingConfirm({
                          kind: 'toggleActive',
                          userId: row.id,
                          name: row.fullName,
                          newActive: !row.isActive,
                        })
                      }}
                      aria-pressed={row.isActive}
                      aria-label={row.isActive ? `Khóa tài khoản ${row.fullName}` : `Mở tài khoản ${row.fullName}`}
                    >
                      <span className="th-admin-toggle__track">
                        <span className="th-admin-toggle__thumb" />
                      </span>
                      <span className="th-admin-toggle__text">{row.isActive ? 'Đang hoạt động' : 'Đã khóa'}</span>
                    </button>
                  </td>
                  <td data-label="Thao tác">
                    <button
                      type="button"
                      className="th-admin-users__btn-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingConfirm({
                          kind: 'resetPassword',
                          email: row.email,
                          name: row.fullName,
                        })
                      }}
                    >
                      Reset mật khẩu (email)
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AppPagination
          className="th-admin-users-pagination"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize)
            setPageIndex(0)
          }}
        />
      </div>
    </div>
  )
}
