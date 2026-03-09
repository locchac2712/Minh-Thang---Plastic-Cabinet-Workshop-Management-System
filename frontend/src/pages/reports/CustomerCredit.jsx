import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { StatCard, Table, Td, Badge, Loading, PageHeader, fmt, fmtCurrency } from '../../components/ui'
import { customerApi } from '../../services/api'

function getCreditStatus(customer) {
  const { creditLimit = 0, currentBalance = 0 } = customer
  if (currentBalance > creditLimit) return { label: 'Vượt hạn mức', variant: 'red' }
  if (currentBalance > creditLimit * 0.8) return { label: 'Gần hạn mức', variant: 'yellow' }
  return { label: 'Bình thường', variant: 'green' }
}

export default function CustomerCredit() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await customerApi.getAll()
        const items = Array.isArray(data) ? data : data?.data || []
        setCustomers(items)
      } catch {
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardLayout title="Tín dụng khách hàng"><Loading /></DashboardLayout>

  const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0)
  const totalBalance = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0)
  const overLimit = customers.filter((c) => (c.currentBalance || 0) > (c.creditLimit || 0))

  const sorted = [...customers].sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))

  return (
    <DashboardLayout title="Tín dụng khách hàng">
      <PageHeader title="Danh sách tín dụng khách hàng" desc="Theo dõi hạn mức và dư nợ khách hàng" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng KH" value={fmt(customers.length)} color="blue" />
        <StatCard label="Tổng hạn mức" value={fmtCurrency(totalCreditLimit)} color="green" />
        <StatCard label="Tổng dư nợ" value={fmtCurrency(totalBalance)} color="orange" />
        <StatCard label="KH vượt hạn mức" value={fmt(overLimit.length)} color="red" />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Chưa có khách hàng</div>
      ) : (
        <Table headers={['Mã KH', 'Tên', 'Hạn mức', 'Dư nợ', 'Còn lại', 'Trạng thái']}>
          {sorted.map((c) => {
            const status = getCreditStatus(c)
            const remaining = (c.creditLimit || 0) - (c.currentBalance || 0)
            const isOver = (c.currentBalance || 0) > (c.creditLimit || 0)
            return (
              <tr key={c.id} className={`transition-colors ${isOver ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-purple-50/30'}`}>
                <Td className="font-mono text-gray-600">{c.customerCode || c.id}</Td>
                <Td className="font-medium text-gray-900">{c.name}</Td>
                <Td className="text-right">{fmtCurrency(c.creditLimit)}</Td>
                <Td className={`text-right font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>{fmtCurrency(c.currentBalance)}</Td>
                <Td className={`text-right ${remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmtCurrency(remaining)}</Td>
                <Td><Badge variant={status.variant}>{status.label}</Badge></Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
