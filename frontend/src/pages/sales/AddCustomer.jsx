import { useState } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import api from "../../services/api";

export const AddCustomer = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", taxCode: "", phoneNumber: "", email: "",
        creditLimit: "", address: "",
    });
    const [saving, setSaving]  = useState(false);
    const [error,  setError]   = useState(null);
    const [toast,  setToast]   = useState(null);

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!form.name) { setError("Vui lòng nhập tên khách hàng"); return; }
        setError(null); setSaving(true);
        try {
            await api.post("/customers", {
                ...form,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
            });
            showToast("Thêm khách hàng thành công!");
            setTimeout(() => { if (onSaved) onSaved(); else onBack(); }, 1200);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    return (
        <div className="af-page">
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="af-header">
                <h1 className="af-title">Thêm khách hàng</h1>
                <button className="cf-back-btn" onClick={onBack}>← Quay lại</button>
            </div>

            {/* Form card */}
            <div className="af-card af-card--narrow">
                {error && (
                    <div className="af-error-banner" style={{marginBottom:16}}>
                        {error}
                        <button className="af-error-close" onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Tên khách hàng <span className="af-required">*</span></label>
                        <input className="af-input" value={form.name} onChange={e => set("name", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Mã <span className="af-required">*</span></label>
                        <input className="af-input" value={form.taxCode} onChange={e => set("taxCode", e.target.value)} />
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Người liên hệ</label>
                        <input className="af-input" value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Số điện thoại</label>
                        <input className="af-input" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Email</label>
                        <input className="af-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Hạn mức tín dụng</label>
                        <input className="af-input" type="number" min="0" value={form.creditLimit} onChange={e => set("creditLimit", e.target.value)} />
                    </div>
                </div>

                <div className="af-field">
                    <label className="af-label">Địa chỉ</label>
                    <textarea className="af-textarea" rows={3} value={form.address} onChange={e => set("address", e.target.value)} />
                </div>

                <div className="af-actions">
                    <button className="af-btn-save af-btn-save--dark" onClick={handleSave} disabled={saving}>
                        {saving ? "Đang lưu..." : "Tạo mới"}
                    </button>
                    <button className="af-btn-cancel" onClick={onBack}>Hủy</button>
                </div>
            </div>
        </div>
    );
};