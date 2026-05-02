import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthApiError, forgotPasswordWithApi } from '../auth/authApi'
import { appLogoUrl } from '../branding/appLogo'
import { homePathForActor, getStoredActor, isAuthenticated } from '../auth/storage'
import './LoginPage.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)
    setSuccessMessage(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Vui lòng nhập email.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setFieldError('Email không đúng định dạng.')
      return
    }

    setSubmitting(true)
    try {
      const msg = await forgotPasswordWithApi({ email: trimmed })
      setSuccessMessage(msg)
    } catch (err) {
      if (err instanceof AuthApiError) {
        const em = err.fieldErrors?.email?.trim()
        if (em) {
          setFieldError(em)
        } else {
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
            <p className="login-page__hero-kicker">Công ty / dự án nội bộ</p>
            <p className="login-page__hero-lead">
              Đặt lại mật khẩu qua email — an toàn, không lộ thông tin tài khoản.
            </p>
          </div>
        </aside>

        <div className="login-page__form-column">
          <main className="login-page__main">
            <section className="login-card" aria-labelledby="forgot-title">
              <header className="login-card__header">
                <h2 id="forgot-title" className="login-card__title">
                  Quên mật khẩu
                </h2>
                <p className="login-card__subtitle">
                  Nhập email đã đăng ký. Nếu hợp lệ, hệ thống gửi hướng dẫn đặt lại mật khẩu.
                </p>
              </header>

              {successMessage ? (
                <div className="login-form__success" role="status">
                  <p className="login-form__success-text">{successMessage}</p>
                  <p className="login-form__success-hint">
                    Kiểm tra cả thư mục <strong>Spam</strong> / <strong>Junk</strong>. Liên kết trong email có
                    hiệu lực giới hạn — nếu hết hạn, gửi yêu cầu lại từ trang này.
                  </p>
                  <Link className="login-form__submit login-form__submit--as-link" to="/login">
                    Quay lại đăng nhập
                  </Link>
                </div>
              ) : (
                <form className="login-form" onSubmit={handleSubmit} noValidate>
                  {error && !fieldError ? (
                    <div className="login-form__error" role="alert">
                      {error}
                    </div>
                  ) : null}

                  <label className="login-field">
                    <span className="login-field__label">Email</span>
                    <input
                      className="login-field__input"
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={submitting}
                      placeholder="ten@congty.com"
                    />
                    {fieldError ? (
                      <span className="login-field__error" role="alert">
                        {fieldError}
                      </span>
                    ) : null}
                  </label>

                  <button className="login-form__submit" type="submit" disabled={submitting}>
                    {submitting ? 'Đang gửi…' : 'Gửi hướng dẫn'}
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
