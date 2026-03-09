import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Field, Select, Badge, Btn, LinkBtn, Alert, Loading, Icons, fmtDate } from '../../components/ui'
import { userApi } from '../../services/api'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTOR', label: 'Giám đốc' },
  { value: 'SALES_STAFF', label: 'NV Bán hàng' },
  { value: 'SALES_MANAGER', label: 'QL Bán hàng' },
  { value: 'WAREHOUSE_MANAGER', label: 'QL Kho' },
  { value: 'PRODUCTION_MANAGER', label: 'QL Sản xuất' },
]

const ROLE_COLORS = {
  ADMIN: 'red',
  DIRECTOR: 'purple',
  SALES_STAFF: 'blue',
  SALES_MANAGER: 'cyan',
  WAREHOUSE_MANAGER: 'yellow',
  PRODUCTION_MANAGER: 'green',
}

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({ fullName: '', phone: '', department: '', role: '' })
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)

  const fetchUser = async () => {
    try {
      const res = await userApi.getById(id)
      const u = res.data.data || res.data
      setUser(u)
      setForm({ fullName: u.fullName || '', phone: u.phone || '', department: u.department || '', role: u.role || '' })
    } catch {
      setAlert({ type: 'error', message: 'Không thể tải thông tin người dùng' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUser() }, [id])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSave = async () => {
    setSaving(true)
    setAlert(null)
    try {
      await userApi.update(id, form)
      setAlert({ type: 'success', message: 'Cập nhật thành công' })
      setEditMode(false)
      fetchUser()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Cập nhật thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({ fullName: user.fullName || '', phone: user.phone || '', department: user.department || '', role: user.role || '' })
    setEditMode(false)
  }

  const handleResetPassword = async () => {
    if (!window.confirm(`Đặt lại mật khẩu cho "${user.fullName}"?`)) return
    try {
      const res = await userApi.resetPassword(id)
      const msg = res.data?.message || res.data?.data || 'Đặt lại mật khẩu thành công'
      setAlert({ type: 'success', message: msg })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Đặt lại mật khẩu thất bại' })
    }
  }

  const handleToggleActive = async () => {
    const action = user.active ? 'vô hiệu hóa' : 'kích hoạt'
    if (!window.confirm(`Bạn muốn ${action} tài khoản "${user.fullName}"?`)) return
    try {
      await userApi.toggleActive(id)
      setAlert({ type: 'success', message: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công` })
      fetchUser()
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
      <PageHeader title={editMode ? 'Sửa người dùng' : 'Chi tiết người dùng'}>
        {!editMode ? (
          <>
            <Btn variant="secondary" onClick={() => setEditMode(true)}>
              {Icons.edit} Sửa
            </Btn>
            <LinkBtn to="/users" variant="ghost">← Quay lại</LinkBtn>
          </>
        ) : (
          <>
            <Btn onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </Btn>
            <Btn variant="secondary" onClick={handleCancel}>Hủy</Btn>
          </>
        )}
      </PageHeader>

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      {!user.active && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3 animate-fade-in-up">
          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-amber-700 font-medium">Tài khoản này đang bị vô hiệu hóa</p>
        </div>
      )}

      <div className="space-y-6 max-w-3xl">
        {editMode ? (
          <Card className="p-8">
            <div className="space-y-5">
              <Field label="Email">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
              </Field>
              <Field
                label="Họ và tên"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Nhập họ và tên"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field
                  label="Số điện thoại"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="Nhập SĐT"
                />
                <Field
                  label="Phòng ban"
                  value={form.department}
                  onChange={set('department')}
                  placeholder="Nhập phòng ban"
                />
              </div>
              <Select
                label="Vai trò"
                options={ROLES}
                value={form.role}
                onChange={set('role')}
                placeholder="Chọn vai trò"
              />
            </div>
          </Card>
        ) : (
          <DetailGrid items={[
            { label: 'Email', value: user.email },
            { label: 'Họ tên', value: user.fullName },
            { label: 'Số điện thoại', value: user.phone },
            { label: 'Phòng ban', value: user.department },
            { label: 'Vai trò', value: <Badge variant={ROLE_COLORS[user.role] || 'gray'}>{ROLE_LABELS[user.role] || user.role}</Badge> },
            { label: 'Trạng thái', value: <Badge variant={user.active ? 'green' : 'gray'}>{user.active ? 'Hoạt động' : 'Vô hiệu'}</Badge> },
            { label: 'Ngày tạo', value: fmtDate(user.createdAt) },
            { label: 'Cập nhật lần cuối', value: fmtDate(user.updatedAt) },
          ]} />
        )}

        {!editMode && (
          <Card className="p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Thao tác</h4>
            <div className="flex flex-wrap gap-3">
              <Btn variant="secondary" onClick={handleResetPassword}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
                Đặt lại mật khẩu
              </Btn>
              <Btn
                variant={user.active ? 'danger' : 'primary'}
                onClick={handleToggleActive}
              >
                {Icons.toggle}
                {user.active ? 'Vô hiệu hóa' : 'Kích hoạt tài khoản'}
              </Btn>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
