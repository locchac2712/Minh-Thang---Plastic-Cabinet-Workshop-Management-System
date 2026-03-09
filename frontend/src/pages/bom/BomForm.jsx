import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import { bomApi, productApi } from '../../services/api'

export default function BomForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', description: '', productId: '', version: '',
  })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const prodRes = await productApi.getAll()
        setProducts(prodRes.data.data || prodRes.data || [])

        if (isEdit) {
          const { data } = await bomApi.getById(id)
          const b = data.data
          setForm({
            name: b.name || '',
            description: b.description || '',
            productId: b.product?.id || '',
            version: b.version || '',
          })
        }
      } catch {
        setError('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, isEdit])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      name: form.name,
      description: form.description,
      product: { id: form.productId },
      version: form.version,
    }

    try {
      if (isEdit) {
        await bomApi.update(id, body)
      } else {
        await bomApi.create(body)
      }
      navigate('/bom')
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa BOM' : 'Tạo BOM'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa BOM' : 'Tạo BOM'}>
      <PageHeader title={isEdit ? 'Sửa BOM' : 'Tạo BOM'} />
      <Alert type="error" message={error} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Tên BOM" name="name" value={form.name} onChange={handleChange} required />

          <TextArea label="Mô tả" name="description" value={form.description} onChange={handleChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Sản phẩm"
              options={products.map(p => ({ value: p.id, label: p.name }))}
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              required
            />
            <Field label="Phiên bản" name="version" value={form.version} onChange={handleChange} required />
          </div>

          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Btn>
            <LinkBtn to="/bom" variant="secondary">Hủy</LinkBtn>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  )
}
