import { useState, useEffect } from "react";
import "./CreateForms.css";
import customerService from "../../services/customerService";
import staffService from "../../services/staffService";
import customerTypeService from "../../services/customerTypeService";
import { useAuth } from "../../context/AuthContext";

const ClassBox = ({ active, name, onClick }) => (
    <div onClick={onClick} style={{
        padding: '12px 16px', borderRadius: 12, border: `2px solid ${active ? '#3b82f6' : '#f1f5f9'}`,
        background: active ? '#eff6ff' : '#fff', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: active ? 700 : 500,
        color: active ? '#1d4ed8' : '#64748b'
    }}>
        {name}
    </div>
);

export const AddCustomer = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", taxCode: "", phoneDesktop: "", address: "",
        contactPerson: "", position: "", email: "", phoneNumber: "",
        customerTypeId: "", area: "NORTH",
        creditLimit: "0", paymentTerm: "30", note: "",
        assignedToId: ""
    });
    const [staffs, setStaffs] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    
    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        staffService.getAll().then(setStaffs).catch(console.error);
        customerTypeService.getAll().then(setCustomerTypes).catch(console.error);
    }, []);

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
                phoneDesktop: form.phoneDesktop,
                contactPerson: form.contactPerson,
                position: form.position,
                area: form.area,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
                paymentTerm: form.paymentTerm,
                note: form.note,
                assignedTo: form.assignedToId ? { id: form.assignedToId } : null,
                customerType: form.customerTypeId ? { id: form.customerTypeId } : null
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
                    <div className="sq-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                        <div className="sq-form-main">
                            {/* Company Info */}
                            <div className="sq-form-card" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
                                <div className="sq-form-section-header" style={{ marginBottom: 20 }}>
                                    <div className="sq-form-section-title" style={{ color: '#3b82f6', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>THÔNG TIN DOANH NGHIỆP</div>
                                </div>
                                <div className="sq-form-row" style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>TÊN DOANH NGHIỆP <span className="sq-required-star" style={{ color: '#ef4444' }}>*</span></label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Nhập tên doanh nghiệp..." value={form.name} onChange={e => set("name", e.target.value)} />
                                        {errors.name && <span className="sq-field-error" style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name}</span>}
                                    </div>
                                </div>
                                <div className="sq-form-row" style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>MÃ SỐ THUẾ</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Ví dụ: 0102030405" value={form.taxCode} onChange={e => set("taxCode", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>SỐ ĐIỆN THOẠI BÀN</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="024 XXXX XXXX" value={form.phoneDesktop} onChange={e => set("phoneDesktop", e.target.value)} />
                                    </div>
                                </div>
                                <div className="sq-form-row">
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>ĐỊA CHỈ TRỤ SỞ CHÍNH</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" value={form.address} onChange={e => set("address", e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Direct Contact */}
                            <div className="sq-form-card" style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0' }}>
                                <div className="sq-form-section-header" style={{ marginBottom: 20 }}>
                                    <div className="sq-form-section-title" style={{ color: '#f59e0b', fontWeight: 800, fontSize: 13, textTransform: 'uppercase' }}>NGƯỜI LIÊN HỆ TRỰC TIẾP</div>
                                </div>
                                <div className="sq-form-row" style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>HỌ VÀ TÊN</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Nguyễn Văn A" value={form.contactPerson} onChange={e => set("contactPerson", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>CHỨC VỤ</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="Giám đốc mua hàng" value={form.position} onChange={e => set("position", e.target.value)} />
                                    </div>
                                </div>
                                <div className="sq-form-row" style={{ display: 'flex', gap: 20 }}>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>EMAIL CÔNG VIỆC</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                                    </div>
                                    <div className="sq-form-field" style={{ flex: 1 }}>
                                        <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>SỐ ĐIỆN THOẠI DI ĐỘNG</label>
                                        <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} placeholder="09XX XXX XXX" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="sq-form-sidebar">
                            <div className="sq-form-card" style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                                <div className="sq-form-section-header" style={{ marginBottom: 16 }}>
                                    <div className="sq-form-section-title" style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>PHÂN LOẠI KHÁCH HÀNG</div>
                                </div>
                                <div className="sq-form-field" style={{ marginBottom: 16 }}>
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>LOẠI KHÁCH HÀNG</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                                        {customerTypes.map(t => (
                                            <ClassBox 
                                                key={t.id} 
                                                active={form.customerTypeId == t.id} 
                                                name={t.name} 
                                                onClick={() => set("customerTypeId", t.id)} 
                                            />
                                        ))}
                                        {customerTypes.length === 0 && <p style={{ fontSize: 12, color: '#94a3b8' }}>Đang tải danh mục...</p>}
                                    </div>
                                </div>
                                <div className="sq-form-field">
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>KHU VỰC</label>
                                    <select className="sq-form-select" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} value={form.area} onChange={e => set("area", e.target.value)}>
                                        <option value="NORTH">Miền Bắc</option>
                                        <option value="CENTRAL">Miền Trung</option>
                                        <option value="SOUTH">Miền Nam</option>
                                    </select>
                                </div>
                                <div className="sq-form-field" style={{ marginTop: 16 }}>
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>NHÂN VIÊN PHỤ TRÁCH</label>
                                    <select className="sq-form-select" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} value={form.assignedToId} onChange={e => set("assignedToId", e.target.value)}>
                                        <option value="">Chưa gán</option>
                                        {staffs.map(s => (
                                            <option key={s.id} value={s.id}>{s.fullname}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sq-form-card" style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
                                <div className="sq-form-section-header" style={{ marginBottom: 16 }}>
                                    <div className="sq-form-section-title" style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>CHÍNH SÁCH & CÔNG NỢ</div>
                                </div>
                                <div className="sq-form-field" style={{ marginBottom: 16 }}>
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>HẠN MỨC CÔNG NỢ (VNĐ)</label>
                                    <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} type="text" value={form.creditLimit === "0" ? "" : form.creditLimit} onChange={e => set("creditLimit", String(e.target.value).replace(/\./g, ''))} placeholder="0" />
                                </div>
                                <div className="sq-form-field" style={{ marginBottom: 16 }}>
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>THỜI HẠN THANH TOÁN</label>
                                    <input className="sq-form-input" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }} type="text" value={form.paymentTerm} onChange={e => set("paymentTerm", e.target.value)} placeholder="30 ngày" />
                                </div>
                                <div className="sq-form-field">
                                    <label className="sq-form-label" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>GHI CHÚ ĐẶC BIỆT</label>
                                    <textarea className="sq-form-textarea" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', minHeight: 60, resize: 'none' }} placeholder="Nhập ghi chú..." value={form.note} onChange={e => set("note", e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sq-modal-footer">
                    <div className="sq-footer-left">
                        {errors.general && <span className="sq-field-error" style={{ color: '#ef4444' }}>{errors.general}</span>}
                    </div>
                    <div className="sq-footer-actions">
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