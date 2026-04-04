import { useState, useEffect } from "react";
import quotationService from "../../services/quotationService.js";
import "./CreateForms.css";
import { useAuth } from "../../context/AuthContext";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { 
    SingleDatePicker, 
    QuotationItemsTable, 
    QuotationSummary 
} from "./components/QuotationFormShared";

export const EditQuoteModal = ({ quoteId, onClose, onSaved }) => {
    const { user } = useAuth();
    const [initialData, setInitialData] = useState(null);
    const [loadingInit, setLoadingInit] = useState(true);

    // Initial load of the quotation to edit
    useEffect(() => {
        (async () => {
            try {
                const qDetail = await quotationService.getById(quoteId);
                setInitialData(qDetail);
            } catch (e) {
                console.error("Lỗi tải thông tin báo giá:", e);
            } finally {
                setLoadingInit(false);
            }
        })();
    }, [quoteId]);

    // Hook logic
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
        getAvailableProducts,
        customer
    } = useQuotationForm(initialData);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSave = async () => {
        const valErrors = validate();
        if (valErrors) { setErrors(valErrors); return; }

        setSaving(true);
        setErrors({});
        try {
            const payload = {
                customerId: Number(custId),
                staffId: user?.id || initialData?.staff?.id,
                discountPercent: Number(discountPercent),
                note,
                items: rows.filter(r => r.productId).map(r => ({
                    productId: Number(r.productId),
                    quantity: r.qty,
                    unitPrice: Number(r.unitPrice)
                })),
            };
            
            await quotationService.update(quoteId, payload);
            if (onSaved) onSaved();
        } catch (e) {
            setErrors({ general: e.response?.data?.message || "Lỗi khi cập nhật báo giá" });
        } finally {
            setSaving(false);
        }
    };

    const isLoading = loadingInit || loadingData;

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Chỉnh sửa Báo giá</h2>
                        <span className="sq-modal-sub">
                            {initialData?.quotationNumber || "..."} · {initialData?.customer?.name || "..."}
                        </span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose} disabled={saving}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {isLoading ? (
                        <div className="sp-state" style={{padding: 40}}><div className="sp-spinner" /></div>
                    ) : (
                        <div className="sq-form-grid">
                            <div className="sq-form-main">
                                {/* Section 1: Basic Info */}
                                <div className="sq-form-card">
                                    <div className="sq-form-row">
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Khách hàng</label>
                                            <div className="sq-form-input sq-form-input--readonly">
                                                <span style={{color: "#94a3b8", marginRight: 8}}>👤</span>
                                                {initialData?.customer?.name || "..."}
                                            </div>
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Thời hạn báo giá</label>
                                            <div className="sq-form-input sq-form-input--readonly" style={{ background: "#f9fafb", color: "#6b7280", fontWeight: "600" }}>
                                                Mặc định 15 ngày kể từ ngày tạo
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sq-form-row">
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Số điện thoại</label>
                                            <input 
                                                className="sq-form-input sq-form-input--readonly" 
                                                value={initialData?.customer?.phoneNumber || ""} 
                                                readOnly 
                                                placeholder="SĐT khách hàng"
                                            />
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Email</label>
                                            <input 
                                                className="sq-form-input sq-form-input--readonly" 
                                                value={initialData?.customer?.email || ""} 
                                                readOnly 
                                                placeholder="Email khách hàng"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Items Table */}
                                <div>
                                    <QuotationItemsTable
                                        rows={rows}
                                        products={products}
                                        getAvailableProducts={getAvailableProducts}
                                        onUpdate={(idx, field, val) => { updateRow(idx, field, val); setErrors(p => ({...p, rows: null})); }}
                                        onAdd={addRow}
                                        onRemove={removeRow}
                                    />
                                    {errors.rows && <span className="sq-field-error" style={{marginTop: 12, fontSize: 13}}>{errors.rows}</span>}
                                </div>
                                
                                {errors.general && <div className="sq-modal-error">{errors.general}</div>}
                            </div>

                            {/* Sidebar: Summary & Note */}
                            <QuotationSummary
                                totals={totals}
                                discountPercent={discountPercent}
                                onDiscountChange={setDiscountPercent}
                                note={note}
                                onNoteChange={setNote}
                                isEdit={true}
                            />
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    <div className="sq-footer-left">
                        {errors.general && <span className="sq-field-error">{errors.general}</span>}
                        {errors.discount && <span className="sq-field-error">{errors.discount}</span>}
                    </div>
                    <div className="sq-footer-actions" style={{ display: "flex", gap: "10px" }}>
                        <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose} disabled={saving}>Đóng</button>
                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving || isLoading}>
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
