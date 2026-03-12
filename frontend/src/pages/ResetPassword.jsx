import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import authService from '../services/authService'

export default function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''

  const [form, setForm] = useState({ token: '', newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ token: '', newPassword: '', confirmPassword: '' })
  const [success, setSuccess] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')

  // Validation Rules
  const hasMinLength = form.newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(form.newPassword)
  const hasLowercase = /[a-z]/.test(form.newPassword)
  const hasNumber = /\d/.test(form.newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)
  const hasNoSpaces = !/\s/.test(form.newPassword) && form.newPassword.length > 0

  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword !== ''

  const isPasswordValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialChar &&
    hasNoSpaces

  // Điều kiện submit
  const isFormValid = isPasswordValid && passwordsMatch && form.token.trim().length > 0

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError('')
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleTokenKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Enter key functionality removed as validate-token does not exist on backend
    }
  }

  const handleResendOtp = async () => {
    if (!email) {
      setError('Không tìm thấy email để gửi lại mã. Vui lòng quay lại màn hình Quên mật khẩu.')
      return
    }

    setResendingOtp(true)
    setError('')
    setResendSuccess('')
    setFieldErrors(prev => ({ ...prev, token: '' }))
    try {
      await authService.forgotPassword({ email })
      setResendSuccess('Đã gửi lại mã OTP thành công!')
      setTimeout(() => setResendSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.')
    } finally {
      setResendingOtp(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    let hasError = false
    const newFieldErrors = { token: '', newPassword: '', confirmPassword: '' }

    if (!form.token.trim()) {
      newFieldErrors.token = 'Vui lòng nhập mã OTP'
      hasError = true
    }

    if (!form.newPassword) {
      newFieldErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
      hasError = true
    } else if (!isPasswordValid) {
      newFieldErrors.newPassword = 'Mật khẩu chưa đáp ứng đủ yêu cầu'
      hasError = true
    }

    if (!form.confirmPassword) {
      newFieldErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
      hasError = true
    } else if (!passwordsMatch) {
      newFieldErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp'
      hasError = true
    }

    if (hasError) {
      setFieldErrors(newFieldErrors)
      return
    }

    try {
      const data = await authService.resetPassword({
        token: form.token.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      })

      if (data?.success || (typeof data === 'string' && data.includes('thành công')) || data) {
        setSuccess(true)
        setTimeout(() => navigate('/login'), 3000)
      }
    } catch (err) {
      let errorMsg = err.response?.data?.message || err.response?.data || '';
      if (typeof errorMsg === 'string') {
        // Loại bỏ "Lỗi: " và "(quá 15 phút)" từ thông báo của Backend
        errorMsg = errorMsg.replace(/^Lỗi:\s*/i, '').replace(/\s*\(quá\s+15\s+phút\)/i, '');
      }
      const strMsg = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : '';

      if (strMsg.includes('hết hạn') || strMsg.includes('không hợp lệ')) {
        setFieldErrors(prev => ({ ...prev, token: errorMsg || 'Mã OTP không hợp lệ hoặc đã hết hạn.' }))
      } else {
        setError(errorMsg || 'Đã xảy ra lỗi. Vui lòng kiểm tra lại.')
      }
    } finally {
      setLoading(false)
    }
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
            Nhập mã OTP từ email và tạo mật khẩu mới
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

        {resendSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3 animate-fade-in-up">
            <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700">{resendSuccess}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Token (OTP) */}
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Mã OTP
            </label>
            <div className="relative">
              <input
                id="token"
                name="token"
                type="text"
                value={form.token}
                onChange={handleChange}
                onKeyDown={handleTokenKeyDown}
                placeholder="Nhập mã OTP"
                className={`w-full bg-white border rounded-xl px-4 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:outline-none transition-all ${fieldErrors.token
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-600'
                  : 'border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                  }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp}
                  title="Gửi lại mã OTP"
                  className="p-1 text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  <svg className={`w-5 h-5 ${resendingOtp ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>
            {fieldErrors.token && (
              <p className="mt-1.5 text-sm text-red-500">{fieldErrors.token}</p>
            )}
          </div>

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
                className={`w-full bg-white border rounded-xl px-4 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:outline-none transition-all ${fieldErrors.newPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-600'
                  : 'border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                  }`}
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                onMouseDown={(e) => e.preventDefault()}
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
              </div>
            </div>
            {fieldErrors.newPassword && (
              <p className="mt-1.5 text-sm text-red-500">{fieldErrors.newPassword}</p>
            )}

            {/* Password Requirements */}
            <div className="mt-3 space-y-1.5 grid grid-cols-2 gap-x-2">
              <Requirement met={hasMinLength} text="Ít nhất 8 ký tự" />
              <Requirement met={hasUppercase} text="Ít nhất 1 chữ hoa" />
              <Requirement met={hasLowercase} text="Ít nhất 1 chữ thường" />
              <Requirement met={hasNumber} text="Ít nhất 1 số" />
              <Requirement met={hasSpecialChar} text="Ít nhất 1 ký tự đặc biệt" />
              <Requirement met={hasNoSpaces} text="Không khoảng trắng" />
            </div>
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
                className={`w-full bg-white border rounded-xl px-4 py-3.5 pr-12 text-sm placeholder:text-gray-400 focus:outline-none transition-all ${fieldErrors.confirmPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-red-600'
                  : 'border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900'
                  }`}
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                onClick={() => setShowConfirm(!showConfirm)}
                onMouseDown={(e) => e.preventDefault()}
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
              </div>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-sm text-red-500">{fieldErrors.confirmPassword}</p>
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
              disabled={loading}
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
        <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <span className={`text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>{text}</span>
    </div>
  )
}
