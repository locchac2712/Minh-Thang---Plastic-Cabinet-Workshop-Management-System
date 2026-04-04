import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import "./CreateForms.css";
import customerService from "../../services/customerService";
import staffService from "../../services/staffService";

export const EditCustomer = ({ customerId, onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", taxCode: "", phoneNumber: "", email: "",
        creditLimit: "", address: "",
        customerType: "", source: "", birthday: "", assignedToId: ""
    });
    const [staffs, setStaffs] = useState([]);
    const [saving, setSaving]  = useState(false);
    const [error,  setError]   = useState(null);
    const [toast,  setToast]   = useState(null);

    useEffect(() => {
        const loadCustomer = async () => {
            if (!customerId) return;
            try {
                // Giả sử có API lấy chi tiết theo ID, hoặc dùng getAll lọc
                // Ở đây tôi dùng customerService.getById nếu có, hoặc fetch lại
                const response = await customerService.getById(customerId);
                const customer = response.data?.data || response.data || response;
                
                setForm({
                    name: customer.name || "",
                    taxCode: customer.taxCode || "",
                    phoneNumber: customer.phoneNumber || "",
                    email: customer.email || "",
                    creditLimit: customer.creditLimit || 0,
                    address: customer.address || "",
                    customerType: customer.customerType || "RETAIL",
                    source: customer.source || "FACEBOOK",
                    birthday: customer.birthday || "",
                    assignedToId: customer.assignedTo?.id || ""
                });
            } catch (e) {
                setError("Không thể tải thông tin khách hàng");
            }
        };
        loadCustomer();
    }, [customerId]);

    useEffect(() => {
        staffService.getAll().then(setStaffs).catch(console.error);
    }, []);

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!form.name) { setError("Vui lòng nhập tên khách hàng"); return; }
        setError(null); setSaving(true);
        try {
            await customerService.update(customerId, {
                ...form,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
                assignedTo: form.assignedToId ? { id: form.assignedToId } : null
            });
            showToast("Cập nhật thông tin thành công!");
            setTimeout(() => { if (onSaved) onSaved(); else onBack(); }, 1200);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    return (
        <div className="sp-page" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="sp-page-header" style={{ marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <div>
                    <h1 className="sp-title">Chỉnh sửa khách hàng</h1>
                    <p className="sp-sub">Cập nhật thông tin chi tiết đối tác CRM</p>
                </div>
                <button className="af-btn-cancel" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Quay lại
                </button>
            </div>

            {/* Body */}
            <div className="af-card" style={{ padding: 32 }}>
                {error && (
                    <div className="af-error-banner" style={{ marginBottom: 16 }}>
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
                        <label className="af-label">Mã / MST</label>
                        <input className="af-input" value={form.taxCode} onChange={e => set("taxCode", e.target.value)} />
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Số điện thoại</label>
                        <input className="af-input" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Email</label>
                        <input className="af-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Hạn mức tín dụng</label>
                        <input className="af-input" type="number" min="0" value={form.creditLimit} onChange={e => set("creditLimit", e.target.value)} />
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Loại khách hàng</label>
                        <select className="af-input" value={form.customerType} onChange={e => set("customerType", e.target.value)}>
                            <option value="RETAIL">Khách lẻ</option>
                            <option value="DISTRIBUTOR">Đại lý / Sỉ</option>
                            <option value="PROJECT">Công trình / Thầu</option>
                        </select>
                    </div>
                    <div className="af-field">
                        <label className="af-label">Nguồn khách hàng</label>
                        <select className="af-input" value={form.source} onChange={e => set("source", e.target.value)}>
                            <option value="FACEBOOK">Facebook</option>
                            <option value="ZALO">Zalo</option>
                            <option value="WEBSITE">Website</option>
                            <option value="REFERRAL">Người quen giới thiệu</option>
                            <option value="OTHER">Nguồn khác</option>
                        </select>
                    </div>
                </div>

                <div className="af-grid-2">
                    <div className="af-field">
                        <label className="af-label">Ngày sinh / Ngày thành lập</label>
                        <input className="af-input" type="date" value={form.birthday} onChange={e => set("birthday", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Sale phụ trách</label>
                        <select className="af-input" value={form.assignedToId} onChange={e => set("assignedToId", e.target.value)}>
                            <option value="">-- Chọn nhân viên --</option>
                            {staffs.map(s => (
                                <option key={s.id} value={s.id}>{s.fullname} ({s.department})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="af-field">
                    <label className="af-label">Địa chỉ</label>
                    <textarea className="af-textarea" rows={2} value={form.address} onChange={e => set("address", e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 32, borderTop: '1px solid #f1f5f9' }}>
                    <button className="af-btn-cancel" onClick={onBack} style={{ width: 120 }}>Hủy</button>
                    <button className="af-btn-save af-btn-save--dark" onClick={handleSave} disabled={saving} style={{ width: 180 }}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};
