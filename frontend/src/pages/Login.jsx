import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import authService from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', rememberMe: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' })
  const [success, setSuccess] = useState('')

  const set = (e) => {
    const { name, value, type, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
    setError('')
    setFieldErrors(prev => ({ ...prev, [name]: '' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    
    let hasError = false
    const newFieldErrors = { username: '', password: '' }

    if (!form.username.trim()) {
      newFieldErrors.username = 'Vui lòng nhập Tên đăng nhập'
      hasError = true
    }
    if (!form.password.trim()) {
      newFieldErrors.password = 'Vui lòng nhập Mật khẩu'
      hasError = true
    }

    if (hasError) {
      setFieldErrors(newFieldErrors)
      return
    }

    setError(''); setLoading(true)
    try {
      const data = await authService.login({ username: form.username.trim(), password: form.password })
      if (data.status === 'SUCCESS' || data.token) {
        const s = form.rememberMe ? localStorage : sessionStorage
        s.setItem('token', data.token)
        s.setItem('user', JSON.stringify(data))
        setSuccess('Đăng nhập thành công')
        setTimeout(() => navigate('/dashboard'), 600)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data || '';
      if (errorMsg.includes('Lock') || errorMsg.includes('khóa')) {
        setError('Tài khoản của bạn đang bị khóa')
      } else {
        setError('Tên đăng nhập sai hoặc mật khẩu sai')
      }
    } finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in-up">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Đăng nhập</h1>
        <p className="text-base text-gray-500 font-normal mb-8">Nhập thông tin tài khoản để truy cập hệ thống</p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đăng nhập</label>
            <input name="username" type="text" maxLength={100} value={form.username} onChange={set} placeholder="Nhập tên đăng nhập"
              className={`w-full bg-white border rounded-xl px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none transition-all shadow-sm ${
                fieldErrors.username 
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-red-600' 
                  : 'border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100'
              }`} />
            {fieldErrors.username && (
              <p className="mt-1.5 text-sm text-red-500">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set} placeholder="••••••••"
                className={`w-full bg-white border rounded-xl px-4 py-3 pr-12 text-sm placeholder:text-gray-400 focus:outline-none transition-all shadow-sm ${
                  fieldErrors.password 
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-red-600' 
                    : 'border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100'
                }`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-[calc(50%+0px)] p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" onMouseDown={(e) => e.preventDefault()}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {showPw
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>}
                </svg>
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" name="rememberMe" checked={form.rememberMe} onChange={set}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer" />
              <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors">
              Quên mật khẩu?
            </Link>
          </div>

          <button type="submit" disabled={loading}
            className="group w-full inline-flex items-center justify-between bg-black text-white pl-6 pr-2 py-2.5 rounded-full text-sm font-medium shadow-lg shadow-black/10 transition-all hover:scale-[1.01] hover:shadow-xl active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            <div className={`w-9 h-9 rounded-full ${loading ? 'bg-gray-700' : 'bg-gray-800 group-hover:bg-gray-700'} flex items-center justify-center transition-colors`}>
              {loading ? (
                <svg className="w-4 h-4 animate-spin-slow" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>
              )}
            </div>
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          © 2026 Minh Thắng Workshop. All rights reserved.
        </p>
      </div>
    </AuthLayout>
  )
}
