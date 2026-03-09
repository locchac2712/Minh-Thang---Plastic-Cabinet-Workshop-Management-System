import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { quotationApi, customerApi, productApi } from '../../services/api'
import { PageHeader, Card, Field, TextArea, Btn, LinkBtn, Alert, Table, Td, Icons, fmtCurrency } from '../../components/ui'

const emptyItem = () => ({
  key: Date.now(),
  product: null,
  productId: '',
  quantity: 1,
  unitPrice: '',
  totalPrice: 0,
  notes: '',
})

export default function QuotationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    customerApi.getAll().then((res) => setCustomers(res.data.data || [])).catch(() => {})
    productApi.getAll().then((res) => setProducts(res.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (isEdit) {
      quotationApi.getById(id).then((res) => {
        const q = res.data.data
        setCustomerId(q.customer?.id || '')
        setValidUntil(q.validUntil ? q.validUntil.split('T')[0] : '')
        setNotes(q.notes || '')
        if (q.items?.length) {
          setItems(q.items.map((it) => ({
            key: it.id || Date.now() + Math.random(),
            productId: it.product?.id || '',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || '',
            totalPrice: it.totalPrice || 0,
            notes: it.notes || '',
          })))
        }
      }).catch(() => navigate('/quotations'))
    }
  }, [id, isEdit, navigate])

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      const qty = Number(updated[index].quantity) || 0
      const price = Number(updated[index].unitPrice) || 0
      updated[index].totalPrice = qty * price
      return updated
    })
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  const removeItem = (index) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        customer: { id: customerId },
        validUntil,
        notes,
        totalAmount,
        items: items.map((it) => ({
          product: { id: it.productId },
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
          totalPrice: it.totalPrice,
          notes: it.notes,
        })),
      }
      if (isEdit) {
        await quotationApi.update(id, payload)
      } else {
        await quotationApi.create(payload)
      }
      navigate('/quotations')
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <PageHeader title={isEdit ? 'Sửa báo giá' : 'Tạo báo giá'}>
        <LinkBtn to="/quotations" variant="ghost">{Icons.back} Quay lại</LinkBtn>
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Alert type="error" message={error} onClose={() => setError('')} />

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Thông tin chung</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Khách hàng">
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              >
                <option value="">Chọn khách hàng</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Hiệu lực đến" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            <div className="sm:col-span-2">
              <TextArea label="Ghi chú" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Sản phẩm</h3>
            <Btn variant="ghost" type="button" onClick={addItem}>{Icons.plus} Thêm</Btn>
          </div>
          <Table headers={['Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Ghi chú', '']}>
            {items.map((item, idx) => (
              <tr key={item.key}>
                <Td>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  >
                    <option value="">Chọn SP</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    className="w-28 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </Td>
                <Td className="font-medium text-gray-700">{fmtCurrency(item.totalPrice)}</Td>
                <Td>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  />
                </Td>
                <Td>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                      {Icons.trash}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 text-right">
            <span className="text-sm text-gray-500">Tổng: </span>
            <span className="text-lg font-semibold">{fmtCurrency(totalAmount)}</span>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Btn type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo báo giá'}
          </Btn>
          <Btn variant="ghost" type="button" onClick={() => navigate('/quotations')}>Hủy</Btn>
        </div>
      </form>
    </DashboardLayout>
  )
}
