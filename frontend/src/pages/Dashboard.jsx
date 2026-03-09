import { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { StatCard, Card, Table, Td, Badge, Loading, fmtCurrency, fmt } from '../components/ui'
import { dashboardApi, salesOrderApi, productionOrderApi } from '../services/api'

const ORDER_BADGE = {
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
  CONFIRMED: { variant: 'blue', label: 'Đã xác nhận' },
  PROCESSING: { variant: 'purple', label: 'Đang xử lý' },
  DELIVERED: { variant: 'green', label: 'Đã giao' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

const PROD_BADGE = {
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang chạy' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [prodOrders, setProdOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, prodRes] = await Promise.all([
          dashboardApi.getStats(),
          salesOrderApi.getAll(),
          productionOrderApi.getAll({ status: 'IN_PROGRESS' }),
        ])
        setStats(statsRes.data.data || statsRes.data)
        const orderData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || []
        setRecentOrders(orderData.slice(0, 5))
        const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.data || []
        setProdOrders(prodData.slice(0, 5))
      } catch {
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <StatCard label="Sản phẩm" value={stats?.totalProducts} color="purple" />
        <StatCard label="Khách hàng" value={stats?.totalCustomers} color="blue" />
        <StatCard label="Đơn hàng" value={stats?.totalSalesOrders} color="green" />
        <StatCard label="Phê duyệt chờ" value={stats?.pendingApprovals} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Đơn hàng gần đây</h3>
            </div>
            {recentOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Chưa có đơn hàng</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Số đơn</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Khách hàng</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Tổng tiền</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((o) => {
                      const st = ORDER_BADGE[o.status] || { variant: 'gray', label: o.status }
                      return (
                        <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                          <Td className="font-mono text-gray-600">{o.orderNumber || o.id}</Td>
                          <Td>{o.customer?.name || '—'}</Td>
                          <Td className="text-right font-medium">{o.totalAmount ? fmtCurrency(o.totalAmount) : '—'}</Td>
                          <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Lệnh SX đang chạy</h3>
            </div>
            {prodOrders.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Không có lệnh SX đang chạy</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Mã LSX</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Sản phẩm</th>
                      <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">SL</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {prodOrders.map((po) => {
                      const st = PROD_BADGE[po.status] || { variant: 'gray', label: po.status }
                      return (
                        <tr key={po.id} className="hover:bg-purple-50/30 transition-colors">
                          <Td className="font-mono text-gray-600">{po.orderNumber || po.id}</Td>
                          <Td>{po.product?.name || '—'}</Td>
                          <Td className="text-right font-medium">{po.quantity ? fmt(po.quantity) : '—'}</Td>
                          <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
