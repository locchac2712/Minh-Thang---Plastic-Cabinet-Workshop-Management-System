import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, Select, Btn, Alert, Loading, LinkBtn } from '../../components/ui'
import { userApi } from '../../services/api'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTOR', label: 'Giám đốc' },
  { value: 'SALES_STAFF', label: 'NV Bán hàng' },
  { value: 'SALES_MANAGER', label: 'QL Bán hàng' },
  { value: 'WAREHOUSE_MANAGER', label: 'QL Kho' },
  { value: 'PRODUCTION_MANAGER', label: 'QL Sản xuất' },
]

const pwdReqs = [
  { key: 'len', label: 'Tối thiểu 8 ký tự', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'Chữ hoa (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'Chữ thường (a-z)', test: (v) => /[a-z]/.test(v) },
  { key: 'num', label: 'Số (0-9)', test: (v) => /[0-9]/.test(v) },
]

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [form, setForm] = useState({
    email: '', fullName: '', phone: '', department: '', role: '',
    password: '', confirmPassword: '',
  })
  const [showPwd, setShowPwd] = useState({ password: false, confirm: false })

  useEffect(() => {
    if (!isEdit) return
    userApi.getById(id)
      .then((res) => {
        const u = res.data.data || res.data
        setForm((f) => ({ ...f, email: u.email || '', fullName: u.fullName || '', phone: u.phone || '', department: u.department || '', role: u.role || '' }))
      })
      .catch(() => setAlert({ type: 'error', message: 'Không thể tải thông tin người dùng' }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const allPwdMet = pwdReqs.every((r) => r.test(form.password))
  const pwdMatch = form.password === form.confirmPassword

  const canSubmit = () => {
    if (!form.email || !form.fullName || !form.role) return false
    if (form.fullName.length < 3 || form.fullName.length > 100) return false
    if (form.phone && !/^\d{10,11}$/.test(form.phone)) return false
    if (!isEdit) {
      if (!form.password || !form.confirmPassword) return false
      if (!allPwdMet || !pwdMatch) return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit()) return
    setSaving(true)
    setAlert(null)
    try {
      if (isEdit) {
        await userApi.update(id, {
          fullName: form.fullName,
          phone: form.phone,
          department: form.department,
          role: form.role,
        })
      } else {
        await userApi.create({
          email: form.email,
          fullName: form.fullName,
          phone: form.phone,
          department: form.department,
          role: form.role,
          password: form.password,
        })
      }
      navigate('/users')
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Lưu thất bại' })
      setSaving(false)
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

  const title = isEdit ? 'Sửa người dùng' : 'Tạo người dùng'

  if (loading) {
    return (
      <DashboardLayout title={title}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={title}>
      <PageHeader title={title}>
        <LinkBtn to="/users" variant="ghost">← Quay lại</LinkBtn>
      </PageHeader>

      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email *">
              {isEdit ? (
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
              ) : (
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="Nhập email"
                  required
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                />
              )}
            </Field>

            <Field
              label="Họ và tên *"
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Nhập họ và tên (3-100 ký tự)"
              required
              minLength={3}
              maxLength={100}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Số điện thoại"
                value={form.phone}
                onChange={set('phone')}
                placeholder="Nhập SĐT (10-11 số)"
              />
              <Field
                label="Phòng ban"
                value={form.department}
                onChange={set('department')}
                placeholder="Nhập phòng ban"
              />
            </div>

            <Select
              label="Vai trò *"
              options={ROLES}
              value={form.role}
              onChange={set('role')}
              placeholder="Chọn vai trò"
              required
            />

            {!isEdit && (
              <>
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Mật khẩu</h4>
                  <div className="space-y-4">
                    <Field label="Mật khẩu *">
                      <div className="relative">
                        <input
                          type={showPwd.password ? 'text' : 'password'}
                          value={form.password}
                          onChange={set('password')}
                          placeholder="Nhập mật khẩu"
                          required
                          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                        />
                        <EyeToggle field="password" />
                      </div>
                    </Field>

                    {form.password && (
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-2 animate-fade-in-up">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Yêu cầu mật khẩu</p>
                        {pwdReqs.map((r) => {
                          const met = r.test(form.password)
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

                    <Field label="Xác nhận mật khẩu *">
                      <div className="relative">
                        <input
                          type={showPwd.confirm ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={set('confirmPassword')}
                          placeholder="Nhập lại mật khẩu"
                          required
                          className={`w-full bg-white border rounded-2xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 ${
                            form.confirmPassword && !pwdMatch
                              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                              : 'border-gray-200 focus:border-purple-400 focus:ring-purple-100'
                          }`}
                        />
                        <EyeToggle field="confirm" />
                      </div>
                      {form.confirmPassword && !pwdMatch && (
                        <p className="text-xs text-red-500 mt-1.5">Mật khẩu xác nhận không khớp</p>
                      )}
                    </Field>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <LinkBtn to="/users" variant="secondary">Hủy</LinkBtn>
              <Btn type="submit" disabled={!canSubmit() || saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo người dùng'}
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
