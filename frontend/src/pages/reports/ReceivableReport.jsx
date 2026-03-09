import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, StatCard, Table, Td, Badge, Loading, EmptyState, fmtCurrency } from '../../components/ui'
import { customerApi } from '../../services/api'

export default function ReceivableReport() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    customerApi.getAll()
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [])

  const totalDebt = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0)
  const debtCustomers = customers.filter((c) => (c.currentBalance || 0) > 0)
  const overdueCustomers = debtCustomers.filter((c) => (c.currentBalance || 0) > (c.creditLimit || 0))

  return (
    <DashboardLayout title="Báo cáo công nợ">
      <PageHeader title="Báo cáo công nợ" desc="Theo dõi công nợ khách hàng" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <StatCard label="Tổng công nợ" value={fmtCurrency(totalDebt)} color="blue" />
        <StatCard label="Số KH có nợ" value={debtCustomers.length} color="orange" />
        <StatCard label="Nợ quá hạn mức" value={overdueCustomers.length} color="red" />
      </div>

      {loading ? <Loading /> : customers.length === 0 ? <EmptyState message="Không có dữ liệu" /> : (
        <Table headers={['Tên KH', 'Hạn mức', 'Dư nợ hiện tại', 'Trạng thái']}>
          {customers.map((c) => {
            const balance = c.currentBalance || 0
            const limit = c.creditLimit || 0
            const isOverdue = balance > limit && limit > 0
            const hasDebt = balance > 0

            return (
              <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-medium text-gray-900">{c.name}</Td>
                <Td>{fmtCurrency(limit)}</Td>
                <Td className="font-medium">{fmtCurrency(balance)}</Td>
                <Td>
                  {isOverdue ? (
                    <Badge variant="red">Quá hạn mức</Badge>
                  ) : hasDebt ? (
                    <Badge variant="yellow">Có nợ</Badge>
                  ) : (
                    <Badge variant="green">Không nợ</Badge>
                  )}
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
