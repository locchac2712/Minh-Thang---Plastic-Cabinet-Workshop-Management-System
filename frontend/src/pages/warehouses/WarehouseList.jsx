import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, ActionBtn, Icons, Loading, EmptyState, fmt } from '../../components/ui'
import { warehouseApi } from '../../services/api'

export default function WarehouseList() {
  const [warehouses, setWarehouses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchWarehouses = async (q = '') => {
    try {
      setLoading(true)
      const res = await warehouseApi.getAll(q)
      setWarehouses(res.data.data || [])
    } catch {
      setWarehouses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWarehouses() }, [])

  const handleSearch = (val) => {
    setSearch(val)
    fetchWarehouses(val)
  }

  const handleToggle = async (id) => {
    try {
      await warehouseApi.toggleActive(id)
      fetchWarehouses(search)
    } catch { /* ignore */ }
  }

  return (
    <DashboardLayout title="Kho hàng">
      <PageHeader title="Kho hàng" desc="Quản lý danh sách kho hàng" actionTo="/warehouses/new" actionLabel="Thêm kho">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm kho..." />
      </PageHeader>

      {loading ? <Loading /> : warehouses.length === 0 ? <EmptyState message="Không có kho hàng nào" /> : (
        <Table headers={['Mã', 'Tên', 'Vị trí', 'Sức chứa', 'Trạng thái', 'Thao tác']}>
          {warehouses.map((w) => (
            <tr key={w.id} className="hover:bg-gray-50/50">
              <Td className="font-mono text-gray-600">{w.code}</Td>
              <Td className="font-medium text-gray-900">{w.name}</Td>
              <Td>{w.location || '—'}</Td>
              <Td>{fmt(w.capacity)}</Td>
              <Td>
                <Badge variant={w.active ? 'green' : 'gray'}>
                  {w.active ? 'Hoạt động' : 'Ngưng'}
                </Badge>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <ActionLink to={`/warehouses/${w.id}`} icon={Icons.eye} title="Xem" />
                  <ActionLink to={`/warehouses/${w.id}/edit`} icon={Icons.edit} title="Sửa" />
                  <ActionBtn onClick={() => handleToggle(w.id)} icon={Icons.toggle} title={w.active ? 'Ngưng' : 'Kích hoạt'} />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
