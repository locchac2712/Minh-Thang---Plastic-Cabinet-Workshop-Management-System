import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading } from '../../components/ui'
import supplierService from '../../services/supplierService'

export default function SupplierDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supplierService.getById(id)
      .then((data) => setSupplier(data))
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
        { label: 'Thông tin liên hệ', value: supplier.contactInfo },
      ]} />
    </DashboardLayout>
  )
}
