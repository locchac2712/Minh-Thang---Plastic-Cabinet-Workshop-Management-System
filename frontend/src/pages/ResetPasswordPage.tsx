import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { App } from 'antd'
import { AuthApiError, resetPasswordWithApi } from '../auth/authApi'
import { appLogoUrl } from '../branding/appLogo'
import { homePathForActor, getStoredActor, isAuthenticated } from '../auth/storage'
import './LoginPage.css'

const MIN_PW = 6

function parseTokenFromSearch(searchParams: URLSearchParams): string {
  const raw = searchParams.get('token')
  if (!raw || !raw.trim()) return ''
  try {
    return decodeURIComponent(raw.trim())
  } catch {
    return raw.trim()
  }
}

export function ResetPasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => parseTokenFromSearch(searchParams), [searchParams])

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])

  const tokenMissing = !token

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (tokenMissing) return

    setError(null)
    setFieldError(null)

    const pw = password
    if (pw.length < MIN_PW) {
      setError(null)
      setFieldError(`Mật khẩu mới phải có ít nhất ${MIN_PW} ký tự.`)
      return
    }
    if (pw !== confirm) {
      setFieldError(null)
      setError('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    setSubmitting(true)
    try {
      const msg = await resetPasswordWithApi({ token, newPassword: pw })
      message.success(msg)
      navigate('/login', { replace: true, state: { passwordResetOk: true } })
    } catch (err) {
      if (err instanceof AuthApiError) {
        const pe = err.fieldErrors?.newPassword?.trim()
        if (pe) {
          setFieldError(pe)
          setError(null)
        } else {
          setFieldError(null)
          setError(err.message)
        }
      } else {
        setError('Không kết nối được máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__layout">
        <aside className="login-page__hero" aria-label="Giới thiệu dự án">
          <div className="login-page__hero-bg" aria-hidden />
          <div className="login-page__hero-content">
            <div className="login-page__hero-logo" aria-hidden>
              <img
                className="login-page__hero-logo-img"
                src={appLogoUrl}
                alt=""
                width={52}
                height={52}
              />
            </div>
            <h1 className="login-page__hero-title">Minh Thắng</h1>
            <p className="login-page__hero-kicker">Đặt lại mật khẩu</p>
            <p className="login-page__hero-lead">Chọn mật khẩu mới đủ mạnh và dễ nhớ với bạn.</p>
          </div>
        </aside>

        <div className="login-page__form-column">
          <main className="login-page__main">
            <section className="login-card" aria-labelledby="reset-title">
              <header className="login-card__header">
                <h2 id="reset-title" className="login-card__title">
                  Đặt lại mật khẩu
                </h2>
                <p className="login-card__subtitle">Mật khẩu tối thiểu {MIN_PW} ký tự.</p>
              </header>

              {tokenMissing ? (
                <div className="login-form__error" role="alert">
                  <p className="login-muted-para">Liên kết không hợp lệ hoặc thiếu mã xác thực.</p>
                  <p className="login-muted-para">
                    <Link className="login-form__link" to="/forgot-password">
                      Yêu cầu gửi lại email
                    </Link>
                    {' · '}
                    <Link className="login-form__link" to="/login">
                      Đăng nhập
                    </Link>
                  </p>
                </div>
              ) : (
                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  {error ? (
                    <div className="login-form__error" role="alert">
                      {error}
                    </div>
                  ) : null}

                  <label className="login-field">
                    <span className="login-field__label">Mật khẩu mới</span>
                    <div className="login-password-field">
                      <input
                        className="login-field__input login-password-field__input"
                        type={showPw ? 'text' : 'password'}
                        name="newPassword"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={submitting}
                        placeholder={`Tối thiểu ${MIN_PW} ký tự`}
                        aria-describedby="reset-pw-hint"
                      />
                      <button
                        type="button"
                        className="login-password-field__toggle"
                        onClick={() => setShowPw((v) => !v)}
                        disabled={submitting}
                      >
                        {showPw ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                    <span id="reset-pw-hint" className="login-field__hint">
                      Dùng kết hợp chữ và số; tránh mật khẩu quá ngắn.
                    </span>
                    {fieldError ? (
                      <span className="login-field__error" role="alert">
                        {fieldError}
                      </span>
                    ) : null}
                  </label>

                  <label className="login-field">
                    <span className="login-field__label">Xác nhận mật khẩu</span>
                    <input
                      className="login-field__input"
                      type={showPw ? 'text' : 'password'}
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      disabled={submitting}
                    />
                  </label>

                  <button className="login-form__submit" type="submit" disabled={submitting}>
                    {submitting ? 'Đang xử lý…' : 'Xác nhận mật khẩu mới'}
                  </button>

                  <p className="login-auth-alt">
                    <Link className="login-form__link" to="/login">
                      ← Quay lại đăng nhập
                    </Link>
                  </p>
                </form>
              )}

              <p className="login-card__foot">Cần hỗ trợ? Liên hệ bộ phận IT nội bộ.</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
