import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import { materialApi } from '../../services/api'

export default function RawMaterialForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', code: '', unit: '', description: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      materialApi.getById(id).then((res) => {
        const m = res.data.data || res.data
        setForm({
          name: m.name || '',
          code: m.code || m.sku || '',
          unit: m.unit || '',
          description: m.description || '',
        })
      }).catch(() => navigate('/materials')).finally(() => setLoading(false))
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
      if (isEdit) {
        await materialApi.update(id, form)
      } else {
        await materialApi.create(form)
      }
      navigate('/materials')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa nguyên vật liệu' : 'Thêm nguyên vật liệu'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa nguyên vật liệu' : 'Thêm nguyên vật liệu'}>
      <PageHeader title={isEdit ? 'Sửa nguyên vật liệu' : 'Thêm nguyên vật liệu'} />
      <Alert type="error" message={error} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Tên nguyên vật liệu" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Mã" name="code" value={form.code} onChange={handleChange} required />
          </div>

          <Field label="Đơn vị" name="unit" value={form.unit} onChange={handleChange} placeholder="VD: kg, lít, mét" />

          <TextArea label="Mô tả" name="description" value={form.description} onChange={handleChange} />

          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Btn>
            <LinkBtn to="/materials" variant="secondary">Hủy</LinkBtn>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  )
}
