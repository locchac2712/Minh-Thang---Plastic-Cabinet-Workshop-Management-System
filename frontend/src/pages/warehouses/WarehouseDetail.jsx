import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading, fmt } from '../../components/ui'
import { warehouseApi } from '../../services/api'

export default function WarehouseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [warehouse, setWarehouse] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    warehouseApi.getById(id)
      .then((res) => setWarehouse(res.data.data))
      .catch(() => navigate('/warehouses'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết kho">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!warehouse) return null

  return (
    <DashboardLayout title="Chi tiết kho">
      <PageHeader title={`Chi tiết: ${warehouse.name}`}>
        <LinkBtn to={`/warehouses/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        <LinkBtn to="/warehouses" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <DetailGrid items={[
        { label: 'Tên kho', value: warehouse.name },
        { label: 'Mã kho', value: warehouse.code },
        { label: 'Vị trí', value: warehouse.location },
        { label: 'Sức chứa', value: fmt(warehouse.capacity) },
        { label: 'Trạng thái', value: <Badge variant={warehouse.active ? 'green' : 'gray'}>{warehouse.active ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { label: 'Địa chỉ', value: warehouse.address },
      ]} />
    </DashboardLayout>
  )
}
