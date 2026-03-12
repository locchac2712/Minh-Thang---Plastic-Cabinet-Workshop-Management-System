import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, Field, TextArea, Select, Btn, Alert, Loading, fmt } from '../../components/ui'
import warehouseService from '../../services/warehouseService'
import stockService from '../../services/stockService'
import materialService from '../../services/materialService'

export default function StockForm() {
    const location = useLocation()
    const navigate = useNavigate()
    const defaultType = location.state?.defaultType || 'IMPORT'
    const [warehouses, setWarehouses] = useState([])
    const [materials, setMaterials] = useState([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [warning, setWarning] = useState('')
    const [form, setForm] = useState({
        type: defaultType,
        warehouseId: '',
        rawMaterialId: '',
        quantity: '',
        reason: '',
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [whData, matData] = await Promise.all([
                    warehouseService.getAll(),
                    materialService.getAll()
                ])
                setWarehouses(whData || [])
                setMaterials(matData || [])
            } catch {
                /* ignore */
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleChange = (e) => {
        const updated = { ...form, [e.target.name]: e.target.value }
        setForm(updated)
        setError('')
        setSuccess(false)

        if (updated.type === 'EXPORT' && (e.target.name === 'rawMaterialId' || e.target.name === 'quantity')) {
            const mat = materials.find((m) => m.id === Number(updated.rawMaterialId))
            if (mat && Number(updated.quantity) > (mat.currentStock ?? 0)) {
                setWarning(`Số lượng xuất (${updated.quantity}) vượt quá tồn kho hiện có (${fmt(mat.currentStock ?? 0)}).`)
            } else {
                setWarning('')
            }
        } else if (updated.type === 'IMPORT') {
            setWarning('')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.rawMaterialId || !form.quantity || Number(form.quantity) <= 0) {
            setError('Vui lòng điền thông tin hợp lệ.')
            return
        }
        try {
            setSubmitting(true)
            const data = {
                type: form.type,
                warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
                referenceId: form.reason || 'Không có lý do',
                details: [
                    {
                        materialId: Number(form.rawMaterialId),
                        quantity: Number(form.quantity)
                    }
                ]
            }

            if (form.type === 'IMPORT') {
                await stockService.stockIn(data)
            } else {
                await stockService.stockOut(data)
            }

            setSuccess(true)
            setWarning('')
            setForm({ ...form, rawMaterialId: '', quantity: '', reason: '' })

            if (form.type === 'EXPORT') {
                const matData = await materialService.getAll()
                setMaterials(matData || [])
            }

            setTimeout(() => {
                navigate(form.type === 'IMPORT' ? '/stock/in' : '/stock/out')
            }, 800)
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || `${form.type === 'IMPORT' ? 'Nhập' : 'Xuất'} kho thất bại. Vui lòng thử lại.`)
        } finally {
            setSubmitting(false)
        }
    }

    const resetForm = () => {
        setSuccess(false)
        setWarning('')
        setForm({ ...form, rawMaterialId: '', quantity: '', reason: '' })
    }

    if (loading) {
        return (
            <DashboardLayout title="Tạo phiếu kho">
                <Loading />
            </DashboardLayout>
        )
    }

    const isOut = form.type === 'EXPORT';

    return (
        <DashboardLayout title={isOut ? "Tạo phiếu xuất" : "Tạo phiếu nhập"}>
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(isOut ? '/stock/out' : '/stock/in')}
                    className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Quay lại"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <PageHeader title={isOut ? "Tạo phiếu xuất kho" : "Tạo phiếu nhập kho"} desc={isOut ? "Tạo phiếu xuất kho nguyên vật liệu" : "Tạo phiếu nhập kho nguyên vật liệu"} />
            </div>

            <div className="max-w-2xl">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Thông tin phiếu</h2>

                    <Alert type="success" message={success ? `Giao dịch thành công! Đang chuyển hướng...` : ''} onClose={resetForm} />
                    <Alert type="error" message={error} onClose={() => setError('')} />
                    {isOut && <Alert type="warning" message={warning} />}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Select
                            label={<>Kho <span className="text-gray-400 font-normal">(Tùy chọn hiển thị)</span></>}
                            value={form.warehouseId}
                            onChange={(e) => handleChange({ target: { name: 'warehouseId', value: e.target.value } })}
                            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                            placeholder="Chọn kho"
                        />
                        <Select
                            label={<>Nguyên vật liệu <span className="text-red-500">*</span></>}
                            value={form.rawMaterialId}
                            onChange={(e) => handleChange({ target: { name: 'rawMaterialId', value: e.target.value } })}
                            options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.sku})${isOut ? ` — Tồn: ${fmt(m.currentStock ?? 0)}` : ''}` }))}
                            placeholder="Chọn NVL"
                        />
                        <Field label={<>Số lượng <span className="text-red-500">*</span></>} name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} placeholder="Nhập số lượng" />
                        <TextArea label="Lý do" name="reason" value={form.reason} onChange={handleChange} placeholder={`Ghi chú lý do ${isOut ? 'xuất' : 'nhập'} kho...`} />

                        <div className="pt-2 flex justify-end gap-3">
                            <Btn
                                type="button"
                                variant="secondary"
                                onClick={() => navigate(isOut ? '/stock/out' : '/stock/in')}
                            >
                                Hủy bỏ
                            </Btn>
                            <Btn type="submit" disabled={submitting}>
                                {submitting ? 'Đang xử lý...' : `Lưu phiếu ${isOut ? 'xuất' : 'nhập'}`}
                            </Btn>
                        </div>
                    </form>
                </Card>
            </div>
        </DashboardLayout>
    )
}
