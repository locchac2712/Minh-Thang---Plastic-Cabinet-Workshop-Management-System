import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading, fmtCurrency } from '../../components/ui'
import { productApi } from '../../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productApi.getById(id)
      .then((res) => setProduct(res.data.data))
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết sản phẩm">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!product) return null

  return (
    <DashboardLayout title="Chi tiết sản phẩm">
      <PageHeader title={`Chi tiết: ${product.name}`}>
        <LinkBtn to={`/products/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        <LinkBtn to="/products" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <DetailGrid items={[
        { label: 'Tên sản phẩm', value: product.name },
        { label: 'SKU', value: product.sku },
        { label: 'Danh mục', value: product.categoryName || product.category?.name },
        { label: 'Đơn vị', value: product.unit },
        { label: 'Giá bán', value: fmtCurrency(product.price) },
        { label: 'Giá vốn', value: fmtCurrency(product.costPrice) },
        { label: 'Trạng thái', value: <Badge variant={product.active ? 'green' : 'gray'}>{product.active ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { label: 'Mô tả', value: product.description },
        { label: 'Hình ảnh', value: product.imageUrl },
      ]} />
    </DashboardLayout>
  )
}
