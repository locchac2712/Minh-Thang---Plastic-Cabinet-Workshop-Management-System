import { useState, useEffect } from "react";
import "./CreateForms.css";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";
const genTempCode = () => `BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const CreateQuote = ({ onBack, onCreated }) => {
    const { user } = useAuth();

    // Form state
    const [status,     setStatus]     = useState("DRAFT");
    const [custId,     setCustId]     = useState("");
    const [custType,   setCustType]   = useState("RETAIL");
    const [validUntil, setValidUntil] = useState("");
    const [note,       setNote]       = useState("");
    const [rows,       setRows]       = useState([{ productId: "", qty: 1, unitPrice: 0, discount: 0 }]);

    // Dropdown data
    const [customers,   setCustomers]   = useState([]);
    const [products,    setProducts]    = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Submit
    const [saving,  setSaving]  = useState(false);
    const [toast,   setToast]   = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load customers + products
    useEffect(() => {
        (async () => {
            try {
                const [cRes, pRes] = await Promise.all([
                    api.get("/customers"),
                    api.get("/products"),
                ]);
                const cBody = cRes.data;
                const pBody = pRes.data;
                setCustomers(
                    Array.isArray(cBody) ? cBody :
                        Array.isArray(cBody?.data) ? cBody.data :
                            cBody?.data?.content ?? []
                );
                setProducts(
                    Array.isArray(pBody) ? pBody :
                        Array.isArray(pBody?.data) ? pBody.data : []
                );
            } catch (e) {
                console.error("Lỗi tải dropdown:", e);
            } finally { setLoadingData(false); }
        })();
    }, []);

    const customer = customers.find(c => String(c.id) === String(custId));

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
    const rowSubtotal  = (r) => (r.qty || 0) * (Number(r.unitPrice) || 0);
    const rowDiscount  = (r) => rowSubtotal(r) * ((r.discount || 0) / 100);
    const rowTotal     = (r) => rowSubtotal(r) - rowDiscount(r);
    const subtotal     = rows.reduce((s, r) => s + rowSubtotal(r), 0);
    const totalDisc    = rows.reduce((s, r) => s + rowDiscount(r), 0);
    const grandTotal   = rows.reduce((s, r) => s + rowTotal(r), 0);

    // Submit
    const handleSubmit = async () => {
        if (!custId) { showToast("Vui lòng chọn khách hàng", "error"); return; }
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (!validRows.length) { showToast("Vui lòng chọn ít nhất 1 sản phẩm", "error"); return; }

        setSaving(true);
        try {
            const payload = {
                customerId: Number(custId),
                staffId:    user?.id ?? null,
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
            showToast("Tạo báo giá thành công!");
            setTimeout(() => {
                if (onCreated) onCreated();
                else onBack();
            }, 1200);
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setSaving(false); }
    };

    const tempCode = genTempCode();

    return (
        <div className="cf-page">
            {/* Toast */}
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="cf-header">
                <h1 className="cf-title">Tạo Báo giá Mới</h1>
                <div className="cf-header__right">
                    <button className="cf-back-btn" onClick={onBack} disabled={saving}>← Quay lại</button>
                    <button className="cf-submit-btn" onClick={handleSubmit} disabled={saving || loadingData}>
                        {saving ? "Đang lưu..." : "Xác nhận Báo giá"}
                    </button>
                </div>
            </div>

            {loadingData ? (
                <div className="cf-loading"><div className="cf-spinner" /><span>Đang tải dữ liệu...</span></div>
            ) : (
                <div className="cf-body">
                    {/* ── LEFT ── */}
                    <div className="cf-left">

                        {/* Code + Status */}
                        <div className="cf-card">
                            <div className="cf-code-row">
                                <div>
                                    <div className="cf-label-small">MÃ BÁO GIÁ</div>
                                    <div className="cf-quote-code">{tempCode}</div>
                                </div>
                                <div className="cf-field" style={{ minWidth: 200 }}>
                                    <div className="cf-label-small">TRẠNG THÁI</div>
                                    <select className="cf-select" value={status} onChange={e => setStatus(e.target.value)} disabled>
                                        <option value="DRAFT">Nháp (Draft)</option>
                                    </select>
                                    <span className="cf-field-hint">Báo giá mới luôn bắt đầu ở trạng thái Nháp</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="cf-card">
                            <div className="cf-grid-2">
                                <div className="cf-field">
                                    <label className="cf-label">Khách hàng *</label>
                                    <select className="cf-select" value={custId} onChange={e => setCustId(e.target.value)}>
                                        <option value="">Chọn khách hàng...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="cf-field">
                                    <label className="cf-label">Loại khách hàng</label>
                                    <select className="cf-select" value={custType} onChange={e => setCustType(e.target.value)}>
                                        <option value="RETAIL">Khách lẻ (Retail)</option>
                                        <option value="WHOLESALE">Khách sỉ (Wholesale)</option>
                                        <option value="VIP">Khách VIP</option>
                                    </select>
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
                                        <input className="cf-input" readOnly value={customer?.email || ""} placeholder="" />
                                    </div>
                                </div>
                                <div className="cf-field">
                                    <label className="cf-label">Số điện thoại</label>
                                    <div className="cf-input-icon">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                                        </svg>
                                        <input className="cf-input" readOnly value={customer?.phoneNumber || ""} placeholder="" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products table */}
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

                        <div className="cf-hint">
                            <div className="cf-hint__icon">i</div>
                            <div className="cf-hint__text">
                                <strong>HƯỚNG DẪN</strong>
                                <p>Chọn khách hàng để hệ thống tự động điền thông tin liên hệ. Thêm sản phẩm và áp dụng mức chiết khấu phù hợp để tối ưu hóa giá trị đơn hàng.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};