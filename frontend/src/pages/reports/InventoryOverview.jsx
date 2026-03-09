import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, PageHeader, fmt, fmtCurrency } from '../../components/ui'
import { materialApi, dashboardApi } from '../../services/api'

export default function InventoryOverview() {
  const [materials, setMaterials] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matRes, statsRes] = await Promise.all([
          materialApi.getAll(),
          dashboardApi.getStats(),
        ])
        const matItems = Array.isArray(matRes.data) ? matRes.data : matRes.data?.data || []
        setMaterials(matItems)
        setStats(statsRes.data?.data || statsRes.data)
      } catch {
        setMaterials([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardLayout title="Tổng quan tồn kho"><Loading /></DashboardLayout>

  const activeMaterials = materials.filter((m) => m.active !== false)
  const totalValue = materials.reduce((sum, m) => sum + (m.quantity || 0) * (m.price || 0), 0)
  const lowStock = materials.filter((m) => m.quantity != null && m.minQuantity != null && m.quantity <= m.minQuantity)

  const warehouseGroups = {}
  materials.forEach((m) => {
    const whName = m.warehouse?.name || 'Chưa phân kho'
    if (!warehouseGroups[whName]) warehouseGroups[whName] = { count: 0, value: 0 }
    warehouseGroups[whName].count++
    warehouseGroups[whName].value += (m.quantity || 0) * (m.price || 0)
  })

  return (
    <DashboardLayout title="Tổng quan tồn kho">
      <PageHeader title="Tổng quan tồn kho" desc="Dashboard tổng hợp tình trạng tồn kho" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng NVL" value={fmt(materials.length)} color="blue" />
        <StatCard label="Cảnh báo thấp" value={fmt(stats?.lowStockItems ?? lowStock.length)} color="red" />
        <StatCard label="Giá trị tồn kho" value={fmtCurrency(totalValue)} color="green" />
        <StatCard label="NVL hoạt động" value={fmt(activeMaterials.length)} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Phân bổ tồn kho</h3>
          {Object.keys(warehouseGroups).length === 0 ? (
            <p className="text-sm text-gray-400">Không có dữ liệu</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(warehouseGroups).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{info.count} nguyên vật liệu</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{fmtCurrency(info.value)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Cảnh báo <Badge variant="red">{lowStock.length}</Badge>
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400">Tồn kho ổn định</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {lowStock.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{fmt(m.quantity)} / {fmt(m.minQuantity)}</p>
                    <p className="text-xs text-red-500">Thiếu {fmt((m.minQuantity || 0) - (m.quantity || 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-3">Tất cả NVL</h3>
      <Table headers={['Tên', 'SKU', 'Kho', 'Số lượng', 'Giá trị']}>
        {materials.map((m) => (
          <tr key={m.id} className={`transition-colors ${m.quantity != null && m.minQuantity != null && m.quantity <= m.minQuantity ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-purple-50/30'}`}>
            <Td className="font-medium text-gray-900">{m.name}</Td>
            <Td className="text-gray-500 font-mono">{m.sku}</Td>
            <Td className="text-gray-500">{m.warehouse?.name || '—'}</Td>
            <Td className="text-right">{fmt(m.quantity)}</Td>
            <Td className="text-right font-semibold">{fmtCurrency((m.quantity || 0) * (m.price || 0))}</Td>
          </tr>
        ))}
      </Table>
    </DashboardLayout>
  )
}
