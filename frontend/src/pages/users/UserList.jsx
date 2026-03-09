import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, FilterTabs, Table, Td, Badge, Select, Alert, Loading, EmptyState, ActionLink, ActionBtn, Icons, fmtDate } from '../../components/ui'
import { userApi } from '../../services/api'

const ROLE_TABS = [
  { value: '', label: 'Tất cả' },
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

const ROLE_LABELS = {
  ADMIN: 'Admin',
  DIRECTOR: 'Giám đốc',
  SALES_STAFF: 'NV Bán hàng',
  SALES_MANAGER: 'QL Bán hàng',
  WAREHOUSE_MANAGER: 'QL Kho',
  PRODUCTION_MANAGER: 'QL Sản xuất',
}

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [alert, setAlert] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (role) params.role = role
      if (status) params.status = status
      const res = await userApi.getAll(params)
      setUsers(res.data.data || res.data || [])
    } catch {
      setAlert({ type: 'error', message: 'Không thể tải danh sách người dùng' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [q, role, status])

  const handleResetPassword = async (user) => {
    if (!window.confirm(`Đặt lại mật khẩu cho "${user.fullName}"?`)) return
    try {
      const res = await userApi.resetPassword(user.id)
      const msg = res.data?.message || res.data?.data || 'Đặt lại mật khẩu thành công'
      setAlert({ type: 'success', message: `${msg}` })
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Đặt lại mật khẩu thất bại' })
    }
  }

  const handleToggleActive = async (user) => {
    const action = user.active ? 'vô hiệu hóa' : 'kích hoạt'
    if (!window.confirm(`Bạn muốn ${action} tài khoản "${user.fullName}"?`)) return
    try {
      await userApi.toggleActive(user.id)
      setAlert({ type: 'success', message: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công` })
      fetchUsers()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || `${action} thất bại` })
    }
  }

  return (
    <DashboardLayout title="Quản lý người dùng">
      <PageHeader title="Quản lý người dùng" desc="Quản lý tài khoản người dùng trong hệ thống" actionTo="/users/new" actionLabel="Tạo người dùng" />

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <SearchBar value={q} onChange={setQ} placeholder="Tìm theo tên, email..." />
        <div className="w-40">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Vô hiệu</option>
          </select>
        </div>
      </div>

      <FilterTabs tabs={ROLE_TABS} active={role} onChange={setRole} />

      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <EmptyState message="Không tìm thấy người dùng nào" />
      ) : (
        <Table headers={['Email', 'Họ tên', 'SĐT', 'Vai trò', 'Trạng thái', 'Ngày tạo', 'Thao tác']}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
              <Td>
                <span className="text-gray-900 font-medium">{u.email}</span>
              </Td>
              <Td>{u.fullName}</Td>
              <Td className="text-gray-500">{u.phone || '—'}</Td>
              <Td>
                <Badge variant={ROLE_COLORS[u.role] || 'gray'}>
                  {ROLE_LABELS[u.role] || u.role}
                </Badge>
              </Td>
              <Td>
                <Badge variant={u.active ? 'green' : 'gray'}>
                  {u.active ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
              </Td>
              <Td className="text-gray-500">{fmtDate(u.createdAt)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <ActionLink to={`/users/${u.id}`} icon={Icons.eye} title="Xem chi tiết" />
                  <ActionLink to={`/users/${u.id}/edit`} icon={Icons.edit} title="Sửa" />
                  <ActionBtn
                    icon={Icons.toggle}
                    onClick={() => handleToggleActive(u)}
                    title={u.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  />
                  <button
                    onClick={() => handleResetPassword(u)}
                    title="Đặt lại mật khẩu"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
