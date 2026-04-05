import React, { useState, useEffect } from "react";
import "./CreateForms.css";
import customerService from "../../services/customerService";
import productService from "../../services/productService";
import salesOrderService from "../../services/salesOrderService";
import quotationService from "../../services/quotationService";
import { SingleDatePicker } from "./components/QuotationFormShared";
const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "0 đ";

export const CreateOrder = ({ onBack }) => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedQuoteId, setSelectedQuoteId] = useState("");


    // Section 1: Thông tin chung
    const [custId, setCustId] = useState("");
    const [customerInfo, setCustomerInfo] = useState({ phone: "", email: "", creditLimit: 0, currentDebt: 0 });
    const [address, setAddress] = useState("");
    const [orderNote, setOrderNote] = useState("");

    const [availableCredit, setAvailableCredit] = useState(0);

    // Section 2: Thông tin thanh toán
    const [paymentTerms, setPaymentTerms] = useState("CASH_ON_DELIVERY");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [depositRatio, setDepositRatio] = useState("");
    const [depositAmount, setDepositAmount] = useState(0);
    const [discountPercent, setDiscountPercent] = useState("");

    // Section 3: Danh sách sản phẩm
    const [rows, setRows] = useState([{ productId: "", qty: 1, unitPrice: 0, discount: 0, notes: "", uom: "" }]);

    useEffect(() => {
        Promise.all([
            customerService.getAll(),
            productService.getAll(),
            quotationService.getAll({ status: "ACCEPTED", size: 100 }),
            quotationService.getAll({ status: "APPROVED", size: 100 })
        ]).then(([cData, pData, qAcc, qApp]) => {
            setCustomers(cData);
            setProducts(pData);
            const accList = qAcc?.content ?? qAcc ?? [];
            const appList = qApp?.content ?? qApp ?? [];
            const combined = [...accList, ...appList].sort((a, b) => b.id - a.id);
            setQuotations(combined);
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
                phone: c.phoneNumber || c.phone || "Chưa có",
                email: c.email || "Chưa có",
                creditLimit: c.creditLimit || 0,
                currentDebt: c.currentDebt || 0
            });
            setAvailableCredit((c.creditLimit || 0) - (c.currentDebt || 0));
            setAddress(c.address || "");
        } else {
            setCustomerInfo({ phone: "", email: "", creditLimit: 0, currentDebt: 0 });
            setAvailableCredit(0);
        }
    };

    const handlePaymentTermsChange = (e) => {
        const term = e.target.value;
        setPaymentTerms(term);
        if (term === "PREPAID") {
            setDepositRatio(100);
        }
    };

    const handleQuoteChange = async (quoteId) => {
        setSelectedQuoteId(quoteId);
        if (!quoteId) {
            setCustId("");
            setCustomerInfo({ phone: "", email: "", creditLimit: 0, currentDebt: 0 });
            setAvailableCredit(0);
            setAddress("");
            setDiscountPercent("");
            return;
        }
        
        try {
            const quoteData = await quotationService.getById(quoteId);
            
            // Auto fill
            if (quoteData.customer) {
                const c = customers.find(x => String(x.id) === String(quoteData.customer.id));
                if (c) {
                    setCustId(c.id);
                    setCustomerInfo({
                        phone: c.phoneNumber || c.phone || "Chưa có",
                        email: c.email || "Chưa có",
                        creditLimit: c.creditLimit || 0,
                        currentDebt: c.currentDebt || 0
                    });
                    setAvailableCredit((c.creditLimit || 0) - (c.currentDebt || 0));
                    setAddress(c.address || "");
                } else {
                    setCustId(quoteData.customer.id);
                    setCustomerInfo({
                        phone: quoteData.customer.phoneNumber || "Chưa có",
                        email: quoteData.customer.email || "Chưa có",
                        creditLimit: 0,
                        currentDebt: 0
                    });
                    setAddress(quoteData.customer.address || "");
                }
            }
            
            if (quoteData.details && quoteData.details.length > 0) {
                const newRows = quoteData.details.map(d => {
                    const product = products.find(p => String(p.id) === String(d.productId));
                    return {
                        productId: d.productId,
                        qty: d.quantity,
                        unitPrice: d.unitPrice,
                        discount: d.discount || 0,
                        notes: "",
                        uom: product?.unit || "Bộ"
                    };
                });
                setRows(newRows);
            }
            if (quoteData.note) {
                setOrderNote("Báo giá " + quoteData.quotationNumber + ": " + quoteData.note);
            }
            if (quoteData.discountPercent) setDiscountPercent(quoteData.discountPercent);
            else setDiscountPercent("");
            
        } catch (err) {
            console.error("Lỗi khi tải báo giá:", err);
            alert("Lỗi khi tải dữ liệu báo giá");
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
    const rowDiscountTotal = rows.reduce((s, r) => s + (Number(r.discount) || 0), 0);
    const percentDiscountAmount = Math.round((grossTotal - rowDiscountTotal) * (Number(discountPercent) || 0) / 100);
    const totalDiscountAmount = rowDiscountTotal + percentDiscountAmount;
    const grandTotal = grossTotal - totalDiscountAmount;

    // Cập nhật tiền cọc khi grandTotal hoặc ratio thay đổi
    useEffect(() => {
        const r = Number(depositRatio) || 0;
        const calculatedDeposit = Math.round(grandTotal * (r / 100));
        setDepositAmount(calculatedDeposit);
    }, [grandTotal, depositRatio]);

    const handleCreate = async () => {
        if (!custId) return alert("Vui lòng chọn khách hàng!");
        if (rows.length === 0 || rows.some(r => !r.productId)) return alert("Vui lòng chọn sản phẩm cho tất cả các dòng!");

        const payload = {
            quotationId: selectedQuoteId ? Number(selectedQuoteId) : null,
            customerId: Number(custId),
            deliveryAddress: address,
            notes: orderNote,
            paymentTerms,
            paymentMethod,
            depositRatio: Number(depositRatio) || 0,
            depositAmount: Number(depositAmount) || 0,
            details: rows.map(r => {
                const lineGross = (Number(r.qty) || 0) * (Number(r.unitPrice) || 0);
                const lineNet = lineGross - (Number(r.discount) || 0);
                const extraDiscount = lineNet * (Number(discountPercent) || 0) / 100;
                return {
                    productId: Number(r.productId),
                    quantity: Number(r.qty),
                    unitPrice: Number(r.unitPrice),
                    discount: Number(r.discount || 0) + extraDiscount,
                    notes: r.notes
                };
            })
        };

        try {
            await salesOrderService.create(payload);
            alert("Tạo đơn hàng thành công!");
            onBack(true);
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể tạo đơn hàng"));
        }
    };

    if (loading) return (
        <div className="sq-modal-overlay">
            <div className="sq-modal-box sq-modal-box--large" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
                <div className="sp-spinner"></div>
            </div>
        </div>
    );

    const isOverLimit = (customerInfo.currentDebt + grandTotal) > customerInfo.creditLimit && customerInfo.creditLimit > 0;

    return (
        <div className="sq-modal-overlay" onClick={onBack}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
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
                    <div className="sq-form-grid">
                        
                        {/* MAIN COLUMN: Info, Payment & Products */}
                        <div className="sq-form-main">
                            
                            {/* SECTION 1: THÔNG TIN CHUNG */}
                            <div className="sq-form-card">
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title">Thông tin chung</div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field" style={{ flex: 1.5 }}>
                                        <label className="sq-form-label">Tạo từ báo giá đã duyệt (Tùy chọn)</label>
                                        <select className="sq-form-select" value={selectedQuoteId} onChange={e => handleQuoteChange(e.target.value)} style={{background: selectedQuoteId ? '#f0fdf4' : '#fff', borderColor: selectedQuoteId ? '#bbf7d0' : '#e5e7eb'}}>
                                            <option value="">-- Không có báo giá (Tạo đơn tự do) --</option>
                                            {quotations.map(q => <option key={q.id} value={q.id}>{q.quotationNumber} - {q.customerName}</option>)}
                                        </select>
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Khách hàng <span className="sq-required-star">*</span></label>
                                        <select className="sq-form-select" value={custId} onChange={e => handleCustomerChange(e.target.value)} disabled={!!selectedQuoteId}>
                                            <option value="">Chọn khách hàng...</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">SĐT / Liên hệ</label>
                                        <input className="sq-form-input sq-form-input--readonly" readOnly value={customerInfo.phone} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Email</label>
                                        <input className="sq-form-input sq-form-input--readonly" readOnly value={customerInfo.email} />
                                    </div>
                                    <div className="sq-form-field" style={{ flex: 1.5 }}>
                                        <label className="sq-form-label">Địa chỉ giao hàng</label>
                                        <input className="sq-form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ nhận hàng chi tiết..." />
                                    </div>
                                </div>
                            </div>
                            
                            {/* SECTION 2: THANH TOÁN */}
                            <div className="sq-form-card">
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title">Thanh toán & Tín dụng</div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Điều khoản thanh toán</label>
                                        <select className="sq-form-select" value={paymentTerms} onChange={handlePaymentTermsChange}>
                                            <option value="CASH_ON_DELIVERY">Thanh toán khi giao hàng (COD)</option>
                                            <option value="NET_15">Thanh toán trong 15 ngày (Net 15)</option>
                                            <option value="NET_30">Thanh toán trong 30 ngày (Net 30)</option>
                                            <option value="PREPAID">Thanh toán trước 100%</option>
                                        </select>
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Phương thức</label>
                                        <select className="sq-form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                            <option value="CASH">Tiền mặt</option>
                                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Tỷ lệ đặt cọc (%)</label>
                                        <input className="sq-form-input" type="number" min="0" max="100" value={depositRatio} onChange={e => {
                                            const v = e.target.value;
                                            if (v === "") setDepositRatio("");
                                            else setDepositRatio(Math.min(100, Math.max(0, Number(v))));
                                        }} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Chiết khấu tổng (%)</label>
                                        <input className="sq-form-input" type="number" min="0" max="30" value={discountPercent} onChange={e => {
                                            const v = e.target.value;
                                            if (v === "") setDiscountPercent("");
                                            else setDiscountPercent(Math.min(30, Math.max(0, Number(v))));
                                        }} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">Tiền cọc yêu cầu</label>
                                        <input className="sq-form-input sq-form-input--readonly" readOnly value={fmt(depositAmount)} />
                                    </div>
                                </div>
                                
                                {custId && (
                                    <div className="sq-form-row" style={{ marginTop: 12 }}>
                                        <div style={{ display: 'flex', gap: 24, fontSize: 13, background: isOverLimit ? '#fef2f2' : '#f8fafc', padding: 12, borderRadius: 10, width: '100%', border: `1px solid ${isOverLimit ? '#fecaca' : '#f1f5f9'}` }}>
                                            <div>Hạn mức LS: <strong style={{color: '#1e293b'}}>{fmt(customerInfo.creditLimit)}</strong></div>
                                            <div>Dư nợ hiện tại: <strong style={{color: '#1e293b'}}>{fmt(customerInfo.currentDebt)}</strong></div>
                                            {isOverLimit && <div style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Vượt hạn mức, đơn hàng cần GĐ duyệt!</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* SECTION 3: SẢN PHẨM */}
                            <div className="sq-form-card">
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title">Chi tiết sản phẩm</div>
                                    <button className="sq-add-row-btn" onClick={addRow}>+ Thêm dòng</button>
                                </div>
                                
                                <div className="sq-items-scroll-wrap sq-items-scroll-wrap--scroll">
                                    <table className="sq-form-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "35%" }}>SẢN PHẨM</th>
                                                <th style={{ width: "12%", textAlign: 'center' }}>ĐVT</th>
                                                <th style={{ width: "15%" }}>SL</th>
                                                <th style={{ width: "20%" }}>ĐƠN GIÁ</th>
                                                <th style={{ width: "18%", textAlign: 'right' }}>THÀNH TIỀN</th>
                                                <th style={{ width: "40px" }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <select className="sq-form-select" style={{padding: '8px 10px'}} value={row.productId} onChange={e => pickProduct(i, e.target.value)}>
                                                            <option value="">Chọn SP...</option>
                                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}><span className="sq-table-readonly">{row.uom || '—'}</span></td>
                                                    <td><input className="sq-table-input" type="number" min="1" value={row.qty} onChange={e => setRow(i, "qty", e.target.value)} /></td>
                                                    <td><input className="sq-table-input" type="number" min="0" value={row.unitPrice} onChange={e => setRow(i, "unitPrice", e.target.value)} /></td>
                                                    <td style={{ fontWeight: '700', textAlign: 'right', color: '#1e293b' }}>{fmt(rowNet(row))}</td>
                                                    <td><button className="sq-remove-btn" onClick={() => removeRow(i)} title="Xóa dòng" disabled={rows.length === 1}>✕</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="sq-form-sidebar">
                            <div className="sq-form-summary">
                                <div className="sq-form-summary-title">TỔNG KẾT ĐƠN HÀNG</div>
                                
                                <div className="sq-form-summary-row">
                                    <span>Tạm tính:</span>
                                    <span>{fmt(grossTotal)}</span>
                                </div>
                                <div className="sq-form-summary-row" style={{ color: '#fca5a5' }}>
                                    <span>Tổng chiết khấu:</span>
                                    <span>- {fmt(totalDiscountAmount)}</span>
                                </div>
                                <div className="sq-form-summary-divider"></div>
                                <div className="sq-form-summary-row sq-form-summary-row--total">
                                    <span>TỔNG TIỀN</span>
                                    <span>{fmt(grandTotal)}</span>
                                </div>
                            </div>
                            
                            <div className="sq-form-field" style={{ marginTop: 10 }}>
                                <label className="sq-form-label">Ghi chú vận hành / Bán hàng</label>
                                <textarea 
                                    className="sq-form-textarea" 
                                    value={orderNote} 
                                    onChange={e => setOrderNote(e.target.value)} 
                                    placeholder="VD: Giao nhanh chiều nay, đóng gói cẩn thận..." 
                                    style={{minHeight: 180}}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="sq-modal-footer">
                    <div className="sq-footer-left"></div>
                    <div className="sq-footer-actions" style={{display: 'flex', gap: 10}}>
                        <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onBack}>Hủy bỏ</button>
                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleCreate}>Tạo đơn hàng</button>
                    </div>
                </div>
            </div>

        </div>
    );
};