import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, Btn, Alert, Loading, LinkBtn, Icons, Dropdown } from '../../components/ui'
import userService from '../../services/userService'

const ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECTOR', label: 'Giám đốc' },
  { value: 'SALES_STAFF', label: 'NV Bán hàng' },
  { value: 'SALES_MANAGER', label: 'QL Bán hàng' },
  { value: 'WAREHOUSE_MANAGER', label: 'QL Kho' },
  { value: 'PRODUCTION_MANAGER', label: 'QL Sản xuất' },
  { value: 'ACCOUNTANT', label: 'Kế toán' },
]

export default function UserForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    address: '',
    role: 'SALES_STAFF',
    password: ''
  })

  const [errors, setErrors] = useState({})
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (!isEdit) return
    userService.getById(id)
      .then((u) => {
        setFormData({
          username: u.username || '',
          email: u.email || '',
          fullName: u.fullName || u.fullname || '',
          phone: u.phone || u.phoneNumber || '',
          address: u.address || '',
          role: u.role || 'SALES_STAFF',
          password: '' // Password is not fetched for security reasons
        })
      })
      .catch(() => setErrors({ general: 'Không thể tải thông tin người dùng' }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const generatePassword = () => {
    const pass = Math.floor(100000 + Math.random() * 900000).toString()
    setFormData(prev => ({ ...prev, password: pass }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.username) nextErrors.username = 'Tên đăng nhập là bắt buộc'
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

    if (!isEdit && !formData.password) {
      nextErrors.password = 'Mật khẩu là bắt buộc'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccessMsg('')
    if (!validate()) return
    setSaving(true)
    try {
      if (isEdit) {
        await userService.update(id, formData)
        setSuccessMsg('Cập nhật tài khoản thành công!')
        setTimeout(() => navigate('/users'), 1500)
      } else {
        const passwordToShow = formData.password
        await userService.create(formData)
        setGeneratedPass(passwordToShow)
        setSuccessMsg(`Tạo tài khoản thành công! Mật khẩu là: ${passwordToShow}`)
        setFormData({ username: '', email: '', fullName: '', phone: '', address: '', role: 'SALES_STAFF', password: '' })
        // Tăng thời gian chờ lên 3s để admin kịp copy mật khẩu
        setTimeout(() => navigate('/users'), 3000)
      }
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Lưu thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const title = isEdit ? 'Cập nhật người dùng' : 'Tạo người dùng mới'

  if (loading) {
    return (
      <DashboardLayout title={title}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={title}>
      <PageHeader title={title}>
        <LinkBtn to="/users" variant="ghost" className="!px-0">
          {Icons.ChevronLeft}
          <span>Quay lại danh sách</span>
        </LinkBtn>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4">
        <form onSubmit={handleSubmit}>
          <Card className="p-8 md:p-10 mb-6 bg-white overflow-visible">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                {Icons.User}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Thông tin tài khoản</h3>
                <p className="text-sm text-gray-500 font-medium">Cung cấp các chi tiết cơ bản cho nhân viên mới</p>
              </div>
            </div>

            {errors.general && <Alert type="error" message={errors.general} onClose={() => setErrors({})} />}
            {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

            {/* Grid layout theo yêu cầu mới */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 overflow-visible">
              {/* Hàng 1: Họ và tên, Tên đăng nhập */}
              <Field label="Họ và tên" error={errors.fullName} required>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  placeholder="Nhập họ và tên..."
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </Field>

              <Field label="Tên đăng nhập" error={errors.username} required>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.username ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  placeholder="Nhập tên đăng nhập..."
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  disabled={isEdit}
                />
              </Field>

              {/* Hàng 2: Email, Mật khẩu */}
              <Field label="Email" error={errors.email} required>
                <input
                  type="email"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>

              <Field label="Mật khẩu" error={errors.password} required={!isEdit}>
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all pr-32`}
                    placeholder={isEdit ? "Để trống nếu không đổi..." : "Nhập hoặc tạo mật khẩu..."}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
              </Field>

              {/* Hàng 3: Số điện thoại, Vai trò */}
              <Field label="Số điện thoại" error={errors.phone} required>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>

              <Dropdown
                label="Vai trò"
                options={ROLES}
                value={formData.role}
                onChange={val => setFormData({ ...formData, role: val })}
                placeholder="Chọn vai trò hệ thống"
                required
              />

              {/* Hàng 4: Địa chỉ */}
              <div className="md:col-span-2">
                <Field label="Địa chỉ">
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                    placeholder="Nhập địa chỉ chi tiết..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </Field>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400 italic font-medium">* Các trường thông tin bắt buộc</p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <LinkBtn to="/users" variant="secondary" className="flex-1 sm:flex-initial justify-center">Hủy</LinkBtn>
                <Btn 
                  type="submit" 
                  disabled={saving} 
                  className="flex-1 sm:flex-initial h-[46px] justify-center min-w-[140px]"
                >
                  {saving ? (
                    <>
                      {Icons.Loading}
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      {Icons.Check}
                      <span>{isEdit ? 'Cập nhật' : 'Tạo tài khoản'}</span>
                    </>
                  )}
                </Btn>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
