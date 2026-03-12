import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, Icons, Loading, EmptyState } from '../../components/ui'
import supplierService from '../../services/supplierService'

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSuppliers = async (q = '') => {
    try {
      setLoading(true)
      const data = await supplierService.getAll(q)
      setSuppliers(data || [])
    } catch {
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSuppliers() }, [])

  const handleSearch = (val) => {
    setSearch(val)
    fetchSuppliers(val)
  }


  return (
    <DashboardLayout title="Nhà cung cấp">
      <PageHeader title="Nhà cung cấp" desc="Quản lý danh sách nhà cung cấp" actionTo="/suppliers/new" actionLabel="Thêm nhà cung cấp">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm nhà cung cấp..." />
      </PageHeader>

      {loading ? <Loading /> : suppliers.length === 0 ? <EmptyState message="Không có nhà cung cấp nào" /> : (
        <Table headers={['Tên', 'Thông tin liên hệ', 'Thao tác']}>
          {suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50/50">
              <Td className="font-medium text-gray-900">{s.name}</Td>
              <Td>{s.contactInfo || '—'}</Td>
              <Td>
                <div className="flex gap-1">
                  <ActionLink to={`/suppliers/${s.id}`} icon={Icons.eye} title="Xem" />
                  <ActionLink to={`/suppliers/${s.id}/edit`} icon={Icons.edit} title="Sửa" />

                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
