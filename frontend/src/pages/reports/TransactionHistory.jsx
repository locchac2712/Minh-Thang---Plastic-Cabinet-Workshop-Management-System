import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, Table, Td, Badge, FilterTabs, Loading, PageHeader, fmt, fmtDate } from '../../components/ui'
import { stockApi } from '../../services/api'

const TYPE_LABELS = {
  STOCK_IN: 'Nhập kho',
  STOCK_OUT: 'Xuất kho',
  ADJUSTMENT: 'Điều chỉnh',
  PRODUCTION_ISSUE: 'Xuất SX',
  DELIVERY_ISSUE: 'Xuất giao',
  RECEIVE_MATERIAL: 'Nhận NVL',
  RECEIVE_FINISHED: 'Nhận TP',
}

const TYPE_BADGE = {
  STOCK_IN: 'green',
  STOCK_OUT: 'red',
  ADJUSTMENT: 'purple',
  PRODUCTION_ISSUE: 'blue',
  DELIVERY_ISSUE: 'cyan',
  RECEIVE_MATERIAL: 'green',
  RECEIVE_FINISHED: 'blue',
}

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'STOCK_IN', label: 'Nhập kho' },
  { value: 'STOCK_OUT', label: 'Xuất kho' },
  { value: 'ADJUSTMENT', label: 'Điều chỉnh' },
]

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = filter ? { type: filter } : {}
        const { data } = await stockApi.getTransactions(params)
        const items = Array.isArray(data) ? data : data?.data || []
        setTransactions(items)
      } catch {
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    fetchData()
  }, [filter])

  if (loading) return <DashboardLayout title="Lịch sử giao dịch"><Loading /></DashboardLayout>

  const sorted = [...transactions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  return (
    <DashboardLayout title="Lịch sử giao dịch">
      <PageHeader title="Lịch sử giao dịch" desc="Theo dõi tất cả giao dịch kho hàng" />

      <FilterTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />

      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-gray-400 text-sm">Không có giao dịch nào</p>
        </Card>
      ) : (
        <Table headers={['Mã GD', 'Loại', 'NVL', 'Kho', 'Số lượng', 'Tham chiếu', 'Ngày']}>
          {sorted.map((tx) => (
            <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
              <Td className="font-mono text-gray-600">{tx.transactionNumber || tx.transactionCode || tx.id}</Td>
              <Td>
                <Badge variant={TYPE_BADGE[tx.type] || 'gray'}>
                  {TYPE_LABELS[tx.type] || tx.type}
                </Badge>
              </Td>
              <Td className="font-medium text-gray-900">{tx.rawMaterial?.name || '—'}</Td>
              <Td className="text-gray-500">{tx.warehouse?.name || '—'}</Td>
              <Td className="text-right font-semibold">{fmt(tx.quantity)}</Td>
              <Td className="text-gray-500">{tx.reference || '—'}</Td>
              <Td className="text-gray-500">{fmtDate(tx.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Card className="p-5 mt-6">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <p className="text-sm text-gray-500">
            Trang này hiển thị giao dịch kho. Để xem lịch sử thanh toán, vui lòng vào chi tiết từng đơn hàng.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  )
}
