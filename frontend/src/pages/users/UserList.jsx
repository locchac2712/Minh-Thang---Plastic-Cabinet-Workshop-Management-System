import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, Alert, Loading, EmptyState, ActionLink, ActionBtn, Icons, ConfirmModal, Pagination, LinkBtn, Dropdown } from '../../components/ui'
import userService from '../../services/userService'

const ROLE_TABS = [
  { value: 'ROLE_ADMIN', label: 'Quản trị viên' },
  { value: 'ROLE_DIRECTOR', label: 'Giám đốc' },
  { value: 'ROLE_SALES_STAFF', label: 'Nhân viên bán hàng' },
  { value: 'ROLE_SALES_MANAGER', label: 'Quản lý bán hàng' },
  { value: 'ROLE_WAREHOUSE_MANAGER', label: 'Quản lý kho' },
  { value: 'ROLE_PRODUCTION_MANAGER', label: 'Quản lý sản xuất' },
  { value: 'ROLE_ACCOUNTANT', label: 'Kế toán' }
]

const ROLE_COLORS = {
  ROLE_ADMIN: 'red',
  ROLE_DIRECTOR: 'purple',
  ROLE_SALES_STAFF: 'blue',
  ROLE_SALES_MANAGER: 'cyan',
  ROLE_WAREHOUSE_MANAGER: 'yellow',
  ROLE_PRODUCTION_MANAGER: 'green',
  ROLE_ACCOUNTANT: 'purple',
}

const ROLE_LABELS = {
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_DIRECTOR: 'Giám đốc',
  ROLE_SALES_STAFF: 'Nhân viên bán hàng',
  ROLE_SALES_MANAGER: 'Quản lý bán hàng',
  ROLE_WAREHOUSE_MANAGER: 'Quản lý kho',
  ROLE_PRODUCTION_MANAGER: 'Quản lý sản xuất',
  ROLE_ACCOUNTANT: 'Kế toán',
}

export default function UserList() {
  const [originalUsers, setOriginalUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [alert, setAlert] = useState(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await userService.getAll() // Fetch all for frontend-side filtering
      setOriginalUsers(data || [])
    } catch {
      setAlert({ type: 'error', message: 'Không thể tải danh sách người dùng' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  // Frontend Filtering Logic
  const filteredUsers = useMemo(() => {
    return originalUsers.filter(u => {
      const searchTerm = q.toLowerCase().trim()
      const matchesQ = !searchTerm || 
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm)) || 
        (u.email && u.email.toLowerCase().includes(searchTerm)) ||
        (u.username && u.username.toLowerCase().includes(searchTerm))
      
      const matchesRole = !role || u.role === role
      const matchesStatus = !status || (status === 'active' ? u.active : !u.active)
      
      return matchesQ && matchesRole && matchesStatus
    })
  }, [originalUsers, q, role, status])

  // Reset page when any filter OR page size changes
  useEffect(() => { setCurrentPage(1) }, [q, role, status, pageSize])

  // Pagination Logic
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const handleToggleActive = async () => {
    const targetUser = confirmModal.user
    if (!targetUser) return
    
    const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
    
    // Constraint 1: Prevent self-deactivation
    if (targetUser.active && String(targetUser.id) === String(currentUser.id)) {
      setAlert({ type: 'error', message: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình' })
      setConfirmModal({ isOpen: false, user: null })
      return
    }

    // Constraint 2: Prevent deactivating the last admin
    if (targetUser.active && targetUser.role === 'ROLE_ADMIN') {
      const activeAdmins = originalUsers.filter(u => u.role === 'ROLE_ADMIN' && u.active)
      if (activeAdmins.length <= 1) {
        setAlert({ type: 'error', message: 'Không thể vô hiệu hóa quản trị viên duy nhất của hệ thống' })
        setConfirmModal({ isOpen: false, user: null })
        return
      }
    }

    const action = targetUser.active ? 'vô hiệu hóa' : 'kích hoạt'
    
    try {
      if (targetUser.active) {
        await userService.lock(targetUser.id)
      } else {
        await userService.unlock(targetUser.id)
      }
      setAlert({ type: 'success', message: `${action.charAt(0).toUpperCase() + action.slice(1)} tài khoản thành công` })
      setConfirmModal({ isOpen: false, user: null })
      fetchUsers()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || `${action} thất bại` })
    }
  }

  return (
    <DashboardLayout title="Quản lý người dùng">
      <PageHeader title="Quản lý người dùng" desc="Quản lý tài khoản người dùng trong hệ thống" />

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        <div className="w-full lg:w-2/3 relative">
          <SearchBar 
            value={q} 
            onChange={setQ} 
            placeholder="Tìm theo tên, email..." 
            className="w-full"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${showFilters ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {Icons.filter}
          </button>
          
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 p-5 bg-white rounded-3xl shadow-2xl border border-gray-100/50 z-30 animate-fade-in flex flex-col sm:flex-row gap-5">
              <div className="flex-1">
                <Dropdown 
                  label="Trạng thái"
                  placeholder="Tất cả trạng thái"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'active', label: 'Hoạt động' },
                    { value: 'inactive', label: 'Vô hiệu' }
                  ]}
                />
              </div>
              <div className="flex-1">
                <Dropdown 
                  label="Vai trò"
                  placeholder="Tất cả vai trò"
                  value={role}
                  onChange={setRole}
                  options={ROLE_TABS}
                />
              </div>
            </div>
          )}
        </div>
        
        <LinkBtn to="/users/new" variant="primary" className="h-[52px] px-8 flex justify-center items-center">
          <span>Tạo người dùng</span>
        </LinkBtn>
      </div>

      {loading ? (
        <Loading />
      ) : filteredUsers.length === 0 ? (
        <EmptyState message="Không tìm thấy người dùng nào" />
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm animate-fade-in-up">
          <Table headers={['Họ tên', 'Tên đăng nhập', 'Email', 'SĐT', 'Vai trò', 'Trạng thái', 'Thao tác']}>
            {paginatedUsers.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                <Td className="font-medium text-gray-900">{u.fullName || '—'}</Td>
                <Td className="text-gray-600">{u.username}</Td>
                <Td className="text-gray-600">{u.email}</Td>
                <Td className="text-gray-500">{u.phone || '—'}</Td>
                <Td>
                  <span className="text-gray-600 font-medium">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span className={`text-[13px] font-medium ${u.active ? 'text-emerald-600' : 'text-red-600'}`}>
                      {u.active ? 'Hoạt động' : 'Vô hiệu'}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <ActionLink to={`/users/${u.id}`} icon={Icons.eye} title="Xem chi tiết" />
                    <ActionBtn
                      icon={Icons.toggle}
                      onClick={() => setConfirmModal({ isOpen: true, user: u })}
                      title={u.active ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                    />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, user: null })}
        onConfirm={handleToggleActive}
        title={confirmModal.user?.active ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
        message={`Bạn có chắc chắn muốn ${confirmModal.user?.active ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản "${confirmModal.user?.fullName}" không?`}
        confirmLabel={confirmModal.user?.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
        variant={confirmModal.user?.active ? 'danger' : 'purple'}
      />
    </DashboardLayout>
  )
}
