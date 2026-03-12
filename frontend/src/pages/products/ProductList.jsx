import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, Icons, Loading, EmptyState, fmtCurrency, Alert } from '../../components/ui'
import productService from '../../services/productService'

export default function ProductList() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await productService.getAll()
      setProducts(data || [])
    } catch (err) {
      setProducts([])
      const status = err?.response?.status
      if (status === 403) {
        setError('Bạn không có quyền xem danh sách sản phẩm (403).')
      } else {
        setError(err?.response?.data?.message || 'Không thể tải danh sách sản phẩm.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleSearch = (val) => {
    setSearch(val)
  }

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return [p.sku, p.name, p.categoryName, p.category?.name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  })

  return (
    <DashboardLayout title="Sản phẩm">
      <PageHeader title="Sản phẩm" desc="Quản lý danh sách sản phẩm" actionTo="/products/new" actionLabel="Thêm sản phẩm">
        <SearchBar value={search} onChange={handleSearch} placeholder="Tìm kiếm sản phẩm..." />
      </PageHeader>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading ? <Loading /> : filteredProducts.length === 0 ? <EmptyState message="Không có sản phẩm nào" /> : (
        <Table headers={['SKU', 'Tên', 'Danh mục', 'Giá', 'Trạng thái', 'Thao tác']}>
          {filteredProducts.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50/50">
              <Td className="font-mono text-gray-600">{p.sku}</Td>
              <Td className="font-medium text-gray-900">{p.name}</Td>
              <Td>{p.categoryName || p.category?.name || '—'}</Td>
              <Td>{fmtCurrency(p.price)}</Td>
              <Td>
                <Badge variant={p.active ? 'green' : 'gray'}>
                  {p.active ? 'Hoạt động' : 'Ngưng'}
                </Badge>
              </Td>
              <Td>
                <div className="flex gap-1">
                  <ActionLink to={`/products/${p.id}`} icon={Icons.eye} title="Xem" />
                  <ActionLink to={`/products/${p.id}/edit`} icon={Icons.edit} title="Sửa" />

                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
