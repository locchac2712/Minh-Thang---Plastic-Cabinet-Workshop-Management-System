import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, LinkBtn, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

const TX_TYPE = {
  STOCK_IN: { label: 'Nhập', variant: 'green' },
  STOCK_OUT: { label: 'Xuất', variant: 'red' },
  ADJUSTMENT: { label: 'Điều chỉnh', variant: 'blue' },
}

export default function WarehouseDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getWarehouse().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Kho hàng"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title="Dashboard Kho hàng">
      <div className="flex flex-wrap gap-3 mb-6">
        <LinkBtn to="/stock/in" variant="primary">+ Nhập kho</LinkBtn>
        <LinkBtn to="/stock/out" variant="secondary">+ Xuất kho</LinkBtn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatCard label="Tổng NVL" value={fmt(stats?.totalMaterials)} color="blue" />
        <StatCard label="Cảnh báo tồn kho" value={fmt(stats?.lowStockCount)} color="red" />
        <StatCard label="Giá trị tồn kho" value={fmtCurrency(stats?.totalStockValue)} color="green" />
      </div>

      {stats?.lowStockMaterials?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Cảnh báo tồn kho thấp</h3>
          <Table headers={['Tên', 'SL hiện tại', 'SL tối thiểu', 'Trạng thái']}>
            {stats.lowStockMaterials.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <Td className="font-medium text-gray-900">{m.name}</Td>
                <Td className="text-red-600 font-semibold">{fmt(m.currentStock)}</Td>
                <Td>{fmt(m.minimumStock)}</Td>
                <Td><Badge variant="red">Cần nhập</Badge></Td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Giao dịch gần đây</h3>
        <Table headers={['Mã', 'Loại', 'NVL', 'SL', 'Ngày']}>
          {(stats?.recentTransactions || []).map((t) => {
            const tx = TX_TYPE[t.type] || { label: t.type, variant: 'gray' }
            return (
              <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                <Td className="font-medium text-gray-900">{t.transactionNumber || t.id}</Td>
                <Td><Badge variant={tx.variant}>{tx.label}</Badge></Td>
                <Td>{t.rawMaterial?.name || '—'}</Td>
                <Td className="font-semibold">{fmt(t.quantity)}</Td>
                <Td className="text-gray-500">{fmtDate(t.createdAt)}</Td>
              </tr>
            )
          })}
          {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
            <tr><Td colSpan={5} className="text-center text-gray-400">Chưa có giao dịch</Td></tr>
          )}
        </Table>
      </div>
    </DashboardLayout>
  )
}
