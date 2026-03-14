import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, SearchBar, Table, Td, Badge, ActionLink, ActionBtn, Icons, Loading, EmptyState, fmtCurrency, Alert, Dropdown, Pagination, LinkBtn } from '../../components/ui'
import productService from '../../services/productService'

export default function ProductList() {
  const [originalProducts, setOriginalProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [alert, setAlert] = useState(null)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchData = async () => {
    setLoading(true)
    try {
      const productsData = await productService.getAll()
      setOriginalProducts(productsData || [])
    } catch {
      setAlert({ type: 'error', message: 'Không thể tải danh sách sản phẩm' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Frontend Filtering Logic
  const filteredProducts = useMemo(() => {
    return originalProducts.filter(p => {
      const searchTerm = q.toLowerCase().trim()
      const matchesQ = !searchTerm || 
        (p.name && p.name.toLowerCase().includes(searchTerm)) || 
        (p.sku && p.sku.toLowerCase().includes(searchTerm))
      
      const matchesStatus = !status || (status === 'active' ? p.active : !p.active)
      
      return matchesQ && matchesStatus
    })
  }, [originalProducts, q, status])

  // Reset page when filtering
  useEffect(() => { setCurrentPage(1) }, [q, status, pageSize])

  // Pagination Logic
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  return (
    <DashboardLayout title="Quản lý sản phẩm">
      <PageHeader 
        title="Quản lý sản phẩm" 
        desc="Quản lý danh sách sản phẩm và vật tư trong hệ thống" 
      />

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
        <div className="w-full lg:w-2/3 relative">
          <SearchBar 
            value={q} 
            onChange={setQ} 
            placeholder="Tìm theo tên, SKU..." 
            className="w-full"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${showFilters ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {Icons.filter}
          </button>
          
          {showFilters && (
            <div className="absolute top-full left-0 right-0 mt-3 p-5 bg-white rounded-3xl shadow-2xl border border-gray-100/50 z-30 animate-fade-in">
              <Dropdown 
                label="Trạng thái"
                placeholder="Tất cả trạng thái"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'inactive', label: 'Ngưng' }
                ]}
              />
            </div>
          )}
        </div>
        
        <LinkBtn to="/products/new" variant="primary" className="h-[52px] px-8 flex justify-center items-center">
          <span>Thêm sản phẩm</span>
        </LinkBtn>
      </div>

      {loading ? (
        <Loading />
      ) : filteredProducts.length === 0 ? (
        <EmptyState message="Không tìm thấy sản phẩm nào" />
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm animate-fade-in-up">
          <Table headers={['SKU', 'Tên sản phẩm', 'Đơn vị', 'Giá bán', 'Trạng thái', 'Thao tác']}>
            {paginatedProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                <Td className="font-mono text-[13px] text-gray-500">{p.sku}</Td>
                <Td className="font-medium text-gray-900">{p.name}</Td>
                <Td className="text-gray-500">{p.unit || '—'}</Td>
                <Td className="font-semibold text-purple-700">{fmtCurrency(p.price)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                    <span className={`text-[13px] font-medium ${p.active ? 'text-emerald-600' : 'text-red-600'}`}>
                      {p.active ? 'Hoạt động' : 'Ngưng'}
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <ActionLink to={`/products/${p.id}`} icon={Icons.eye} title="Xem chi tiết" />
                    <ActionLink to={`/products/${p.id}/edit`} icon={Icons.edit} title="Chỉnh sửa" />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          
          <Pagination 
            currentPage={currentPage}
            totalItems={filteredProducts.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
