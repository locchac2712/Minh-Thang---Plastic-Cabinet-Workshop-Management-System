import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading } from '../../components/ui'
import { supplierApi } from '../../services/api'

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supplierApi.getById(id)
      .then((res) => setSupplier(res.data.data))
      .catch(() => navigate('/suppliers'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết nhà cung cấp">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!supplier) return null

  return (
    <DashboardLayout title="Chi tiết nhà cung cấp">
      <PageHeader title={`Chi tiết: ${supplier.name}`}>
        <LinkBtn to={`/suppliers/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        <LinkBtn to="/suppliers" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <DetailGrid items={[
        { label: 'Tên nhà cung cấp', value: supplier.name },
        { label: 'Mã', value: supplier.code },
        { label: 'Người liên hệ', value: supplier.contactPerson },
        { label: 'Số điện thoại', value: supplier.phone },
        { label: 'Email', value: supplier.email },
        { label: 'Trạng thái', value: <Badge variant={supplier.active ? 'green' : 'gray'}>{supplier.active ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { label: 'Địa chỉ', value: supplier.address },
      ]} />
    </DashboardLayout>
  )
}
