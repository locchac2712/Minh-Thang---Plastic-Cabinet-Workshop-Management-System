import React, { useState, useEffect } from "react";
import "./CreateForms.css";
import customerService from "../../services/customerService";
import productService from "../../services/productService";
import salesOrderService from "../../services/salesOrderService";
import { PlanCalendarModal } from "./PlanCalendarModal";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "0 đ";

export const CreateOrder = ({ onBack }) => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);

    // Section 1: Thông tin chung
    const [custId, setCustId] = useState("");
    const [customerInfo, setCustomerInfo] = useState({ phone: "", email: "", creditLimit: 0, currentDebt: 0 });
    const [deliveryDate, setDeliveryDate] = useState("");
    const [address, setAddress] = useState("");
    const [orderNote, setOrderNote] = useState("");

    const [availableCredit, setAvailableCredit] = useState(0);

    // Section 2: Thông tin thanh toán
    const [paymentTerms, setPaymentTerms] = useState("CASH_ON_DELIVERY");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [depositRatio, setDepositRatio] = useState(0);
    const [depositAmount, setDepositAmount] = useState(0);

    // Section 3: Danh sách sản phẩm
    const [rows, setRows] = useState([{ productId: "", qty: 1, unitPrice: 0, discount: 0, notes: "", uom: "" }]);

    useEffect(() => {
        Promise.all([
            customerService.getAll(),
            productService.getAll()
        ]).then(([cData, pData]) => {
            setCustomers(cData);
            setProducts(pData);
        }).catch(err => {
            console.error("Error loading create order data:", err);
        }).finally(() => setLoading(false));
    }, []);

    // Logic xử lý khi chọn khách hàng
    const handleCustomerChange = (id) => {
        setCustId(id);
        const c = customers.find(x => String(x.id) === String(id));
        if (c) {
            setCustomerInfo({
                phone: c.phone || "Chưa có",
                email: c.email || "Chưa có",
                creditLimit: c.creditLimit || 0,
                currentDebt: c.currentDebt || 0
            });
            setAvailableCredit((c.creditLimit || 0) - (c.currentDebt || 0));
            if (!address) setAddress(c.address || "");
        } else {
            setCustomerInfo({ phone: "", email: "", creditLimit: 0, currentDebt: 0 });
            setAvailableCredit(0);
        }
    };

    // Logic xử lý hàng hàng
    const setRow = (i, f, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
    const addRow = () => setRows(p => [...p, { productId: "", qty: 1, unitPrice: 0, discount: 0, notes: "", uom: "" }]);
    const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));

    const pickProduct = (i, pid) => {
        const pr = products.find(p => String(p.id) === String(pid));
        setRows(p => p.map((r, idx) => idx === i ? {
            ...r,
            productId: pid,
            unitPrice: pr?.sellingPrice ?? pr?.price ?? 0,
            uom: pr?.unit || "Bộ"
        } : r));
    };

    // Tính toán tài chính
    const rowGross = r => (Number(r.qty) || 0) * (Number(r.unitPrice) || 0);
    const rowNet = r => rowGross(r) - (Number(r.discount) || 0);

    const grossTotal = rows.reduce((s, r) => s + rowGross(r), 0);
    const totalDiscount = rows.reduce((s, r) => s + (Number(r.discount) || 0), 0);
    const grandTotal = grossTotal - totalDiscount;

    // Cập nhật tiền cọc khi grandTotal hoặc ratio thay đổi
    useEffect(() => {
        const calculatedDeposit = Math.round(grandTotal * (depositRatio / 100));
        setDepositAmount(calculatedDeposit);
    }, [grandTotal, depositRatio]);

    const handleSelectDateFromCalendar = (date) => {
        const isoDate = date.toISOString().split('T')[0];
        setDeliveryDate(isoDate);
        setShowCalendar(false);
    };

    const handleCreate = async () => {
        if (!custId) return alert("Vui lòng chọn khách hàng!");
        if (rows.length === 0 || rows.some(r => !r.productId)) return alert("Vui lòng chọn sản phẩm cho tất cả các dòng!");

        const payload = {
            customerId: Number(custId),
            deliveryAddress: address,
            notes: orderNote,
            dueDate: deliveryDate || null,
            paymentTerms,
            paymentMethod,
            depositRatio: Number(depositRatio),
            depositAmount: Number(depositAmount),
            details: rows.map(r => ({
                productId: Number(r.productId),
                quantity: Number(r.qty),
                unitPrice: Number(r.unitPrice),
                discount: Number(r.discount),
                notes: r.notes
            }))
        };

        try {
            await salesOrderService.create(payload);
            alert("Tạo đơn hàng thành công!");
            onBack();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể tạo đơn hàng"));
        }
    };

    if (loading) return (
        <div className="sq-modal-overlay">
            <div className="sq-modal-box sq-modal-box--huge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
                <div className="sp-spinner"></div>
            </div>
        </div>
    );

    const isOverLimit = (customerInfo.currentDebt + grandTotal) > customerInfo.creditLimit && customerInfo.creditLimit > 0;

    return (
        <div className="sq-modal-overlay" onClick={onBack}>
            <div className="sq-modal-box sq-modal-box--huge" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sq-modal-header">
                    <div>
                        <h2 className="sq-modal-title">Tạo đơn hàng mới</h2>
                        <div style={{ fontSize: '0.85em', color: '#6b7280', marginTop: 4 }}>Nhập thông tin chi tiết để khởi tạo đơn hàng bán chính thức</div>
                    </div>
                    <button className="sq-modal-close" onClick={onBack}>✕</button>
                </div>

                {/* Body */}
                <div className="sq-modal-body">
                    <div className="cf-container">
                        {/* LEFT COLUMN: Info & Payment */}
                        <div className="cf-main-info">
                            {/* SECTION 1: THÔNG TIN CHUNG */}
                            <div className="cf-card">
                                <div className="cf-section-header">
                                    <div className="cf-section-label">
                                        <span className="cf-section-num">1</span>
                                        Thông tin chung
                                    </div>
                                </div>
                                <div className="cf-grid-2">
                                    <div className="cf-field">
                                        <label className="cf-label">Khách hàng <span className="cf-required">*</span></label>
                                        <select className="cf-select" value={custId} onChange={e => handleCustomerChange(e.target.value)}>
                                            <option value="">Chọn khách hàng</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="cf-field">
                                        <label className="cf-label">SĐT / Liên hệ</label>
                                        <input className="cf-input cf-input--readonly" readOnly value={customerInfo.phone} />
                                    </div>
                                    <div className="cf-field" style={{ position: 'relative' }}>
                                        <label className="cf-label">Ngày giao dự kiến</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input className="cf-input cf-input--date" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                                            <button className="cf-add-row-btn" style={{ padding: '8px', minWidth: '42px' }} title="Xem lịch xưởng" onClick={() => setShowCalendar(true)}>📅</button>
                                        </div>
                                    </div>
                                    <div className="cf-field">
                                        <label className="cf-label">Email</label>
                                        <input className="cf-input cf-input--readonly" readOnly value={customerInfo.email} />
                                    </div>
                                </div>
                                <div className="cf-field" style={{ marginTop: 16 }}>
                                    <label className="cf-label">Địa chỉ giao hàng</label>
                                    <textarea className="cf-textarea" rows={3} value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ nhận hàng chi tiết..." />
                                </div>
                            </div>

                            {/* SECTION 2: THÔNG TIN THANH TOÁN */}
                            <div className="cf-card">
                                <div className="cf-section-header">
                                    <div className="cf-section-label">
                                        <span className="cf-section-num">2</span>
                                        Thanh toán & Tín dụng
                                    </div>
                                </div>
                                <div className="cf-grid-2">
                                    <div className="cf-field">
                                        <label className="cf-label">Điều khoản thanh toán</label>
                                        <select className="cf-select" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                                            <option value="CASH_ON_DELIVERY">Thanh toán khi giao hàng (COD)</option>
                                            <option value="NET_15">Thanh toán trong 15 ngày (Net 15)</option>
                                            <option value="NET_30">Thanh toán trong 30 ngày (Net 30)</option>
                                            <option value="PREPAID">Thanh toán trước 100%</option>
                                        </select>
                                    </div>
                                    <div className="cf-field">
                                        <label className="cf-label">Phương thức thanh toán</label>
                                        <select className="cf-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                            <option value="CASH">Tiền mặt</option>
                                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                                        </select>
                                    </div>
                                    <div className="cf-field">
                                        <label className="cf-label">Tỷ lệ đặt cọc (%)</label>
                                        <input className="cf-input" type="number" min="0" max="100" value={depositRatio} onChange={e => setDepositRatio(Number(e.target.value))} />
                                    </div>
                                    <div className="cf-field">
                                        <label className="cf-label">Tiền cọc yêu cầu</label>
                                        <input className="cf-input cf-input--readonly" readOnly value={fmt(depositAmount)} />
                                    </div>
                                </div>

                                {/* Customer Credit Card Info */}
                                {custId && (
                                    <div className={`cf-credit-info ${isOverLimit ? 'cf-credit-info--danger' : ''}`}>
                                        <div className="cf-credit-item">
                                            <span>Hạn mức tín dụng:</span>
                                            <strong>{fmt(customerInfo.creditLimit)}</strong>
                                        </div>
                                        <div className="cf-credit-item">
                                            <span>Dư nợ hiện tại:</span>
                                            <strong>{fmt(customerInfo.currentDebt)}</strong>
                                        </div>
                                        {isOverLimit && (
                                            <div className="cf-credit-warning">
                                                ⚠️ Đơn hàng khiến khách vượt hạn mức tín dụng!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Products */}
                        <div className="cf-product-section">
                            <div className="cf-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div className="cf-section-header">
                                    <div className="cf-section-label">
                                        <span className="cf-section-num">3</span>
                                        Danh sách sản phẩm
                                    </div>
                                    <button className="cf-add-row-btn" onClick={addRow}>+ Thêm dòng</button>
                                </div>
                                <div className="cf-table-wrapper" style={{ flex: 1 }}>
                                    <table className="cf-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "35%" }}>SẢN PHẨM</th>
                                                <th style={{ width: "12%", textAlign: 'center' }}>ĐVT</th>
                                                <th style={{ width: "10%" }}>SL</th>
                                                <th style={{ width: "18%" }}>ĐƠN GIÁ</th>
                                                <th style={{ width: "20%" }}>THÀNH TIỀN</th>
                                                <th style={{ width: "40px" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <select className="cf-table-select" value={row.productId} onChange={e => pickProduct(i, e.target.value)}>
                                                            <option value="">Chọn sản phẩm</option>
                                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}><span className="cf-uom-badge">{row.uom || '—'}</span></td>
                                                    <td><input className="cf-table-input" type="number" min="1" value={row.qty} onChange={e => setRow(i, "qty", e.target.value)} /></td>
                                                    <td><input className="cf-table-input" type="number" min="0" value={row.unitPrice} onChange={e => setRow(i, "unitPrice", e.target.value)} /></td>
                                                    <td className="cf-td--amount" style={{ fontWeight: '700', textAlign: 'right' }}>{fmt(rowNet(row))}</td>
                                                    <td><button className="cf-remove-btn" onClick={() => removeRow(i)} disabled={rows.length === 1}>✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="cf-summary-box">
                                    <div className="cf-field" style={{ marginTop: 16 }}>
                                        <label className="cf-label">Ghi chú đơn hàng</label>
                                        <textarea className="cf-textarea" rows={3} value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Ghi chú sản xuất hoặc giao hàng..." />
                                    </div>
                                    
                                    <div className="cf-financial-summary">
                                        <div className="cf-summary-row">
                                            <span>Tổng tiền chưa chiết khấu:</span>
                                            <span>{fmt(grossTotal)}</span>
                                        </div>
                                        <div className="cf-summary-row cf-summary-row--discount">
                                            <span>Tổng chiết khấu áp dụng:</span>
                                            <span>- {fmt(totalDiscount)}</span>
                                        </div>
                                        <div className="cf-summary-row cf-summary-row--total">
                                            <span>TỔNG THANH TOÁN:</span>
                                            <span>{fmt(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sq-modal-footer">
                    <div className="sq-modal-footer-info">
                        Trạng thái dự kiến: <span className={`so-badge ${isOverLimit ? 'so-badge--approval' : 'so-badge--deposit'}`}>
                            {isOverLimit ? 'Chờ phê duyệt' : 'Chờ đặt cọc'}
                        </span>
                    </div>
                    <div className="sq-modal-footer-actions" style={{ display: 'flex', gap: '12px' }}>
                        <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onBack}>Hủy bỏ</button>
                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleCreate}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                            Tạo đơn hàng
                        </button>
                    </div>
                </div>
            </div>

            <PlanCalendarModal 
                isOpen={showCalendar} 
                onClose={() => setShowCalendar(false)} 
                onSelectDate={handleSelectDateFromCalendar} 
            />
        </div>
    );
};