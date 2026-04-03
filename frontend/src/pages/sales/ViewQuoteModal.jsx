import { useState, useEffect, useRef } from "react";
import quotationService from "../../services/quotationService.js";
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
    const { user } = useAuth();
    const [quote, setQuote] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);
    const [mode, setMode] = useState("view"); // "view" | "edit"

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
        validUntil, setValidUntil,
        note, setNote,
        status, setStatus,
        rows,
        addRow, removeRow, updateRow,
        totals,
        validate
    } = useQuotationForm(quote);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSaveEdit = async () => {
        const valErr = validate();
        if (valErr) { setError(valErr); return; }
        
        setSaving(true); setError(null);
        try {
            const payload = {
                customerId: Number(custId),
                staffId: user?.id || quote?.staff?.id,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: rows.filter(r => r.productId).map(r => ({
                    productId: Number(r.productId),
                    quantity: r.qty,
                    unitPrice: Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            };
            await quotationService.update(quoteId, payload);
            if (status !== quote.status) {
                await quotationService.updateStatus(quoteId, status);
            }
            await loadQuote();
            setMode("view");
            if (onSaved) onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Lỗi khi lưu");
        } finally { setSaving(false); }
    };

    const handleUpdateStatus = async (newStatus, msg = "cập nhật trạng thái") => {

        setSaving(true); setError(null);
        try {
            await quotationService.updateStatus(quoteId, newStatus);
            await loadQuote();
            if (onSaved) onSaved();
            return true;
        } catch (e) {
            setError(e.response?.data?.message || `Lỗi khi ${msg}`);
            return false;
        } finally { setSaving(false); }
    };

    const handlePrintAndSend = async () => {
        if (quote?.status === "DRAFT") {
            const ok = await handleUpdateStatus("SENT", "chuyển sang trạng thái Đã gửi");
            if (!ok) return;
        }
        printQuotation(quote);
    };

    const isLocked = quote?.status === "ACCEPTED" || quote?.status === "REJECTED" || quote?.status === "EXPIRED";

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
                                <span className={`sq-badge sq-badge--${quote?.status?.toLowerCase()}`}>
                                    {quote?.status === "DRAFT" ? "Bản nháp" :
                                     quote?.status === "SENT" ? "Đã gửi" :
                                     quote?.status === "ACCEPTED" ? "Đã chốt" :
                                     quote?.status === "REJECTED" ? "Đã hủy" : "Hết hạn"}
                                </span>
                            </span>
                        </div>
                        <button className="sq-modal-close" onClick={onClose}>✕</button>
                    </div>

                    <div className="sq-modal-body">
                        {loadingInit ? (
                            <div className="sp-state"><div className="sp-spinner" /><span>Đang tải thông tin...</span></div>
                        ) : (
                            <div className="sq-form-grid">
                                <div className="sq-form-main">
                                    <div className="sq-form-card">
                                        <div className="sq-form-row">
                                            <div className="sq-form-field" style={{ flex: 2 }}>
                                                <label className="sq-form-label">Khách hàng</label>
                                                <div className="sq-form-input sq-form-input--readonly">
                                                    <span style={{color: "#94a3b8", marginRight: 8}}>👤</span>
                                                    {quote?.customer?.name || "..."}
                                                </div>
                                            </div>
                                            <div className="sq-form-field">
                                                <label className="sq-form-label">Ngày hiệu lực</label>
                                                <SingleDatePicker value={validUntil} isReadOnly={mode === "view"} onChange={setValidUntil} />
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
                                        onUpdate={updateRow} 
                                        onAdd={addRow} 
                                        onRemove={removeRow} 
                                        isReadOnly={mode === "view"}
                                    />
                                    {error && <div className="sq-modal-error">{error}</div>}
                                </div>
                                <QuotationSummary 
                                    totals={totals} 
                                    note={note} 
                                    onNoteChange={setNote} 
                                    isReadOnly={mode === "view"}
                                    isEdit={mode === "edit"}
                                />
                            </div>
                        )}
                    </div>

                    <div className="sq-modal-footer">
                        {mode === "view" ? (
                            <>
                                <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                                <div style={{display:"flex",gap:8}}>
                                    {quote?.status === "DRAFT" && (
                                        <>
                                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setMode("edit")} style={{backgroundColor:"#f1f5f9", color:"#475569"}}>Sửa báo giá</button>
                                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={handlePrintAndSend} disabled={saving} style={{backgroundColor:"#3b82f6", color:"#fff"}}>
                                                In báo giá
                                            </button>
                                        </>
                                    )}
                                    {quote?.status === "SENT" && (
                                        <>
                                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setMode("edit")} style={{backgroundColor:"#f59e0b", color: "#fff"}}>Sửa nội dung</button>
                                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => handleUpdateStatus("ACCEPTED")} disabled={saving} style={{backgroundColor:"#10b981", color: "#fff"}}>
                                                {saving ? "Đang xử lý..." : "Chốt báo giá"}
                                            </button>
                                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => handleUpdateStatus("REJECTED")} disabled={saving} style={{backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fecaca"}}>
                                                Hủy báo giá
                                            </button>
                                        </>
                                    )}
                                </div>
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
        </>
    );
};
