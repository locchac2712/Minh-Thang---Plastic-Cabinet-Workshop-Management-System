import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert, Loading, Table, Td } from '../../components/ui'
import { stockCountApi, materialApi, warehouseApi } from '../../services/api'

export default function StockCountForm() {
  const navigate = useNavigate()
  const [warehouses, setWarehouses] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    warehouseId: '',
    countDate: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [items, setItems] = useState([])

  const handleWarehouseChange = (wid) => {
    setForm({ ...form, warehouseId: wid })
    const filteredMats = materials.filter(m => !wid || m.warehouse?.id === Number(wid))
    setItems(filteredMats.map(m => ({
      materialId: m.id,
      name: m.name,
      sku: m.sku,
      systemQuantity: m.quantity ?? 0,
      actualQuantity: m.quantity ?? 0,
      notes: ''
    })))
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [whRes, matRes] = await Promise.all([
          warehouseApi.getAll(),
          materialApi.getAll(),
        ])
        setWarehouses(whRes.data.data || [])
        setMaterials(matRes.data.data || [])
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.warehouseId || !form.countDate) {
      setError('Vui lòng chọn kho và ngày kiểm kê.')
      return
    }
    try {
      setSubmitting(true)
      await stockCountApi.create({
        warehouseId: Number(form.warehouseId),
        countDate: form.countDate,
        notes: form.notes,
        items: items
      })
      navigate('/stock-counts')
    } catch {
      setError('Tạo phiếu kiểm kê thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Tạo phiếu kiểm kê">
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Tạo phiếu kiểm kê">
      <PageHeader title="Tạo phiếu kiểm kê" desc="Điền thông tin kiểm kê kho" />

      <Alert type="error" message={error} onClose={() => setError('')} />

      <form onSubmit={handleSubmit}>
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin kiểm kê</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={<>Kho <span className="text-red-500">*</span></>}
              value={form.warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              placeholder="Chọn kho"
            />
            <Field label={<>Ngày kiểm kê <span className="text-red-500">*</span></>} type="date" value={form.countDate}
              onChange={(e) => setForm({ ...form, countDate: e.target.value })} />
            <div className="md:col-span-2">
              <TextArea label="Ghi chú" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ghi chú cho phiếu kiểm kê..." />
            </div>
          </div>
        </Card>

        {form.warehouseId && items.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nhập số lượng thực tế</h2>
            <Table headers={['Vật tư', 'Tồn kho HT', 'Tồn thực tế', 'Ghi chú']}>
              {items.map((it, idx) => (
                <tr key={it.materialId} className="hover:bg-purple-50/30">
                  <Td>{it.name} <span className="text-xs text-gray-400">({it.sku})</span></Td>
                  <Td className="text-gray-500 font-medium">{it.systemQuantity}</Td>
                  <Td>
                    <input
                      type="number"
                      className="w-24 border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                      value={it.actualQuantity}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].actualQuantity = Number(e.target.value)
                        setItems(newItems)
                      }}
                      min="0"
                    />
                  </Td>
                  <Td>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500 inline-block px-3 py-1 text-sm bg-white border"
                      value={it.notes}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[idx].notes = e.target.value
                        setItems(newItems)
                      }}
                      placeholder="Ghi chú chênh lệch..."
                    />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Btn type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </Btn>
          <Btn variant="secondary" type="button" onClick={() => navigate('/stock-counts')}>
            Hủy bỏ
          </Btn>
        </div>
      </form>
    </DashboardLayout>
  )
}
