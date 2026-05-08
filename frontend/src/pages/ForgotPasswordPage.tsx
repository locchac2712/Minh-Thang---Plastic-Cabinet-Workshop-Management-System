import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, App, Typography, Result } from 'antd'
import { AuthApiError, forgotPasswordWithApi } from '../auth/authApi'
import { appLogoUrl } from '../branding/appLogo'
import { homePathForActor, getStoredActor, isAuthenticated } from '../auth/storage'
import './LoginPage.css'

const { Title, Text } = Typography

type ForgotPasswordValues = {
  email: string
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])

  async function onFinish(values: ForgotPasswordValues) {
    setSubmitting(true)
    try {
      const msg = await forgotPasswordWithApi({ email: values.email.trim() })
      setSuccessMessage(msg)
      message.success('Đã gửi yêu cầu thành công.')
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
            <Text className="th-login__hero-kicker">Công ty / dự án nội bộ</Text>
            <Text className="th-login__hero-lead">
              Đặt lại mật khẩu qua email — an toàn, không lộ thông tin tài khoản.
            </Text>
          </div>
        </aside>

        <div className="th-login__form-column">
          <main className="th-login__main">
            <section className="th-login-card" aria-labelledby="forgot-title">
              {successMessage ? (
                <Result
                  status="success"
                  title="Gửi yêu cầu thành công"
                  subTitle={
                    <div style={{ textAlign: 'left' }}>
                      <Text>{successMessage}</Text>
                      <br /><br />
                      <Text type="secondary" size="small">
                        Kiểm tra cả thư mục <strong>Spam</strong> / <strong>Junk</strong>. Liên kết trong email có
                        hiệu lực giới hạn — nếu hết hạn, hãy gửi lại yêu cầu.
                      </Text>
                    </div>
                  }
                  extra={[
                    <Button type="primary" key="login" onClick={() => navigate('/login')}>
                      Quay lại đăng nhập
                    </Button>
                  ]}
                />
              ) : (
                <>
                  <header className="th-login-card__header">
                    <Title level={2} id="forgot-title" className="th-login-card__title">
                      Quên mật khẩu
                    </Title>
                    <Text className="th-login-card__subtitle">
                      Nhập email đã đăng ký. Nếu hợp lệ, hệ thống gửi hướng dẫn đặt lại mật khẩu.
                    </Text>
                  </header>

                  <Form
                    className="th-login-form"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                  >
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Vui lòng nhập email.' },
                        { type: 'email', message: 'Email không đúng định dạng.' }
                      ]}
                    >
                      <Input
                        type="email"
                        autoComplete="email"
                        disabled={submitting}
                        placeholder="ten@congty.com"
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
                      Gửi hướng dẫn
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
