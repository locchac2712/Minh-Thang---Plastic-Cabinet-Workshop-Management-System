import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

// ── Searchable Customer Dropdown with inline Add ──────────
const CustomerSearchSelect = ({ customers, value, onChange, onCustomerCreated }) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCust, setNewCust] = useState({ name: "", phoneNumber: "", email: "" });
    const [addingCust, setAddingCust] = useState(false);
    const [addError, setAddError] = useState("");
    const wrapRef = useRef(null);

    // Tên KH đang chọn
    const selectedCust = customers.find(c => String(c.id) === String(value));

    // Khi đã chọn KH → hiện tên trong input
    useEffect(() => {
        if (selectedCust && !isOpen) setSearch(selectedCust.name);
    }, [selectedCust, isOpen]);

    // Click outside → đóng dropdown
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

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    const hasExactMatch = customers.some(c =>
        c.name.toLowerCase() === search.trim().toLowerCase()
    );

    const handleInputChange = (e) => {
        setSearch(e.target.value);
        setIsOpen(true);
        setShowAddForm(false);
        if (!e.target.value.trim()) onChange("");
    };

    const handleSelect = (c) => {
        onChange(String(c.id));
        setSearch(c.name);
        setIsOpen(false);
        setShowAddForm(false);
    };

    const handleOpenAdd = () => {
        setShowAddForm(true);
        setNewCust({ name: search.trim(), phoneNumber: "", email: "" });
        setAddError("");
    };

    const handleCreateCustomer = async () => {
        if (!newCust.name.trim()) { setAddError("Tên khách hàng là bắt buộc"); return; }
        if (!newCust.phoneNumber.trim()) { setAddError("Số điện thoại là bắt buộc"); return; }
        setAddingCust(true);
        setAddError("");
        try {
            const res = await api.post("/customers", {
                name: newCust.name.trim(),
                phoneNumber: newCust.phoneNumber.trim(),
                email: newCust.email.trim() || null,
            });
            const created = res.data?.data || res.data;
            onCustomerCreated(created);
            onChange(String(created.id));
            setSearch(created.name);
            setIsOpen(false);
            setShowAddForm(false);
        } catch (e) {
            setAddError(e.response?.data?.message || "Lỗi khi thêm khách hàng");
        } finally { setAddingCust(false); }
    };

    return (
        <div className="cq-cust-wrap" ref={wrapRef}>
            <div className="cq-cust-input-wrap">
                <svg className="cq-cust-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    className="sq-form-input cq-cust-input"
                    placeholder="Nhập tên khách hàng để tìm..."
                    value={search}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    autoComplete="off"
                />
                {value && (
                    <button className="cq-cust-clear" onClick={() => { onChange(""); setSearch(""); setIsOpen(false); }} title="Xóa chọn">✕</button>
                )}
            </div>

            {isOpen && (
                <div className="cq-cust-dropdown">
                    {/* Danh sách kết quả */}
                    <div className="cq-cust-list">
                        {filtered.length > 0 ? filtered.map(c => (
                            <div
                                key={c.id}
                                className={`cq-cust-item${String(c.id) === String(value) ? " cq-cust-item--active" : ""}`}
                                onClick={() => handleSelect(c)}
                            >
                                <div className="cq-cust-item-name">{c.name}</div>
                                <div className="cq-cust-item-info">
                                    {c.phoneNumber && <span>📞 {c.phoneNumber}</span>}
                                    {c.email && <span>✉ {c.email}</span>}
                                </div>
                            </div>
                        )) : (
                            <div className="cq-cust-empty">Không tìm thấy khách hàng</div>
                        )}
                    </div>

                    {/* Nút thêm KH mới — chỉ hiện khi search có text và không khớp chính xác */}
                    {search.trim() && !hasExactMatch && !showAddForm && (
                        <div className="cq-cust-add-row" onClick={handleOpenAdd}>
                            <span className="cq-cust-add-icon">+</span>
                            <span>Thêm khách hàng "<strong>{search.trim()}</strong>"</span>
                        </div>
                    )}

                    {/* Form thêm KH mới inline */}
                    {showAddForm && (
                        <div className="cq-cust-add-form">
                            <div className="cq-cust-add-title">Thêm khách hàng mới</div>
                            <div className="cq-cust-add-field">
                                <label>Tên KH <span style={{color:"#ef4444"}}>*</span></label>
                                <input
                                    value={newCust.name}
                                    onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Tên khách hàng"
                                    autoFocus
                                />
                            </div>
                            <div className="cq-cust-add-field">
                                <label>SĐT <span style={{color:"#ef4444"}}>*</span></label>
                                <input
                                    value={newCust.phoneNumber}
                                    onChange={e => setNewCust(p => ({ ...p, phoneNumber: e.target.value }))}
                                    placeholder="0901234567"
                                />
                            </div>
                            <div className="cq-cust-add-field">
                                <label>Email</label>
                                <input
                                    value={newCust.email}
                                    onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))}
                                    placeholder="email@example.com (không bắt buộc)"
                                />
                            </div>
                            {addError && <div className="cq-cust-add-error">⚠️ {addError}</div>}
                            <div className="cq-cust-add-actions">
                                <button className="cq-cust-add-cancel" onClick={() => setShowAddForm(false)} disabled={addingCust}>Hủy</button>
                                <button className="cq-cust-add-save" onClick={handleCreateCustomer} disabled={addingCust}>
                                    {addingCust ? "Đang lưu..." : "Thêm KH"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Searchable Product Dropdown (no add-new) ──────────────
const ProductSearchSelect = ({ products, value, onChange }) => {
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

    const handleInputChange = (e) => {
        setSearch(e.target.value);
        setIsOpen(true);
        if (!e.target.value.trim()) onChange("");
    };

    const handleSelect = (p) => {
        onChange(String(p.id));
        setSearch(`${p.name} (${p.sku})`);
        setIsOpen(false);
    };

    return (
        <div className="cq-prod-wrap" ref={wrapRef}>
            <input
                className="cq-prod-input"
                placeholder="Nhập tên hoặc mã SP..."
                value={search}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />
            {value && (
                <button className="cq-prod-clear" onClick={() => { onChange(""); setSearch(""); setIsOpen(false); }} type="button">✕</button>
            )}
            {isOpen && (
                <div className="cq-prod-dropdown">
                    {filtered.length > 0 ? filtered.map(p => (
                        <div key={p.id}
                            className={`cq-prod-item${String(p.id) === String(value) ? " cq-prod-item--active" : ""}`}
                            onClick={() => handleSelect(p)}
                        >
                            <span className="cq-prod-item-name">{p.name}</span>
                            <span className="cq-prod-item-sku">{p.sku}</span>
                        </div>
                    )) : (
                        <div className="cq-prod-empty">Không tìm thấy sản phẩm</div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Single Date Picker (custom calendar, no past dates) ───
const SingleDatePicker = ({ value, onChange, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) return new Date(value);
        return new Date();
    });
    const wrapRef = useRef(null);

    const today = new Date().toISOString().split("T")[0];
    const minD = minDate || today;

    // Click outside → đóng
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const formatDisplay = (dStr) => {
        if (!dStr) return "";
        const d = new Date(dStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    const handleDayClick = (dayStr) => {
        if (dayStr < minD) return; // chặn ngày quá khứ
        onChange(dayStr);
        setIsOpen(false);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i).toISOString().split("T")[0]);
        }

        return (
            <div className="cq-cal">
                <div className="cq-cal-header">
                    <button type="button" onClick={() => setViewDate(new Date(year, month - 1))}>&lt;</button>
                    <span>Tháng {month + 1}, {year}</span>
                    <button type="button" onClick={() => setViewDate(new Date(year, month + 1))}>&gt;</button>
                </div>
                <div className="cq-cal-grid">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <div key={d} className="cq-cal-day-head">{d}</div>)}
                    {days.map((d, index) => {
                        if (!d) return <div key={`empty-${index}`} />;
                        const isPast = d < minD;
                        const isSelected = d === value;
                        const isToday = d === today;
                        return (
                            <div
                                key={d}
                                className={`cq-cal-day${isSelected ? " cq-cal-day--selected" : ""}${isPast ? " cq-cal-day--disabled" : ""}${isToday ? " cq-cal-day--today" : ""}`}
                                onClick={() => handleDayClick(d)}
                            >
                                {new Date(d).getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="cq-datepicker-wrap" ref={wrapRef}>
            <div
                className={`sq-form-input cq-datepicker-trigger${isOpen ? " cq-datepicker-trigger--open" : ""}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="cq-datepicker-text">{value ? formatDisplay(value) : "Chọn ngày..."}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>
            {value && (
                <button className="cq-datepicker-clear" type="button" onClick={(e) => { e.stopPropagation(); onChange(""); }} title="Xóa ngày">✕</button>
            )}
            {isOpen && (
                <div className="cq-datepicker-popup">
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
};

// ── Main Modal ─────────────────────────────────────────────
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

    const handleCustomerCreated = (newCustomer) => {
        setCustomers(prev => [...prev, newCustomer]);
    };

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
    const subTotal   = rows.reduce((s, r) => s + (r.qty * r.unitPrice), 0);
    const totalDiscount = rows.reduce((s, r) => s + ((r.qty * r.unitPrice) * (r.discount / 100)), 0);
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
                                            <CustomerSearchSelect
                                                customers={customers}
                                                value={custId}
                                                onChange={setCustId}
                                                onCustomerCreated={handleCustomerCreated}
                                            />
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Hiệu lực đến</label>
                                            <SingleDatePicker value={validUntil} onChange={setValidUntil} />
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="sq-form-card">
                                    <div className="sq-form-section-header">
                                        <span className="sq-form-section-title">DANH SÁCH SẢN PHẨM</span>
                                        <button className="sq-add-row-btn" onClick={addRow}>+ Thêm dòng</button>
                                    </div>
                                    <div className={`sq-items-scroll-wrap${rows.length > 5 ? " sq-items-scroll-wrap--scroll" : ""}`}>
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
                                                            <ProductSearchSelect
                                                                products={products}
                                                                value={row.productId}
                                                                onChange={(pid) => pickProduct(i, pid)}
                                                            />
                                                        </td>
                                                        <td><input className="sq-table-input" type="number" min="1" value={row.qty} onChange={e => setRow(i,"qty",Number(e.target.value))} /></td>
                                                        <td><span className="sq-table-readonly">{fmt(row.unitPrice)}</span></td>
                                                        <td><input className="sq-table-input" type="number" min="0" max="100" value={row.discount} onChange={e => setRow(i,"discount",Number(e.target.value))} /></td>
                                                        <td style={{textAlign: "right"}}><span className="sq-table-readonly sq-table-readonly--total">{fmt(rowTotal(row))}</span></td>
                                                        <td><button className="sq-remove-btn" onClick={() => removeRow(i)} disabled={rows.length===1}>✕</button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {error && <div className="sq-modal-error">⚠️ {error}</div>}
                            </div>

                            <div className="sq-form-sidebar">
                                <div className="sq-form-summary">
                                    <div className="sq-form-summary-title">TỔNG KẾT ĐƠN HÀNG</div>
                                    <div className="sq-form-summary-row">
                                        <span>Tạm tính</span>
                                        <span>{fmt(subTotal)}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="sq-form-summary-row sq-form-summary-row--discount">
                                            <span>Chiết khấu</span>
                                            <span>- {fmt(totalDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="sq-form-summary-divider" />
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
                .sq-form-table td { padding: 10px 4px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
                .sq-table-select, .sq-table-input { width: 100%; border: none; background: transparent; font-family: inherit; font-size: 13.5px; padding: 4px; outline: none; }
                .sq-table-input { font-weight: 500; color: #111827; border-bottom: 1px solid transparent; width: 80px; }
                .sq-table-input:focus { border-color: #111827; }
                .sq-table-readonly { font-size: 13.5px; font-weight: 500; color: #6b7280; white-space: nowrap; }
                .sq-table-readonly--total { font-weight: 700; color: #111827; }
                .sq-items-scroll-wrap { }
                .sq-items-scroll-wrap--scroll { max-height: 310px; overflow-y: auto; }
                .sq-items-scroll-wrap--scroll::-webkit-scrollbar { width: 5px; }
                .sq-items-scroll-wrap--scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
                .sq-items-scroll-wrap--scroll::-webkit-scrollbar-track { background: transparent; }

                /* ── Product Search Select ── */
                .cq-prod-wrap { position: relative; }
                .cq-prod-input {
                    width: 100%; border: none; background: transparent; font-family: inherit;
                    font-size: 13.5px; padding: 4px 22px 4px 4px; outline: none; font-weight: 500; color: #111827;
                }
                .cq-prod-input::placeholder { color: #9ca3af; font-weight: 400; }
                .cq-prod-clear {
                    position: absolute; right: 2px; top: 50%; transform: translateY(-50%);
                    background: #e5e7eb; border: none; border-radius: 50%; width: 16px; height: 16px;
                    font-size: 9px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .cq-prod-clear:hover { background: #d1d5db; color: #111827; }
                .cq-prod-dropdown {
                    position: absolute; top: calc(100% + 2px); left: -10px; right: -10px;
                    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px;
                    box-shadow: 0 10px 28px rgba(0,0,0,.12); z-index: 55;
                    max-height: 180px; overflow-y: auto;
                    animation: cqFadeIn .12s ease;
                }
                .cq-prod-item {
                    padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid #f3f4f6; transition: background .1s;
                }
                .cq-prod-item:last-child { border-bottom: none; }
                .cq-prod-item:hover { background: #f9fafb; }
                .cq-prod-item--active { background: #f3f0ff; }
                .cq-prod-item-name { font-size: 13px; font-weight: 600; color: #111827; }
                .cq-prod-item-sku { font-size: 11px; color: #9ca3af; font-weight: 500; }
                .cq-prod-empty { padding: 14px; text-align: center; color: #9ca3af; font-size: 12.5px; }
                
                .sq-remove-btn { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 16px; }
                .sq-remove-btn:hover { color: #ef4444; }
                
                .sq-form-summary { background: #111827; border-radius: 14px; padding: 24px; color: #fff; margin-bottom: 20px; }
                .sq-form-summary-title { font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 16px; }
                .sq-form-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #d1d5db; padding: 4px 0; }
                .sq-form-summary-row--discount { color: #fbbf24; }
                .sq-form-summary-divider { border-top: 1px solid rgba(255,255,255,.15); margin: 10px 0; }
                .sq-form-summary-row--total { font-weight: 700; font-size: 18px; color: #fff; padding-top: 4px; }
                
                .sq-form-textarea { 
                    width: 100%; padding: 12px; border-radius: 10px; border: 1.5px solid #e5e7eb; 
                    font-family: inherit; font-size: 13.5px; outline: none; resize: none; margin-top: 8px;
                }
                .sq-modal-error { margin-top: 12px; padding: 10px 14px; border-radius: 10px; background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 500; }

                /* ── Single Date Picker ── */
                .cq-datepicker-wrap { position: relative; }
                .cq-datepicker-trigger {
                    display: flex; align-items: center; justify-content: space-between;
                    cursor: pointer; user-select: none; color: #111827;
                }
                .cq-datepicker-trigger--open { border-color: #111827; }
                .cq-datepicker-text { font-size: 14px; }
                .cq-datepicker-clear {
                    position: absolute; right: 32px; top: 50%; transform: translateY(-50%);
                    background: #e5e7eb; border: none; border-radius: 50%; width: 18px; height: 18px;
                    font-size: 10px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
                }
                .cq-datepicker-clear:hover { background: #d1d5db; color: #111827; }
                .cq-datepicker-popup {
                    position: absolute; top: calc(100% + 4px); left: 0; z-index: 60;
                    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px;
                    box-shadow: 0 12px 32px rgba(0,0,0,.12); padding: 12px;
                    animation: cqFadeIn .15s ease; min-width: 280px;
                }
                .cq-cal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 10px; padding: 0 4px;
                }
                .cq-cal-header span { font-size: 13px; font-weight: 700; color: #111827; }
                .cq-cal-header button {
                    background: none; border: 1px solid #e5e7eb; border-radius: 6px;
                    width: 28px; height: 28px; font-size: 13px; cursor: pointer; color: #6b7280;
                    display: flex; align-items: center; justify-content: center;
                }
                .cq-cal-header button:hover { background: #f3f4f6; color: #111827; }
                .cq-cal-grid {
                    display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
                }
                .cq-cal-day-head {
                    text-align: center; font-size: 11px; font-weight: 600; color: #9ca3af;
                    padding: 4px 0;
                }
                .cq-cal-day {
                    text-align: center; font-size: 13px; padding: 7px 0;
                    border-radius: 8px; cursor: pointer; transition: all .12s;
                    color: #111827; font-weight: 500;
                }
                .cq-cal-day:hover:not(.cq-cal-day--disabled) { background: #f3f4f6; }
                .cq-cal-day--selected { background: #7c3aed !important; color: #fff !important; font-weight: 700; }
                .cq-cal-day--today { border: 1.5px solid #7c3aed; }
                .cq-cal-day--disabled {
                    color: #d1d5db; cursor: not-allowed; opacity: .5;
                }

                /* ── Customer Search Select ── */
                .cq-cust-wrap { position: relative; }
                .cq-cust-input-wrap { position: relative; display: flex; align-items: center; }
                .cq-cust-search-icon { position: absolute; left: 12px; pointer-events: none; z-index: 1; }
                .cq-cust-input { padding-left: 34px !important; padding-right: 32px !important; width: 100%; }
                .cq-cust-clear {
                    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
                    background: #e5e7eb; border: none; border-radius: 50%; width: 20px; height: 20px;
                    font-size: 11px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    transition: all .15s;
                }
                .cq-cust-clear:hover { background: #d1d5db; color: #111827; }
                
                .cq-cust-dropdown {
                    position: absolute; top: calc(100% + 4px); left: 0; right: 0;
                    background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px;
                    box-shadow: 0 12px 32px rgba(0,0,0,.12); z-index: 50;
                    overflow: hidden;
                    animation: cqFadeIn .15s ease;
                }
                @keyframes cqFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
                
                .cq-cust-list { max-height: 200px; overflow-y: auto; }
                .cq-cust-item {
                    padding: 10px 14px; cursor: pointer; transition: background .12s;
                    border-bottom: 1px solid #f3f4f6;
                }
                .cq-cust-item:hover { background: #f9fafb; }
                .cq-cust-item--active { background: #f3f0ff; }
                .cq-cust-item-name { font-size: 13.5px; font-weight: 600; color: #111827; }
                .cq-cust-item-info { font-size: 11.5px; color: #9ca3af; display: flex; gap: 10px; margin-top: 2px; }
                
                .cq-cust-empty { padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; }
                
                .cq-cust-add-row {
                    padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 8px;
                    border-top: 1.5px solid #e5e7eb; background: #f0fdf4; color: #15803d;
                    font-size: 13px; font-weight: 600; transition: background .12s;
                }
                .cq-cust-add-row:hover { background: #dcfce7; }
                .cq-cust-add-icon {
                    width: 22px; height: 22px; border-radius: 50%; background: #22c55e; color: #fff;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 15px; font-weight: 700; flex-shrink: 0;
                }
                
                .cq-cust-add-form {
                    padding: 14px; border-top: 1.5px solid #e5e7eb; background: #fafafa;
                }
                .cq-cust-add-title { font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .03em; }
                .cq-cust-add-field { margin-bottom: 8px; }
                .cq-cust-add-field label { display: block; font-size: 12px; font-weight: 600; color: #4b5563; margin-bottom: 3px; }
                .cq-cust-add-field input {
                    width: 100%; padding: 8px 10px; border: 1.5px solid #e5e7eb; border-radius: 8px;
                    font-family: inherit; font-size: 13px; outline: none; background: #fff;
                }
                .cq-cust-add-field input:focus { border-color: #7c3aed; }
                .cq-cust-add-error { font-size: 12px; color: #dc2626; margin-bottom: 8px; }
                .cq-cust-add-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; }
                .cq-cust-add-cancel {
                    padding: 6px 14px; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff;
                    font-size: 12px; font-weight: 600; color: #6b7280; cursor: pointer;
                }
                .cq-cust-add-cancel:hover { background: #f3f4f6; }
                .cq-cust-add-save {
                    padding: 6px 14px; border-radius: 8px; border: none; background: #7c3aed;
                    font-size: 12px; font-weight: 700; color: #fff; cursor: pointer;
                }
                .cq-cust-add-save:hover { background: #6d28d9; }
                .cq-cust-add-save:disabled { opacity: .6; cursor: not-allowed; }
            `}</style>
        </div>
    );
};
