import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import { supplierApi } from '../../services/api'

export default function SupplierForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', code: '', contactPerson: '', phone: '', email: '', address: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      supplierApi.getById(id).then((res) => {
        const s = res.data.data
        setForm({
          name: s.name || '',
          code: s.code || '',
          contactPerson: s.contactPerson || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
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
        await supplierApi.update(id, form)
      } else {
        await supplierApi.create(form)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Tên nhà cung cấp" name="name" value={form.name} onChange={handleChange} required />
            <Field label="Mã" name="code" value={form.code} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Người liên hệ" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
            <Field label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} />
          </div>

          <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />

          <TextArea label="Địa chỉ" name="address" value={form.address} onChange={handleChange} />

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
