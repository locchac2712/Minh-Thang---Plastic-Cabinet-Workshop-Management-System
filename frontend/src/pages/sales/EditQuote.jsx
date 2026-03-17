import { useState, useEffect } from "react";
import "./CreateForms.css";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

export const EditQuote = ({ quoteId, onBack, onSaved }) => {
    const { user } = useAuth();

    // Form state
    const [validUntil, setValidUntil] = useState("");
    const [note,       setNote]       = useState("");
    const [status,     setStatus]     = useState("DRAFT");
    const [rows,       setRows]       = useState([]);

    // Dropdown data
    const [customers,   setCustomers]   = useState([]);
    const [products,    setProducts]    = useState([]);
    const [quoteInfo,   setQuoteInfo]   = useState(null); // read-only info (code, customer, staff)
    const [loadingData, setLoadingData] = useState(true);

    // Submit
    const [saving,  setSaving]  = useState(false);
    const [toast,   setToast]   = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load quote detail + products
    useEffect(() => {
        (async () => {
            try {
                const [detailRes, pRes] = await Promise.all([
                    quotationService.getById(quoteId),
                    api.get("/products"),
                ]);

                const q = detailRes;
                setQuoteInfo(q);

                // Prefill form
                if (q.validUntil) setValidUntil(q.validUntil.split("T")[0]);
                if (q.status) setStatus(q.status);
                setNote(q.note || "");

                // Prefill rows từ details
                setRows((q.details || []).map(d => ({
                    productId: String(d.productId),
                    qty:       d.quantity,
                    unitPrice: Number(d.unitPrice),
                    discount:  d.discount
                        ? Math.round(
                            (Number(d.discount) / (d.quantity * Number(d.unitPrice))) * 100
                        )
                        : 0,
                })));

                const pBody = pRes.data;
                setProducts(
                    Array.isArray(pBody) ? pBody :
                        Array.isArray(pBody?.data) ? pBody.data : []
                );
            } catch (e) {
                showToast("Không thể tải dữ liệu báo giá", "error");
            } finally { setLoadingData(false); }
        })();
    }, [quoteId]);

    // Row handlers
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

    // Calculations
    const rowSubtotal = (r) => (r.qty || 0) * (Number(r.unitPrice) || 0);
    const rowDiscount = (r) => rowSubtotal(r) * ((r.discount || 0) / 100);
    const rowTotal    = (r) => rowSubtotal(r) - rowDiscount(r);
    const subtotal    = rows.reduce((s, r) => s + rowSubtotal(r), 0);
    const totalDisc   = rows.reduce((s, r) => s + rowDiscount(r), 0);
    const grandTotal  = rows.reduce((s, r) => s + rowTotal(r), 0);

    // Submit
    const handleSubmit = async () => {
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (!validRows.length) { showToast("Vui lòng chọn ít nhất 1 sản phẩm", "error"); return; }

        setSaving(true);
        try {
            const payload = {
                customerId: quoteInfo?.customer?.id,
                staffId:    user?.id ?? quoteInfo?.staff?.id,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: validRows.map(r => ({
                    productId:       Number(r.productId),
                    quantity:        r.qty,
                    unitPrice:       Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            };
            // Cập nhật nội dung
            await quotationService.update(quoteId, payload);
            // Nếu status thay đổi → gọi thêm API đổi status
            if (status !== quoteInfo?.status) {
                await quotationService.updateStatus(quoteId, status);
            }
            showToast("Cập nhật báo giá thành công!");
            setTimeout(() => { if (onSaved) onSaved(); else onBack(); }, 1200);
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setSaving(false); }
    };

    if (loadingData) return (
        <div className="cf-page">
            <div className="cf-loading"><div className="cf-spinner"/><span>Đang tải dữ liệu...</span></div>
        </div>
    );

    return (
        <div className="cf-page">
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="cf-header">
                <div>
                    <h1 className="cf-title">Chỉnh sửa Báo giá</h1>
                    <span className="cf-title-sub">{quoteInfo?.quotationNumber}</span>
                </div>
                <div className="cf-header__right">
                    <button className="cf-back-btn" onClick={onBack} disabled={saving}>← Quay lại</button>
                    <button className="cf-submit-btn" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>

            <div className="cf-body">
                {/* ── LEFT ── */}
                <div className="cf-left">

                    {/* Read-only info */}
                    <div className="cf-card">
                        <div className="cf-code-row">
                            <div>
                                <div className="cf-label-small">MÃ BÁO GIÁ</div>
                                <div className="cf-quote-code">{quoteInfo?.quotationNumber}</div>
                            </div>
                            <div className="cf-field" style={{ minWidth: 200 }}>
                                <div className="cf-label-small">TRẠNG THÁI</div>
                                <select className="cf-select" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="DRAFT">Nháp (Draft)</option>
                                    <option value="SENT">Đã gửi (Sent)</option>
                                    <option value="ACCEPTED">Đã chốt (Accepted)</option>
                                    <option value="REJECTED">Đã hủy (Rejected)</option>
                                    <option value="EXPIRED">Hết hạn (Expired)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Customer info — read only */}
                    <div className="cf-card">
                        <div className="cf-grid-2">
                            <div className="cf-field">
                                <label className="cf-label">Khách hàng</label>
                                <div className="cf-input-readonly">{quoteInfo?.customer?.name || "—"}</div>
                            </div>
                            <div className="cf-field">
                                <label className="cf-label">Nhân viên phụ trách</label>
                                <div className="cf-input-readonly">{quoteInfo?.staff?.fullname || "—"}</div>
                            </div>
                        </div>
                        <div className="cf-grid-2" style={{ marginTop: 16 }}>
                            <div className="cf-field">
                                <label className="cf-label">Email liên hệ</label>
                                <div className="cf-input-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                        <polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                    <input className="cf-input" readOnly value={quoteInfo?.customer?.email || ""} placeholder="" />
                                </div>
                            </div>
                            <div className="cf-field">
                                <label className="cf-label">Số điện thoại</label>
                                <div className="cf-input-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                                    </svg>
                                    <input className="cf-input" readOnly value={quoteInfo?.customer?.phone || ""} placeholder="" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products table — editable */}
                    <div className="cf-card">
                        <div className="cf-section-header">
                            <span className="cf-section-title">SẢN PHẨM & DỊCH VỤ</span>
                            <button className="cf-add-row-btn" onClick={addRow}>+ Thêm dòng mới</button>
                        </div>
                        <table className="cf-table">
                            <thead>
                            <tr>
                                <th style={{width:"36%"}}>SẢN PHẨM / SKU</th>
                                <th>SỐ LƯỢNG</th>
                                <th>ĐƠN GIÁ</th>
                                <th>CHIẾT KHẤU %</th>
                                <th>THÀNH TIỀN</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row, i) => {
                                const pr = products.find(p => String(p.id) === String(row.productId));
                                return (
                                    <tr key={i}>
                                        <td>
                                            <select className="cf-table-select" value={row.productId} onChange={e => pickProduct(i, e.target.value)}>
                                                <option value="">Chọn sản phẩm...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                                ))}
                                            </select>
                                            <div className="cf-table-sku">{pr?.sku || "—"}</div>
                                        </td>
                                        <td>
                                            <input className="cf-table-input" type="number" min="1"
                                                   value={row.qty} onChange={e => setRow(i,"qty",Math.max(1,Number(e.target.value)))} />
                                        </td>
                                        <td>
                                            <input className="cf-table-input" type="number" min="0"
                                                   value={row.unitPrice} onChange={e => setRow(i,"unitPrice",Number(e.target.value))} />
                                        </td>
                                        <td>
                                            <div className="cf-discount-wrap">
                                                <input className="cf-table-input cf-table-input--discount" type="number"
                                                       min="0" max="100" value={row.discount}
                                                       onChange={e => setRow(i,"discount",Math.min(100,Math.max(0,Number(e.target.value))))} />
                                                <span className="cf-pct">%</span>
                                            </div>
                                        </td>
                                        <td className="cf-td--amount">{fmt(rowTotal(row))}</td>
                                        <td>
                                            <button className="cf-remove-btn" onClick={() => removeRow(i)} disabled={rows.length===1}>✕</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="cf-right">
                    <div className="cf-card">
                        <div className="cf-sidebar-title">TỔNG KẾT BÁO GIÁ</div>
                        <div className="cf-field" style={{marginBottom:18}}>
                            <label className="cf-label">Hiệu lực đến (Valid until)</label>
                            <input className="cf-input cf-input--date" type="date"
                                   value={validUntil} onChange={e => setValidUntil(e.target.value)} />
                        </div>
                        <div className="cf-summary-row">
                            <span className="cf-summary-label">Tạm tính:</span>
                            <span className="cf-summary-val">{fmt(subtotal)}</span>
                        </div>
                        <div className="cf-summary-row">
                            <span className="cf-summary-label cf-summary-label--orange">Chiết khấu:</span>
                            <span className="cf-summary-val cf-summary-val--orange">-{fmt(totalDisc)}</span>
                        </div>
                        <div className="cf-divider"/>
                        <div className="cf-summary-row cf-summary-row--total">
                            <span>TỔNG CỘNG:</span>
                            <span className="cf-total-val">{fmt(grandTotal)}</span>
                        </div>
                    </div>

                    <div className="cf-card">
                        <label className="cf-label" style={{marginBottom:8,display:"block"}}>Ghi chú nội bộ / Phản hồi</label>
                        <textarea className="cf-textarea" rows={5}
                                  placeholder="Nhập ghi chú cho báo giá này..."
                                  value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                </div>
            </div>
        </div>
    );
};