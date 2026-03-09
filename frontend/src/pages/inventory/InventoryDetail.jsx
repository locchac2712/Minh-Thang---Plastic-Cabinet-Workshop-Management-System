import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Badge, LinkBtn, Loading, EmptyState, Icons, fmt, fmtCurrency } from '../../components/ui'
import { materialApi } from '../../services/api'

export default function InventoryDetail() {
  const { id } = useParams()
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await materialApi.getById(id)
        setMaterial(res.data.data)
      } catch {
        setMaterial(null)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết tồn kho">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!material) {
    return (
      <DashboardLayout title="Chi tiết tồn kho">
        <EmptyState message="Không tìm thấy dữ liệu" />
        <div className="text-center mt-4">
          <LinkBtn to="/inventory" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        </div>
      </DashboardLayout>
    )
  }

  const low = material.quantity <= material.minQuantity

  const detailItems = [
    { label: 'SKU', value: <span className="font-mono">{material.sku}</span> },
    { label: 'Đơn vị', value: material.unit },
    { label: 'Nhà cung cấp', value: material.supplier?.name },
    { label: 'Kho', value: material.warehouse?.name },
    { label: 'Giá', value: material.price ? fmtCurrency(material.price) : '—' },
    { label: 'Trạng thái', value: <Badge variant={low ? 'red' : 'green'}>{low ? 'Cần nhập thêm' : 'Đủ hàng'}</Badge> },
  ]

  return (
    <DashboardLayout title="Chi tiết tồn kho">
      <PageHeader title={material.name} desc="Chi tiết nguyên vật liệu">
        <LinkBtn to="/inventory" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DetailGrid items={detailItems} />
        </div>
        <Card className="p-6 flex flex-col items-center justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Số lượng tồn kho</p>
          <p className={`text-4xl font-bold ${low ? 'text-red-600' : 'text-gray-900'}`}>{fmt(material.quantity ?? 0)}</p>
          <p className="text-sm text-gray-400 mt-2">Tối thiểu: {fmt(material.minQuantity ?? 0)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h3>
        <EmptyState message="Lịch sử giao dịch sẽ hiển thị tại đây" />
      </Card>
    </DashboardLayout>
  )
}
