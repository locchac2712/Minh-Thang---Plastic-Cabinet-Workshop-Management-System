import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import { warehouseApi } from '../../services/api'

export default function WarehouseForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', code: '', location: '', address: '', capacity: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      warehouseApi.getById(id).then((res) => {
        const w = res.data.data
        setForm({
          name: w.name || '',
          code: w.code || '',
          location: w.location || '',
          address: w.address || '',
          capacity: w.capacity ?? '',
        })
      }).catch(() => navigate('/warehouses')).finally(() => setLoading(false))
    }
  }, [id, isEdit, navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : null,
      }
      if (isEdit) {
        await warehouseApi.update(id, payload)
      } else {
        await warehouseApi.create(payload)
      }
      navigate('/warehouses')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa kho' : 'Thêm kho'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa kho' : 'Thêm kho'}>
      <PageHeader title={isEdit ? 'Sửa kho' : 'Thêm kho'} />
      <Alert type="error" message={error} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Tên kho" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Mã kho" name="code" value={form.code} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Vị trí" name="location" value={form.location} onChange={handleChange} />
            <Field label="Sức chứa" name="capacity" type="number" value={form.capacity} onChange={handleChange} />
          </div>

          <TextArea label="Địa chỉ" name="address" value={form.address} onChange={handleChange} />

          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Btn>
            <LinkBtn to="/warehouses" variant="secondary">Hủy</LinkBtn>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  )
}
