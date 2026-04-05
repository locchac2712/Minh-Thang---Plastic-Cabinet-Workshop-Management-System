import React, { useRef, useState, useEffect } from "react";
import api from "../../../services/api";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

const CustomStatusSelect = ({ value, onChange, options, disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (disabled) {
        return (
            <div className="sq-status-badge-large" style={{ backgroundColor: selected?.color || "#9ca3af" }}>
                {selected?.label || value}
            </div>
        );
    }

    return (
        <div className="sq-custom-select" ref={wrapRef} style={{ width: "100%" }}>
            <div 
                className={`sq-select-trigger${isOpen ? " sq-select-trigger--open" : ""}`} 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    borderLeft: `4px solid ${selected?.color || "#e2e8f0"}`,
                    padding: "10px 16px",
                    borderRadius: "12px",
                    background: "#fff",
                    border: "1.5px solid #e2e8f0",
                    borderLeftWidth: "4px"
                }}
            >
                <span style={{ fontWeight: "700", color: selected?.color, fontSize: "14px" }}>
                    {selected ? selected.label : "Chọn trạng thái..."}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {isOpen && (
                <div className="sq-select-popup" style={{ top: "calc(100% + 4px)", borderRadius: "12px" }}>
                    {options.map(o => (
                        <div 
                            key={o.value} 
                            className={`sq-select-item${value === o.value ? " sq-select-item--active" : ""}`} 
                            onClick={() => { onChange(o.value); setIsOpen(false); }}
                            style={{ padding: "10px 14px", borderRadius: "8px" }}
                        >
                            <span style={{ color: o.color, fontWeight: "700", fontSize: "13.5px" }}>{o.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
// ── Product Line Table ──────────────────────────────────────
export const QuotationItemsTable = ({ rows, products, getAvailableProducts, onUpdate, onAdd, onRemove, isReadOnly = false, errors = {} }) => {

    return (
        <div className="sq-form-card">
            <div className="sq-form-section-header">
                <span className="sq-form-section-title">DANH SÁCH SẢN PHẨM</span>
                {!isReadOnly && <button className="sq-add-row-btn" onClick={onAdd} type="button">+ Thêm dòng mới</button>}
            </div>
            {errors?.rows && <div className="sq-field-error" style={{ marginBottom: '12px', marginLeft: '4px' }}>{errors.rows}</div>}
            <div className={`sq-items-scroll-wrap ${rows.length > 5 ? "sq-items-scroll-wrap--scroll" : ""}`}>
                <table className="sq-form-table">
                    <thead>
                        <tr>
                            <th style={{ width: "35%" }}>Sản phẩm <span className="sq-required-star">*</span></th>
                            <th style={{ width: "100px" }}>ĐVT</th>
                            <th style={{ width: "100px" }}>Số lượng</th>
                            <th style={{ width: "140px" }}>Đơn giá</th>
                            <th style={{ textAlign: "right" }}>Thành tiền</th>
                            {!isReadOnly && <th style={{ width: "50px" }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => {
                            const lineTotal = (row.qty || 0) * (row.unitPrice || 0);
                            const selectedProduct = products.find(p => String(p.id) === String(row.productId));
                            
                            return (
                                <tr key={i}>
                                    <td>
                                        <ProductSearchSelect
                                            products={getAvailableProducts ? getAvailableProducts(row.productId) : products}
                                            value={row.productId}
                                            onChange={(val) => onUpdate(i, "productId", val)}
                                            disabled={isReadOnly}
                                        />
                                    </td>
                                    <td>
                                        <span className="sq-table-readonly">{selectedProduct?.unit || "-"}</span>
                                    </td>
                                    <td>
                                        {isReadOnly ? (
                                            <span className="sq-table-readonly">{row.qty}</span>
                                        ) : (
                                            <input
                                                className="sq-table-input"
                                                type="number"
                                                min="1"
                                                value={row.qty}
                                                onFocus={(e) => {
                                                    const target = e.target;
                                                    setTimeout(() => target.select(), 0);
                                                }}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === "") {
                                                        onUpdate(i, "qty", "");
                                                        return;
                                                    }
                                                    const num = Number(val);
                                                    onUpdate(i, "qty", num > 0 ? num : 1);
                                                }}
                                            />
                                        )}
                                    </td>
                                    <td>
                                        <span className="sq-table-readonly">{fmt(row.unitPrice)}</span>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <span className="sq-table-readonly sq-table-readonly--total">
                                            {fmt(lineTotal)}
                                        </span>
                                    </td>
                                    {!isReadOnly && (
                                        <td>
                                            <button
                                                className="sq-remove-btn"
                                                onClick={() => onRemove(i)}
                                                disabled={rows.length === 1}
                                                type="button"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <style>{`
                .sq-table-readonly--total { font-weight: 700; color: #111827; }
            `}</style>
        </div>
    );
};


// ── Summary Panel ───────────────────────────────────────────
export const QuotationSummary = ({ totals, discountPercent, onDiscountChange, note, onNoteChange, status, onStatusChange, isReadOnly = false, isEdit = false }) => {
    const isDiscountWarning = discountPercent > 30;

    const statusOptions = [
        { value: "DRAFT", label: "Bản nháp", color: "#64748b" },
        { value: "WAITING_APPROVAL", label: "Chờ duyệt", color: "#f59e0b" },
        { value: "APPROVED", label: "Đã duyệt", color: "#10b981" },
        { value: "REJECTED", label: "Từ chối duyệt", color: "#ef4444" },
        { value: "ACCEPTED", label: "Chấp thuận", color: "#8b5cf6" },
        { value: "CANCELLED", label: "Hủy", color: "#94a3b8" },
        { value: "EXPIRED", label: "Hết hạn", color: "#4b5563" }
    ];

    return (
        <div className="sq-form-sidebar">

            <div className="sq-form-summary">
                <div className="sq-form-summary-title">TỔNG KẾT CHI PHÍ</div>
                <div className="sq-form-summary-row">
                    <span>Tạm tính</span>
                    <span>{fmt(totals.subTotal)}</span>
                </div>
                
                <div className="sq-form-summary-row" style={{ marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.2)", paddingTop: "12px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Chiết khấu (%)</span>
                            {isReadOnly ? (
                                <span style={{ fontWeight: 700 }}>{discountPercent}%</span>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={discountPercent}
                                        onFocus={(e) => {
                                            const target = e.target;
                                            setTimeout(() => target.select(), 0);
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "") {
                                                onDiscountChange(0);
                                                return;
                                            }
                                            const num = Math.min(100, Math.max(0, Number(val)));
                                            onDiscountChange(num);
                                        }}
                                        style={{ width: "60px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "#fff", padding: "4px 8px", textAlign: "right", fontSize: "14px" }}
                                    />
                                    <span style={{ fontSize: "13px", opacity: 0.7 }}>%</span>
                                </div>
                            )}
                        </div>
                        {isDiscountWarning && (
                            <span style={{ color: "#fca5a5", fontSize: "11px", fontWeight: "600", marginTop: "2px" }}>
                                ⚠️ Vượt quá hạn mức 30% quy định
                            </span>
                        )}
                        {totals.totalDiscount > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                                <span>Tiền giảm</span>
                                <span>- {fmt(totals.totalDiscount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sq-form-summary-divider" />
                <div className="sq-form-summary-row sq-form-summary-row--total">
                    <span>TỔNG CỘNG</span>
                    <span>{fmt(totals.grandTotal)}</span>
                </div>
            </div>

            {isReadOnly && status && (
                <div className="sq-form-card" style={{ marginTop: "16px" }}>
                    <label className="sq-form-label">Trạng thái báo giá</label>
                    <div style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        textAlign: 'center',
                        color: statusOptions.find(s => s.value === status)?.color || '#64748b',
                        background: (statusOptions.find(s => s.value === status)?.color || '#64748b') + '15',
                        border: '1.5px solid ' + (statusOptions.find(s => s.value === status)?.color || '#64748b') + '30'
                    }}>
                        {statusOptions.find(s => s.value === status)?.label || status}
                    </div>
                </div>
            )}

            <div className="sq-form-card">
                <label className="sq-form-label">Ghi chú báo giá</label>
                <textarea
                    className="sq-form-textarea"
                    rows={6}
                    placeholder="Nhập ghi chú cho khách hàng..."
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    readOnly={isReadOnly}
                />
            </div>
            
            <style>{`
                .sq-form-summary-row--total { font-size: 18px; font-weight: 700; color: #fff; }
                .sq-status-badge-large {
                    padding: 8px 12px;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                    text-align: center;
                    text-transform: uppercase;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
};

// ── Searchable Customer Dropdown with inline Add ──────────
export const CustomerSearchSelect = ({ customers, value, onChange, onCustomerCreated }) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCust, setNewCust] = useState({ name: "", phoneNumber: "", email: "" });
    const [addingCust, setAddingCust] = useState(false);
    const [addErrors, setAddErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState(""); 
    const wrapRef = useRef(null);
    const selectedCust = customers.find(c => String(c.id) === String(value));

    // Backend typically returns items by ID DESC or similar, so the first 3 are recent.
    const recentCustomers = customers.slice(0, 3);

    useEffect(() => {
        if (selectedCust && !isOpen) setSearch(selectedCust.name);
    }, [selectedCust, isOpen]);

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowAddForm(false);
                if (selectedCust) setSearch(selectedCust.name);
                else setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [selectedCust]);

    // Only filter if there's text, otherwise show recent
    const filtered = search.trim() 
        ? customers.filter(c => c.name.toLowerCase().includes(search.trim().toLowerCase()))
        : recentCustomers;

    const hasExactMatch = customers.some(c => c.name.toLowerCase() === search.trim().toLowerCase());

    const handleCreateCustomer = async () => {
        const errors = {};
        const trimmedName = newCust.name.trim();
        const trimmedPhone = newCust.phoneNumber.trim();
        const trimmedEmail = newCust.email.trim();

        // Name Validation
        if (!trimmedName) {
            errors.name = "Tên khách hàng là bắt buộc";
        } else if (!/^[a-zA-ZÀ-ỹ\s]{2,100}$/u.test(trimmedName)) {
            errors.name = "Tên từ 2-100 ký tự và không chứa ký tự đặc biệt";
        }

        // Phone Validation
        if (!trimmedPhone) {
            errors.phoneNumber = "Số điện thoại là bắt buộc";
        } else if (!/^0\d{9}$/.test(trimmedPhone)) {
            errors.phoneNumber = "SĐT phải bắt đầu bằng 0 và có đúng 10 chữ số";
        }

        // Email Validation (Không bắt buộc, chỉ check định dạng nếu có nhập)
        if (trimmedEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                errors.email = "Email không đúng định dạng";
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setAddErrors(errors);
            return;
        }

        setAddingCust(true); 
        setAddErrors({});
        try {
            const res = await api.post("/customers", {
                name: newCust.name.trim(),
                phoneNumber: newCust.phoneNumber.trim(),
                email: newCust.email.trim(),
            });
            const created = res.data?.data || res.data;
            
            setSuccessMsg("Thêm khách hàng thành công!");
            
            setTimeout(() => {
                if (onCustomerCreated) onCustomerCreated(created);
                onChange(String(created.id));
                setSearch(created.name);
                setSuccessMsg("");
                setIsOpen(false);
                setShowAddForm(false);
                setNewCust({ name: "", phoneNumber: "", email: "" });
            }, 1200);
        } catch (e) {
            console.error("Lỗi khi thêm KH:", e);
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Số điện thoại hoặc Email đã được sử dụng";
            setAddErrors({ general: errorMsg });
        } finally { setAddingCust(false); }
    };

    return (
        <div className="cq-cust-wrap" ref={wrapRef}>
            <div className="cq-cust-input-wrap">
                <svg className="cq-cust-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input className="sq-form-input cq-cust-input" placeholder="Nhập tên khách hàng để tìm..." value={search} onChange={e => { setSearch(e.target.value); setIsOpen(true); }} onFocus={() => setIsOpen(true)} autoComplete="off" />
                {value && <button className="cq-cust-clear" onClick={() => { onChange(""); setSearch(""); setIsOpen(false); }} title="Xóa chọn" type="button">✕</button>}
            </div>
            {isOpen && (
                <div className="cq-cust-dropdown">
                    <div className="cq-cust-list">
                        {!search.trim() && <div className="cq-cust-list-label">Khách hàng gần đây</div>}
                        {filtered.length > 0 ? filtered.map(c => (
                            <div key={c.id} className={`cq-cust-item${String(c.id) === String(value) ? " cq-cust-item--active" : ""}`} onClick={() => { onChange(String(c.id)); setSearch(c.name); setIsOpen(false); }}>
                                <div className="cq-cust-item-name">{c.name}</div>
                                <div className="cq-cust-item-info">
                                    {c.phoneNumber && <span>📞 {c.phoneNumber}</span>}
                                    {c.email && <span>✉ {c.email}</span>}
                                </div>
                            </div>
                        )) : (
                            <div className="cq-cust-empty">
                                {search.trim() ? "Không tìm thấy khách hàng." : "Nhập tên để tìm kiếm thêm."}
                            </div>
                        )}
                    </div>
                    {search.trim() && !hasExactMatch && !showAddForm && (
                        <div className="cq-cust-add-row" onClick={() => { setShowAddForm(true); setNewCust({ name: search.trim(), phoneNumber: "", email: "" }); setAddErrors({}); setSuccessMsg(""); }}>
                            <span className="cq-cust-add-icon">+</span>
                            <span>Thêm khách hàng "<strong>{search.trim()}</strong>"</span>
                        </div>
                    )}
                    {showAddForm && (
                        <div className="cq-cust-add-form">
                            <div className="cq-cust-add-title">Thêm khách hàng mới</div>
                            <div className="cq-cust-add-field">
                                <label>Tên KH <span style={{color:"#ef4444"}}>*</span></label>
                                <input 
                                    className="sq-form-input" 
                                    value={newCust.name} 
                                    onChange={e => { setNewCust(p => ({ ...p, name: e.target.value })); setAddErrors(p => ({...p, name: null})); }} 
                                    placeholder="Nhập tên khách hàng" 
                                />
                                {addErrors.name && <span className="sq-field-error">{addErrors.name}</span>}
                            </div>
                            <div className="cq-cust-add-field">
                                <label>SĐT <span style={{color:"#ef4444"}}>*</span></label>
                                <input 
                                    className="sq-form-input" 
                                    value={newCust.phoneNumber} 
                                    onChange={e => { setNewCust(p => ({ ...p, phoneNumber: e.target.value })); setAddErrors(p => ({...p, phoneNumber: null})); }} 
                                    placeholder="Nhập số điện thoại khách hàng" 
                                />
                                {addErrors.phoneNumber && <span className="sq-field-error">{addErrors.phoneNumber}</span>}
                            </div>
                            <div className="cq-cust-add-field">
                                <label>Email</label>
                                <input 
                                    className="sq-form-input" 
                                    value={newCust.email} 
                                    onChange={e => { setNewCust(p => ({ ...p, email: e.target.value })); setAddErrors(p => ({...p, email: null})); }} 
                                    placeholder="Nhập email khách hàng" 
                                />
                                {addErrors.email && <span className="sq-field-error">{addErrors.email}</span>}
                            </div>
                            {addErrors.general && <div className="cq-cust-add-error">{addErrors.general}</div>}
                            <div className="cq-cust-add-actions">
                                <button className="cq-cust-add-cancel" onClick={() => setShowAddForm(false)} disabled={addingCust} type="button">Hủy</button>
                                <button className="cq-cust-add-save" onClick={handleCreateCustomer} disabled={addingCust} type="button">{addingCust ? "Đang lưu..." : "Thêm KH"}</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <style>{`
                .cq-cust-list-label { padding: 8px 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
                .cq-cust-add-success { padding: 20px; text-align: center; color: #059669; font-weight: 600; font-size: 15px; }
            `}</style>
        </div>
    );
};

// ── Single Date Picker ──────────────────────────────────────
export const SingleDatePicker = ({ value, onChange, isReadOnly = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
    const wrapRef = useRef(null);
    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const formatDisplay = (dStr) => {
        if (!dStr) return "";
        const d = new Date(dStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear(), month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).toISOString().split("T")[0]);

        return (
            <div className="cq-cal">
                <div className="cq-cal-header">
                    <button type="button" onClick={() => setViewDate(new Date(year, month - 1))}>&lt;</button>
                    <span>Tháng {month + 1}, {year}</span>
                    <button type="button" onClick={() => setViewDate(new Date(year, month + 1))}>&gt;</button>
                </div>
                <div className="sq-cal-grid">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <div key={d} className="sq-cal-day-head">{d}</div>)}
                    {days.map((d, index) => {
                        if (!d) return <div key={`e-${index}`} />;
                        const isPast = d < today, isSel = d === value, isT = d === today;
                        return (
                            <div key={d} className={`sq-cal-day${isSel ? " sq-cal-day--start" : ""}${isPast ? " sq-cal-day--disabled" : ""}${isT ? " sq-cal-day--today" : ""}`}
                                 onClick={() => { if(!isPast) { onChange(d); setIsOpen(false); } }}>
                                {new Date(d).getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (isReadOnly) {
        return (
            <div className="sq-form-input sq-form-input--readonly">
                {value ? formatDisplay(value) : "N/A"}
            </div>
        );
    }

    return (
        <div className="cq-datepicker-wrap" ref={wrapRef}>
            <div className={`sq-form-input cq-datepicker-trigger${isOpen ? " cq-datepicker-trigger--open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="cq-datepicker-text">{value ? formatDisplay(value) : "Chọn ngày..."}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            {isOpen && <div className="cq-datepicker-popup">{renderCalendar()}</div>}
        </div>
    );
};

// ── Private Internal Helper ──────────────────────────────────
const ProductSearchSelect = ({ products, value, onChange, disabled = false }) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);

    const selectedProd = products.find(p => String(p.id) === String(value));

    useEffect(() => {
        if (selectedProd && !isOpen) setSearch(`${selectedProd.name} (${selectedProd.sku})`);
        else if (!value && !isOpen) setSearch("");
    }, [selectedProd, isOpen, value]);

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setIsOpen(false);
                if (selectedProd) setSearch(`${selectedProd.name} (${selectedProd.sku})`);
                else setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [selectedProd]);

    const filtered = products.filter(p => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
    });

    if (disabled) {
        return (
            <div className="sq-table-readonly">
                {selectedProd ? `${selectedProd.name} (${selectedProd.sku})` : "N/A"}
            </div>
        );
    }

    return (
        <div className="cq-prod-wrap" ref={wrapRef}>
            <input
                className="cq-prod-input"
                placeholder="Nhập tên SP..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setIsOpen(true); if(!e.target.value.trim()) onChange("") }}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
                disabled={disabled}
            />
            {value && !disabled && (
                <button className="cq-prod-clear" onClick={() => { onChange(""); setSearch(""); setIsOpen(false); }} type="button">✕</button>
            )}
            {isOpen && (
                <div className="cq-prod-dropdown">
                    {filtered.length > 0 ? filtered.map(p => (
                        <div key={p.id}
                            className={`cq-prod-item${String(p.id) === String(value) ? " cq-prod-item--active" : ""}`}
                            onClick={() => { onChange(String(p.id)); setIsOpen(false); }}
                        >
                            <span className="cq-prod-item-name">{p.name}</span>
                            <span className="cq-prod-item-sku">{p.sku}</span>
                        </div>
                    )) : (
                        <div className="cq-prod-empty">Không tìm thấy</div>
                    )}
                </div>
            )}
        </div>
    );
};
