import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, Table, Td, Badge, Field, Select, Btn, Alert, Loading, PageHeader, fmt, fmtDate, TextArea } from '../../components/ui'
import { stockApi, warehouseApi, materialApi } from '../../services/api'

export default function StockAdjustments() {
  const [warehouses, setWarehouses] = useState([])
  const [materials, setMaterials] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    warehouseId: '',
    rawMaterialId: '',
    quantity: '',
    reason: '',
  })

  const fetchTransactions = async () => {
    try {
      const { data } = await stockApi.getTransactions({ type: 'ADJUSTMENT' })
      const items = Array.isArray(data) ? data : data?.data || []
      setTransactions(items)
    } catch {
      setTransactions([])
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, matRes] = await Promise.all([
          warehouseApi.getAll(),
          materialApi.getAll(),
        ])
        const whItems = Array.isArray(whRes.data) ? whRes.data : whRes.data?.data || []
        const matItems = Array.isArray(matRes.data) ? matRes.data : matRes.data?.data || []
        setWarehouses(whItems)
        setMaterials(matItems)
        await fetchTransactions()
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.warehouseId || !form.rawMaterialId || !form.quantity || !form.reason?.trim()) {
      setError('Vui lòng điền đầy đủ thông tin. Lý do là bắt buộc.')
      return
    }
    const qty = Number(form.quantity)
    if (qty === 0 || isNaN(qty)) {
      setError('Số lượng phải khác 0.')
      return
    }
    try {
      setSubmitting(true)
      await stockApi.adjust({
        warehouse: { id: form.warehouseId },
        rawMaterial: { id: form.rawMaterialId },
        quantity: Math.abs(qty),
        reference: 'ADJUSTMENT',
        reason: form.reason.trim(),
      })
      setSuccess('Điều chỉnh tồn kho thành công!')
      setForm({ warehouseId: '', rawMaterialId: '', quantity: '', reason: '' })
      await fetchTransactions()
    } catch {
      setError('Điều chỉnh thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DashboardLayout title="Điều chỉnh tồn kho"><Loading /></DashboardLayout>

  const sorted = [...transactions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  return (
    <DashboardLayout title="Điều chỉnh tồn kho">
      <PageHeader title="Điều chỉnh tồn kho" desc="Tạo phiếu điều chỉnh và xem lịch sử" />

      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tạo điều chỉnh mới</h3>

        <Alert type="success" message={success} onClose={() => setSuccess('')} />
        <Alert type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={<>Kho <span className="text-red-500">*</span></>}
            value={form.warehouseId}
            onChange={(e) => handleChange({ target: { name: 'warehouseId', value: e.target.value } })}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            placeholder="Chọn kho"
          />
          <Select
            label={<>Nguyên vật liệu <span className="text-red-500">*</span></>}
            value={form.rawMaterialId}
            onChange={(e) => handleChange({ target: { name: 'rawMaterialId', value: e.target.value } })}
            options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.sku})` }))}
            placeholder="Chọn NVL"
          />
          <Field
            label={<>Số lượng <span className="text-red-500">*</span></>}
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            placeholder="Dương = tăng, Âm = giảm"
          />
          <div className="md:col-span-2">
            <TextArea
              label={<>Lý do <span className="text-red-500">*</span></>}
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Nhập lý do điều chỉnh (bắt buộc)..."
            />
          </div>
          <div className="md:col-span-2">
            <Btn type="submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Điều chỉnh tồn kho'}
            </Btn>
          </div>
        </form>
      </Card>

      <h3 className="text-sm font-semibold text-gray-900 mb-3">Lịch sử điều chỉnh</h3>
      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-gray-400 text-sm">Chưa có điều chỉnh nào</p>
        </Card>
      ) : (
        <Table headers={['Mã GD', 'NVL', 'Kho', 'Số lượng', 'Lý do', 'Người thực hiện', 'Ngày']}>
          {sorted.map((tx) => (
            <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
              <Td className="font-mono text-gray-600">{tx.transactionNumber || tx.transactionCode || tx.id}</Td>
              <Td className="font-medium text-gray-900">{tx.rawMaterial?.name || '—'}</Td>
              <Td className="text-gray-500">{tx.warehouse?.name || '—'}</Td>
              <Td className="text-right font-semibold">
                <Badge variant={tx.quantity >= 0 ? 'green' : 'red'}>
                  {tx.quantity >= 0 ? '+' : ''}{fmt(tx.quantity)}
                </Badge>
              </Td>
              <Td className="text-gray-500 max-w-[200px] truncate">{tx.reason || '—'}</Td>
              <Td className="text-gray-500">{tx.createdBy?.fullName || '—'}</Td>
              <Td className="text-gray-500">{fmtDate(tx.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
