import { useState, useEffect, useRef } from "react";
import quotationService, { getQuoteStatus } from "../../services/quotationService.js";
import "./CreateForms.css";
import { useAuth } from "../../context/AuthContext";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { 
    SingleDatePicker, 
    QuotationItemsTable, 
    QuotationSummary 
} from "./components/QuotationFormShared";
import { printQuotation } from "../../utils/printUtils";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";


// ── Main ViewQuoteModal ───────────────────────────────────
export const ViewQuoteModal = ({ quoteId, onClose, onSaved }) => {
    const { user, hasRole } = useAuth();
    const isDirector = hasRole("DIRECTOR");
    const [quote, setQuote] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);
    const [mode, setMode] = useState("view"); // "view" | "edit"

    const s = getQuoteStatus(quote?.status);
    
    const loadQuote = async () => {
        try {
            setLoadingInit(true);
            const res = await quotationService.getById(quoteId);
            setQuote(res);
        } catch (e) {
            console.error("Lỗi tải chi tiết báo giá:", e);
        } finally {
            setLoadingInit(false);
        }
    };

    useEffect(() => { loadQuote(); }, [quoteId]);

    // Use shared hook for edit mode logic
    const {
        products, loadingData,
        custId,
        note, setNote,
        status, setStatus,
        discountPercent, setDiscountPercent,
        rows,
        addRow, removeRow, updateRow,
        totals,
        validate,
        getAvailableProducts
    } = useQuotationForm(quote);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [successMsg, setSuccessMsg] = useState(null);

    const handleSaveEdit = async () => {
        const valErr = validate();
        if (valErr) { setError(valErr); return; }
        
        setSaving(true); setError(null);
        try {
            const payload = {
                customerId: Number(custId),
                staffId: user?.id || quote?.staff?.id,
                discountPercent: Number(discountPercent),
                note,
                items: rows.filter(r => r.productId).map(r => ({
                    productId: Number(r.productId),
                    quantity: r.qty,
                    unitPrice: Number(r.unitPrice)
                })),
            };
            await quotationService.update(quoteId, payload);
            await loadQuote();
            setMode("view");
            if (onSaved) onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi lưu");
        } finally { setSaving(false); }
    };

    const handleUpdateStatus = async (newStatus, reason = null) => {
        setSaving(true); setError(null);
        try {
            await quotationService.updateStatus(quoteId, newStatus, reason);
            if (onSaved) onSaved();
            if (newStatus === "APPROVED") {
                setSuccessMsg("Đã phê duyệt báo giá thành công!");
            } else if (newStatus === "REJECTED") {
                setSuccessMsg("Đã từ chối báo giá.");
            } else {
                setSuccessMsg("Cập nhật trạng thái thành công!");
            }
            setTimeout(() => onClose(), 1500);
            return true;
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi cập nhật trạng thái");
            return false;
        } finally { setSaving(false); }
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) {
            setError("Lý do từ chối là bắt buộc!");
            return;
        }
        handleUpdateStatus("REJECTED", rejectReason.trim());
    };

    const handlePrintAndSend = async () => {
        printQuotation(quote);
    };

    const isLocked = quote?.status === "APPROVED" || quote?.status === "ACCEPTED" || quote?.status === "EXPIRED";
    const canEdit = quote?.status === "DRAFT" || quote?.status === "REJECTED";

    return (
        <>
            <div className="sq-modal-overlay" onClick={onClose}>
                <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                    <div className="sq-modal-header">
                        <div className="sq-modal-title-group">
                            <h2 className="sq-modal-title">
                                {mode === "edit" ? "Chỉnh sửa Báo giá" : "Chi tiết Báo giá"}
                            </h2>
                            <span className="sq-modal-sub" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {quote?.quotationNumber || "..."} · {quote?.customer?.name}
                                <span className={`sq-badge`} style={{ backgroundColor: s.color, color: "#fff" }}>
                                    {s.text}
                                </span>
                            </span>
                        </div>
                        <button className="sq-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="sq-modal-body">
                        {successMsg && (
                            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '16px 20px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', fontSize: '15px', fontWeight: '700', color: '#15803d' }}>
                                {successMsg}
                            </div>
                        )}
                        {loadingInit ? (
                            <div className="sp-state" style={{padding: 40}}><div className="sp-spinner" /></div>
                        ) : !successMsg && (
                            <div className="sq-form-grid">
                                <div className="sq-form-main">
                                    {quote?.status === "REJECTED" && quote?.rejectionReason && (
                                        <div className="sq-rejection-banner" style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                            <span style={{ fontSize: "18px" }}>⚠️</span>
                                            <div>
                                                <div style={{ fontWeight: "700", color: "#991b1b", fontSize: "13px" }}>Lý do từ chối phê duyệt:</div>
                                                <div style={{ color: "#b91c1c", fontSize: "13.5px", marginTop: "2px" }}>{quote.rejectionReason}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="sq-form-card">
                                        <div className="sq-form-row">
                                            <div className="sq-form-field">
                                                <label className="sq-form-label">Khách hàng</label>
                                                <div className="sq-form-input sq-form-input--readonly">
                                                    <span style={{color: "#94a3b8", marginRight: 8}}>👤</span>
                                                    {quote?.customer?.name || "..."}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="sq-form-row">
                                            <div className="sq-form-field">
                                                <label className="sq-form-label">Số điện thoại</label>
                                                <input 
                                                    className="sq-form-input sq-form-input--readonly" 
                                                    value={quote?.customer?.phoneNumber || ""} 
                                                    readOnly 
                                                    placeholder="SĐT khách hàng"
                                                />
                                            </div>
                                            <div className="sq-form-field">
                                                <label className="sq-form-label">Email</label>
                                                <input 
                                                    className="sq-form-input sq-form-input--readonly" 
                                                    value={quote?.customer?.email || ""} 
                                                    readOnly 
                                                    placeholder="Email khách hàng"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <QuotationItemsTable 
                                        rows={rows} 
                                        products={products} 
                                        getAvailableProducts={getAvailableProducts}
                                        onUpdate={updateRow} 
                                        onAdd={addRow} 
                                        onRemove={removeRow} 
                                        isReadOnly={mode === "view"}
                                        errors={error && typeof error === 'object' ? error : {}}
                                    />
                                    {error && typeof error === 'string' && <div className="sq-modal-error">{error}</div>}

                                    {rejectMode && (
                                        <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '12px', padding: '16px 20px', marginTop: '16px' }}>
                                            <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>Nhập lý do từ chối báo giá:</label>
                                            <textarea
                                                value={rejectReason}
                                                onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Vd: Giá chưa phù hợp, cần điều chỉnh lại sản phẩm..."
                                                rows={3}
                                                style={{ width: '100%', border: '1.5px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                                <QuotationSummary 
                                    totals={totals} 
                                    discountPercent={discountPercent}
                                    onDiscountChange={setDiscountPercent}
                                    note={note} 
                                    onNoteChange={setNote} 
                                    status={status}
                                    onStatusChange={setStatus}
                                    isReadOnly={mode === "view"}
                                    isEdit={mode === "edit"}
                                />
                            </div>
                        )}
                    </div>

                    <div className="sq-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                            {mode === "view" ? (
                                <>
                                    {canEdit && !rejectMode && (
                                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setMode("edit")} style={{backgroundColor:"#f1f5f9", color:"#475569"}}>Chỉnh sửa</button>
                                    )}
                                    {quote?.status === "WAITING_APPROVAL" && isDirector && !rejectMode && (
                                        <>
                                            <button className="sq-modal-btn sq-modal-btn--submit" disabled={saving} onClick={() => handleUpdateStatus("APPROVED")} style={{backgroundColor:"#10b981", color: "#fff"}}>
                                                {saving ? "Đang xử lý..." : "Phê duyệt"}
                                            </button>
                                            <button className="sq-modal-btn sq-modal-btn--cancel" disabled={saving} onClick={() => setRejectMode(true)} style={{backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fecaca"}}>
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                    {rejectMode && (
                                        <>
                                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => { setRejectMode(false); setRejectReason(""); setError(null); }}>Hủy</button>
                                            <button className="sq-modal-btn sq-modal-btn--submit" disabled={saving || !rejectReason.trim()} onClick={handleRejectSubmit} style={{backgroundColor: "#ef4444", color: "#fff"}}>
                                                {saving ? "Đang xử lý..." : "Xác nhận từ chối"}
                                            </button>
                                        </>
                                    )}
                                    {quote?.status === "APPROVED" && (
                                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => handleUpdateStatus("ACCEPTED")} style={{backgroundColor:"#3b82f6", color: "#fff"}}>Chốt đơn hàng</button>
                                    )}
                                    {(quote?.status === "APPROVED" || quote?.status === "ACCEPTED") && (
                                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handlePrintAndSend} style={{backgroundColor:"#1e293b", color:"#fff"}}>
                                            In báo giá
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => setMode("view")} disabled={saving}>Hủy</button>
                                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSaveEdit} disabled={saving}>
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
