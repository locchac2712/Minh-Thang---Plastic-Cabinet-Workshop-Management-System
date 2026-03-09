import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Badge, LinkBtn, Icons, Loading } from '../../components/ui'
import { materialApi } from '../../services/api'

export default function RawMaterialDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    materialApi.getById(id)
      .then((res) => setMaterial(res.data.data || res.data))
      .catch(() => navigate('/materials'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết nguyên vật liệu">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!material) return null

  return (
    <DashboardLayout title="Chi tiết nguyên vật liệu">
      <PageHeader title={`Chi tiết: ${material.name}`}>
        <LinkBtn to={`/materials/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        <LinkBtn to="/materials" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <DetailGrid items={[
        { label: 'Tên nguyên vật liệu', value: material.name },
        { label: 'Mã', value: material.code || material.sku },
        { label: 'Đơn vị', value: material.unit },
        { label: 'Trạng thái', value: <Badge variant={material.active !== false ? 'green' : 'gray'}>{material.active !== false ? 'Hoạt động' : 'Ngưng'}</Badge> },
        { label: 'Mô tả', value: material.description },
      ]} />
    </DashboardLayout>
  )
}
