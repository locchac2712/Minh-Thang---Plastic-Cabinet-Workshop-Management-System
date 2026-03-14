import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Badge, Btn, LinkBtn, Alert, Loading, Icons, fmtCurrency, fmtDate } from '../../components/ui'
import productService from '../../services/productService'
import api from '../../services/api' // For direct image upload

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isNew = id === 'new'
  const isEditPath = location.pathname.endsWith('/edit')
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [editMode, setEditMode] = useState(isNew || isEditPath)
  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', sellingPrice: '', currentStock: '', unit: '', imageUrl: '', active: true
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [alert, setAlert] = useState(null)
  const fileInputRef = useRef(null)

  const fetchData = async () => {
    try {
      if (!isNew) {
        const p = await productService.getById(id)
        setProduct(p)
        setFormData({
          name: p.name || '',
          sku: p.sku || '',
          description: p.description || '',
          sellingPrice: p.sellingPrice ?? '',
          currentStock: p.currentStock ?? '',
          unit: p.unit || '',
          imageUrl: p.imageUrl || '',
          active: (p.status === 'ACTIVE' || p.active) ?? true
        })
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Không thể tải thông tin sản phẩm' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const validate = () => {
    const nextErrors = {}
    if (!formData.name) nextErrors.name = 'Tên sản phẩm là bắt buộc'
    if (!formData.sku) nextErrors.sku = 'Mã SKU là bắt buộc'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    setAlert(null)
    try {
      const payload = {
        ...formData,
        sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : null,
        currentStock: formData.currentStock ? Number(formData.currentStock) : 0,
      }
      
      if (isNew) {
        await productService.create(payload)
        setAlert({ type: 'success', message: 'Tạo sản phẩm mới thành công!' })
      } else {
        await productService.update(id, payload)
        setAlert({ type: 'success', message: 'Cập nhật sản phẩm thành công!' })
      }
      
      setTimeout(() => navigate('/products'), 1500)
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Thao tác thất bại' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (isNew) return
    const newStatus = !formData.active
    try {
      await productService.changeStatus(id, newStatus ? 'ACTIVE' : 'DEACTIVATED')
      setFormData({ ...formData, active: newStatus })
      setAlert({ type: 'success', message: `Đã ${newStatus ? 'kích hoạt' : 'ngưng'} sản phẩm` })
    } catch (err) {
      setAlert({ type: 'error', message: 'Không thể thay đổi trạng thái' })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSaving(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      const res = await api.post('/files/upload/products', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const imageUrl = res.data?.data ?? res.data
      setFormData({ ...formData, imageUrl })
      setAlert({ type: 'success', message: 'Tải ảnh lên thành công' })
    } catch (err) {
      setAlert({ type: 'error', message: 'Lỗi upload hình ảnh' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <DashboardLayout title="Sản phẩm"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title={isNew ? 'Thêm sản phẩm mới' : (editMode ? 'Chỉnh sửa sản phẩm' : 'Chi tiết sản phẩm')}>
      <PageHeader 
        title={isNew ? 'Thêm sản phẩm mới' : (editMode ? 'Chỉnh sửa sản phẩm' : product?.name)} 
        desc={editMode ? 'Cập nhật thông tin chi tiết của sản phẩm' : 'Thông tin chi tiết và lịch sử sản phẩm'}
      >
        <div className="flex items-center gap-3">
          {!editMode ? (
            <>
              <Btn variant="secondary" onClick={() => setEditMode(true)}>
                {Icons.edit} Chỉnh sửa
              </Btn>
              <LinkBtn to="/products" variant="ghost">Quay lại</LinkBtn>
            </>
          ) : (
            <>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : (isNew ? 'Tạo mới' : 'Lưu thay đổi')}
              </Btn>
              <Btn variant="secondary" onClick={() => isNew ? navigate('/products') : setEditMode(false)}>Hủy</Btn>
            </>
          )}
        </div>
      </PageHeader>

      <Alert type={alert?.type} message={alert?.message} onClose={() => setAlert(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Hàng 1: Tên sản phẩm, SKU */}
              <Field label="Tên sản phẩm" error={errors.name} required={editMode}>
                <input
                  type="text"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700 font-medium' : (errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10')} outline-none transition-all`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên sản phẩm..."
                />
              </Field>

              <Field label="Mã SKU (Mã sản phẩm)" error={errors.sku} required={editMode}>
                <input
                  type="text"
                  readOnly={!isNew && !editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${(!isNew || !editMode) ? 'bg-gray-50/50 border-gray-100 text-gray-500 font-mono' : (errors.sku ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10')} outline-none transition-all`}
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="VD: TS-001"
                  disabled={!isNew}
                />
              </Field>

              <Field label="Đơn vị tính">
                <input
                  type="text"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="VD: cái, bộ, mét..."
                />
              </Field>

              {/* Hàng 2: Giá bán, Tồn kho */}
              <Field label="Giá bán (VND)">
                <input
                  type="number"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-purple-700 font-bold' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  value={formData.sellingPrice}
                  onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </Field>

              <Field label="Tồn kho">
                <input
                  type="number"
                  readOnly={!editMode}
                  className={`w-full px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-600' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                  value={formData.currentStock}
                  onChange={e => setFormData({ ...formData, currentStock: e.target.value })}
                />
              </Field>

              {/* Hàng 4: Mô tả */}
              <div className="md:col-span-2">
                <TextArea
                  label="Mô tả sản phẩm"
                  readOnly={!editMode}
                  rows={4}
                  className={!editMode ? 'bg-gray-50/50 border-gray-100 text-gray-700' : ''}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả chi tiết về sản phẩm..."
                />
              </div>

              {/* Hàng 5: Hình ảnh URL */}
              <div className="md:col-span-2">
                <Field label="Đường dẫn hình ảnh (URL)">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly={!editMode}
                      className={`flex-1 px-4 py-3 rounded-xl border ${!editMode ? 'bg-gray-50/50 border-gray-100 text-blue-600 underline' : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10'} outline-none transition-all`}
                      value={formData.imageUrl}
                      onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {editMode && (
                      <>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <Btn variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                          {Icons.upload}
                        </Btn>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {!isNew && (
            <Card className="p-6">
               <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">Trạng thái kinh doanh</h4>
               <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${formData.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-bold text-gray-700">{formData.active ? 'Hoạt động' : 'Đã ngưng'}</span>
                  </div>
                  <Badge variant={formData.active ? 'green' : 'gray'}>{formData.active ? 'Sẵn sàng' : 'Ngưng'}</Badge>
               </div>
               <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold transition-all active:scale-95 ${formData.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  {Icons.toggle}
                  {formData.active ? 'Ngưng kinh doanh' : 'Bắt đầu kinh doanh'}
                </button>
            </Card>
          )}

          {formData.imageUrl && (
            <Card className="p-4 overflow-hidden border-2 border-dashed border-gray-200">
               <img 
                src={formData.imageUrl} 
                alt={formData.name} 
                className="w-full h-auto rounded-xl shadow-lg hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image' }}
               />
            </Card>
          )}

          {!isNew && (
            <Card className="p-6 bg-gray-50/50 border-dashed">
              <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin bổ sung</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase font-medium">Mã hệ thống (ID)</p>
                  <p className="text-sm font-mono text-gray-600">#{id}</p>
                </div>
                {product?.createdAt && (
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-medium">Ngày thêm</p>
                    <p className="text-sm text-gray-600">{fmtDate(product.createdAt)}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
