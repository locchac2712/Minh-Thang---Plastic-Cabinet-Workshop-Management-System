import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthApiError, loginWithApi } from '../auth/authApi'
import { appLogoUrl } from '../branding/appLogo'
import {
  getStoredActor,
  homePathForActor,
  isAuthenticated,
  persistAuthSession,
  resolveActorFromRole,
} from '../auth/storage'
import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passwordResetOk = Boolean(
    (location.state as { passwordResetOk?: boolean } | null)?.passwordResetOk,
  )

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const u = username.trim()
    if (!u) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }

    setSubmitting(true)
    try {
      const data = await loginWithApi({
        username: u,
        password,
      })

      persistAuthSession({
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        role: data.role,
        fullName: data.fullName,
        remember,
      })

      const actor = resolveActorFromRole(data.role)
      navigate(homePathForActor(actor), { replace: true })
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.statusCode === 401) {
          setError('Sai tài khoản hoặc mật khẩu.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Không thể kết nối máy chủ đăng nhập. Vui lòng thử lại.')
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
              Hệ thống quản trị tủ bếp — bán sỉ, kho, sản xuất và phân quyền đa vai trò.
            </p>
          </div>
        </aside>

        <div className="login-page__form-column">
          <main className="login-page__main">
            <section className="login-card" aria-labelledby="login-title">
              <header className="login-card__header">
                <h2 id="login-title" className="login-card__title">
                  Đăng nhập
                </h2>
                <p className="login-card__subtitle">Sử dụng tài khoản được IT cấp quyền.</p>
              </header>

              <form className="login-form" onSubmit={handleSubmit} noValidate>
                {passwordResetOk ? (
                  <div className="login-form__success" role="status">
                    Mật khẩu đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.
                  </div>
                ) : null}
                {error ? (
                  <div className="login-form__error" role="alert">
                    {error}
                  </div>
                ) : null}

                <label className="login-field">
                  <span className="login-field__label">Tên đăng nhập hoặc email</span>
                  <input
                    className="login-field__input"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitting}
                  />
                </label>

                <label className="login-field">
                  <span className="login-field__label">Mật khẩu</span>
                  <input
                    className="login-field__input"
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </label>

                <div className="login-form__row">
                  <label className="login-check">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={submitting}
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <Link className="login-form__link" to="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button className="login-form__submit" type="submit" disabled={submitting}>
                  {submitting ? 'Đang xử lý…' : 'Đăng nhập'}
                </button>
              </form>

              <p className="login-card__foot">Cần hỗ trợ tài khoản? Liên hệ bộ phận IT nội bộ.</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
