import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import authService from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setFieldError('Vui lòng nhập Email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Email không đúng định dạng')
      return
    }

    setError('')
    setFieldError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const data = await authService.forgotPassword({ email: email.trim() })
      if (data?.success || (typeof data === 'string' && data.includes('thành công')) || data) {
         setSuccessMsg('Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra email của bạn.');
         setTimeout(() => {
           navigate('/reset-password', { state: { email: email.trim() } });
         }, 2500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || '';
      const strMsg = typeof errorMsg === 'string' ? errorMsg.toLowerCase() : '';
      if (err.response?.status === 404 || strMsg.includes('tồn tại') || strMsg.includes('not found')) {
        setError('Lỗi: Không tìm thấy tài khoản với email này!')
      } else {
        setError(typeof errorMsg === 'string' && errorMsg ? errorMsg : 'Đã xảy ra lỗi. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Quay lại đăng nhập
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Quên mật khẩu</h1>
          <p className="text-gray-500 text-sm">Nhập email đã đăng ký để nhận mã OTP để đặt lại mật khẩu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMsg(''); setFieldError(''); }} placeholder="you@gmail.com"
              className={`w-full bg-white border rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none transition-all shadow-sm ${
                fieldError 
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-red-600' 
                  : 'border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100'
              }`} />
            {fieldError && (
              <p className="mt-1.5 text-sm text-red-500">{fieldError}</p>
            )}
          </div>

          <button type="submit" disabled={loading || successMsg !== ''}
            className="group w-full inline-flex items-center justify-between bg-black text-white pl-6 pr-2 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-black/10 transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            <span>{loading ? 'Đang gửi...' : successMsg ? 'Đang chuyển hướng...' : 'Gửi mã OTP'}</span>
            <div className="w-9 h-9 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center transition-colors">
              {loading || successMsg ? (
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              )}
            </div>
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
