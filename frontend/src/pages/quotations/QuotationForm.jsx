import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { 
  LinkBtn, Icons, fmtCurrency, GlassCard, Badge, Select, Dropdown, Modal, ComboBox, PageHeader, Btn,
  Alert, Field, Card, Table, Td, TextArea, DatePicker
} from '../../components/ui'
import { QuotationPrint } from '../../components/QuotationPrint'
import customerService from '../../services/customerService'
import productService from '../../services/productService'
import quotationService from '../../services/quotationService'

const emptyItem = () => ({
  key: Date.now() + Math.random(),
  productId: '',
  sku: '',
  name: '',
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  totalPrice: 0,
  notes: '',
})

const generateQuotationNumber = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `BG-${year}-${random}`
}

export default function QuotationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  
  // Header Info
  const [quotationNumber, setQuotationNumber] = useState('')
  const [createdDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('DRAFT')
  
  // Customer Info
  const [customerId, setCustomerId] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerType, setCustomerType] = useState('Khách lẻ')
  
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({}) // State lưu trữ nhiều lỗi theo từng trường
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [customerSaving, setCustomerSaving] = useState(false)

  useEffect(() => {
    customerService.getAll().then((data) => setCustomers(data || [])).catch(() => {})
    productService.getAll().then((data) => setProducts(data || [])).catch(() => {})
    
    if (!isEdit) {
      setQuotationNumber(generateQuotationNumber())
    }
  }, [isEdit])

  useEffect(() => {
    if (isEdit) {
      quotationService.getById(id).then((q) => {
        setQuotationNumber(q.quotationNumber || '')
        setStatus(q.status || 'DRAFT')
        setCustomerId(q.customer?.id || '')
        setCustomerEmail(q.customer?.email || '')
        setCustomerPhone(q.customer?.phoneNumber || '')
        setValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '')
        setNotes(q.notes || '')
        if (q.items?.length) {
          setItems(q.items.map((it) => ({
            key: it.id || Date.now() + Math.random(),
            productId: it.product?.id || '',
            sku: it.product?.sku || '',
            name: it.product?.name || '',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            discount: it.discount || 0,
            totalPrice: it.totalPrice || 0,
            notes: it.notes || '',
          })))
        }
      }).catch(() => navigate('/quotations'))
    }
  }, [id, isEdit, navigate])

  // Auto-fill customer info
  const handleCustomerChange = (cid) => {
    setCustomerId(cid)
    setErrors(prev => ({ ...prev, customerId: '' })) // Xóa lỗi khi thay đổi
    const customer = customers.find(c => String(c.id) === String(cid))
    if (customer) {
      setCustomerEmail(customer.email || '')
      setCustomerPhone(customer.phoneNumber || '')
      // Default to "Khách lẻ"
      setCustomerType(customer.type || 'Khách lẻ')
    }
  }

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev]
      let current = { ...updated[index] }

      // Validate non-negative numbers & strip leading zeros
      let cleanValue = value === '' ? 0 : Number(value);
      if (isNaN(cleanValue)) cleanValue = 0;
      
      if (field === 'quantity') cleanValue = Math.max(1, Math.floor(cleanValue))
      if (field === 'discount') cleanValue = Math.max(0, Math.min(100, cleanValue))
      
      current[field] = cleanValue
      
      // Auto-fill product details (Unit Price is READ-ONLY now)
      if (field === 'productId') {
        const prod = products.find(p => String(p.id) === String(value))
        if (prod) {
          current.sku = prod.sku || ''
          current.name = prod.name || ''
          current.unitPrice = prod.sellingPrice || 0
        }
      }

      const qty = Number(current.quantity) || 0
      const price = Number(current.unitPrice) || 0
      const disc = Number(current.discount) || 0
      current.totalPrice = qty * price * (1 - disc / 100)
      
      updated[index] = current
      return updated
    })
    
    // Xóa lỗi cho dòng này khi có thay đổi
    if (errors.items?.[index]) {
      setErrors(prev => {
        const newItemsErrors = { ...prev.items }
        delete newItemsErrors[index]
        return { ...prev, items: newItemsErrors }
      })
    }
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
    // Xóa/Cập nhật lại lỗi index nếu cần
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0)
    const grandTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0)
    return { subtotal, discount: subtotal - grandTotal, grandTotal }
  }, [items])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // VALIDATIONS
    const newErrors = {}
    if (!customerId) newErrors.customerId = 'Vui lòng chọn khách hàng'
    if (!validUntil) newErrors.validUntil = 'Vui lòng chọn ngày hiệu lực'
    
    if (validUntil) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(validUntil)
      
      if (selectedDate < today) newErrors.validUntil = 'Ngày hiệu lực không được nhỏ hơn ngày hiện tại'
    }
    
    const itemErrors = {}
    items.forEach((it, idx) => {
      const errs = {}
      if (!it.productId) errs.productId = 'Chọn sản phẩm'
      if (it.quantity <= 0) errs.quantity = 'Lỗi qty'
      if (it.unitPrice < 0) errs.unitPrice = 'Lỗi giá'
      if (it.discount < 0) errs.discount = 'Âm %'
      if (it.discount > 30) errs.discount = '> 30%'
      
      if (Object.keys(errs).length > 0) {
        itemErrors[idx] = errs
      }
    })
    
    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    setErrors({})
    try {
      // Lấy thông tin nhân viên từ localStorage
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const staffId = user?.staffId || user?.id || 1 

      const payload = {
        customerId: Number(customerId),
        staffId: Number(staffId),
        validUntil: validUntil ? `${validUntil}T23:59:59` : null,
        status: status,
        note: notes,
        items: items.map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          discountPercent: Number(it.discount) || 0,
        })),
      }
      if (isEdit) {
        await quotationService.update(id, payload)
      } else {
        await quotationService.create(payload)
      }
      navigate('/quotations')
    } catch (err) {
      setErrors({ server: err.response?.data?.message || 'Có lỗi xảy ra khi lưu báo giá' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Hiệu chỉnh Báo giá' : 'Tạo Báo giá Mới'}>
        <div className="flex items-center gap-2">
          <LinkBtn to="/quotations" variant="ghost">{Icons.back} Quay lại</LinkBtn>
          {(isEdit || !saving) && (
            <Btn variant="secondary" onClick={() => window.print()} className="bg-white border-gray-200">
               In Báo giá
            </Btn>
          )}
          <Btn type="submit" onClick={handleSubmit} disabled={saving} className="shadow-lg shadow-purple-600/20">
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Xác nhận Báo giá'}
          </Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Alert type="error" message={errors.server} onClose={() => setErrors(prev => ({ ...prev, server: '' }))} />

          {/* Header Info Card */}
          <GlassCard className="p-8 relative z-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1 block">Mã báo giá</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{quotationNumber || 'Đang tạo...'}</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trạng thái</span>
                <Badge variant={
                  status === 'DRAFT' ? 'gray' :
                  status === 'SENT' ? 'blue' :
                  status === 'ACCEPTED' ? 'green' : 'red'
                }>
                  {status === 'DRAFT' ? 'Nháp' :
                   status === 'SENT' ? 'Đã gửi' :
                   status === 'ACCEPTED' ? 'Đã chốt' : 
                   status === 'REJECTED' ? 'Đã hủy' : 'Hết hạn'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ComboBox
                label="Khách hàng"
                required
                placeholder="Tìm hoặc chọn khách hàng..."
                value={customerId}
                onChange={(val) => handleCustomerChange(val)}
                options={customers.map(c => ({ value: c.id, label: c.name }))}
                onCreateNew={() => setIsCustomerModalOpen(true)}
                error={errors.customerId}
              />

              <div className="flex flex-col gap-8">
                <Dropdown
                  label="Loại khách hàng"
                  value={customerType}
                  onChange={(val) => setCustomerType(val)}
                  options={[
                    { value: 'Khách lẻ', label: 'Khách lẻ' },
                    { value: 'Đại lý', label: 'Đại lý' },
                    { value: 'Nhà phân phối', label: 'Nhà phân phối' },
                  ]}
                />

                {isEdit && (
                  <Dropdown
                    label="Trạng thái báo giá"
                    value={status}
                    onChange={(val) => setStatus(val)}
                    options={[
                      { value: 'DRAFT', label: 'Nháp' },
                      { value: 'SENT', label: 'Đã gửi' },
                      { value: 'ACCEPTED', label: 'Đã chốt' },
                      { value: 'REJECTED', label: 'Hủy' },
                      { value: 'EXPIRED', label: 'Hết hạn' },
                    ]}
                  />
                )}
              </div>
              
              <Field label="Email liên hệ" icon={Icons.eye} value={customerEmail} readOnly disabled className="opacity-70" />
              <Field label="Số điện thoại" icon={Icons.eye} value={customerPhone} readOnly disabled className="opacity-70" />
            </div>
          </GlassCard>

          {/* Items Section */}
          <Card className="border-none shadow-xl shadow-gray-200/50 min-h-[400px] overflow-hidden">
            <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">SẢN PHẨM</h3>
              <Btn variant="ghost" type="button" onClick={addItem} className="text-purple-600 hover:bg-purple-50">
                {Icons.plus} Thêm dòng mới
              </Btn>
            </div>
            <Table 
              headers={['Sản phẩm / SKU', 'Số lượng', 'Đơn giá', 'Chiết khấu %', 'Thành tiền', '']}
              className="border-none shadow-none"
              containerClassName="overflow-x-auto"
            >
              {items.map((item, idx) => (
                <tr key={item.key} className="group hover:bg-gray-50/50 transition-colors">
                  <Td className="min-w-[280px]">
                    <div className="flex flex-col gap-1 pt-1">
                      <ComboBox
                        placeholder="Tìm sản phẩm..."
                        value={item.productId}
                        onChange={(val) => updateItem(idx, 'productId', val)}
                        options={products
                          .filter(p => !items.some((it, i) => i !== idx && String(it.productId) === String(p.id)))
                          .map(p => ({ value: p.id, label: p.name }))
                        }
                        error={errors.items?.[idx]?.productId}
                      />
                      <span className="text-[10px] font-mono text-gray-400 px-2 uppercase tracking-tighter">{item.sku || '—'}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className={`w-20 bg-gray-50/50 border ${errors.items?.[idx]?.quantity ? 'border-red-500' : 'border-gray-100'} rounded-2xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-purple-400 transition-all outline-none shadow-sm`}
                      />
                      {errors.items?.[idx]?.quantity && <span className="text-[9px] text-red-500 font-bold">{errors.items[idx].quantity}</span>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1 bg-gray-50/30 px-3 py-2.5 rounded-2xl border border-gray-50">
                      <span className="text-sm font-bold text-gray-700">{fmtCurrency(item.unitPrice)}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                          className={`w-20 bg-orange-50/30 border ${errors.items?.[idx]?.discount ? 'border-red-500' : 'border-orange-100'} text-orange-600 rounded-2xl px-4 py-2.5 text-sm font-bold focus:bg-white focus:border-orange-400 transition-all outline-none shadow-sm`}
                        />
                        <span className="text-xs text-orange-400 font-black">%</span>
                      </div>
                      {errors.items?.[idx]?.discount && <span className="text-[9px] text-red-500 font-bold">{errors.items[idx].discount}</span>}
                    </div>
                  </Td>
                  <Td className="font-black text-gray-900 tracking-tight">{fmtCurrency(item.totalPrice)}</Td>
                  <Td>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="w-8 h-8 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                        {Icons.trash}
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <GlassCard className="p-8 sticky top-32">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6 pb-4 border-b border-gray-100">Tổng kết Báo giá</h3>
            <div className="flex flex-col gap-6">
              <DatePicker 
                label="Hiệu lực đến (Valid until)" 
                required 
                value={validUntil} 
                onChange={(val) => {
                  setValidUntil(val)
                  // Real-time validation
                  if (val) {
                    const selectedDate = new Date(val);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                      setErrors(prev => ({ ...prev, validUntil: 'Ngày hiệu lực không được nhỏ hơn ngày hiện tại' }));
                    } else {
                      setErrors(prev => ({ ...prev, validUntil: '' }));
                    }
                  } else {
                    setErrors(prev => ({ ...prev, validUntil: 'Vui lòng chọn ngày hiệu lực' }));
                  }
                }} 
                error={errors.validUntil}
              />
              
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-gray-400">Tạm tính:</span>
                  <span className="text-gray-900">{fmtCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-orange-400">Chiết khấu:</span>
                  <span className="text-orange-600">-{fmtCurrency(totals.discount)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">TỔNG CỘNG:</span>
                  <span className="text-2xl font-black text-purple-600 tracking-tighter">{fmtCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              <div className="pt-6">
                <TextArea label="Ghi chú nội bộ / Phản hồi" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Nhập ghi chú cho báo giá này..." />
              </div>
            </div>
          </GlassCard>
          
        </div>
      </div>

      <Modal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
        title="Tạo nhanh Khách hàng"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <Field 
            label="Tên khách hàng" 
            required 
            value={newCustomer.name} 
            onChange={e => {
              setNewCustomer({...newCustomer, name: e.target.value})
              setErrors(prev => ({ ...prev, newCus_name: '' }))
            }} 
            error={errors.newCus_name}
          />
          <Field 
            label="Số điện thoại" 
            value={newCustomer.phone} 
            onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} 
          />
          <Field 
            label="Email" 
            value={newCustomer.email} 
            onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Btn variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>Hủy</Btn>
            <Btn onClick={async () => {
              if(!newCustomer.name) {
                setErrors(prev => ({ ...prev, newCus_name: 'Vui lòng nhập tên khách hàng' }))
                return
              }
              setCustomerSaving(true)
              try {
                const res = await customerService.create({ 
                  name: newCustomer.name, 
                  phoneNumber: newCustomer.phone,
                  email: newCustomer.email,
                  address: 'Chưa cập nhật'
                })
                
                const list = await customerService.getAll()
                setCustomers(list)
                
                const createdCus = res?.data || res
                if (createdCus?.id) {
                  handleCustomerChange(createdCus.id)
                }
                
                setIsCustomerModalOpen(false)
                setNewCustomer({ name: '', phone: '', email: '' })
                setErrors(prev => ({ ...prev, newCus_name: '' }))
              } catch (err) {
                console.error("Create Customer Error:", err)
                const msg = err.response?.data?.message || 'Không thể tạo khách hàng mới. Vui lòng kiểm tra lại dữ liệu hoặc tên khách hàng đã tồn tại.'
                setErrors(prev => ({ ...prev, newCus_server: msg }))
              } finally { 
                setCustomerSaving(false) 
              }
            }} disabled={customerSaving}>
              {customerSaving ? 'Đang tạo...' : 'Tạo khách hàng'}
            </Btn>
          </div>
          {errors.newCus_server && <p className="text-xs text-red-500 font-bold mt-2">{errors.newCus_server}</p>}
        </div>
      </Modal>
      <QuotationPrint 
        data={{
          quotationNumber: quotationNumber || 'CHƯA CÓ MÃ',
          customerName: customers.find(c => String(c.id) === String(customerId))?.name,
          customerType,
          customerPhone,
          customerEmail,
          validUntil,
          items,
          totals
        }} 
      />
    </DashboardLayout>
  )
}
