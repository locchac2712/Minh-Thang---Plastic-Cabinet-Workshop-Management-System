import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { 
  PageHeader, Card, Alert, Table, Td, Field, TextArea, Btn, 
  LinkBtn, Icons, fmtCurrency, GlassCard, Badge 
} from '../../components/ui'
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
  const [customerType, setCustomerType] = useState('Retail')
  
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
    const customer = customers.find(c => String(c.id) === String(cid))
    if (customer) {
      setCustomerEmail(customer.email || '')
      setCustomerPhone(customer.phoneNumber || '')
      // Assume type is retail if not present
      setCustomerType(customer.type || 'Retail')
    }
  }

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev]
      let current = { ...updated[index], [field]: value }
      
      // Auto-fill product details
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
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0)
    const grandTotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0)
    return { subtotal, discount: subtotal - grandTotal, grandTotal }
  }, [items])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Lấy thông tin nhân viên từ localStorage
      const userStr = localStorage.getItem('user')
      const user = userStr ? JSON.parse(userStr) : null
      const staffId = user?.staffId || user?.id || 1 // Fallback to 1 if not found

      const payload = {
        customerId: Number(customerId),
        staffId: Number(staffId),
        validUntil: validUntil ? `${validUntil}T23:59:59` : null, // Chuyển sang định dạng LocalDateTime
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
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu báo giá')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Hiệu chỉnh Báo giá' : 'Tạo Báo giá Mới'}>
        <div className="flex items-center gap-2">
          <LinkBtn to="/quotations" variant="ghost">{Icons.back} Quay lại</LinkBtn>
          <Btn type="submit" onClick={handleSubmit} disabled={saving} className="shadow-lg shadow-purple-600/20">
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Xác nhận Báo giá'}
          </Btn>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Alert type="error" message={error} onClose={() => setError('')} />

          {/* Header Info Card */}
          <GlassCard className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1 block">Mã báo giá</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{quotationNumber || 'Đang tạo...'}</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Trạng thái</span>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                    status === 'DRAFT' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                    status === 'SENT' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                    status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-600' :
                    'bg-red-50 border-red-200 text-red-600'
                  }`}
                >
                  <option value="DRAFT">Nháp (Draft)</option>
                  <option value="SENT">Đã gửi (Sent)</option>
                  <option value="ACCEPTED">Đã chốt (Accepted)</option>
                  <option value="REJECTED">Đã hủy (Rejected)</option>
                  <option value="EXPIRED">Hết hạn (Expired)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Khách hàng">
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all font-medium"
                >
                  <option value="">Chọn khách hàng...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Loại khách hàng">
                <select 
                  value={customerType} 
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm outline-none font-medium"
                >
                  <option value="Retail">Khách lẻ (Retail)</option>
                  <option value="Dealer">Đại lý (Dealer)</option>
                  <option value="Distributor">Nhà phân phối (Distributor)</option>
                </select>
              </Field>
              <Field label="Email liên hệ">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    {Icons.eye}
                  </span>
                  <input type="text" value={customerEmail} readOnly className="w-full bg-gray-50 border border-transparent rounded-2xl pl-11 pr-5 py-3.5 text-sm text-gray-500 font-medium" />
                </div>
              </Field>
              <Field label="Số điện thoại">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
                    {Icons.eye}
                  </span>
                  <input type="text" value={customerPhone} readOnly className="w-full bg-gray-50 border border-transparent rounded-2xl pl-11 pr-5 py-3.5 text-sm text-gray-500 font-medium" />
                </div>
              </Field>
            </div>
          </GlassCard>

          {/* Items Section */}
          <Card className="p-0 overflow-hidden overflow-x-auto border-none shadow-xl shadow-gray-200/50">
            <div className="p-6 bg-white border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Sản phẩm & Dịch vụ</h3>
              <Btn variant="ghost" type="button" onClick={addItem} className="text-purple-600 hover:bg-purple-50">
                {Icons.plus} Thêm dòng mới
              </Btn>
            </div>
            <Table headers={['Sản phẩm / SKU', 'Số lượng', 'Đơn giá', 'Chiết khấu %', 'Thành tiền', '']}>
              {items.map((item, idx) => (
                <tr key={item.key} className="group hover:bg-gray-50/50 transition-colors">
                  <Td className="min-w-[250px]">
                    <div className="flex flex-col gap-1">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                        required
                        className="w-full border-none bg-transparent rounded-xl px-0 py-1 text-sm font-bold text-gray-800 focus:ring-0"
                      >
                        <option value="">Chọn sản phẩm...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span className="text-[10px] font-mono text-gray-400">{item.sku || '—'}</span>
                    </div>
                  </Td>
                  <Td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      className="w-20 bg-gray-50 border-transparent rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:border-purple-200 transition-all outline-none"
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                      className="w-32 bg-gray-50 border-transparent rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:border-purple-200 transition-all outline-none"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={(e) => updateItem(idx, 'discount', e.target.value)}
                        className="w-16 bg-orange-50/50 border-transparent text-orange-600 rounded-xl px-3 py-2 text-sm font-bold focus:bg-white focus:border-orange-200 transition-all outline-none"
                      />
                      <span className="text-xs text-orange-400 font-bold">%</span>
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
            <div className="flex flex-col gap-5">
              <Field label="Hiệu lực đến (Valid until)" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              
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
          
          <div className="px-6 py-5 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shrink-0">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase mb-1">Hướng dẫn</h4>
              <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
                Chọn khách hàng để hệ thống tự động điền thông tin liên hệ. Thêm sản phẩm và áp dụng mức chiết khấu phù hợp để tối ưu hóa giá trị đơn hàng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
