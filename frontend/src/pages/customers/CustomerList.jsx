import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { customerApi } from '../../services/api'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, ActionBtn, Loading, EmptyState, Icons, fmtCurrency } from '../../components/ui'

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async (q = '') => {
    try {
      setLoading(true)
      const res = await customerApi.getAll(q)
      setCustomers(res.data.data || [])
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleSearch = (val) => {
    setSearch(val)
    fetchCustomers(val)
  }

  const handleToggle = async (id) => {
    try {
      await customerApi.toggleActive(id)
      fetchCustomers(search)
    } catch { /* ignore */ }
  }

  return (
    <DashboardLayout>
      <PageHeader title="Khách hàng" desc="Quản lý danh sách khách hàng" actionTo="/customers/new" actionLabel="Thêm khách hàng">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm khách hàng..." />
      </PageHeader>

      {loading ? <Loading /> : customers.length === 0 ? <EmptyState message="Không có khách hàng nào" /> : (
        <Table headers={['Mã', 'Tên', 'Liên hệ', 'SĐT', 'Hạn mức', 'Trạng thái', 'Thao tác']}>
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
              <Td className="font-mono text-gray-600">{c.code}</Td>
              <Td className="font-medium text-gray-900">{c.name}</Td>
              <Td className="text-gray-500">{c.contactPerson || '—'}</Td>
              <Td className="text-gray-500">{c.phone || '—'}</Td>
              <Td className="font-medium text-gray-700">{fmtCurrency(c.creditLimit)}</Td>
              <Td>
                <Badge variant={c.active ? 'green' : 'gray'}>
                  {c.active ? 'Hoạt động' : 'Ngưng'}
                </Badge>
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <ActionLink to={`/customers/${c.id}`} icon={Icons.eye} title="Xem" />
                  <ActionLink to={`/customers/${c.id}/edit`} icon={Icons.edit} title="Sửa" />
                  <ActionBtn icon={Icons.toggle} onClick={() => handleToggle(c.id)} title={c.active ? 'Ngưng' : 'Kích hoạt'} />
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
