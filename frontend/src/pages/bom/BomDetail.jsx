import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, DetailGrid, Card, Table, Td, Badge, Btn, LinkBtn, Field, Select, Icons, Loading, Alert, EmptyState, fmtDate } from '../../components/ui'
import { bomApi, materialApi } from '../../services/api'

const statusMap = {
  DRAFT: { label: 'Nháp', variant: 'yellow' },
  ACTIVE: { label: 'Hoạt động', variant: 'green' },
  ARCHIVED: { label: 'Lưu trữ', variant: 'gray' },
}

export default function BomDetail() {
  const { id } = useParams()
  const [bom, setBom] = useState(null)
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [itemForm, setItemForm] = useState({ materialId: '', quantity: '', unit: '', notes: '' })

  const fetchBom = async () => {
    try {
      const { data } = await bomApi.getById(id)
      setBom(data.data)
    } catch {
      setError('Không thể tải thông tin BOM')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const matRes = await materialApi.getAll()
        setMaterials(matRes.data.data || [])
      } catch { /* ignore */ }
    }
    fetchBom()
    loadData()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      await bomApi.changeStatus(id, newStatus)
      fetchBom()
    } catch {
      setError('Không thể thay đổi trạng thái')
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      await bomApi.addItem(id, {
        rawMaterial: { id: Number(itemForm.materialId) },
        quantity: Number(itemForm.quantity),
        unit: itemForm.unit,
        notes: itemForm.notes,
      })
      setItemForm({ materialId: '', quantity: '', unit: '', notes: '' })
      setShowAddForm(false)
      fetchBom()
    } catch {
      setError('Không thể thêm thành phần')
    }
  }

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thành phần này?')) return
    try {
      await bomApi.removeItem(itemId)
      fetchBom()
    } catch {
      setError('Không thể xóa thành phần')
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết BOM">
        <Loading />
      </DashboardLayout>
    )
  }

  if (error && !bom) {
    return (
      <DashboardLayout title="Chi tiết BOM">
        <Alert type="error" message={error} />
      </DashboardLayout>
    )
  }

  const status = statusMap[bom?.status] || { label: bom?.status, variant: 'gray' }

  return (
    <DashboardLayout title="Chi tiết BOM">
      <PageHeader title={`Chi tiết: ${bom.name}`}>
        <LinkBtn to={`/bom/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        {bom.status === 'DRAFT' && (
          <Btn variant="primary" onClick={() => handleStatusChange('ACTIVE')}>Kích hoạt</Btn>
        )}
        {bom.status === 'ACTIVE' && (
          <Btn variant="secondary" onClick={() => handleStatusChange('ARCHIVED')}>Lưu trữ</Btn>
        )}
        <LinkBtn to="/bom" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <Alert type="error" message={error} />

      <DetailGrid items={[
        { label: 'Tên BOM', value: bom.name },
        { label: 'Sản phẩm', value: bom.product?.name },
        { label: 'Phiên bản', value: bom.version },
        { label: 'Trạng thái', value: <Badge variant={status.variant}>{status.label}</Badge> },
        { label: 'Ngày tạo', value: fmtDate(bom.createdAt) },
        { label: 'Cập nhật', value: fmtDate(bom.updatedAt) },
      ]} />

      <div className="mt-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Thành phần</h3>
            <Btn variant={showAddForm ? 'ghost' : 'primary'} onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? 'Đóng' : 'Thêm thành phần'}
            </Btn>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddItem} className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  options={materials.map(m => ({ value: m.id, label: m.name }))}
                  value={itemForm.materialId}
                  onChange={(e) => setItemForm({ ...itemForm, materialId: e.target.value })}
                  placeholder="Chọn nguyên vật liệu"
                  required
                />
                <Field
                  type="number"
                  placeholder="Số lượng"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                  required
                  min={0}
                />
                <Field
                  placeholder="Đơn vị"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                />
                <Field
                  placeholder="Ghi chú"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                />
              </div>
              <div className="mt-4">
                <Btn type="submit">Thêm</Btn>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Nguyên vật liệu', 'Số lượng', 'Đơn vị', 'Ghi chú', 'Thao tác'].map((h, i) => (
                    <th key={i} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(!bom.items || bom.items.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <EmptyState message="Chưa có thành phần nào" />
                    </td>
                  </tr>
                ) : (
                  bom.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <Td className="font-medium text-gray-900">{item.rawMaterial?.name || '—'}</Td>
                      <Td>{item.quantity}</Td>
                      <Td>{item.unit || '—'}</Td>
                      <Td>{item.notes || '—'}</Td>
                      <Td>
                        <Btn variant="danger" onClick={() => handleRemoveItem(item.id)} className="text-xs px-3 py-1.5">
                          {Icons.trash} Xóa
                        </Btn>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
