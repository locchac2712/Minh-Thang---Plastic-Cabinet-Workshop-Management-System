import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AuthApiError,
  changeMyPassword,
  fetchMeProfile,
  type MeData,
  updateMeProfile,
} from '../auth/authApi'
import { getAccessToken, getTokenType, syncAuthIdentityFromMe } from '../auth/storage'
import './AccountSettingsPage.css'

const MIN_PASSWORD = 6

function roleLabelVi(role: string): string {
  const r = role.trim().toUpperCase().replace(/^ROLE_/, '')
  switch (r) {
    case 'ADMIN':
      return 'Quản trị'
    case 'SELLER':
      return 'Kinh doanh'
    case 'DIRECTOR':
      return 'Giám đốc'
    case 'PRODUCTION':
      return 'Sản xuất'
    case 'ACCOUNTANT':
      return 'Kế toán'
    default:
      return role
  }
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

type PasswordInputProps = {
  id: string
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  show: boolean
  disabled?: boolean
  autoComplete: string
  hint?: string
  error?: string
}

function PasswordInput({
  id,
  label,
  name,
  value,
  onChange,
  show,
  disabled,
  autoComplete,
  hint,
  error,
}: PasswordInputProps) {
  return (
    <label className="th-account-field" htmlFor={id}>
      <span className="th-account-field__label">{label}</span>
      <input
        id={id}
        className={`th-account-field__input${error ? ' th-account-field__input--error' : ''}`}
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
      />
      {hint ? <span className="th-account-field__hint">{hint}</span> : null}
      {error ? (
        <span className="th-account-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function AccountSettingsPage() {
  const [profile, setProfile] = useState<MeData | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [profileFieldError, setProfileFieldError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({})
  const [passwordSaving, setPasswordSaving] = useState(false)

  const profileDirty = useMemo(() => {
    if (!profile) return false
    return fullName.trim() !== profile.fullName.trim()
  }, [fullName, profile])

  const loadProfile = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const me = await fetchMeProfile({ accessToken, tokenType: getTokenType() })
      setProfile(me)
      setFullName(me.fullName)
    } catch (err) {
      setLoadError(err instanceof AuthApiError ? err.message : 'Không tải được hồ sơ.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setProfileNotice(null)
    setProfileFieldError(null)

    const trimmed = fullName.trim()
    if (!trimmed) {
      setProfileFieldError('Họ tên không được để trống.')
      return
    }
    if (!profileDirty) return

    const accessToken = getAccessToken()
    if (!accessToken) {
      setProfileNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn.' })
      return
    }

    setProfileSaving(true)
    try {
      const updated = await updateMeProfile({
        accessToken,
        tokenType: getTokenType(),
        fullName: trimmed,
      })
      setProfile(updated)
      setFullName(updated.fullName)
      syncAuthIdentityFromMe({ role: updated.role, fullName: updated.fullName })
      setProfileNotice({ type: 'success', message: 'Đã cập nhật họ tên.' })
    } catch (err) {
      if (err instanceof AuthApiError) {
        const fe = err.fieldErrors?.fullName?.trim()
        if (fe) setProfileFieldError(fe)
        else setProfileNotice({ type: 'error', message: err.message })
      } else {
        setProfileNotice({ type: 'error', message: 'Không cập nhật được hồ sơ.' })
      }
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordNotice(null)
    setPasswordFieldErrors({})

    const errors: Record<string, string> = {}
    if (!currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
    if (!newPassword) errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
    else if (newPassword.length < MIN_PASSWORD) {
      errors.newPassword = `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD} ký tự.`
    }
    if (!confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
    else if (newPassword !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp.'

    if (Object.keys(errors).length > 0) {
      setPasswordFieldErrors(errors)
      return
    }

    const accessToken = getAccessToken()
    if (!accessToken) {
      setPasswordNotice({ type: 'error', message: 'Phiên đăng nhập hết hạn.' })
      return
    }

    setPasswordSaving(true)
    try {
      const msg = await changeMyPassword({
        accessToken,
        tokenType: getTokenType(),
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordNotice({ type: 'success', message: msg })
    } catch (err) {
      if (err instanceof AuthApiError) {
        const next: Record<string, string> = {}
        if (err.fieldErrors?.currentPassword) next.currentPassword = err.fieldErrors.currentPassword
        if (err.fieldErrors?.newPassword) next.newPassword = err.fieldErrors.newPassword
        if (Object.keys(next).length > 0) {
          setPasswordFieldErrors(next)
        } else {
          setPasswordNotice({ type: 'error', message: err.message })
        }
      } else {
        setPasswordNotice({ type: 'error', message: 'Không đổi được mật khẩu.' })
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="th-account-page" aria-busy="true" aria-live="polite">
        <div className="th-account-page__header th-account-skeleton-block" />
        <div className="th-account-hero th-account-skeleton-block th-account-skeleton-block--hero" />
        <div className="th-account-stack">
          <div className="th-account-card th-account-skeleton-block th-account-skeleton-block--card" />
          <div className="th-account-card th-account-skeleton-block th-account-skeleton-block--card" />
        </div>
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="th-account-page">
        <div className="th-account-banner th-account-banner--error" role="alert">
          <span className="material-symbols-outlined" aria-hidden>
            error
          </span>
          <div>
            <strong>Không tải được hồ sơ</strong>
            <p>{loadError ?? 'Vui lòng thử lại sau.'}</p>
          </div>
          <button type="button" className="th-account-btn th-account-btn--ghost" onClick={() => void loadProfile()}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  const displayName = profile.fullName.trim() || profile.username

  return (
    <div className="th-account-page">
      <header className="th-account-page__header">
        <h1 className="th-account-page__title">Tài khoản</h1>
        <p className="th-account-page__lead">Quản lý thông tin hiển thị và mật khẩu đăng nhập của bạn.</p>
      </header>

      <section className="th-account-hero" aria-label="Tóm tắt tài khoản">
        <div className="th-account-hero__avatar" aria-hidden>
          {initialsFromName(displayName)}
        </div>
        <div className="th-account-hero__body">
          <div className="th-account-hero__top">
            <h2 className="th-account-hero__name">{displayName}</h2>
            <span className="th-account-hero__role">{roleLabelVi(profile.role)}</span>
          </div>
          <ul className="th-account-hero__meta">
            <li>
              <span className="material-symbols-outlined" aria-hidden>
                badge
              </span>
              {profile.username}
            </li>
            {profile.email ? (
              <li>
                <span className="material-symbols-outlined" aria-hidden>
                  mail
                </span>
                {profile.email}
              </li>
            ) : null}
          </ul>
        </div>
      </section>

      <div className="th-account-stack">
        <section className="th-account-card" aria-labelledby="account-profile-title">
          <header className="th-account-card__head">
            <span className="th-account-card__icon" aria-hidden>
              <span className="material-symbols-outlined">person</span>
            </span>
            <div>
              <h2 id="account-profile-title" className="th-account-card__title">
                Hồ sơ hiển thị
              </h2>
              <p className="th-account-card__subtitle">Tên dùng trên hệ thống — email do quản trị quản lý.</p>
            </div>
          </header>

          <form className="th-account-form" onSubmit={handleProfileSubmit}>
            <label className="th-account-field" htmlFor="account-full-name">
              <span className="th-account-field__label">Họ và tên</span>
              <input
                id="account-full-name"
                className={`th-account-field__input${profileFieldError ? ' th-account-field__input--error' : ''}`}
                type="text"
                name="fullName"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  setProfileNotice(null)
                  setProfileFieldError(null)
                }}
                maxLength={100}
                autoComplete="name"
                disabled={profileSaving}
                placeholder="Nhập họ tên đầy đủ"
              />
              {profileFieldError ? (
                <span className="th-account-field__error" role="alert">
                  {profileFieldError}
                </span>
              ) : (
                <span className="th-account-field__hint">Tối đa 100 ký tự.</span>
              )}
            </label>

            {profileNotice ? (
              <div
                className={`th-account-banner th-account-banner--${profileNotice.type}`}
                role={profileNotice.type === 'error' ? 'alert' : 'status'}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {profileNotice.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{profileNotice.message}</span>
              </div>
            ) : null}

            <footer className="th-account-card__foot">
              <button
                type="button"
                className="th-account-btn th-account-btn--ghost"
                disabled={profileSaving || !profileDirty}
                onClick={() => {
                  setFullName(profile.fullName)
                  setProfileNotice(null)
                  setProfileFieldError(null)
                }}
              >
                Hoàn tác
              </button>
              <button
                type="submit"
                className="th-account-btn th-account-btn--primary"
                disabled={profileSaving || !profileDirty}
              >
                {profileSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </footer>
          </form>
        </section>

        <section className="th-account-card" aria-labelledby="account-password-title">
          <header className="th-account-card__head">
            <span className="th-account-card__icon th-account-card__icon--lock" aria-hidden>
              <span className="material-symbols-outlined">lock</span>
            </span>
            <div>
              <h2 id="account-password-title" className="th-account-card__title">
                Bảo mật
              </h2>
              <p className="th-account-card__subtitle">
                Đổi mật khẩu đăng nhập. Quên mật khẩu?{' '}
                <Link className="th-account-link" to="/forgot-password">
                  Gửi email đặt lại
                </Link>
              </p>
            </div>
          </header>

          <form className="th-account-form" onSubmit={handlePasswordSubmit}>
            <div className="th-account-form__pw-toolbar">
              <span className="th-account-form__pw-label">Mật khẩu</span>
              <button
                type="button"
                className="th-account-btn th-account-btn--text"
                onClick={() => setShowPasswords((v) => !v)}
                disabled={passwordSaving}
              >
                {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
            </div>

            <PasswordInput
              id="account-current-password"
              label="Mật khẩu hiện tại"
              name="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showPasswords}
              disabled={passwordSaving}
              autoComplete="current-password"
              error={passwordFieldErrors.currentPassword}
            />

            <PasswordInput
              id="account-new-password"
              label="Mật khẩu mới"
              name="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              show={showPasswords}
              disabled={passwordSaving}
              autoComplete="new-password"
              hint={`Tối thiểu ${MIN_PASSWORD} ký tự.`}
              error={passwordFieldErrors.newPassword}
            />

            <PasswordInput
              id="account-confirm-password"
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPasswords}
              disabled={passwordSaving}
              autoComplete="new-password"
              error={passwordFieldErrors.confirmPassword}
            />

            {passwordNotice ? (
              <div
                className={`th-account-banner th-account-banner--${passwordNotice.type}`}
                role={passwordNotice.type === 'error' ? 'alert' : 'status'}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {passwordNotice.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{passwordNotice.message}</span>
              </div>
            ) : null}

            <footer className="th-account-card__foot">
              <button
                type="button"
                className="th-account-btn th-account-btn--ghost"
                disabled={passwordSaving}
                onClick={() => {
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordNotice(null)
                  setPasswordFieldErrors({})
                }}
              >
                Xóa form
              </button>
              <button type="submit" className="th-account-btn th-account-btn--primary" disabled={passwordSaving}>
                {passwordSaving ? 'Đang đổi…' : 'Cập nhật mật khẩu'}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </div>
  )
}
