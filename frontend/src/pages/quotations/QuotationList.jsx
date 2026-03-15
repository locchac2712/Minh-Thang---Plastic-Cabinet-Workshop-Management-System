import { useState, useEffect, useMemo, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { 
  PageHeader, Loading, EmptyState, Table, Td, Badge, 
  ActionLink, Icons, fmtCurrency, fmtDate, GlassCard, SearchBar,
  Drawer, Btn, Field, Alert, ConfirmModal, fmt 
} from '../../components/ui'
import quotationService from '../../services/quotationService'

export default function QuotationList() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(null)
  const [alert, setAlert] = useState(null)

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const data = await quotationService.getAll()
      const list = data?.content || data?.data?.content || []
      setQuotations(list)
    } catch (err) {
      console.error("Fetch Error Detail:", err.response?.data || err.message)
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuotations() }, [])

  // Filtered quotations directly
  const filteredQuotations = useMemo(() => {
    let result = quotations

    // Lọc theo trạng thái
    if (filterStatus !== 'ALL') {
      result = result.filter(q => q.status?.toUpperCase() === filterStatus)
    }

    // Lọc theo tìm kiếm
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(q => 
        q.quotationNumber?.toLowerCase().includes(s) ||
        q.customerName?.toLowerCase().includes(s) ||
        q.customer?.name?.toLowerCase().includes(s)
      )
    }

    // Filter by price range
    if (minPrice) {
      result = result.filter(q => (q.totalAmount || 0) >= parseFloat(minPrice))
    }
    if (maxPrice) {
      result = result.filter(q => (q.totalAmount || 0) <= parseFloat(maxPrice))
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0)
      result = result.filter(q => new Date(q.createdDate || q.createdAt).getTime() >= start)
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999)
      result = result.filter(q => new Date(q.createdDate || q.createdAt).getTime() <= end)
    }

    return result
  }, [quotations, search, filterStatus, minPrice, maxPrice, startDate, endDate])

  const openDetail = async (quote, isEditMode = false) => {
    try {
      const detail = await quotationService.getById(quote.id)
      setSelectedQuote(detail)
      setEditData(JSON.parse(JSON.stringify(detail))) // Deep copy
      setIsDrawerOpen(true)
      setIsEditing(isEditMode)
    } catch (err) {
      setAlert({ type: 'error', message: 'Không thể lấy chi tiết báo giá' })
    }
  }

  const handleUpdate = async () => {
    try {
      // Prepare payload for update
      const payload = {
        customerId: selectedQuote.customer?.id,
        staffId: selectedQuote.staff?.id,
        validUntil: editData.validUntil?.includes('T') ? editData.validUntil : `${editData.validUntil}T23:59:59`,
        status: editData.status,
        note: editData.note,
        items: editData.details.map(d => ({
          productId: d.productId, // Fix: ItemDto has productId directly
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          discountPercent: d.discountPercent ?? (d.discount && d.quantity && d.unitPrice ? (d.discount / (d.quantity * d.unitPrice)) * 100 : 0)
        }))
      }
      await quotationService.update(selectedQuote.id, payload)
      setAlert({ type: 'success', message: 'Cập nhật nội dung báo giá thành công' })
      setIsEditing(false)
      openDetail(selectedQuote) // Refresh detail
      fetchQuotations() // Refresh list
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Lỗi khi cập nhật báo giá' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const totalAmountValue = useMemo(() => 
    filteredQuotations.reduce((sum, q) => sum + (q.totalAmount || 0), 0)
  , [filteredQuotations])

  const getStatusColor = (status) => {
    const s = status?.toUpperCase()
    if (s === 'DRAFT') return 'blue'
    if (s === 'SENT') return 'purple'
    if (s === 'ACCEPTED' || s === 'APPROVED') return 'green'
    if (s === 'REJECTED' || s === 'CANCELLED') return 'red'
    if (s === 'EXPIRED') return 'yellow'
    return 'gray'
  }

  const getStatusLabel = (status) => {
    const s = status?.toUpperCase()
    if (s === 'DRAFT') return 'Nháp'
    if (s === 'SENT') return 'Đã gửi'
    if (s === 'ACCEPTED' || s === 'APPROVED') return 'Đã chốt'
    if (s === 'REJECTED' || s === 'CANCELLED') return 'Hủy'
    if (s === 'EXPIRED') return 'Hết hạn'
    return status
  }

  const STATUS_OPTIONS = [
    { value: 'ALL', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'SENT', label: 'Đã gửi' },
    { value: 'ACCEPTED', label: 'Đã chốt' },
    { value: 'REJECTED', label: 'Hủy' },
    { value: 'EXPIRED', label: 'Hết hạn' },
  ]

  return (
    <DashboardLayout>
      <PageHeader 
        title="Quản lý Báo giá" 
        desc="Theo dõi quy trình bán hàng và chốt đơn" 
        actionTo="/quotations/new" 
        actionLabel="Tạo báo giá"
      />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <GlassCard className="mb-8 p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <SearchBar 
                placeholder="Tìm số báo giá hoặc tên khách hàng..."
                className="w-full"
                value={search}
                onChange={setSearch}
              />
            </div>
            
            <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
              {/* Status Select */}
              <div className="relative w-full md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-gray-50/50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-purple-400 focus:bg-white transition-all appearance-none"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Stats overview */}
              <div className="flex gap-4 items-center px-4 py-2 bg-purple-50 rounded-2xl border border-purple-100/50 text-xs font-bold whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-400 uppercase tracking-widest">Kết quả</span>
                  <span className="text-purple-700">{filteredQuotations.length}</span>
                </div>
                <div className="w-px h-6 bg-purple-100"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-purple-400 uppercase tracking-widest">Tổng tiền</span>
                  <span className="text-purple-700">{fmtCurrency(totalAmountValue)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
            {/* Price Range */}
            <div className="lg:col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                {Icons.currency} Khoảng giá (VNĐ)
              </p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
                <span className="text-gray-300">→</span>
                <input 
                  type="number" 
                  placeholder="Đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2 lg:col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                {Icons.calendar} Ngày tạo báo giá
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Từ</span>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Đến</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-10 px-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-purple-400 focus:bg-white transition-all"
                  />
                </div>
                {/* Reset Button */}
                {(minPrice || maxPrice || startDate || endDate || search || filterStatus !== 'ALL') && (
                  <button 
                    onClick={() => {
                      setMinPrice(''); setMaxPrice(''); setStartDate(''); setEndDate('');
                      setSearch(''); setFilterStatus('ALL');
                    }}
                    className="h-10 px-4 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1"
                    title="Xóa bộ lọc"
                  >
                    {Icons.close} Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {loading ? <Loading /> : filteredQuotations.length === 0 ? <EmptyState message="Không tìm thấy báo giá nào" /> : (
        <div className="animate-fade-in pb-8">
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <Table headers={['Số báo giá', 'Khách hàng', 'Nhân viên', 'Tổng tiền', 'Ngày tạo', 'Trạng thái', 'Thao tác']}>
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-none">
                  <Td className="font-mono text-xs text-gray-500 tracking-tighter">{q.quotationNumber}</Td>
                  <Td className="font-bold text-gray-900">{q.customerName || q.customer?.name || 'Vãng lai'}</Td>
                  <Td className="text-gray-600 text-xs font-medium">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase">
                        {(q.salesStaff?.fullName || q.staff?.fullName || q.staffName || '?').charAt(0)}
                      </div>
                      {q.salesStaff?.fullName || q.staff?.fullName || q.staffName || '—'}
                    </div>
                  </Td>
                  <Td className="font-black text-gray-800 tracking-tight">{fmtCurrency(q.totalAmount)}</Td>
                  <Td className="text-gray-500 text-xs">{fmtDate(q.createdDate || q.createdAt)}</Td>
                  <Td>
                    <Badge variant={getStatusColor(q.status)}>
                      {getStatusLabel(q.status)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetail(q)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                      >
                        {Icons.eye}
                      </button>
                      <button 
                        onClick={() => openDetail(q, true)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                        title="Sửa nhanh"
                      >
                        {Icons.edit}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      )}

      {/* Drawer Chi tiết Báo giá */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={`Chi tiết Báo giá ${selectedQuote?.quotationNumber || ''}`}
      >
        {selectedQuote && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin khách hàng</p>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{selectedQuote.customer?.name}</h4>
                <p className="text-sm text-gray-500">{selectedQuote.customer?.email || 'Chưa có email'}</p>
                <p className="text-sm text-gray-500">{selectedQuote.customer?.phone || 'Chưa có SĐT'}</p>
                <p className="text-sm text-gray-500 mt-2">{selectedQuote.customer?.address || 'Chưa có địa chỉ'}</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100/50">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Thông tin báo giá</p>
                <div className="flex justify-between items-center mb-4">
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({...editData, status: e.target.value})}
                        className="h-8 pl-3 pr-8 bg-white border border-purple-200 rounded-lg text-xs font-bold text-purple-700 focus:outline-none appearance-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.filter(o => o.value !== 'ALL').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <Badge variant={getStatusColor(selectedQuote.status)}>
                      {getStatusLabel(selectedQuote.status)}
                    </Badge>
                  )}
                  <span className="text-xs font-medium text-purple-600">{fmtDate(selectedQuote.createdDate)}</span>
                </div>
                <p className="text-2xl font-black text-purple-700 tracking-tighter">{fmtCurrency(selectedQuote.totalAmount)}</p>
                <p className="text-[10px] text-purple-400 font-medium mt-1">Người tạo: {selectedQuote.staff?.fullname}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h5 className="font-bold text-gray-900">Danh sách sản phẩm</h5>
                    {!isEditing && (
                        <Btn variant="secondary" onClick={() => setIsEditing(true)}>
                            {Icons.edit} Chỉnh sửa
                        </Btn>
                    )}
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-400 border-b border-gray-50">
                            <th className="px-6 py-4 font-semibold">Tên sản phẩm</th>
                            <th className="px-6 py-4 font-semibold">Số lượng</th>
                            <th className="px-6 py-4 font-semibold">Đơn giá</th>
                            <th className="px-6 py-4 font-semibold">Chiết khấu</th>
                            <th className="px-6 py-4 font-semibold text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {(isEditing ? editData : selectedQuote).details.map((item, idx) => {
                            const quantity = item.quantity || 0;
                            const unitPrice = item.unitPrice || 0;
                            const totalBase = quantity * unitPrice;
                            const discountPercent = item.discountPercent ?? (totalBase > 0 ? (item.discount / totalBase) * 100 : 0);
                            
                            return (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.productName}</td>
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newData = {...editData}
                                                    newData.details[idx].quantity = parseInt(e.target.value) || 0
                                                    setEditData(newData)
                                                }}
                                                className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-400"
                                            />
                                        ) : item.quantity}
                                    </td>
                                    <td className="px-6 py-4">{fmtCurrency(item.unitPrice)}</td>
                                    <td className="px-6 py-4">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="number" 
                                                    value={Math.round(discountPercent * 10) / 10}
                                                    onChange={(e) => {
                                                        const newData = {...editData}
                                                        const val = parseFloat(e.target.value) || 0
                                                        newData.details[idx].discountPercent = val
                                                        setEditData(newData)
                                                    }}
                                                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-400"
                                                />
                                                <span>%</span>
                                            </div>
                                        ) : (
                                            <span className="text-red-500">-{fmtCurrency(item.discount || 0)}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {fmtCurrency(isEditing ? 
                                            (totalBase * (1 - (discountPercent || 0) / 100)) : 
                                            item.totalLineAmount
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col gap-4">
                <Field label="Ghi chú">
                    {isEditing ? (
                        <textarea 
                            value={editData.note || ''}
                            onChange={(e) => setEditData({...editData, note: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 min-h-[100px]"
                            placeholder="Nhập ghi chú mới..."
                        />
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-600 italic">
                            {selectedQuote.note || 'Không có ghi chú'}
                        </div>
                    )}
                </Field>
                <div className="w-48">
                    <Field label="Ngày hết hạn">
                         {isEditing ? (
                            <input 
                                type="date" 
                                value={editData.validUntil?.split('T')[0] || ''}
                                onChange={(e) => setEditData({...editData, validUntil: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
                            />
                         ) : (
                             <div className="text-gray-900 font-medium">{fmtDate(selectedQuote.validUntil)}</div>
                         )}
                    </Field>
                </div>
            </div>

            <div className="fixed bottom-0 right-0 left-0 md:left-auto md:w-[42rem] bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 flex justify-between items-center z-20">
                <div className="flex gap-3">
                    {selectedQuote.status === 'DRAFT' && (
                        <Btn variant="secondary" onClick={handlePrint}>
                            {Icons.print} In báo giá
                        </Btn>
                    )}
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <>
                            <Btn variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Btn>
                            <Btn variant="purple" onClick={handleUpdate}>
                                {Icons.save} Lưu thay đổi
                            </Btn>
                        </>
                    ) : (
                        <Btn variant="purple" onClick={() => setIsDrawerOpen(false)}>Đóng</Btn>
                    )}
                </div>
            </div>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  )
}
