import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Loading } from '../../components/ui'
import { roleApi } from '../../services/api'

const ROLE_INFO = {
  ADMIN:              { label: 'Admin',              desc: 'Quản trị viên hệ thống, toàn quyền truy cập',           color: 'bg-red-50 text-red-600' },
  DIRECTOR:           { label: 'Director',           desc: 'Giám đốc, giám sát tổng quan và phê duyệt',            color: 'bg-purple-50 text-purple-600' },
  SALES_STAFF:        { label: 'Sales Staff',        desc: 'Nhân viên bán hàng, quản lý khách hàng và đơn hàng',    color: 'bg-blue-50 text-blue-600' },
  SALES_MANAGER:      { label: 'Sales Manager',      desc: 'Quản lý bán hàng, giám sát đội ngũ sales',             color: 'bg-cyan-50 text-cyan-600' },
  WAREHOUSE_MANAGER:  { label: 'Warehouse Manager',  desc: 'Quản lý kho, kiểm soát tồn kho và xuất nhập',          color: 'bg-orange-50 text-orange-600' },
  PRODUCTION_MANAGER: { label: 'Production Manager', desc: 'Quản lý sản xuất, theo dõi tiến độ và BOM',            color: 'bg-green-50 text-green-600' },
}

function getRoleKey(item) {
  if (typeof item === 'string') return item
  return item?.role || item?.name || String(item)
}

export default function RoleList() {
  const [roleKeys, setRoleKeys] = useState(Object.keys(ROLE_INFO))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    roleApi.getAll()
      .then(({ data }) => {
        const list = data?.data || data || []
        if (Array.isArray(list) && list.length > 0) {
          setRoleKeys(list.map(getRoleKey))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout title="Quản lý vai trò">
      <PageHeader title="Quản lý vai trò" desc="Phân quyền và quản lý vai trò người dùng" />

      {loading ? <Loading /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {roleKeys.map((key) => {
            const k = String(key)
            const info = ROLE_INFO[k] || { label: k, desc: '', color: 'bg-gray-50 text-gray-600' }
            return (
              <Link key={k} to={`/roles/${k}`}>
                <Card className="p-6 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${info.color} flex items-center justify-center mb-4 text-lg font-bold group-hover:scale-110 transition-transform`}>
                    {String(info.label).charAt(0)}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                    {info.label}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{info.desc}</p>
                  <div className="mt-4 text-xs text-gray-400 flex items-center gap-1">
                    Xem danh sách người dùng
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
