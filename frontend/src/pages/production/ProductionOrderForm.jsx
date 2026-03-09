import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert } from '../../components/ui'
import { productionOrderApi, productApi, salesOrderApi, bomApi } from '../../services/api'

export default function ProductionOrderForm() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    productId: '',
    salesOrderId: '',
    bomId: '',
    quantity: '',
    priority: 1,
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [products, setProducts] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [boms, setBoms] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    productApi.getAll().then((res) => setProducts(res.data.data || res.data)).catch(() => {})
    salesOrderApi.getAll().then((res) => setSalesOrders(res.data.data || res.data)).catch(() => {})
    bomApi.getAll().then((res) => setBoms(res.data.data || res.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        product: { id: form.productId },
        salesOrder: form.salesOrderId ? { id: form.salesOrderId } : null,
        bom: form.bomId ? { id: form.bomId } : null,
        quantity: Number(form.quantity),
        priority: Number(form.priority),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        notes: form.notes || null,
      }
      await productionOrderApi.create(payload)
      navigate('/production-orders')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Tạo lệnh sản xuất">
      <PageHeader title="Tạo lệnh sản xuất" desc="Điền thông tin để tạo lệnh sản xuất mới" />

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert type="error" message={error} onClose={() => setError('')} />

            <Select
              label={<>Sản phẩm <span className="text-red-500">*</span></>}
              value={form.productId}
              onChange={(e) => handleChange({ target: { name: 'productId', value: e.target.value } })}
              required
              options={products.map((p) => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
              placeholder="-- Chọn sản phẩm --"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Đơn hàng liên kết"
                value={form.salesOrderId}
                onChange={(e) => handleChange({ target: { name: 'salesOrderId', value: e.target.value } })}
                options={salesOrders.map((s) => ({ value: s.id, label: s.orderNumber }))}
                placeholder="-- Không --"
              />
              <Select
                label="BOM"
                value={form.bomId}
                onChange={(e) => handleChange({ target: { name: 'bomId', value: e.target.value } })}
                options={boms.map((b) => ({ value: b.id, label: b.name || b.bomCode || `BOM #${b.id}` }))}
                placeholder="-- Không --"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={<>Số lượng <span className="text-red-500">*</span></>} name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} required />
              <Field label="Độ ưu tiên (0-10)" name="priority" type="number" min="0" max="10" value={form.priority} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Ngày bắt đầu" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              <Field label="Ngày kết thúc" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>

            <TextArea label="Ghi chú" name="notes" value={form.notes} onChange={handleChange} />

            <div className="flex items-center gap-3 pt-2">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Tạo lệnh sản xuất'}
              </Btn>
              <Btn variant="ghost" type="button" onClick={() => navigate('/production-orders')}>
                Hủy
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
