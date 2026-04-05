import { useState } from "react";
import "./CreateForms.css";
import customerService from "../../services/customerService";

export const AddCustomer = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", taxCode: "", phoneDesktop: "", address: "",
        contactPerson: "", position: "", email: "", phoneNumber: "",
        customerType: "", area: "",
        creditLimit: "0", paymentTerm: "30", note: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    
    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const handleSave = async () => {
        if (!form.name) {
            setErrors({ name: "Vui lòng nhập tên doanh nghiệp" });
            return;
        }
        setSaving(true);
        setErrors({});
        try {
            const validPayload = {
                name: form.name,
                taxCode: form.taxCode,
                address: form.address,
                email: form.email,
                phoneNumber: form.phoneNumber,
                customerType: form.customerType,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
            };
            await customerService.create(validPayload);
            onSaved();
        } catch (e) {
            setErrors({ general: e.response?.data?.message || "Có lỗi xảy ra" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onBack}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Thêm Khách Hàng Mới</h2>
                        <span className="sq-modal-sub">Nhập thông tin đối tác vào hệ thống</span>
                    </div>
                    <button className="sq-modal-close" onClick={onBack} disabled={saving}>✕</button>
                </div>

                <div className="sq-modal-body">
                    <div className="sq-form-grid">
                        <div className="sq-form-main">
                            {/* Company Info */}
                            <div className="sq-form-card">
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title" style={{color: '#3b82f6'}}>THÔNG TIN DOANH NGHIỆP</div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field" style={{flex: 2}}>
                                        <label className="sq-form-label">TÊN DOANH NGHIỆP <span className="sq-required-star">*</span></label>
                                        <input className="sq-form-input" placeholder="Nhập tên doanh nghiệp..." value={form.name} onChange={e => set("name", e.target.value)} />
                                        {errors.name && <span className="sq-field-error">{errors.name}</span>}
                                    </div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">MÃ SỐ THUẾ</label>
                                        <input className="sq-form-input" placeholder="Ví dụ: 0102030405" value={form.taxCode} onChange={e => set("taxCode", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">SỐ ĐIỆN THOẠI BÀN</label>
                                        <input className="sq-form-input" placeholder="024 XXXX XXXX" value={form.phoneDesktop} onChange={e => set("phoneDesktop", e.target.value)} />
                                    </div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">ĐỊA CHỈ TRỤ SỞ CHÍNH</label>
                                        <input className="sq-form-input" placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" value={form.address} onChange={e => set("address", e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Direct Contact */}
                            <div className="sq-form-card">
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title" style={{color: '#f59e0b'}}>NGƯỜI LIÊN HỆ TRỰC TIẾP</div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">HỌ VÀ TÊN</label>
                                        <input className="sq-form-input" placeholder="Nguyễn Văn A" value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">CHỨC VỤ</label>
                                        <input className="sq-form-input" placeholder="Giám đốc mua hàng" value={form.position} onChange={e => set("position", e.target.value)} />
                                    </div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">EMAIL CÔNG VIỆC</label>
                                        <input className="sq-form-input" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field">
                                        <label className="sq-form-label">SỐ ĐIỆN THOẠI DI ĐỘNG</label>
                                        <input className="sq-form-input" placeholder="09XX XXX XXX" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="sq-form-sidebar">
                            <div className="sq-form-card" style={{padding: '20px'}}>
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title">PHÂN LOẠI KHÁCH HÀNG</div>
                                </div>
                                <div className="sq-form-field" style={{marginBottom: 16}}>
                                    <label className="sq-form-label">NHÓM KHÁCH HÀNG</label>
                                    <select className="sq-form-select" value={form.customerType} onChange={e => set("customerType", e.target.value)}>
                                        <option value="" disabled>Chọn nhóm...</option>
                                        <option value="DISTRIBUTOR">Đại lý cấp 1</option>
                                        <option value="DISTRIBUTOR2">Đại lý cấp 2</option>
                                        <option value="RETAIL">Bán lẻ</option>
                                        <option value="PROJECT">Dự án</option>
                                    </select>
                                </div>
                                <div className="sq-form-field">
                                    <label className="sq-form-label">KHU VỰC</label>
                                    <select className="sq-form-select" value={form.area} onChange={e => set("area", e.target.value)}>
                                        <option value="" disabled>Chọn khu vực...</option>
                                        <option value="NORTH">Miền Bắc</option>
                                        <option value="CENTRAL">Miền Trung</option>
                                        <option value="SOUTH">Miền Nam</option>
                                    </select>
                                </div>
                            </div>

                            <div className="sq-form-card" style={{padding: '20px'}}>
                                <div className="sq-form-section-header">
                                    <div className="sq-form-section-title">CHÍNH SÁCH & CÔNG NỢ</div>
                                </div>
                                <div className="sq-form-field" style={{marginBottom: 16}}>
                                    <label className="sq-form-label">HẠN MỨC CÔNG NỢ (VNĐ)</label>
                                    <input className="sq-form-input" type="text" value={form.creditLimit === "0" ? "" : form.creditLimit} onChange={e => set("creditLimit", String(e.target.value).replace(/\./g, ''))} placeholder="0" />
                                </div>
                                <div className="sq-form-field" style={{marginBottom: 16}}>
                                    <label className="sq-form-label">THỜI HẠN THANH TOÁN</label>
                                    <input className="sq-form-input" type="text" value={form.paymentTerm} onChange={e => set("paymentTerm", e.target.value)} placeholder="30 ngày" />
                                </div>
                                <div className="sq-form-field">
                                    <label className="sq-form-label">GHI CHÚ ĐẶC BIỆT</label>
                                    <textarea className="sq-form-textarea" placeholder="Nhập ghi chú..." value={form.note} onChange={e => set("note", e.target.value)} style={{minHeight: 60}} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sq-modal-footer">
                    <div className="sq-footer-left">
                        {errors.general && <span className="sq-field-error">{errors.general}</span>}
                    </div>
                    <div className="sq-footer-actions" style={{display: 'flex', gap: 12}}>
                        <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onBack} disabled={saving}>Hủy</button>
                        <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : "Xác nhận và Lưu hồ sơ"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};