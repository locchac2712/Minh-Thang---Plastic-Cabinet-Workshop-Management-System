import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { App, Form, Input, Button, Typography, Result } from 'antd'
import { AuthApiError, resetPasswordWithApi } from '../auth/authApi'
import { appLogoUrl } from '../branding/appLogo'
import { homePathForActor, getStoredActor, isAuthenticated } from '../auth/storage'
import './LoginPage.css'

const { Title, Text } = Typography
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
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])

  const tokenMissing = !token

  async function onFinish(values: any) {
    if (tokenMissing) return

    setSubmitting(true)
    try {
      const msg = await resetPasswordWithApi({ token, newPassword: values.password })
      message.success(msg)
      navigate('/login', { replace: true, state: { passwordResetOk: true } })
    } catch (err) {
      if (err instanceof AuthApiError) {
        message.error(err.message)
      } else {
        message.error('Không kết nối được máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="th-login">
      <div className="th-login__layout">
        <aside className="th-login__hero" aria-label="Giới thiệu dự án">
          <div className="th-login__hero-bg" aria-hidden />
          <div className="th-login__hero-content">
            <div className="th-login__hero-logo" aria-hidden>
              <img
                className="th-login__hero-logo-img"
                src={appLogoUrl}
                alt=""
                width={52}
                height={52}
              />
            </div>
            <Title level={1} className="th-login__hero-title">Minh Thắng</Title>
            <Text className="th-login__hero-kicker">Đặt lại mật khẩu</Text>
            <p className="th-login__hero-lead">Chọn mật khẩu mới đủ mạnh và dễ nhớ với bạn.</p>
          </div>
        </aside>

        <div className="th-login__form-column">
          <main className="th-login__main">
            <section className="th-login-card" aria-labelledby="reset-title">
              {tokenMissing ? (
                <Result
                  status="error"
                  title="Liên kết không hợp lệ"
                  subTitle="Liên kết không hợp lệ hoặc thiếu mã xác thực. Vui lòng kiểm tra lại email hoặc yêu cầu mã mới."
                  extra={[
                    <Button type="primary" key="forgot" onClick={() => navigate('/forgot-password')}>
                      Yêu cầu mã mới
                    </Button>,
                    <Button key="login" onClick={() => navigate('/login')}>
                      Đăng nhập
                    </Button>
                  ]}
                />
              ) : (
                <>
                  <header className="th-login-card__header">
                    <Title level={2} id="reset-title" className="th-login-card__title">
                      Đặt lại mật khẩu
                    </Title>
                    <Text className="th-login-card__subtitle">Mật khẩu tối thiểu {MIN_PW} ký tự.</Text>
                  </header>

                  <Form
                    className="th-login-form"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                  >
                    <Form.Item
                      label="Mật khẩu mới"
                      name="password"
                      extra="Dùng kết hợp chữ và số; tránh mật khẩu quá ngắn."
                      rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
                        { min: MIN_PW, message: `Mật khẩu phải có ít nhất ${MIN_PW} ký tự.` }
                      ]}
                    >
                      <Input.Password
                        autoComplete="new-password"
                        placeholder={`Tối thiểu ${MIN_PW} ký tự`}
                        disabled={submitting}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Xác nhận mật khẩu"
                      name="confirm"
                      dependencies={['password']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu.' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('Mật khẩu xác nhận không trùng khớp.'));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu mới"
                        disabled={submitting}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={submitting}
                      block
                      style={{ marginTop: 8 }}
                    >
                      Xác nhận mật khẩu mới
                    </Button>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <Link className="th-login-form__link" to="/login">
                        ← Quay lại đăng nhập
                      </Link>
                    </div>
                  </Form>
                </>
              )}

              <Text className="th-login-card__foot">Cần hỗ trợ? Liên hệ bộ phận IT nội bộ.</Text>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
