import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, Icons, Loading, EmptyState, Alert } from '../../components/ui'
import materialService from '../../services/materialService'

export default function RawMaterialList() {
  const [materials, setMaterials] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await materialService.getAll()
      setMaterials(data || [])
    } catch (err) {
      setMaterials([])
      const status = err?.response?.status
      if (status === 403) {
        setError('Bạn không có quyền xem danh sách nguyên vật liệu (403).')
      } else {
        setError(err?.response?.data?.message || 'Không thể tải danh sách nguyên vật liệu.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMaterials() }, [])

  const handleSearch = (val) => {
    setSearch(val)
  }

  const filteredMaterials = materials.filter((m) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [m.sku, m.materialName, m.name, m.unit, m.supplier]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })

  return (
    <DashboardLayout title="Nguyên vật liệu">
      <PageHeader title="Nguyên vật liệu" desc="Quản lý danh sách nguyên vật liệu" actionTo="/materials/new" actionLabel="Thêm mới">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm nguyên vật liệu..." />
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? <Loading /> : filteredMaterials.length === 0 ? <EmptyState message="Không có nguyên vật liệu nào" /> : (
        <Table headers={['Mã', 'Tên NVL', 'Đơn vị', 'Nhà cung cấp', 'Tồn kho', 'Ngưỡng min', 'Trạng thái', 'Thao tác']}>
          {filteredMaterials.map((m) => {
            const isLowStock = m.isLowStock === true
            return (
              <tr key={m.id} className="hover:bg-gray-50/50">
                <Td className="font-mono text-gray-600">{m.sku || '—'}</Td>
                <Td className="font-medium text-gray-900">{m.materialName || m.name || '—'}</Td>
                <Td>{m.unit || '—'}</Td>
                <Td>{m.supplier || '—'}</Td>
                <Td>{m.currentStock ?? '—'}</Td>
                <Td>{m.minStockLevel ?? '—'}</Td>
                <Td>
                  <Badge variant={isLowStock ? 'yellow' : 'green'}>
                    {isLowStock ? 'Sắp hết' : 'Đủ tồn'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-1">
                    <ActionLink to={`/materials/${m.id}`} icon={Icons.eye} title="Xem" />
                    <ActionLink to={`/materials/${m.id}/edit`} icon={Icons.edit} title="Sửa" />
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
