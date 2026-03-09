import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, Field, Btn, Alert, Badge } from '../../components/ui'
import { profileApi } from '../../services/api'

const pwdReqs = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Chữ hoa (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Chữ thường (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'num', label: 'Số (0-9)', test: (v) => /[0-9]/.test(v) },
]

export default function UserProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '', role: '', department: '' })
  const [alert, setAlert] = useState(null)
  const [saving, setSaving] = useState(false)

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdAlert, setPwdAlert] = useState(null)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    profileApi.get()
      .then((res) => setProfile(res.data.data || res.data))
      .catch(() => setAlert({ type: 'error', message: 'Không thể tải thông tin hồ sơ' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setAlert(null)
    try {
      await profileApi.update({ fullName: profile.fullName, phone: profile.phone })
      setAlert({ type: 'success', message: 'Cập nhật hồ sơ thành công' })
      const stored = localStorage.getItem('user') ? 'localStorage' : 'sessionStorage'
      const user = JSON.parse(window[stored].getItem('user') || '{}')
      window[stored].setItem('user', JSON.stringify({ ...user, fullName: profile.fullName }))
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cập nhật thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const allPwdMet = pwdReqs.every((r) => r.test(pwdForm.newPassword))
  const pwdMatch = pwdForm.newPassword === pwdForm.confirmPassword
  const canSubmitPwd = pwdForm.currentPassword && pwdForm.newPassword && pwdForm.confirmPassword && allPwdMet && pwdMatch

  const handleChangePassword = async () => {
    setPwdSaving(true)
    setPwdAlert(null)
    try {
      await profileApi.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      navigate('/login', { state: { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' } })
    } catch (err) {
      setPwdAlert({ type: 'error', message: err.response?.data?.message || 'Đổi mật khẩu thất bại' })
      setPwdSaving(false)
    }
  }

  const EyeToggle = ({ field }) => (
    <button
      type="button"
      onClick={() => setShowPwd((p) => ({ ...p, [field]: !p[field] }))}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {showPwd[field] ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )}
    </button>
  )

  if (loading) {
    return (
      <DashboardLayout title="Hồ sơ cá nhân">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <svg className="w-8 h-8 animate-spin-slow text-purple-400 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Đang tải...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Hồ sơ cá nhân">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card className="p-8">
          <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

          <div className="flex items-center gap-5 mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-600/20 shrink-0">
              {(profile.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{profile.fullName || 'Người dùng'}</h3>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <Badge variant="purple">{profile.role}</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <Field
              label="Họ và tên"
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              placeholder="Nhập họ và tên"
            />
            <Field label="Email">
              <input
                type="text"
                value={profile.email}
                readOnly
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
            </Field>
            <Field
              label="Số điện thoại"
              value={profile.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vai trò">
                <div className="py-3">
                  <Badge variant="purple">{profile.role}</Badge>
                </div>
              </Field>
              <Field label="Phòng ban">
                <input
                  type="text"
                  value={profile.department || '—'}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Btn onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Btn>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Đổi mật khẩu</h3>
          <Alert type={pwdAlert?.type} message={pwdAlert?.message} onClose={() => setPwdAlert(null)} />

          <div className="space-y-4">
            <Field label="Mật khẩu hiện tại">
              <div className="relative">
                <input
                  type={showPwd.current ? 'text' : 'password'}
                  value={pwdForm.currentPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                />
                <EyeToggle field="current" />
              </div>
            </Field>
            <Field label="Mật khẩu mới">
              <div className="relative">
                <input
                  type={showPwd.new ? 'text' : 'password'}
                  value={pwdForm.newPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                />
                <EyeToggle field="new" />
              </div>
            </Field>

            {pwdForm.newPassword && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 animate-fade-in-up">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yêu cầu mật khẩu</p>
                {pwdReqs.map((r) => {
                  const met = r.test(pwdForm.newPassword)
                  return (
                    <div key={r.key} className="flex items-center gap-2">
                      {met ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={`text-xs ${met ? 'text-emerald-600' : 'text-gray-400'}`}>{r.label}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Field label="Xác nhận mật khẩu mới">
              <div className="relative">
                <input
                  type={showPwd.confirm ? 'text' : 'password'}
                  value={pwdForm.confirmPassword}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                  className={`w-full bg-white border rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                    pwdForm.confirmPassword && !pwdMatch
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                  }`}
                />
                <EyeToggle field="confirm" />
              </div>
              {pwdForm.confirmPassword && !pwdMatch && (
                <p className="text-xs text-red-500 mt-1.5">Mật khẩu xác nhận không khớp</p>
              )}
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Btn onClick={handleChangePassword} disabled={!canSubmitPwd || pwdSaving} variant="purple">
              {pwdSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Btn>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
