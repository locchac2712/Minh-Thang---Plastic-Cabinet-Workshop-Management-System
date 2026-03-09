import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, Loading, EmptyState, fmt } from '../../components/ui'
import { materialApi, warehouseApi } from '../../services/api'

export default function InventoryList() {
  const [materials, setMaterials] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = async (q = '') => {
    try {
      setLoading(true)
      const [matRes, whRes] = await Promise.all([
        materialApi.getAll(q),
        warehouseApi.getAll(),
      ])
      setMaterials(matRes.data.data || [])
      setWarehouses(whRes.data.data || [])
    } catch {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSearch = (val) => {
    setSearch(val)
    fetchData(val)
  }

  const filtered = warehouseId
    ? materials.filter((m) => m.warehouse?.id === Number(warehouseId))
    : materials

  return (
    <DashboardLayout title="Tồn kho">
      <PageHeader title="Tồn kho" desc="Theo dõi số lượng tồn kho nguyên vật liệu">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm NVL..." />
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="bg-white border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
        >
          <option value="">Tất cả kho</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Không có dữ liệu tồn kho" /> : (
        <Table headers={['SKU', 'Tên NVL', 'Đơn vị', 'Kho', 'Số lượng tồn', 'SL tối thiểu', 'Trạng thái']}>
          {filtered.map((m) => {
            const low = m.quantity <= m.minQuantity
            return (
              <tr key={m.id} className={`hover:bg-purple-50/30 transition-colors ${low ? 'bg-red-50/50' : ''}`}>
                <Td className="font-mono text-gray-600">{m.sku}</Td>
                <Td className="font-medium text-gray-900">
                  <Link to={`/inventory/${m.id}`} className="hover:text-purple-600 transition-colors">{m.name}</Link>
                </Td>
                <Td className="text-gray-500">{m.unit}</Td>
                <Td className="text-gray-500">{m.warehouse?.name || '—'}</Td>
                <Td className="text-right font-medium">{fmt(m.quantity ?? 0)}</Td>
                <Td className="text-right text-gray-500">{fmt(m.minQuantity ?? 0)}</Td>
                <Td>
                  <Badge variant={low ? 'red' : 'green'}>
                    {low ? 'Cần nhập thêm' : 'Đủ'}
                  </Badge>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
