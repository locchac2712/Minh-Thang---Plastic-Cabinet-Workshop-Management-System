import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Field, Select, Badge, Btn, LinkBtn, Alert, Loading, Icons, fmtDate } from '../../components/ui'
import userService from '../../services/userService'

const ROLES = [
  { value: 'ROLE_ADMIN', label: 'Quản trị viên' },
  { value: 'ROLE_DIRECTOR', label: 'Giám đốc' },
  { value: 'ROLE_SALES_STAFF', label: 'Nhân viên bán hàng' },
  { value: 'ROLE_SALES_MANAGER', label: 'Quản lý bán hàng' },
  { value: 'ROLE_WAREHOUSE_MANAGER', label: 'Quản lý kho' },
  { value: 'ROLE_PRODUCTION_MANAGER', label: 'Quản lý sản xuất' },
  { value: 'ROLE_ACCOUNTANT', label: 'Kế toán' }
]

const ROLE_LABELS = {
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_DIRECTOR: 'Giám đốc',
  ROLE_SALES_STAFF: 'Nhân viên bán hàng',
  ROLE_SALES_MANAGER: 'Quản lý bán hàng',
  ROLE_WAREHOUSE_MANAGER: 'Quản lý kho',
  ROLE_PRODUCTION_MANAGER: 'Quản lý sản xuất',
  ROLE_ACCOUNTANT: 'Kế toán',
}

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({ username: '', fullName: '', email: '', phone: '', address: '', role: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const fetchUser = async () => {
    try {
      const u = await userService.getById(id)
      setUser(u)
      setFormData({ 
        username: u.username || '', 
        fullName: u.fullName || '', 
        email: u.email || '', 
        phone: u.phone || '', 
        address: u.address || '', 
        role: u.role || '' 
      })
    } catch {
      setAlert({ type: 'error', message: 'Không thể tải thông tin người dùng' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUser() }, [id])

  const validate = () => {
    const nextErrors = {}
    if (!formData.fullName) nextErrors.fullName = 'Họ và tên là bắt buộc'
    if (!formData.email) {
      nextErrors.email = 'Email là bắt buộc'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Email không đúng định dạng'
    }
    if (!formData.phone) {
      nextErrors.phone = 'Số điện thoại là bắt buộc'
    } else if (!/^\d{10}$/.test(formData.phone)) {
      nextErrors.phone = 'Số điện thoại phải có 10 chữ số'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setAlert(null)
    try {
      await userService.update(id, formData)
      setAlert({ type: 'success', message: 'Cập nhật thành công! Đang quay lại danh sách...' })
      setTimeout(() => navigate('/users'), 1500)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cập nhật thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({ 
      username: user.username || '', 
      fullName: user.fullName || '', 
      email: user.email || '', 
      phone: user.phone || '', 
      address: user.address || '', 
      role: user.role || '' 
    })
    setErrors({})
    setEditMode(false)
  }

  const handleResetPassword = async () => {
    try {
      const pass = await userService.resetPassword(id)
      setNewPassword(pass)
      setAlert({ type: 'success', message: 'Đã đặt lại mật khẩu mới!' })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Đặt lại mật khẩu thất bại' })
    }
  }

  const handleToggleActive = async () => {
    const action = user.active ? 'vô hiệu hóa' : 'kích hoạt'
    try {
      if (user.active) await userService.lock(id)
      else await userService.unlock(id)
      setAlert({ type: 'success', message: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công! Đang quay lại danh sách...` })
      setTimeout(() => navigate('/users'), 1500)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || `${action} thất bại` })
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết người dùng">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!user) {
    return (
      <DashboardLayout title="Chi tiết người dùng">
        <Alert type="error" message="Không tìm thấy người dùng" />
        <div className="mt-4">
          <LinkBtn to="/users" variant="secondary">← Quay lại danh sách</LinkBtn>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Chi tiết người dùng">
      <PageHeader title={editMode ? 'Chỉnh sửa tài khoản' : 'Chi tiết tài khoản'} desc={editMode ? 'Cập nhật thông tin người dùng hệ thống' : 'Thông tin chi tiết và hành động quản trị'}>
        <div className="flex items-center gap-3">
          {!editMode ? (
            <>
              <Btn variant="secondary" onClick={() => setEditMode(true)}>
                {Icons.edit} Sửa thông tin
              </Btn>
              <LinkBtn to="/users" variant="ghost">Quay lại</LinkBtn>
            </>
          ) : (
            <>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Btn>
              <Btn variant="secondary" onClick={handleCancel}>Hủy</Btn>
            </>
          )}
        </div>
      </PageHeader>

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      {newPassword && (
        <div className="mb-6 bg-purple-50 border-2 border-dashed border-purple-200 rounded-3xl p-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 font-bold text-sm mb-1 uppercase tracking-wider">Mật khẩu mới đã được tạo</p>
              <h3 className="text-3xl font-black text-purple-900 tracking-widest">{newPassword}</h3>
            </div>
            <button 
              onClick={() => setNewPassword('')}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors"
            >
              {Icons.close}
            </button>
          </div>
          <p className="text-purple-500 text-xs mt-3 italic">* Vui lòng cung cấp mật khẩu này cho người dùng. Block này sẽ biến mất sau khi bạn đóng hoặc tải lại trang.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Hàng 1: Họ tên, Tên đăng nhập */}
              <Field label="Họ và tên" error={errors.fullName} required={editMode}>
                <input
                  type="text"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : (errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10')} outline-none transition-all`}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </Field>

              <Field label="Tên đăng nhập">
                <input
                  type="text"
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 border-gray-100 text-gray-400 outline-none cursor-not-allowed"
                  value={formData.username}
                />
              </Field>

              {/* Hàng 2: Email, Trạng thái (View) / Email (Edit) */}
              <Field label="Email" error={errors.email} required={editMode}>
                <input
                  type="email"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : (errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10')} outline-none transition-all`}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>

              <Field label="Trạng thái">
                <div className="h-[50px] flex items-center">
                  <Badge variant={user.active ? 'green' : 'gray'}>
                    {user.active ? 'Đang hoạt động' : 'Tạm khóa'}
                  </Badge>
                </div>
              </Field>

              {/* Hàng 3: SĐT, Vai trò */}
              <Field label="Số điện thoại" error={errors.phone} required={editMode}>
                <input
                  type="text"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : (errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10')} outline-none transition-all`}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>

              {editMode ? (
                <Select
                  label="Vai trò"
                  options={ROLES}
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  required
                  disabled={user.username === JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}').username}
                />
              ) : (
                <Field label="Vai trò">
                  <input
                    type="text"
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border bg-gray-50/50 border-gray-100 text-gray-700 outline-none"
                    value={ROLE_LABELS[formData.role] || formData.role}
                  />
                </Field>
              )}

              {/* Hàng 4: Địa chỉ */}
              <div className="md:col-span-2">
                <Field label="Địa chỉ">
                  <input
                    type="text"
                    readOnly={!editMode}
                    className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                    placeholder="Chưa cập nhật địa chỉ"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">Quản trị tài khoản</h4>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all active:scale-95"
              >
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Đặt lại mật khẩu
              </button>

              <button
                type="button"
                onClick={handleToggleActive}
                disabled={user.username === JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}').username}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95 ${user.active ? 'bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                title={user.username === JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}').username ? "Bạn không thể tự vô hiệu hóa tài khoản của mình" : ""}
              >
                {Icons.toggle}
                {user.active ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
              </button>
            </div>
          </Card>

          <Card className="p-6 bg-gray-50/50 border-dashed">
            <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lịch sử hệ thống</h4>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-medium">Ngày tạo</p>
                <p className="text-sm text-gray-600">{fmtDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase font-medium">Cập nhật cuối</p>
                <p className="text-sm text-gray-600">{fmtDate(user.updatedAt)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
