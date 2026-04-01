import { useState, useEffect } from "react";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

export const CreateQuoteModal = ({ onClose, onCreated }) => {
    const { user } = useAuth();

    // Form state
    const [custId,     setCustId]     = useState("");
    const [validUntil, setValidUntil] = useState("");
    const [note,       setNote]       = useState("");
    const [rows,       setRows]       = useState([{ productId: "", qty: 1, unitPrice: 0, discount: 0 }]);

    // Data
    const [customers,   setCustomers]   = useState([]);
    const [products,    setProducts]    = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [cRes, pRes] = await Promise.all([
                    api.get("/customers"),
                    api.get("/products"),
                ]);
                const cBody = cRes.data;
                const pBody = pRes.data;
                setCustomers(Array.isArray(cBody) ? cBody : (cBody?.data?.content || cBody?.data || []));
                setProducts(Array.isArray(pBody) ? pBody : (pBody?.data || []));
            } catch (e) {
                console.error("Lỗi tải dữ liệu:", e);
                setError("Không thể tải danh sách khách hàng/sản phẩm");
            } finally { setLoadingData(false); }
        })();
    }, []);

    const setRow = (i, f, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
    const addRow    = () => setRows(p => [...p, { productId: "", qty: 1, unitPrice: 0, discount: 0 }]);
    const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));

    const pickProduct = (i, pid) => {
        const pr = products.find(p => String(p.id) === String(pid));
        setRows(p => p.map((r, idx) => idx === i
            ? { ...r, productId: pid, unitPrice: pr?.sellingPrice ?? pr?.price ?? 0 }
            : r
        ));
    };

    const rowTotal   = (r) => (r.qty * r.unitPrice) * (1 - (r.discount / 100));
    const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0);

    const handleSubmit = async () => {
        if (!custId) { setError("Vui lòng chọn khách hàng"); return; }
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (!validRows.length) { setError("Vui lòng chọn ít nhất 1 sản phẩm"); return; }

        setSaving(true);
        try {
            const payload = {
                customerId: Number(custId),
                staffId:    user?.id,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: validRows.map(r => ({
                    productId:       Number(r.productId),
                    quantity:        r.qty,
                    unitPrice:       Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            };
            await quotationService.create(payload);
            onCreated();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi tạo báo giá");
        } finally { setSaving(false); }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Tạo Báo giá Mới</h2>
                        <span className="sq-modal-sub">Điền các thông tin chi tiết để gửi báo giá cho khách hàng</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose} disabled={saving}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {loadingData ? (
                        <div className="sp-state"><div className="sp-spinner" /><span>Đang tải dữ liệu...</span></div>
                    ) : (
                        <div className="sq-form-grid">
                            <div className="sq-form-main">
                                {/* Customer Row */}
                                <div className="sq-form-card">
                                    <div className="sq-form-row">
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Khách hàng *</label>
                                            <select className="sq-form-select" value={custId} onChange={e => setCustId(e.target.value)}>
                                                <option value="">Chọn khách hàng...</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Hiệu lực đến</label>
                                            <input className="sq-form-input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="sq-form-card">
                                    <div className="sq-form-section-header">
                                        <span className="sq-form-section-title">DANH SÁCH SẢN PHẨM</span>
                                        <button className="sq-add-row-btn" onClick={addRow}>+ Thêm dòng</button>
                                    </div>
                                    <table className="sq-form-table">
                                        <thead>
                                            <tr>
                                                <th style={{width: "40%"}}>Sản phẩm</th>
                                                <th>Số lượng</th>
                                                <th>Đơn giá</th>
                                                <th>Chiết khấu %</th>
                                                <th style={{textAlign: "right"}}>Thành tiền</th>
                                                <th style={{width: "40px"}}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <select className="sq-table-select" value={row.productId} onChange={e => pickProduct(i, e.target.value)}>
                                                            <option value="">--- Chọn sản phẩm ---</option>
                                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                        </select>
                                                    </td>
                                                    <td><input className="sq-table-input" type="number" value={row.qty} onChange={e => setRow(i,"qty",Number(e.target.value))} /></td>
                                                    <td><input className="sq-table-input" type="number" value={row.unitPrice} onChange={e => setRow(i,"unitPrice",Number(e.target.value))} /></td>
                                                    <td><input className="sq-table-input" type="number" value={row.discount} onChange={e => setRow(i,"discount",Number(e.target.value))} /></td>
                                                    <td style={{textAlign: "right", fontWeight: 600}}>{fmt(rowTotal(row))}</td>
                                                    <td><button className="sq-remove-btn" onClick={() => removeRow(i)} disabled={rows.length===1}>✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {error && <div className="sq-modal-error">⚠️ {error}</div>}
                            </div>

                            <div className="sq-form-sidebar">
                                <div className="sq-form-summary">
                                    <div className="sq-form-summary-title">TỔNG KẾT ĐƠN HÀNG</div>
                                    <div className="sq-form-summary-row sq-form-summary-row--total">
                                        <span>TỔNG CỘNG</span>
                                        <span>{fmt(grandTotal)}</span>
                                    </div>
                                </div>

                                <div className="sq-form-card">
                                    <label className="sq-form-label">Ghi chú báo giá</label>
                                    <textarea className="sq-form-textarea" rows={6} placeholder="Nhập ghi chú cho khách hàng..." value={note} onChange={e => setNote(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose} disabled={saving}>Hủy bỏ</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSubmit} disabled={saving || loadingData}>
                        {saving ? "Đang xử lý..." : "Xác nhận & Lưu"}
                    </button>
                </div>
            </div>

            <style>{`
                .sq-form-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
                .sq-form-main { display: flex; flex-direction: column; gap: 20px; }
                .sq-form-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #f0f0f5; }
                .sq-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .sq-form-field { display: flex; flex-direction: column; gap: 6px; }
                .sq-form-label { font-size: 13px; font-weight: 600; color: #4b5563; }
                .sq-form-select, .sq-form-input { 
                    padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e5e7eb; 
                    font-family: inherit; font-size: 14px; outline: none; background: #fff;
                }
                .sq-form-select:focus, .sq-form-input:focus { border-color: #111827; }
                
                .sq-form-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
                .sq-form-section-title { font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: .05em; }
                .sq-add-row-btn { font-size: 12px; font-weight: 700; color: #7c3aed; background: #f3f0ff; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; }
                
                .sq-form-table { width: 100%; border-collapse: collapse; }
                .sq-form-table th { text-align: left; font-size: 12px; color: #9ca3af; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
                .sq-form-table td { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
                .sq-table-select, .sq-table-input { width: 100%; border: none; background: transparent; font-family: inherit; font-size: 13.5px; padding: 4px; outline: none; }
                .sq-table-input { font-weight: 500; color: #111827; border-bottom: 1px solid transparent; }
                .sq-table-input:focus { border-color: #111827; }
                
                .sq-remove-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; }
                .sq-remove-btn:hover { color: #ef4444; }
                
                .sq-form-summary { background: #111827; border-radius: 14px; padding: 24px; color: #fff; margin-bottom: 20px; }
                .sq-form-summary-title { font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 16px; }
                .sq-form-summary-row--total { display: flex; justify-content: space-between; font-weight: 700; font-size: 18px; }
                
                .sq-form-textarea { 
                    width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; 
                    font-family: inherit; font-size: 13.5px; outline: none; resize: none; margin-top: 8px;
                }
                .sq-modal-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 500; }
            `}</style>
        </div>
    );
};
