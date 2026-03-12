import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import supplierService from '../../services/supplierService'

export default function SupplierForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', contactInfo: ''
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      supplierService.getById(id).then((s) => {
        setForm({
          name: s.name || '',
          contactInfo: s.contactInfo || ''
        })
      }).catch(() => navigate('/suppliers')).finally(() => setLoading(false))
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
        await supplierService.update(id, form)
      } else {
        await supplierService.create(form)
      }
      navigate('/suppliers')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}>
      <PageHeader title={isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'} />
      <Alert type="error" message={error} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            <Field label="Tên nhà cung cấp" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <TextArea label="Thông tin liên hệ" name="contactInfo" value={form.contactInfo} onChange={handleChange} />

          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Btn>
            <LinkBtn to="/suppliers" variant="secondary">Hủy</LinkBtn>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  )
}
