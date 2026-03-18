import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { 
  PageHeader, Loading, EmptyState, Table, Td, Badge, 
  ActionLink, Icons, fmtCurrency, fmtDate, GlassCard, SearchBar,
  Drawer, Btn, Field, Alert, ConfirmModal, fmt, Dropdown, DatePicker, Pagination
} from '../../components/ui'
import { QuotationPrint } from '../../components/QuotationPrint'
import quotationService from '../../services/quotationService'

export default function QuotationList() {
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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
  const [drawerAlert, setDrawerAlert] = useState(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [dateError, setDateError] = useState('')
  const [editDateError, setEditDateError] = useState('')
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const filterRef = useRef(null)
  const navigate = useNavigate()
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1) // UI dùng 1-based, API dùng 0-based
  const [totalElements, setTotalElements] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Debounce search: chờ 500ms sau khi user ngừng gõ mới gọi API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Reset về trang 1 khi search thay đổi
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('Ngày bắt đầu không thể sau ngày kết thúc')
    } else {
      setDateError('')
    }
  }, [startDate, endDate])

  const PRICE_RANGES = [
    { label: 'Tất cả', min: '', max: '' },
    { label: 'Dưới 10 triệu', min: 0, max: 10000000 },
    { label: '10 triệu - 50 triệu', min: 10000000, max: 50000000 },
    { label: '50 triệu - 100 triệu', min: 50000000, max: 100000000 },
    { label: '100 triệu - 500 triệu', min: 100000000, max: 500000000 },
    { label: 'Trên 500 triệu', min: 500000000, max: 999999999999 },
  ]

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage - 1, // Spring Data: 0-based
        size: pageSize,
        sortBy: 'createdDate',
        sortDir: 'desc',
        ...(debouncedSearch && { keyword: debouncedSearch }),
        ...(filterStatus !== 'ALL' && { status: filterStatus }),
        ...(minPrice !== '' && { minPrice }),
        ...(maxPrice !== '' && { maxPrice }),
        ...(startDate && { startDate: `${startDate}T00:00:00` }),
        ...(endDate && { endDate: `${endDate}T23:59:59` }),
      }
      const pageData = await quotationService.getAll(params)
      setQuotations(pageData.content || [])
      setTotalElements(pageData.totalElements || 0)
    } catch (err) {
      console.error("Fetch Error Detail:", err.response?.data || err.message)
      setQuotations([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, filterStatus, minPrice, maxPrice, startDate, endDate])

  useEffect(() => { fetchQuotations() }, [fetchQuotations])

  // Reset về trang 1 khi đổi filterStatus
  const handleStatusChange = (val) => {
    setFilterStatus(val)
    setCurrentPage(1)
  }

  // Reset về trang 1 khi đổi pageSize
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  // Filtered quotations (Bây giờ chỉ dùng kết quả từ API)
  const filteredQuotations = useMemo(() => quotations, [quotations])

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
      if (editData.validUntil && selectedQuote.createdDate) {
        const validDate = new Date(editData.validUntil).setHours(0,0,0,0);
        const createdDate = new Date(selectedQuote.createdDate).setHours(0,0,0,0);
        if (validDate < createdDate) {
          setEditDateError('Ngày hết hạn không được trước ngày tạo báo giá');
          return;
        }
      }
      setEditDateError('');
      
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
      setDrawerAlert({ type: 'success', message: 'Cập nhật nội dung báo giá thành công' })
      
      // Chờ 1.5s để user kịp đọc thông báo rồi mới về màn hình chi tiết
      setTimeout(() => {
        setDrawerAlert(null)
        setIsEditing(false)
        openDetail(selectedQuote) // Refresh detail
        fetchQuotations() // Refresh list
      }, 1500)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Lỗi khi cập nhật báo giá' })
    }
  }

  const handleCancelQuote = async () => {
    try {
      await quotationService.updateStatus(selectedQuote.id, 'REJECTED')
      setAlert({ type: 'success', message: 'Hủy báo giá thành công' })
      setIsCancelConfirmOpen(false)
      setIsDrawerOpen(false)
      fetchQuotations()
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Lỗi khi hủy báo giá' })
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

  const hasFilter = minPrice !== '' || maxPrice !== '' || startDate || endDate || filterStatus !== 'ALL'

  return (
    <DashboardLayout>
      <PageHeader 
        title="Quản lý Báo giá" 
        desc="Theo dõi quy trình bán hàng và chốt đơn" 
        actionTo="/quotations/new" 
        actionLabel="Tạo báo giá"
      />

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="mb-8 flex items-center gap-4 relative">
        <div className="flex-1 relative">
          <SearchBar 
            placeholder="Tìm số báo giá hoặc tên khách hàng..."
            className="w-full"
            value={search}
            onChange={setSearch}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-xl transition-all ${isFilterOpen || hasFilter ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 text-gray-400 hover:text-gray-900'}`}
              title="Bộ lọc nâng cao"
            >
              {Icons.filter}
            </button>
          </div>

          {/* Advanced Filter Popover */}
          {isFilterOpen && (
            <div 
              ref={filterRef}
              className="absolute top-full right-0 mt-3 p-6 bg-white rounded-[32px] shadow-2xl border border-gray-100 z-[100] w-[700px] animate-fade-in"
            >
              <div className="grid grid-cols-3 gap-8">
                {/* Column 1: Status */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Trạng thái</p>
                  <Dropdown 
                    value={filterStatus}
                    onChange={handleStatusChange}
                    options={STATUS_OPTIONS}
                    placeholder={null}
                  />
                </div>

                {/* Column 2: Price Range */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Khoảng giá tiền</p>
                  <Dropdown 
                    value={`${minPrice}-${maxPrice}`}
                    onChange={(val) => {
                      const [min, max] = val.split('-')
                      setMinPrice(min)
                      setMaxPrice(max)
                    }}
                    options={PRICE_RANGES.map(r => ({ value: `${r.min}-${r.max}`, label: r.label }))}
                    placeholder={null}
                  />
                </div>

                {/* Column 3: Date Range */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Ngày tạo báo giá</p>
                  <div className="flex flex-col gap-4">
                    <DatePicker 
                      label="Từ ngày"
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Chọn ngày bắt đầu"
                      error={dateError ? ' ' : ''}
                    />
                    <DatePicker 
                      label="Đến ngày"
                      value={endDate}
                      onChange={setEndDate}
                      placeholder="Chọn ngày kết thúc"
                      error={dateError}
                    />

                    <div className="mt-4 pt-4 border-t border-gray-50 flex gap-2">
                       <button 
                        onClick={() => {
                          setMinPrice(''); setMaxPrice(''); setStartDate(''); setEndDate('');
                          setSearch(''); setFilterStatus('ALL');
                        }}
                        className="flex-1 h-11 rounded-xl text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        Xóa bộ lọc
                      </button>
                      <button 
                        onClick={() => setIsFilterOpen(false)}
                        className="flex-1 h-11 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-lg shadow-black/10"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="hidden lg:flex gap-6 items-center px-6 py-3 bg-purple-50/50 rounded-full border border-purple-100/50">
          <div className="flex flex-col">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest">Kết quả</span>
            <span className="text-sm font-bold text-purple-700">{totalElements} items</span>
          </div>
          <div className="w-px h-6 bg-purple-200/50"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest">Tổng doanh thu</span>
            <span className="text-sm font-bold text-purple-700">{fmtCurrency(totalAmountValue)}</span>
          </div>
        </div>
      </div>

      {loading ? <Loading /> : quotations.length === 0 ? <EmptyState message="Không tìm thấy báo giá nào" /> : (
        <div className="animate-fade-in pb-8">
          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <Table headers={['Số báo giá', 'Khách hàng', 'Nhân viên', 'Tổng tiền', 'Ngày tạo', 'Trạng thái', 'Thao tác']}>
              {quotations.map((q) => (
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
                      { !['REJECTED', 'EXPIRED', 'ACCEPTED', 'APPROVED'].includes(q.status) && (
                        <button 
                          onClick={() => openDetail(q, true)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                          title="Sửa nhanh"
                        >
                          {Icons.edit}
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>

            {/* Phân trang */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalElements}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        </div>
      )}

      {/* Drawer Chi tiết Báo giá */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        title={`Chi tiết Báo giá ${selectedQuote?.quotationNumber || ''}`}
      >
        {drawerAlert && <Alert type={drawerAlert.type} message={drawerAlert.message} onClose={() => setDrawerAlert(null)} className="mb-4" />}
        {selectedQuote && (
          <div className="flex flex-col gap-8 pb-20">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin khách hàng</p>
                <h4 className="text-lg font-bold text-gray-900 mb-1">{selectedQuote.customer?.name}</h4>
                <p className="text-sm text-gray-500">{selectedQuote.customer?.email || 'Chưa có email'}</p>
                <p className="text-sm text-gray-500">{selectedQuote.customer?.phoneNumber || 'Chưa có SĐT'}</p>
                <p className="text-sm text-gray-500 mt-2">{selectedQuote.customer?.address || 'Chưa có địa chỉ'}</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100/50">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Thông tin báo giá</p>
                <div className="flex justify-between items-center mb-4">
                  {isEditing ? (
                    <div className="w-48 relative">
                      <Dropdown
                        value={editData.status}
                        onChange={(val) => setEditData({...editData, status: val})}
                        options={STATUS_OPTIONS.filter(o => o.value !== 'ALL')}
                        placeholder={null}
                        className="py-1 font-bold text-purple-700 !shadow-none !border-purple-200"
                        required={true}
                      />
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
                    {!isEditing && !['REJECTED', 'EXPIRED', 'ACCEPTED', 'APPROVED'].includes(selectedQuote.status) && (
                        <Btn variant="secondary" onClick={() => setIsEditing(true)}>
                            {Icons.edit} Chỉnh sửa
                        </Btn>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-400 border-b border-gray-50">
                                <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-widest bg-gray-50/50">Sản phẩm</th>
                                <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-widest bg-gray-50/50">Số lượng</th>
                                <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-widest bg-gray-50/50">Đơn giá</th>
                                <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-widest bg-gray-50/50 text-orange-500">Chiết khấu</th>
                                <th className="px-6 py-4 font-semibold uppercase text-[10px] tracking-widest bg-gray-50/50 text-right">Thành tiền</th>
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
                                        <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-50/50">{item.productName}</td>
                                        <td className="px-6 py-4 border-r border-gray-50/50">
                                            {isEditing ? (
                                                <input 
                                                    type="number" 
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newData = {...editData}
                                                        let val = e.target.value === '' ? 0 : Number(e.target.value);
                                                        newData.details[idx].quantity = Math.max(1, Math.floor(val) || 0)
                                                        setEditData(newData)
                                                    }}
                                                    className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-purple-400 shadow-sm font-bold"
                                                />
                                            ) : (
                                                <span className="font-bold text-gray-900">{item.quantity}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-600 border-r border-gray-50/50 whitespace-nowrap">{fmtCurrency(item.unitPrice)}</td>
                                        <td className="px-6 py-4 border-r border-gray-50/50">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input 
                                                        type="number" 
                                                        value={Math.round(discountPercent * 10) / 10}
                                                        onChange={(e) => {
                                                            const newData = {...editData}
                                                            let val = e.target.value === '' ? 0 : Number(e.target.value);
                                                            val = Math.max(0, Math.min(100, val || 0))
                                                            newData.details[idx].discountPercent = val
                                                            setEditData(newData)
                                                        }}
                                                        className="w-16 bg-white border border-orange-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-400 shadow-sm text-orange-600 font-bold"
                                                    />
                                                    <span className="text-orange-400 font-bold">%</span>
                                                </div>
                                            ) : (
                                                <span className="text-orange-600 font-bold">-{fmtCurrency(item.discount || 0)}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-purple-700 tracking-tight whitespace-nowrap">
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
                             <DatePicker 
                                 label=""
                                 value={editData.validUntil?.split('T')[0] || ''}
                                 onChange={(val) => {
                                     setEditData({...editData, validUntil: val})
                                     setEditDateError('') // Clear error khi user gõ lại
                                 }}
                                 error={editDateError}
                             />
                          ) : (
                             <div className="text-gray-900 font-medium">{fmtDate(selectedQuote.validUntil)}</div>
                         )}
                    </Field>
                </div>
            </div>

            <div className="fixed bottom-0 right-0 left-0 md:left-auto md:w-[42rem] bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 flex justify-between items-center z-20">
                <div className="flex gap-3">
                    {!isEditing && ['DRAFT', 'SENT'].includes(selectedQuote.status) && (
                        <>
                            <Btn variant="secondary" onClick={handlePrint}>
                                In báo giá
                            </Btn>
                            <Btn variant="danger" onClick={() => setIsCancelConfirmOpen(true)}>
                                Hủy báo giá
                            </Btn>
                        </>
                    )}
                    {!isEditing && selectedQuote.status === 'ACCEPTED' && (
                        <Btn variant="primary" onClick={() => navigate('/sales-orders/new', { state: { quotationData: selectedQuote } })}>
                            Tạo đơn hàng
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

      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelQuote}
        title="Xác nhận hủy báo giá"
        message="Bạn có chắc chắn muốn hủy báo giá này không? Hành động này không thể hoàn tác."
        variant="danger"
        confirmLabel="Hủy báo giá"
      />
      {selectedQuote && (
        <QuotationPrint 
          data={{
            quotationNumber: selectedQuote.quotationNumber,
            customerName: selectedQuote.customer?.name,
            customerType: "Khách lẻ", // Backend chưa trả về loại, mặc định Khách lẻ
            customerPhone: selectedQuote.customer?.phoneNumber,
            customerEmail: selectedQuote.customer?.email,
            validUntil: selectedQuote.validUntil,
            items: selectedQuote.details.map(d => ({
              name: d.productName,
              sku: d.productSku || '—',
              quantity: d.quantity,
              unitPrice: d.unitPrice,
              discount: d.discountPercent || (d.unitPrice * d.quantity > 0 ? (d.discount / (d.unitPrice * d.quantity)) * 100 : 0),
              totalPrice: d.totalLineAmount
            })),
            totals: {
              subtotal: selectedQuote.details.reduce((sum, d) => sum + (d.quantity * d.unitPrice), 0),
              discount: selectedQuote.details.reduce((sum, d) => sum + (d.discount || 0), 0),
              grandTotal: selectedQuote.totalAmount
            }
          }} 
        />
      )}
    </DashboardLayout>
  )
}
