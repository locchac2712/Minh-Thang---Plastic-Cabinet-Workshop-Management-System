import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Form, Input, Checkbox, Button, App, Flex, Typography } from 'antd'
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

const { Title, Text } = Typography

type LoginFormValues = {
  username: string
  password: string
  remember: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  
  const passwordResetOk = Boolean(
    (location.state as { passwordResetOk?: boolean } | null)?.passwordResetOk,
  )

  useEffect(() => {
    if (isAuthenticated()) {
      const actor = getStoredActor() ?? 'admin'
      navigate(homePathForActor(actor), { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (passwordResetOk) {
      message.success('Mật khẩu đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu mới.')
    }
  }, [passwordResetOk, message])

  const [submitting, setSubmitting] = useState(false)

  async function onFinish(values: LoginFormValues) {
    setSubmitting(true)

    try {
      const data = await loginWithApi({
        username: values.username.trim(),
        password: values.password,
      })

      persistAuthSession({
        accessToken: data.accessToken,
        tokenType: data.tokenType,
        role: data.role,
        fullName: data.fullName,
        remember: values.remember,
      })

      const actor = resolveActorFromRole(data.role)
      navigate(homePathForActor(actor), { replace: true })
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.statusCode === 401) {
          message.error('Sai tài khoản hoặc mật khẩu.')
        } else {
          message.error(err.message)
        }
      } else {
        message.error('Không thể kết nối máy chủ đăng nhập. Vui lòng thử lại.')
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
              Hệ thống quản trị tủ bếp — bán sỉ, kho, sản xuất và phân quyền đa vai trò.
            </Text>
          </div>
        </aside>

        <div className="th-login__form-column">
          <main className="th-login__main">
            <section className="th-login-card" aria-labelledby="login-title">
              <header className="th-login-card__header">
                <Title level={2} id="login-title" className="th-login-card__title">
                  Đăng nhập
                </Title>
                <Text className="th-login-card__subtitle">Sử dụng tài khoản được IT cấp quyền.</Text>
              </header>

              <Form
                className="th-login-form"
                onFinish={onFinish}
                initialValues={{ remember: true }}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  label="Tên đăng nhập"
                  name="username"
                  rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập.' }]}
                >
                  <Input
                    autoComplete="username"
                    disabled={submitting}
                    placeholder="Nhập tên đăng nhập"
                  />
                </Form.Item>

                <Form.Item
                  label="Mật khẩu"
                  name="password"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu.' }]}
                >
                  <Input.Password
                    autoComplete="current-password"
                    placeholder="••••••••"
                    disabled={submitting}
                  />
                </Form.Item>

                <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox disabled={submitting}>
                      Ghi nhớ đăng nhập
                    </Checkbox>
                  </Form.Item>
                  <Link className="th-login-form__link" to="/forgot-password">
                    Quên mật khẩu?
                  </Link>
                </Flex>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={submitting}
                  block
                >
                  Đăng nhập
                </Button>
              </Form>

              <Text className="th-login-card__foot">Cần hỗ trợ tài khoản? Liên hệ bộ phận IT nội bộ.</Text>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
