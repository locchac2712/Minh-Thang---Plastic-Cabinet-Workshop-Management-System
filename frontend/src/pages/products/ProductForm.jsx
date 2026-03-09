import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, LinkBtn, Alert, Loading } from '../../components/ui'
import { productApi } from '../../services/api'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '', sku: '', description: '', categoryId: '', price: '', costPrice: '', unit: '', imageUrl: '',
  })
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    productApi.getCategories().then((res) => setCategories(res.data.data || [])).catch(() => {})
    if (isEdit) {
      productApi.getById(id).then((res) => {
        const p = res.data.data
        setForm({
          name: p.name || '',
          sku: p.sku || '',
          description: p.description || '',
          categoryId: p.categoryId || p.category?.id || '',
          price: p.price ?? '',
          costPrice: p.costPrice ?? '',
          unit: p.unit || '',
          imageUrl: p.imageUrl || '',
        })
      }).catch(() => navigate('/products')).finally(() => setLoading(false))
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
        price: form.price ? Number(form.price) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        categoryId: form.categoryId || null,
      }
      if (isEdit) {
        await productApi.update(id, payload)
      } else {
        await productApi.create(payload)
      }
      navigate('/products')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
        <Loading />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}>
      <PageHeader title={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} />
      <Alert type="error" message={error} />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Tên sản phẩm" name="name" value={form.name} onChange={handleChange} required />
            <Field label="SKU" name="sku" value={form.sku} onChange={handleChange} required />
          </div>

          <TextArea label="Mô tả" name="description" value={form.description} onChange={handleChange} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Danh mục"
              options={categories.map(c => ({ value: c.id, label: c.name }))}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            />
            <Field label="Đơn vị" name="unit" value={form.unit} onChange={handleChange} placeholder="VD: cái, kg, hộp" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Giá bán" name="price" type="number" value={form.price} onChange={handleChange} />
            <Field label="Giá vốn" name="costPrice" type="number" value={form.costPrice} onChange={handleChange} />
          </div>

          <Field label="URL hình ảnh" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://..." />

          <div className="flex gap-3 pt-2">
            <Btn type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Btn>
            <LinkBtn to="/products" variant="secondary">Hủy</LinkBtn>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  )
}
