import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { salesOrderApi } from '../../services/api'
import { PageHeader, DetailGrid, Card, Table, Td, Badge, Btn, LinkBtn, Loading, Alert, Field, TextArea, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const orderStatusVariant = {
  PENDING: 'yellow', CONFIRMED: 'blue', IN_PRODUCTION: 'purple',
  READY_FOR_DELIVERY: 'cyan', DELIVERED: 'green', CANCELLED: 'red',
}
const orderStatusLabel = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', IN_PRODUCTION: 'Đang sản xuất',
  READY_FOR_DELIVERY: 'Sẵn giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
}

const paymentVariant = { UNPAID: 'red', PARTIAL: 'yellow', PAID: 'green' }
const paymentLabel = { UNPAID: 'Chưa thanh toán', PARTIAL: 'Thanh toán một phần', PAID: 'Đã thanh toán' }

const STATUS_FLOW = {
  PENDING: { next: 'CONFIRMED', label: 'Xác nhận' },
  CONFIRMED: { next: 'IN_PRODUCTION', label: 'Bắt đầu SX' },
  IN_PRODUCTION: { next: 'READY_FOR_DELIVERY', label: 'Sẵn sàng giao' },
  READY_FOR_DELIVERY: { next: 'DELIVERED', label: 'Đã giao hàng' },
}

export default function SalesOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '', paymentDate: '', paymentMethod: '', reference: '', notes: '',
  })
  const [paymentError, setPaymentError] = useState('')
  const [paymentSaving, setPaymentSaving] = useState(false)

  const fetchOrder = () => {
    salesOrderApi.getById(id)
      .then((res) => setOrder(res.data.data))
      .catch(() => navigate('/sales-orders'))
      .finally(() => setLoading(false))
  }

  const fetchPayments = () => {
    salesOrderApi.getPayments(id)
      .then((res) => setPayments(res.data.data || []))
      .catch(() => setPayments([]))
  }

  useEffect(() => {
    fetchOrder()
    fetchPayments()
  }, [id])

  const handleStatusChange = async () => {
    const flow = STATUS_FLOW[order.status]
    if (!flow) return
    try {
      setActionLoading(true)
      await salesOrderApi.changeStatus(id, flow.next)
      fetchOrder()
    } catch { /* ignore */ }
    finally { setActionLoading(false) }
  }

  const handleCancelOrder = async () => {
    try {
      setActionLoading(true)
      await salesOrderApi.changeStatus(id, 'CANCELLED')
      fetchOrder()
    } catch { /* ignore */ }
    finally { setActionLoading(false) }
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setPaymentSaving(true)
    setPaymentError('')
    try {
      await salesOrderApi.addPayment(id, {
        ...paymentForm,
        amount: Number(paymentForm.amount) || 0,
      })
      setPaymentForm({ amount: '', paymentDate: '', paymentMethod: '', reference: '', notes: '' })
      setShowPaymentForm(false)
      fetchPayments()
      fetchOrder()
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setPaymentSaving(false)
    }
  }

  if (loading) {
    return <DashboardLayout><Loading /></DashboardLayout>
  }

  if (!order) return null

  const flow = STATUS_FLOW[order.status]
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const remaining = (order.totalAmount || 0) - totalPaid

  return (
    <DashboardLayout>
      <PageHeader title="Chi tiết đơn hàng">
        <LinkBtn to="/sales-orders" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        {flow && (
          <Btn onClick={handleStatusChange} disabled={actionLoading}>{flow.label}</Btn>
        )}
        {order.status === 'PENDING' && (
          <Btn variant="danger" onClick={handleCancelOrder} disabled={actionLoading}>Hủy đơn</Btn>
        )}
      </PageHeader>

      <DetailGrid items={[
        { label: 'Số đơn hàng', value: order.orderNumber },
        { label: 'Trạng thái', value: <Badge variant={orderStatusVariant[order.status] || 'gray'}>{orderStatusLabel[order.status] || order.status}</Badge> },
        { label: 'Khách hàng', value: order.customer?.name },
        { label: 'NV bán hàng', value: order.salesStaff?.fullName },
        { label: 'Thanh toán', value: <Badge variant={paymentVariant[order.paymentStatus] || 'gray'}>{paymentLabel[order.paymentStatus] || order.paymentStatus}</Badge> },
        { label: 'Ngày giao hàng', value: fmtDate(order.deliveryDate) },
        ...(order.deliveryAddress ? [{ label: 'Địa chỉ giao hàng', value: order.deliveryAddress }] : []),
        ...(order.notes ? [{ label: 'Ghi chú', value: order.notes }] : []),
      ]} />

      <Card className="mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Sản phẩm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(order.items || []).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                  <Td className="text-gray-500">{idx + 1}</Td>
                  <Td className="font-medium text-gray-900">{item.product?.name || '—'}</Td>
                  <Td className="text-gray-700">{item.quantity}</Td>
                  <Td className="text-gray-700">{fmtCurrency(item.unitPrice)}</Td>
                  <Td className="font-medium text-gray-900">{fmtCurrency(item.totalPrice)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Thanh toán</h3>
          {order.status !== 'CANCELLED' && (
            <Btn variant="ghost" onClick={() => setShowPaymentForm(!showPaymentForm)}>
              {Icons.plus} Ghi nhận thanh toán
            </Btn>
          )}
        </div>

        {showPaymentForm && (
          <Card className="bg-gray-50/80 p-5 mb-5 border-gray-200">
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <Alert type="error" message={paymentError} onClose={() => setPaymentError('')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Số tiền" type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                <Field label="Ngày thanh toán" type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} required />
                <Field label="Phương thức" value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} placeholder="Chuyển khoản, tiền mặt..." />
                <Field label="Số tham chiếu" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                <div className="sm:col-span-2">
                  <TextArea label="Ghi chú" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Btn type="submit" disabled={paymentSaving}>
                  {paymentSaving ? 'Đang lưu...' : 'Xác nhận'}
                </Btn>
                <Btn variant="ghost" type="button" onClick={() => setShowPaymentForm(false)}>Hủy</Btn>
              </div>
            </form>
          </Card>
        )}

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Số tiền', 'Ngày', 'Phương thức', 'Tham chiếu', 'Người ghi'].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{fmtDate(p.paymentDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.paymentMethod || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.reference || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.recordedBy?.fullName || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Chưa có thanh toán nào</p>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="grid grid-cols-3 gap-4 text-right">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Tổng đơn hàng</p>
            <p className="text-lg font-semibold text-gray-900">{fmtCurrency(order.totalAmount)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Đã thanh toán</p>
            <p className="text-lg font-semibold text-emerald-600">{fmtCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Còn lại</p>
            <p className="text-lg font-semibold text-red-600">{fmtCurrency(remaining)}</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  )
}
