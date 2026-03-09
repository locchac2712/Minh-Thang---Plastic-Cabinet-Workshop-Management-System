import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert, Loading, Icons } from '../../components/ui'
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

  const addItem = () => {
    setItems([...items, { rawMaterialId: '', systemQuantity: 0, actualQuantity: '', notes: '' }])
  }

  const updateItem = (index, field, value) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }

    if (field === 'rawMaterialId') {
      const mat = materials.find((m) => m.id === Number(value))
      updated[index].systemQuantity = mat?.quantity ?? 0
    }

    setItems(updated)
  }

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.warehouseId || !form.countDate) {
      setError('Vui lòng chọn kho và ngày kiểm kê.')
      return
    }
    if (items.length === 0) {
      setError('Vui lòng thêm ít nhất một vật tư để kiểm kê.')
      return
    }
    try {
      setSubmitting(true)
      await stockCountApi.create({
        warehouse: { id: form.warehouseId },
        countDate: form.countDate,
        notes: form.notes,
        items: items.map((it) => ({
          rawMaterial: { id: Number(it.rawMaterialId) },
          systemQuantity: it.systemQuantity,
          actualQuantity: Number(it.actualQuantity) || 0,
          difference: (Number(it.actualQuantity) || 0) - it.systemQuantity,
          notes: it.notes,
        })),
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
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
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

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách vật tư kiểm kê</h2>
            <Btn type="button" onClick={addItem}>
              {Icons.plus} Thêm vật tư
            </Btn>
          </div>

          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              Chưa có vật tư nào. Nhấn "Thêm vật tư" để bắt đầu.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => {
                const diff = (Number(item.actualQuantity) || 0) - item.systemQuantity
                const diffColor = diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-gray-500'
                return (
                  <div key={idx} className="border border-gray-100 rounded-2xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Nguyên vật liệu</label>
                        <select value={item.rawMaterialId} onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all">
                          <option value="">Chọn NVL</option>
                          {materials.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">SL hệ thống</label>
                        <input type="number" value={item.systemQuantity} readOnly
                          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50 text-gray-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">SL thực tế</label>
                        <input type="number" value={item.actualQuantity} onChange={(e) => updateItem(idx, 'actualQuantity', e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Lệch</label>
                        <p className={`px-4 py-3 text-sm font-semibold ${diffColor}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Ghi chú</label>
                        <input type="text" value={item.notes} onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                          placeholder="Ghi chú"
                          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all" />
                      </div>
                      <div className="md:col-span-1 flex justify-center">
                        <button type="button" onClick={() => removeItem(idx)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          {Icons.trash}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-3">
          <Btn type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lưu phiếu kiểm kê'}
          </Btn>
          <Btn variant="secondary" type="button" onClick={() => navigate('/stock-counts')}>
            Hủy
          </Btn>
        </div>
      </form>
    </DashboardLayout>
  )
}
