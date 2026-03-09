import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert, Table, Td, Loading, EmptyState, fmt, fmtDate } from '../../components/ui'
import { stockApi, materialApi, warehouseApi } from '../../services/api'

export default function StockOut() {
  const [warehouses, setWarehouses] = useState([])
  const [materials, setMaterials] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [form, setForm] = useState({
    warehouseId: '',
    rawMaterialId: '',
    quantity: '',
    reference: '',
    reason: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, matRes, txRes] = await Promise.all([
          warehouseApi.getAll(),
          materialApi.getAll(),
          stockApi.getTransactions({ type: 'STOCK_OUT' }),
        ])
        setWarehouses(whRes.data.data || [])
        setMaterials(matRes.data.data || [])
        const txData = Array.isArray(txRes.data) ? txRes.data : txRes.data?.data || []
        setTransactions(txData.slice(0, 10))
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    setForm(updated)
    setError('')
    setSuccess(false)

    if (e.target.name === 'rawMaterialId' || e.target.name === 'quantity') {
      const mat = materials.find((m) => m.id === Number(updated.rawMaterialId))
      if (mat && Number(updated.quantity) > (mat.quantity ?? 0)) {
        setWarning(`Số lượng xuất (${updated.quantity}) vượt quá tồn kho hiện có (${fmt(mat.quantity ?? 0)}).`)
      } else {
        setWarning('')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.warehouseId || !form.rawMaterialId || !form.quantity || Number(form.quantity) <= 0) {
      setError('Vui lòng điền đầy đủ thông tin hợp lệ.')
      return
    }
    try {
      setSubmitting(true)
      await stockApi.stockOut({
        warehouse: { id: form.warehouseId },
        rawMaterial: { id: form.rawMaterialId },
        quantity: Number(form.quantity),
        reference: form.reference,
        reason: form.reason,
      })
      setSuccess(true)
      setWarning('')
      setForm({ warehouseId: '', rawMaterialId: '', quantity: '', reference: '', reason: '' })
      const txRes = await stockApi.getTransactions({ type: 'STOCK_OUT' })
      const txData = Array.isArray(txRes.data) ? txRes.data : txRes.data?.data || []
      setTransactions(txData.slice(0, 10))
      const matRes = await materialApi.getAll()
      setMaterials(matRes.data.data || [])
    } catch {
      setError('Xuất kho thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSuccess(false)
    setWarning('')
    setForm({ warehouseId: '', rawMaterialId: '', quantity: '', reference: '', reason: '' })
  }

  if (loading) {
    return (
      <DashboardLayout title="Xuất kho">
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Xuất kho">
      <PageHeader title="Xuất kho" desc="Tạo phiếu xuất kho nguyên vật liệu" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tạo phiếu xuất kho</h2>

          <Alert type="success" message={success ? 'Xuất kho thành công!' : ''} onClose={resetForm} />
          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="warning" message={warning} />

          <form onSubmit={handleSubmit} className="space-y-4">
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
              options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.sku}) — Tồn: ${fmt(m.quantity ?? 0)}` }))}
              placeholder="Chọn NVL"
            />
            <Field label={<>Số lượng <span className="text-red-500">*</span></>} name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="Nhập số lượng" />
            <Field label="Tham chiếu" name="reference" value={form.reference} onChange={handleChange} placeholder="Số phiếu, lệnh sản xuất..." />
            <TextArea label="Lý do" name="reason" value={form.reason} onChange={handleChange} placeholder="Ghi chú lý do xuất kho..." />
            <Btn type="submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Xuất kho'}
            </Btn>
          </form>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử xuất kho gần đây</h2>
          {transactions.length === 0 ? <EmptyState message="Chưa có giao dịch" /> : (
            <Table headers={['Mã GD', 'NVL', 'Kho', 'Số lượng', 'Tham chiếu', 'Ngày']}>
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
                  <Td className="font-mono text-gray-600">{tx.transactionCode || tx.id}</Td>
                  <Td>{tx.rawMaterial?.name || '—'}</Td>
                  <Td className="text-gray-500">{tx.warehouse?.name || '—'}</Td>
                  <Td className="text-right font-medium text-red-600">-{fmt(tx.quantity)}</Td>
                  <Td className="text-gray-500">{tx.reference || '—'}</Td>
                  <Td className="text-gray-500">{fmtDate(tx.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
