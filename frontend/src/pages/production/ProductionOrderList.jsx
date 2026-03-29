import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Card, Table, Td, Badge, Loading, EmptyState, Icons, fmt, fmtDate } from '../../components/ui'

/* ─────────── MOCK DATA ─────────── */
const MOCK_ORDERS = [
  { id: 1, orderNumber: 'LSX-2026-001', product: { name: 'Bàn làm việc Gỗ Sồi' }, quantity: 50, completedQuantity: 50, scrapQuantity: 2, status: 'COMPLETED', startDate: '2026-01-10', dueDate: '2026-02-10', priority: 'HIGH' },
  { id: 2, orderNumber: 'LSX-2026-002', product: { name: 'Ghế xoay văn phòng cao cấp' }, quantity: 100, completedQuantity: 65, scrapQuantity: 3, status: 'IN_PROGRESS', startDate: '2026-02-01', dueDate: '2026-03-15', priority: 'URGENT' },
  { id: 3, orderNumber: 'LSX-2026-003', product: { name: 'Tủ hồ sơ 3 buồng Gỗ Công Nghiệp' }, quantity: 30, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-03-20', dueDate: '2026-04-20', priority: 'MEDIUM' },
  { id: 4, orderNumber: 'LSX-2026-004', product: { name: 'Kệ sách gỗ tự nhiên' }, quantity: 20, completedQuantity: 20, scrapQuantity: 1, status: 'COMPLETED', startDate: '2026-01-15', dueDate: '2026-02-28', priority: 'LOW' },
  { id: 5, orderNumber: 'LSX-2026-005', product: { name: 'Bàn họp oval 10 chỗ' }, quantity: 5, completedQuantity: 3, scrapQuantity: 0, status: 'IN_PROGRESS', startDate: '2026-03-01', dueDate: '2026-03-30', priority: 'HIGH' },
  { id: 6, orderNumber: 'LSX-2026-006', product: { name: 'Tủ quần áo 4 cánh' }, quantity: 15, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-04-01', dueDate: '2026-05-01', priority: 'MEDIUM' },
  { id: 7, orderNumber: 'LSX-2026-007', product: { name: 'Giường ngủ King Size' }, quantity: 10, completedQuantity: 10, scrapQuantity: 0, status: 'COMPLETED', startDate: '2026-02-10', dueDate: '2026-03-10', priority: 'HIGH' },
  { id: 8, orderNumber: 'LSX-2026-008', product: { name: 'Bàn làm việc Gỗ Sồi' }, quantity: 80, completedQuantity: 40, scrapQuantity: 5, status: 'IN_PROGRESS', startDate: '2026-03-05', dueDate: '2026-04-15', priority: 'URGENT' },
  { id: 9, orderNumber: 'LSX-2026-009', product: { name: 'Ghế xoay văn phòng cao cấp' }, quantity: 200, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-04-10', dueDate: '2026-06-10', priority: 'LOW' },
  { id: 10, orderNumber: 'LSX-2026-010', product: { name: 'Tủ bếp modular' }, quantity: 25, completedQuantity: 25, scrapQuantity: 1, status: 'COMPLETED', startDate: '2026-01-20', dueDate: '2026-02-20', priority: 'MEDIUM' },
  { id: 11, orderNumber: 'LSX-2026-011', product: { name: 'Bàn ăn 6 chỗ' }, quantity: 40, completedQuantity: 15, scrapQuantity: 2, status: 'IN_PROGRESS', startDate: '2026-03-10', dueDate: '2026-04-10', priority: 'HIGH' },
  { id: 12, orderNumber: 'LSX-2026-012', product: { name: 'Kệ tivi gỗ công nghiệp' }, quantity: 60, completedQuantity: 0, scrapQuantity: 0, status: 'CANCELLED', startDate: '2026-02-15', dueDate: '2026-03-15', priority: 'LOW' },
  { id: 13, orderNumber: 'LSX-2026-013', product: { name: 'Bàn trang điểm' }, quantity: 35, completedQuantity: 35, scrapQuantity: 0, status: 'COMPLETED', startDate: '2026-02-01', dueDate: '2026-03-01', priority: 'MEDIUM' },
  { id: 14, orderNumber: 'LSX-2026-014', product: { name: 'Ghế bar chân cao' }, quantity: 50, completedQuantity: 20, scrapQuantity: 1, status: 'IN_PROGRESS', startDate: '2026-03-15', dueDate: '2026-04-30', priority: 'URGENT' },
  { id: 15, orderNumber: 'LSX-2026-015', product: { name: 'Tủ hồ sơ 3 buồng Gỗ Công Nghiệp' }, quantity: 45, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-05-01', dueDate: '2026-06-15', priority: 'HIGH' },
]

/* ─────────── CONSTANTS ─────────── */
const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Kế hoạch', value: 'PLANNED' },
  { label: 'Đang SX', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const STATUS_BADGE = {
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang SX' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

const PRIORITY_BADGE = {
  URGENT: { variant: 'red', label: 'Cần gấp' },
  HIGH: { variant: 'gray', label: 'Cao' },
  MEDIUM: { variant: 'gray', label: 'Trung bình' },
  LOW: { variant: 'gray', label: 'Thấp' },
}

const PAGE_SIZE = 8

/* ─────────── STYLES ─────────── */
const filterTabStyle = (active) => ({
  padding: '7px 18px',
  borderRadius: '20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: active ? '600' : '400',
  background: active ? '#7c3aed' : '#f3f4f6',
  color: active ? '#fff' : '#6b7280',
  transition: 'all 0.2s',
})

const inputStyle = {
  padding: '9px 14px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
}

const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 20px',
  borderRadius: '10px',
  border: 'none',
  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
  color: '#fff',
  fontWeight: '600',
  fontSize: '13px',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'all 0.2s',
  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
}

const paginationBtn = (active, disabled) => ({
  padding: '6px 12px',
  borderRadius: '8px',
  border: active ? '2px solid #7c3aed' : '1px solid #e5e7eb',
  background: active ? '#7c3aed' : '#fff',
  color: active ? '#fff' : disabled ? '#d1d5db' : '#374151',
  fontWeight: active ? '600' : '400',
  fontSize: '13px',
  cursor: disabled ? 'default' : 'pointer',
  transition: 'all 0.15s',
  opacity: disabled ? 0.5 : 1,
})


export default function ProductionOrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    // Simulate API call with mock data
    setLoading(true)
    setTimeout(() => {
      setOrders(MOCK_ORDERS)
      setLoading(false)
    }, 400)
  }, [])

  // Filtered + searched data
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Status filter
    if (status) {
      result = result.filter(o => o.status === status)
    }

    // Search by order number or product name
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.product?.name || '').toLowerCase().includes(q)
      )
    }

    // Date range filter on startDate
    if (dateFrom) {
      result = result.filter(o => o.startDate >= dateFrom)
    }
    if (dateTo) {
      result = result.filter(o => o.startDate <= dateTo)
    }

    return result
  }, [orders, status, search, dateFrom, dateTo])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const pagedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1) }, [status, search, dateFrom, dateTo])

  const clearFilters = () => {
    setStatus('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <DashboardLayout title="Lệnh sản xuất">
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: 0 }}>Lệnh sản xuất</h1>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Quản lý các lệnh sản xuất trong xưởng</p>
        </div>
        <Link to="/production-orders/new" style={btnPrimary}>
          <span style={{ fontSize: '16px' }}>＋</span>
          Tạo lệnh SX
        </Link>
      </div>

      {/* ── SEARCH & DATE FILTERS ── */}
      <Card className="p-4 mb-4">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Mã lệnh SX hoặc Tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date From */}
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Date To */}
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Clear */}
          {(search || dateFrom || dateTo || status) && (
            <button
              onClick={clearFilters}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#6b7280',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                alignSelf: 'flex-end',
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
        </div>
      </Card>

      {/* ── STATUS TABS ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            style={filterTabStyle(status === tab.value)}
          >
            {tab.label}
            {tab.value === '' && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({orders.length})</span>}
            {tab.value && <span style={{ marginLeft: '4px', opacity: 0.7 }}>({orders.filter(o => o.status === tab.value).length})</span>}
          </button>
        ))}
      </div>

      {/* ── RESULTS INFO ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>
          Hiển thị {pagedOrders.length} / {filteredOrders.length} lệnh sản xuất
        </span>
      </div>

      {/* ── TABLE ── */}
      {loading ? <Loading /> : filteredOrders.length === 0 ? (
        <EmptyState message="Không có lệnh sản xuất nào" />
      ) : (
        <Table headers={['Mã lệnh SX', 'Sản phẩm', 'Số lượng', 'Ưu tiên', 'Trạng thái', 'Ngày bắt đầu', 'Ngày hoàn thành', 'Thao tác']}>
          {pagedOrders.map((o) => {
            const pct = o.quantity > 0 ? Math.min(100, Math.round((o.completedQuantity || 0) / o.quantity * 100)) : 0
            const st = STATUS_BADGE[o.status] || { variant: 'gray', label: o.status }
            const pr = PRIORITY_BADGE[o.priority] || { variant: 'gray', label: o.priority }
            return (
              <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                <Td>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{o.orderNumber}</span>
                </Td>
                <Td>
                  <span style={{ color: '#374151' }}>{o.product?.name || '—'}</span>
                </Td>
                <Td>
                  <span style={{ fontWeight: '500' }}>{fmt(o.quantity)}</span>
                </Td>
                <Td>
                  <Badge variant={pr.variant}>{pr.label}</Badge>
                </Td>
                <Td>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </Td>
                <Td>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{fmtDate(o.startDate)}</span>
                </Td>
                <Td>
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>{fmtDate(o.dueDate)}</span>
                </Td>
                <Td>
                  <Link
                    to={`/production-orders/${o.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      color: '#7c3aed',
                      fontSize: '12px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    👁 Chi tiết
                  </Link>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={paginationBtn(false, currentPage === 1)}
          >
            ‹ Trước
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={paginationBtn(currentPage === page, false)}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={paginationBtn(false, currentPage === totalPages)}
          >
            Sau ›
          </button>
        </div>
      )}
    </DashboardLayout>
  )
}
