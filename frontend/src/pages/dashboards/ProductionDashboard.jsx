import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, LinkBtn, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

export default function ProductionDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getProduction().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Sản xuất"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title="Dashboard Sản xuất">
      <div className="flex flex-wrap gap-3 mb-6">
        <LinkBtn to="/production-orders/new" variant="primary">+ Tạo lệnh SX</LinkBtn>
        <LinkBtn to="/work-orders/new" variant="secondary">+ Tạo Work Order</LinkBtn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Tổng lệnh SX" value={fmt(stats?.totalOrders)} color="blue" />
        <StatCard label="Đang SX" value={fmt(stats?.inProgress)} color="purple" />
        <StatCard label="Hoàn thành" value={fmt(stats?.completed)} color="green" />
        <StatCard label="Tỷ lệ hoàn thành" value={stats?.completionRate != null ? stats.completionRate + '%' : '—'} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tỷ lệ phế phẩm</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">
                {stats?.scrapRate != null ? stats.scrapRate + '%' : '—'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ sản phẩm bị lỗi / phế phẩm</p>
              <p className="text-xs text-gray-400 mt-1">Mục tiêu: dưới 5%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Work Order chờ xử lý</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">
                {fmt(stats?.pendingWorkOrders)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số work order đang chờ thực hiện</p>
              <Link to="/work-orders" className="text-xs text-purple-600 hover:text-purple-800 mt-1 inline-block">
                Xem tất cả →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {stats?.inProgressOrders?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Lệnh SX đang chạy</h3>
          <Table headers={['Số lệnh', 'Sản phẩm', 'SL yêu cầu', 'SL hoàn thành', 'Tiến độ', 'Ngày bắt đầu']}>
            {stats.inProgressOrders.map((o) => {
              const pct = o.requiredQuantity > 0
                ? Math.round((o.completedQuantity / o.requiredQuantity) * 100)
                : 0
              return (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <Td>
                    <Link to={`/production-orders/${o.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td className="font-medium text-gray-900">{o.product?.name || '—'}</Td>
                  <Td>{fmt(o.requiredQuantity)}</Td>
                  <Td className="font-semibold text-emerald-600">{fmt(o.completedQuantity)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                        <div
                          className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: Math.min(pct, 100) + '%' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-10">{pct}%</span>
                    </div>
                  </Td>
                  <Td className="text-gray-500">{fmtDate(o.startDate)}</Td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}
    </DashboardLayout>
  )
}
