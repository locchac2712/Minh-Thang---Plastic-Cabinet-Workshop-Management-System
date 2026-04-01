import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// ── Print Preview Popup ───────────────────────────────────
const PrintPreview = ({ quote, onClose, onPrinted }) => {
    const printRef = useRef(null);

    const handlePrint = () => {
        const content = printRef.current;
        const win = window.open("", "_blank", "width=800,height=600");
        win.document.write(`
            <html><head><title>Báo giá ${quote.quotationNumber}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #111; padding-bottom: 20px; }
                .header h1 { font-size: 22px; margin-bottom: 4px; }
                .header .code { font-size: 14px; color: #666; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                .info-block label { font-size: 11px; color: #888; display: block; margin-bottom: 2px; }
                .info-block div { font-size: 14px; font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 12px; border: 1px solid #ddd; }
                td { padding: 8px 12px; font-size: 13px; border: 1px solid #ddd; }
                .total-row { text-align: right; font-size: 16px; font-weight: 700; margin-top: 8px; }
                .note { margin-top: 20px; padding: 12px; background: #fffbe6; border: 1px solid #ffe58f; font-size: 13px; }
                @media print { body { padding: 20px; } }
            </style></head><body>${content.innerHTML}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
        if (onPrinted) onPrinted();
    };

    const details = quote.details || [];
    const subTotal = details.reduce((s, d) => s + (d.quantity * Number(d.unitPrice)), 0);
    const totalDiscount = details.reduce((s, d) => s + Number(d.discount || 0), 0);

    return (
        <div className="sq-modal-overlay" style={{ zIndex: 9999 }} onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Xem trước khi in</h2>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <div ref={printRef}>
                        <div className="header">
                            <h1>BÁO GIÁ</h1>
                            <div className="code">{quote.quotationNumber}</div>
                        </div>
                        <div className="info-grid">
                            <div className="info-block"><label>Khách hàng</label><div>{quote.customer?.name}</div></div>
                            <div className="info-block"><label>Ngày tạo</label><div>{fmtDate(quote.createdDate)}</div></div>
                            <div className="info-block"><label>Nhân viên</label><div>{quote.staff?.fullname}</div></div>
                            <div className="info-block"><label>Hiệu lực đến</label><div>{fmtDate(quote.validUntil)}</div></div>
                        </div>
                        <table>
                            <thead><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Chiết khấu</th><th style={{textAlign:"right"}}>Thành tiền</th></tr></thead>
                            <tbody>
                                {details.map((d, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{d.productName}</td>
                                        <td>{d.quantity}</td>
                                        <td>{fmt(d.unitPrice)}</td>
                                        <td>{d.discountPercent || 0}%</td>
                                        <td style={{textAlign:"right"}}>{fmt(d.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalDiscount > 0 && (
                            <div style={{textAlign:"right", fontSize:"14px", color:"#666", marginBottom: 4}}>
                                Tạm tính: {fmt(subTotal)} | Chiết khấu: -{fmt(totalDiscount)}
                            </div>
                        )}
                        <div className="total-row">Tổng cộng: {fmt(quote.totalAmount)}</div>
                        {quote.note && <div className="note"><strong>Ghi chú:</strong> {quote.note}</div>}
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handlePrint}>
                        In báo giá
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Searchable Product Select for Edit mode ───────────────
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

    return (
        <div className="vq-prod-wrap" ref={wrapRef}>
            <input className="vq-prod-input" placeholder="Nhập tên SP..."
                value={search} onChange={e => { setSearch(e.target.value); setIsOpen(true); if (!e.target.value.trim()) onChange(""); }}
                onFocus={() => setIsOpen(true)} autoComplete="off" />
            {value && <button className="vq-prod-clear" type="button" onClick={() => { onChange(""); setSearch(""); }}>✕</button>}
            {isOpen && (
                <div className="vq-prod-dropdown">
                    {filtered.length > 0 ? filtered.map(p => (
                        <div key={p.id} className={`vq-prod-item${String(p.id) === String(value) ? " vq-prod-item--active" : ""}`}
                            onClick={() => { onChange(String(p.id)); setSearch(`${p.name} (${p.sku})`); setIsOpen(false); }}>
                            <span style={{fontWeight:600,fontSize:13}}>{p.name}</span>
                            <span style={{fontSize:11,color:"#9ca3af"}}>{p.sku}</span>
                        </div>
                    )) : <div style={{padding:14,textAlign:"center",color:"#9ca3af",fontSize:12}}>Không tìm thấy</div>}
                </div>
            )}
        </div>
    );
};

// ── Single Date Picker for Edit mode ──────────────────────
const EditDatePicker = ({ value, onChange }) => {
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
            <div style={{padding:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <button type="button" onClick={() => setViewDate(new Date(year, month - 1))} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:6,width:28,height:28,cursor:"pointer"}}>&lt;</button>
                    <span style={{fontSize:13,fontWeight:700}}>Tháng {month+1}, {year}</span>
                    <button type="button" onClick={() => setViewDate(new Date(year, month + 1))} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:6,width:28,height:28,cursor:"pointer"}}>&gt;</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
                    {["CN","T2","T3","T4","T5","T6","T7"].map(d => <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:600,color:"#9ca3af",padding:"4px 0"}}>{d}</div>)}
                    {days.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const isPast = d < today, isSel = d === value, isT = d === today;
                        return (
                            <div key={d} onClick={() => !isPast && (onChange(d), setIsOpen(false))}
                                style={{textAlign:"center",fontSize:13,padding:"7px 0",borderRadius:8,cursor:isPast?"not-allowed":"pointer",
                                    background:isSel?"#7c3aed":"transparent",color:isSel?"#fff":isPast?"#d1d5db":"#111827",
                                    fontWeight:isSel?700:500,opacity:isPast?.5:1,border:isT&&!isSel?"1.5px solid #7c3aed":"1.5px solid transparent"}}>
                                {new Date(d).getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div ref={wrapRef} style={{position:"relative"}}>
            <div onClick={() => setIsOpen(!isOpen)} style={{padding:"8px 12px",border:"1.5px solid #e5e7eb",borderRadius:10,background:"#fff",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14}}>
                <span>{value ? formatDisplay(value) : "Chọn ngày..."}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            {isOpen && (
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:60,background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,boxShadow:"0 12px 32px rgba(0,0,0,.12)",minWidth:280}}>
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
};

// ── Main ViewQuoteModal ───────────────────────────────────
export const ViewQuoteModal = ({ quoteId, onClose, onSaved }) => {
    const { user } = useAuth();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState("view"); // "view" | "edit"
    const [showPrint, setShowPrint] = useState(false);

    // Edit state
    const [validUntil, setValidUntil] = useState("");
    const [note, setNote] = useState("");
    const [rows, setRows] = useState([]);
    const [products, setProducts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const loadQuote = async () => {
        try {
            setLoading(true);
            const res = await quotationService.getById(quoteId);
            setQuote(res);
            // Prep edit fields
            setValidUntil(res.validUntil ? res.validUntil.split("T")[0] : "");
            setNote(res.note || "");
            setRows((res.details || []).map(d => ({
                productId: String(d.productId),
                qty: d.quantity,
                unitPrice: Number(d.unitPrice),
                discount: d.discountPercent || 0,
            })));
        } catch (e) {
            console.error("Lỗi tải chi tiết:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuote();
        // Load products for edit mode
        api.get("/products").then(res => {
            const body = res.data;
            setProducts(Array.isArray(body) ? body : (body?.data || []));
        }).catch(() => {});
    }, [quoteId]);

    // Edit helpers
    const setRow = (i, f, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
    const addRow = () => setRows(p => [...p, { productId: "", qty: 1, unitPrice: 0, discount: 0 }]);
    const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));
    const pickProduct = (i, pid) => {
        const pr = products.find(p => String(p.id) === String(pid));
        setRows(p => p.map((r, idx) => idx === i ? { ...r, productId: pid, unitPrice: pr?.sellingPrice ?? pr?.price ?? 0 } : r));
    };
    const rowTotal = (r) => (r.qty * r.unitPrice) * (1 - (r.discount / 100));
    const subTotal = rows.reduce((s, r) => s + (r.qty * r.unitPrice), 0);
    const totalDiscount = rows.reduce((s, r) => s + ((r.qty * r.unitPrice) * (r.discount / 100)), 0);
    const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0);

    const handleSaveEdit = async () => {
        const validRows = rows.filter(r => r.productId && r.qty > 0);
        if (!validRows.length) { setError("Vui lòng chọn ít nhất 1 sản phẩm"); return; }
        setSaving(true);
        setError(null);
        try {
            await quotationService.update(quoteId, {
                customerId: quote.customer?.id,
                staffId: user?.id || quote.staff?.id,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: validRows.map(r => ({
                    productId: Number(r.productId),
                    quantity: r.qty,
                    unitPrice: Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            });
            await loadQuote();
            setMode("view");
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi lưu");
        } finally { setSaving(false); }
    };

    const handleChangeToSent = async () => {
        setSaving(true);
        try {
            await quotationService.updateStatus(quoteId, "SENT");
            if (onSaved) onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi đổi trạng thái");
            setSaving(false);
        }
    };

    const isDraft = quote?.status === "DRAFT";

    return (
        <>
            <div className="sq-modal-overlay" onClick={onClose}>
                <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                    <div className="sq-modal-header">
                        <div className="sq-modal-title-group">
                            <h2 className="sq-modal-title">{mode === "edit" ? "Chỉnh sửa Báo giá" : "Chi tiết Báo giá"}</h2>
                            <span className="sq-modal-sub">{quote?.quotationNumber || "Đang tải..."} · {quote?.customer?.name}</span>
                        </div>
                        <button className="sq-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="sq-modal-body">
                        {loading ? (
                            <div className="sp-state"><div className="sp-spinner" /><span>Đang tải thông tin...</span></div>
                        ) : !quote ? (
                            <div className="sp-state sp-state--error">⚠️ Không tìm thấy dữ liệu</div>
                        ) : mode === "view" ? (
                            /* ───── VIEW MODE ───── */
                            <div className="sq-view-grid">
                                <div className="sq-view-main">
                                    <div className="sq-view-card">
                                        <div className="sq-view-section-title">THÔNG TIN CHUNG</div>
                                        <div className="sq-view-row-grid">
                                            <div className="sq-view-item"><label>Ngày tạo</label><div>{fmtDate(quote.createdDate)}</div></div>
                                            <div className="sq-view-item"><label>Trạng thái</label>
                                                <span className={`sq-badge sq-badge--${(quote.status||"").toLowerCase()}`}>
                                                    {quote.status === "DRAFT" ? "Bản nháp" : quote.status === "SENT" ? "Đã gửi" : quote.status === "ACCEPTED" ? "Đã chốt" : quote.status === "REJECTED" ? "Đã hủy" : "Hết hạn"}
                                                </span>
                                            </div>
                                            <div className="sq-view-item"><label>Hiệu lực đến</label><div>{fmtDate(quote.validUntil)}</div></div>
                                        </div>
                                    </div>

                                    <div className="sq-view-card">
                                        <div className="sq-view-section-title">KHÁCH HÀNG & NHÂN VIÊN</div>
                                        <div className="sq-view-row-grid">
                                            <div className="sq-view-item"><label>Khách hàng</label><div style={{fontWeight:600}}>{quote.customer?.name}</div></div>
                                            <div className="sq-view-item"><label>Điện thoại</label><div>{quote.customer?.phone || "—"}</div></div>
                                            <div className="sq-view-item"><label>Nhân viên</label><div style={{fontWeight:600}}>{quote.staff?.fullname}</div></div>
                                        </div>
                                    </div>

                                    <div className="sq-view-card">
                                        <div className="sq-view-section-title">DANH SÁCH SẢN PHẨM</div>
                                        <table className="sq-view-table">
                                            <thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Chiết khấu</th><th style={{textAlign:"right"}}>Thành tiền</th></tr></thead>
                                            <tbody>
                                                {(quote.details || []).map((d, i) => (
                                                    <tr key={i}>
                                                        <td><div style={{fontWeight:500,color:"#111827"}}>{d.productName}</div><div style={{fontSize:12,color:"#6b7280"}}>{d.sku}</div></td>
                                                        <td>{d.quantity}</td><td>{fmt(d.unitPrice)}</td>
                                                        <td>{d.discountPercent || 0}%</td>
                                                        <td style={{textAlign:"right",fontWeight:600}}>{fmt(d.totalPrice)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="sq-view-sidebar">
                                    <div className="sq-view-summary">
                                        <div className="sq-view-summary-title">TỔNG KẾT CHI PHÍ</div>
                                        <div className="sq-view-summary-row"><span>Tạm tính</span><span>{fmt(quote.totalAmount)}</span></div>
                                        <div className="sq-view-summary-sep" />
                                        <div className="sq-view-summary-row sq-view-summary-row--total"><span>Tổng cộng</span><span>{fmt(quote.totalAmount)}</span></div>
                                    </div>

                                    {quote.note && (
                                        <div className="sq-view-note">
                                            <label>Ghi chú báo giá</label>
                                            <p>{quote.note}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* ───── EDIT MODE ───── */
                            <div className="sq-form-grid">
                                <div className="sq-form-main">
                                    <div className="sq-form-card">
                                        <div className="sq-form-row">
                                            <div className="sq-form-field">
                                                <label className="sq-form-label">Hiệu lực đến</label>
                                                <EditDatePicker value={validUntil} onChange={setValidUntil} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sq-form-card">
                                        <div className="sq-form-section-header">
                                            <span className="sq-form-section-title">DANH SÁCH SẢN PHẨM</span>
                                            <button className="sq-add-row-btn" onClick={addRow}>+ Thêm dòng</button>
                                        </div>
                                        <div className={`sq-items-scroll-wrap${rows.length > 5 ? " sq-items-scroll-wrap--scroll" : ""}`}>
                                            <table className="sq-form-table">
                                                <thead>
                                                    <tr>
                                                        <th style={{width:"40%"}}>Sản phẩm</th>
                                                        <th>Số lượng</th>
                                                        <th>Đơn giá</th>
                                                        <th>Chiết khấu %</th>
                                                        <th style={{textAlign:"right"}}>Thành tiền</th>
                                                        <th style={{width:"40px"}}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rows.map((row, i) => (
                                                        <tr key={i}>
                                                            <td><ProductSearchSelect products={products} value={row.productId} onChange={pid => pickProduct(i, pid)} /></td>
                                                            <td><input className="sq-table-input" type="number" min="1" value={row.qty} onChange={e => setRow(i,"qty",Number(e.target.value))} /></td>
                                                            <td><span className="sq-table-readonly">{fmt(row.unitPrice)}</span></td>
                                                            <td><input className="sq-table-input" type="number" min="0" max="100" value={row.discount} onChange={e => setRow(i,"discount",Number(e.target.value))} /></td>
                                                            <td style={{textAlign:"right"}}><span className="sq-table-readonly sq-table-readonly--total">{fmt(rowTotal(row))}</span></td>
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

                    {/* ───── Footer Buttons ───── */}
                    <div className="sq-modal-footer">
                        {mode === "view" ? (
                            <>
                                <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                                <div style={{display:"flex",gap:8}}>
                                    {isDraft && (
                                        <button className="vq-btn-print" onClick={() => setShowPrint(true)}>
                                            In báo giá
                                        </button>
                                    )}
                                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setMode("edit")}>
                                        Chỉnh sửa
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => { setMode("view"); setError(null); }} disabled={saving}>Hủy</button>
                                <div style={{display:"flex",gap:8}}>
                                    {isDraft && (
                                        <button className="vq-btn-sent" onClick={handleChangeToSent} disabled={saving}>
                                            {saving ? "Đang xử lý..." : "Đổi sang Đã gửi"}
                                        </button>
                                    )}
                                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSaveEdit} disabled={saving}>
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <style>{`
                    .sq-view-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
                    .sq-view-main { display: flex; flex-direction: column; gap: 20px; }
                    .sq-view-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #f0f0f5; }
                    .sq-view-section-title { font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: .05em; margin-bottom: 12px; }
                    .sq-view-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                    .sq-view-item label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
                    .sq-view-item div { font-size: 14px; color: #111827; }
                    
                    .sq-view-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    .sq-view-table th { text-align: left; font-size: 12px; color: #6b7280; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
                    .sq-view-table td { padding: 12px; font-size: 13.5px; border-bottom: 1px solid #f3f4f6; }
                    
                    .sq-view-summary { background: #111827; border-radius: 14px; padding: 24px; color: #fff; }
                    .sq-view-summary-title { font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 16px; }
                    .sq-view-summary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; color: #d1d5db; }
                    .sq-view-summary-sep { height: 1px; background: rgba(255,255,255,0.1); margin: 16px 0; }
                    .sq-view-summary-row--total { font-weight: 700; font-size: 18px; color: #fff; }
                    
                    .sq-view-note { margin-top: 20px; padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; }
                    .sq-view-note label { font-size: 12px; font-weight: 700; color: #92400e; display: block; margin-bottom: 4px; }
                    .sq-view-note p { font-size: 13px; color: #b45309; margin: 0; line-height: 1.5; }

                    .sq-view-sidebar { display: flex; flex-direction: column; gap: 16px; }

                    /* Edit mode - form classes (đồng bộ với CreateQuoteModal) */
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

                    /* Product Search Select */
                    .vq-prod-wrap { position: relative; }
                    .vq-prod-input { width: 100%; border: none; background: transparent; font-family: inherit; font-size: 13.5px; padding: 4px 22px 4px 4px; outline: none; font-weight: 500; color: #111827; }
                    .vq-prod-input::placeholder { color: #9ca3af; font-weight: 400; }
                    .vq-prod-clear { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); background: #e5e7eb; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 9px; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                    .vq-prod-clear:hover { background: #d1d5db; color: #111827; }
                    .vq-prod-dropdown { position: absolute; top: calc(100% + 2px); left: -10px; right: -10px; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px; box-shadow: 0 10px 28px rgba(0,0,0,.12); z-index: 55; max-height: 180px; overflow-y: auto; animation: vqFadeIn .12s ease; }
                    @keyframes vqFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
                    .vq-prod-item { padding: 8px 12px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f3f4f6; transition: background .1s; }
                    .vq-prod-item:last-child { border-bottom: none; }
                    .vq-prod-item:hover { background: #f9fafb; }
                    .vq-prod-item--active { background: #f3f0ff; }

                    .vq-btn-print {
                        padding: 8px 20px; border-radius: 10px; border: 1.5px solid #e5e7eb; background: #fff;
                        font-size: 13px; font-weight: 700; color: #111827; cursor: pointer; transition: all .15s;
                    }
                    .vq-btn-print:hover { background: #f3f4f6; border-color: #d1d5db; }

                    .vq-btn-sent {
                        padding: 8px 20px; border-radius: 10px; border: none; background: #059669;
                        font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; transition: all .15s;
                    }
                    .vq-btn-sent:hover { background: #047857; }
                    .vq-btn-sent:disabled { opacity: .6; cursor: not-allowed; }
                `}</style>
            </div>

            {/* Print preview popup */}
            {showPrint && quote && (
                <PrintPreview
                    quote={quote}
                    onClose={() => setShowPrint(false)}
                    onPrinted={() => setShowPrint(false)}
                />
            )}
        </>
    );
};
