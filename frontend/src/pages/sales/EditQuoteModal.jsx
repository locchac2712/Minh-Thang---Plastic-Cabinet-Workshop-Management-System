import { useState, useEffect } from "react";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

export const EditQuoteModal = ({ quoteId, onClose, onSaved }) => {
    const { user } = useAuth();

    // Form state
    const [validUntil, setValidUntil] = useState("");
    const [note,       setNote]       = useState("");
    const [status,     setStatus]     = useState("DRAFT");
    const [rows,       setRows]       = useState([]);

    // Data
    const [quoteInfo,   setQuoteInfo]   = useState(null);
    const [products,    setProducts]    = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [error,       setError]       = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const [qDetail, pRes] = await Promise.all([
                    quotationService.getById(quoteId),
                    api.get("/products"),
                ]);

                setQuoteInfo(qDetail);
                if (qDetail.validUntil) setValidUntil(qDetail.validUntil.split("T")[0]);
                setStatus(qDetail.status);
                setNote(qDetail.note || "");
                
                setRows((qDetail.details || []).map(d => ({
                    productId: String(d.productId),
                    qty:       d.quantity,
                    unitPrice: Number(d.unitPrice),
                    discount:  d.discountPercent || 0
                })));

                const pBody = pRes.data;
                setProducts(Array.isArray(pBody) ? pBody : (pBody?.data || []));
            } catch (e) {
                console.error("Lỗi tải dữ liệu:", e);
                setError("Không thể tải thông tin báo giá");
            } finally { setLoadingData(false); }
        })();
    }, [quoteId]);

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
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (!validRows.length) { setError("Vui lòng chọn ít nhất 1 sản phẩm"); return; }

        setSaving(true);
        try {
            const payload = {
                customerId: quoteInfo.customer?.id,
                staffId:    user?.id || quoteInfo.staff?.id,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: validRows.map(r => ({
                    productId:       Number(r.productId),
                    quantity:        r.qty,
                    unitPrice:       Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            };
            await quotationService.update(quoteId, payload);
            if (status !== quoteInfo.status) {
                await quotationService.updateStatus(quoteId, status);
            }
            onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi cập nhật báo giá");
        } finally { setSaving(false); }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Chỉnh sửa Báo giá</h2>
                        <span className="sq-modal-sub">{quoteInfo?.quotationNumber || "Đang tải..."} · {quoteInfo?.customer?.name}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose} disabled={saving}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {loadingData ? (
                        <div className="sp-state"><div className="sp-spinner" /><span>Đang tải dữ liệu...</span></div>
                    ) : (
                        <div className="sq-form-grid">
                            <div className="sq-form-main">
                                <div className="sq-form-card">
                                    <div className="sq-form-row">
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Trạng thái hiện tại</label>
                                            <select className="sq-form-select" value={status} onChange={e => setStatus(e.target.value)}>
                                                <option value="DRAFT">Bản nháp (Draft)</option>
                                                <option value="SENT">Đã gửi (Sent)</option>
                                                <option value="ACCEPTED">Đã chốt (Accepted)</option>
                                                <option value="REJECTED">Đã hủy (Rejected)</option>
                                                <option value="EXPIRED">Hết hạn (Expired)</option>
                                            </select>
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Hiệu lực đến</label>
                                            <input className="sq-form-input" type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <div className="sq-form-card">
                                    <div className="sq-form-section-header">
                                        <span className="sq-form-section-title">NỘI DUNG SẢN PHẨM</span>
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
                                    <div className="sq-form-summary-title">TỔNG KẾT CHI PHÍ</div>
                                    <div className="sq-form-summary-row sq-form-summary-row--total">
                                        <span>TỔNG CỘNG</span>
                                        <span>{fmt(grandTotal)}</span>
                                    </div>
                                </div>

                                <div className="sq-form-card">
                                    <label className="sq-form-label">Ghi chú nội bộ</label>
                                    <textarea className="sq-form-textarea" rows={6} placeholder="Nhập ghi chú quan trọng..." value={note} onChange={e => setNote(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose} disabled={saving}>Đóng</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSubmit} disabled={saving || loadingData}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};
