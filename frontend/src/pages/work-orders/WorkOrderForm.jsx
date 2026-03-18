import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert, Loading } from '../../components/ui'
import productionOrderService from '../../services/productionOrderService'
import workOrderService from '../../services/workOrderService'

export default function WorkOrderForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    productionOrderId: searchParams.get('productionOrderId') || '',
    description: '',
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [productionOrders, setProductionOrders] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const productionOrdersData = await productionOrderService.getAll()
        setProductionOrders(productionOrdersData || [])

        if (isEdit) {
          const wo = await workOrderService.getById(id)
          setForm({
            productionOrderId: wo.productionOrder?.id || '',
            description: wo.description || '',
            startDate: wo.startDate ? wo.startDate.substring(0, 10) : '',
            endDate: wo.endDate ? wo.endDate.substring(0, 10) : '',
            notes: wo.notes || '',
          })
        }
      } catch {
        if (isEdit) navigate('/work-orders')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id, isEdit, navigate])

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
        productionOrder: form.productionOrderId ? { id: form.productionOrderId } : null,
        description: form.description || null,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        notes: form.notes || null,
      }
      if (isEdit) {
        await workOrderService.update(id, payload)
      } else {
        await workOrderService.create(payload)
      }
      navigate('/work-orders')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa Work Order' : 'Tạo Work Order'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa Work Order' : 'Tạo Work Order'}>
      <PageHeader title={isEdit ? 'Sửa Work Order' : 'Tạo Work Order'} desc="Điền thông tin work order" />

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert type="error" message={error} onClose={() => setError('')} />

            <Select
              label={<>Lệnh sản xuất <span className="text-red-500">*</span></>}
              value={form.productionOrderId}
              onChange={(e) => handleChange({ target: { name: 'productionOrderId', value: e.target.value } })}
              required
              options={productionOrders.map((po) => ({ value: po.id, label: `${po.orderNumber} — ${po.product?.name || ''}` }))}
              placeholder="-- Chọn lệnh sản xuất --"
            />

            <TextArea label="Mô tả" name="description" value={form.description} onChange={handleChange} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Ngày bắt đầu" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              <Field label="Ngày kết thúc" name="endDate" type="date" value={form.endDate} onChange={handleChange} />
            </div>

            <TextArea label="Ghi chú" name="notes" value={form.notes} onChange={handleChange} />

            <div className="flex items-center gap-3 pt-2">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo Work Order'}
              </Btn>
              <Btn variant="ghost" type="button" onClick={() => navigate('/work-orders')}>
                Hủy
              </Btn>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
