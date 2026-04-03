import { useState } from "react";
import "./CreateForms.css";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";
import { useQuotationForm } from "../../hooks/useQuotationForm";
import { 
    CustomerSearchSelect, 
    SingleDatePicker, 
    QuotationItemsTable, 
    QuotationSummary 
} from "./components/QuotationFormShared";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";

export const CreateQuoteModal = ({ onClose, onCreated }) => {
    const { user } = useAuth();
    
    // Use the custom hook for all quotation logic
    const {
        customers, products, loadingData,
        custId, setCustId,
        validUntil, setValidUntil,
        note, setNote,
        rows,
        addRow, removeRow, updateRow,
        totals,
        validate,
        addCustomerToList,
        customer
    } = useQuotationForm();

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
                staffId: user?.id || 1,
                validUntil: validUntil ? validUntil + "T23:59:59" : null,
                note,
                items: rows.filter(r => r.productId).map(r => ({
                    productId: Number(r.productId),
                    quantity: r.qty,
                    unitPrice: Number(r.unitPrice),
                    discountPercent: r.discount,
                })),
            };
            await quotationService.create(payload);
            onCreated();
        } catch (e) {
            setErrors({ general: e.response?.data?.message || "Lỗi khi tạo báo giá" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Tạo Báo giá mới</h2>
                    </div>
                    <button className="sq-modal-close" onClick={onClose} disabled={saving}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {loadingData ? (
                        <div className="sp-state"><div className="sp-spinner" /><span>Đang tải dữ liệu...</span></div>
                    ) : (
                        <div className="sq-form-grid">
                            <div className="sq-form-main">
                                {/* Section 1: Basic Info */}
                                <div className="sq-form-card">
                                    <div className="sq-form-row">
                                        <div className="sq-form-field" style={{ flex: 2 }}>
                                            <label className="sq-form-label">Khách hàng <span className="sq-required-star">*</span></label>
                                            <CustomerSearchSelect
                                                customers={customers}
                                                value={custId}
                                                onChange={(val) => { setCustId(val); setErrors(p => ({...p, custId: null})); }}
                                                onCustomerCreated={(c) => addCustomerToList(c)}
                                            />
                                            {errors.custId && <span className="sq-field-error">{errors.custId}</span>}
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Ngày hiệu lực <span className="sq-required-star">*</span></label>
                                            <SingleDatePicker value={validUntil} onChange={(val) => { setValidUntil(val); setErrors(p => ({...p, validUntil: null})); }} />
                                            {errors.validUntil && <span className="sq-field-error">{errors.validUntil}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="sq-form-row">
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Số điện thoại</label>
                                            <input 
                                                className="sq-form-input sq-form-input--readonly" 
                                                value={customer?.phoneNumber || ""} 
                                                readOnly 
                                                placeholder="SĐT khách hàng"
                                            />
                                        </div>
                                        <div className="sq-form-field">
                                            <label className="sq-form-label">Email</label>
                                            <input 
                                                className="sq-form-input sq-form-input--readonly" 
                                                value={customer?.email || ""} 
                                                readOnly 
                                                placeholder="Email khách hàng"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Items Table */}
                                <QuotationItemsTable
                                    rows={rows}
                                    products={products}
                                    onUpdate={updateRow}
                                    onAdd={addRow}
                                    onRemove={removeRow}
                                    errors={errors}
                                />
                            </div>

                            {/* Sidebar: Summary & Note */}
                            <QuotationSummary
                                totals={totals}
                                note={note}
                                onNoteChange={setNote}
                            />
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    <div className="sq-footer-left">
                    </div>
                    <div className="sq-footer-actions">
                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving || loadingData}>
                            {saving ? "Đang tạo..." : "Tạo báo giá"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
