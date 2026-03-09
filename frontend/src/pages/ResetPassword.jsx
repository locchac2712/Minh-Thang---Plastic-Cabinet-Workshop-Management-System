import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { authApi } from '../services/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)\S{8,}$/
  const hasMinLength = form.newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(form.newPassword)
  const hasNumber = /\d/.test(form.newPassword)
  const hasNoSpaces = !/\s/.test(form.newPassword)
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword !== ''
  const isFormValid = passwordRegex.test(form.newPassword) && passwordsMatch

  useEffect(() => {
    if (!token) {
      setValidating(false)
      setTokenError('Không tìm thấy token. Vui lòng yêu cầu link mới.')
      return
    }

    authApi.validateToken(token)
      .then(() => { setTokenValid(true) })
      .catch((err) => { setTokenError(err.response?.data?.message || 'Token không hợp lệ') })
      .finally(() => { setValidating(false) })
  }, [token])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await authApi.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })

      if (data.success) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-8 h-8 animate-spin-slow text-gray-400 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Đang xác thực token...</p>
        </div>
      </AuthLayout>
    )
  }

  if (tokenError) {
    return (
      <AuthLayout>
        <div className="text-center py-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Không thể đặt lại mật khẩu</h2>
          <p className="text-gray-500 mb-8">{tokenError}</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium
                       hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
          >
            Yêu cầu link mới
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center py-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Đặt lại mật khẩu thành công!</h2>
          <p className="text-gray-500 mb-2">Mật khẩu của bạn đã được cập nhật.</p>
          <p className="text-gray-400 text-sm mb-8">Tự động chuyển về trang đăng nhập sau 3 giây...</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium
                       hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
            Đặt lại mật khẩu
          </h1>
          <p className="text-gray-500">
            Tạo mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3 animate-fade-in-up">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm
                           placeholder:text-gray-400 focus:outline-none focus:border-gray-900
                           focus:ring-1 focus:ring-gray-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Requirements */}
            {form.newPassword && (
              <div className="mt-3 space-y-1.5">
                <Requirement met={hasMinLength} text="Tối thiểu 8 ký tự" />
                <Requirement met={hasUppercase} text="Có ít nhất 1 chữ hoa" />
                <Requirement met={hasNumber} text="Có ít nhất 1 số" />
                <Requirement met={hasNoSpaces} text="Không chứa khoảng trắng" />
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pr-12 text-sm
                           placeholder:text-gray-400 focus:outline-none focus:border-gray-900
                           focus:ring-1 focus:ring-gray-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {form.confirmPassword && !passwordsMatch && (
              <p className="mt-2 text-xs text-red-500">Mật khẩu xác nhận không trùng khớp</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Link
              to="/login"
              className="flex-1 py-3.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium
                         hover:bg-gray-50 transition-all text-center"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-medium
                         hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed
                         transition-all shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                'Lưu mật khẩu mới'
              )}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  )
}

function Requirement({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>{text}</span>
    </div>
  )
}
