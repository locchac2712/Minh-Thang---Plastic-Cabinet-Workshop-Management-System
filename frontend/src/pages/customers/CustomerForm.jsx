import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { customerApi } from '../../services/api'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Icons } from '../../components/ui'

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', code: '', contactPerson: '', phone: '', email: '', address: '', creditLimit: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      customerApi.getById(id).then((res) => {
        const c = res.data.data
        setForm({
          name: c.name || '',
          code: c.code || '',
          contactPerson: c.contactPerson || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          creditLimit: c.creditLimit ?? '',
        })
      }).catch(() => navigate('/customers'))
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
      const payload = { ...form, creditLimit: Number(form.creditLimit) || 0 }
      if (isEdit) {
        await customerApi.update(id, payload)
      } else {
        await customerApi.create(payload)
      }
      navigate('/customers')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng'}>
        <LinkBtn to="/customers" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <div className="max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Alert type="error" message={error} onClose={() => setError('')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Tên khách hàng" name="name" value={form.name} onChange={handleChange} required />
              <Field label="Mã" name="code" value={form.code} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Người liên hệ" name="contactPerson" value={form.contactPerson} onChange={handleChange} />
              <Field label="Số điện thoại" name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
              <Field label="Hạn mức tín dụng" name="creditLimit" type="number" value={form.creditLimit} onChange={handleChange} />
            </div>

            <TextArea label="Địa chỉ" name="address" value={form.address} onChange={handleChange} rows={3} />

            <div className="flex items-center gap-3 pt-2">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
              </Btn>
              <Btn variant="ghost" type="button" onClick={() => navigate('/customers')}>Hủy</Btn>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
