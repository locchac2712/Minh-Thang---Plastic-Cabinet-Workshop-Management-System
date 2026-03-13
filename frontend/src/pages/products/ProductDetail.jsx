import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading, fmtCurrency, Alert } from '../../components/ui'
import productService from '../../services/productService'
import api from '../../services/api' // For direct image upload

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    productService.getById(id)
      .then((data) => setProduct(data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setActionLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/files/upload/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const imageUrl = res.data?.data ?? res.data
      
      const updatedProduct = { ...product, imageUrl }
      await productService.update(id, updatedProduct)
      setProduct(updatedProduct)
    } catch (err) {
      setError('Lỗi upload hình ảnh: ' + (err.response?.data?.message || err.message))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết sản phẩm">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!product) return null

  const statusLabel = {
    DRAFT: { text: 'Bản nháp', variant: 'gray' },
    ACTIVE: { text: 'Hoạt động', variant: 'green' },
    DEACTIVATED: { text: 'Ngừng bán', variant: 'red' },
  }
  const s = statusLabel[product.status] || { text: product.status, variant: 'gray' }

  return (
    <DashboardLayout title="Chi tiết sản phẩm">
      <PageHeader title={`Chi tiết: ${product.name}`}>
        <LinkBtn to={`/products/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        <LinkBtn to="/products" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <DetailGrid items={[
        { label: 'Tên sản phẩm', value: product.name },
        { label: 'SKU', value: product.sku },
        { label: 'Đơn vị', value: product.unit },
        { label: 'Giá bán', value: fmtCurrency(product.sellingPrice) },
        { label: 'Tồn kho', value: `${product.currentStock ?? 0} ${product.unit ?? ''}` },
        { label: 'Trạng thái', value: <Badge variant={s.variant}>{s.text}</Badge> },
        { label: 'Mô tả', value: product.description },
        { 
          label: 'Hình ảnh', 
          value: (
            <div className="flex flex-col gap-2">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="w-32 h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                  Chưa có ảnh
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={actionLoading}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium"
              >
                {actionLoading ? 'Đang tải...' : product.imageUrl ? 'Thay đổi ảnh' : 'Thêm ảnh'}
              </button>
            </div>
          ) 
        },
      ]} />
    </DashboardLayout>
  )
}
