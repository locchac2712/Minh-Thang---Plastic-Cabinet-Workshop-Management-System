import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import "./CreateForms.css";
import customerService from "../../services/customerService";
import staffService from "../../services/staffService";

export const AddCustomer = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", taxCode: "", phoneNumber: "", email: "",
        creditLimit: "", address: "",
        customerType: "RETAIL", source: "FACEBOOK", birthday: "",
        assignedToId: ""
    });
    const [staffs, setStaffs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    useEffect(() => {
        staffService.getAll().then(setStaffs).catch(console.error);
    }, []);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!form.name) { setError("Vui lòng nhập tên khách hàng"); return; }
        setError(null); setSaving(true);
        try {
            await customerService.create({
                ...form,
                creditLimit: form.creditLimit ? Number(form.creditLimit) : 0,
                assignedTo: form.assignedToId ? { id: form.assignedToId } : null
            });
            showToast("Thêm khách hàng thành công!");
            setTimeout(() => { if (onSaved) onSaved(); else onBack(); }, 1200);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    return (
        <div style={{ padding: '24px 32px', background: '#fafbfc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ cursor: 'pointer', marginTop: 4, color: '#64748b' }} onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    </div>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px 0', color: '#0f172a' }}>Thêm khách hàng mới</h1>
                        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Khởi tạo hồ sơ đối tác trong hệ thống CRM</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="af-btn-cancel" onClick={onBack} style={{ width: 120, height: 44, borderRadius: 12 }}>Hủy</button>
                    <button
                        className="af-btn-save af-btn-save--dark"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ width: 200, height: 44, borderRadius: 12, background: '#0f172a', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                        {saving ? <div className="cf-spinner-sm" /> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>}
                        {saving ? "Đang lưu..." : "Lưu khách hàng"}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: '#fff1f2', color: '#e11d48', padding: '16px 24px', borderRadius: 16, marginBottom: 24, border: '1px solid #fecdd3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        {error}
                    </div>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* FORM BODY */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>

                {/* LEFT COLUMN: IDENTIFICATION & CRM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Card 1: Thông tin cơ bản */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>ĐỊNH DANH & LIÊN HỆ</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
                            <div className="af-field">
                                <label className="af-label">Tên khách hàng <span className="af-required">*</span></label>
                                <input className="af-input" placeholder="Ví dụ: Nguyễn Văn A..." value={form.name} onChange={e => set("name", e.target.value)} />
                            </div>
                            <div className="af-field">
                                <label className="af-label">Mã khách hàng / MST</label>
                                <input className="af-input" placeholder="Để trống để tự tạo..." value={form.taxCode} onChange={e => set("taxCode", e.target.value)} />
                            </div>
                            <div className="af-field">
                                <label className="af-label">Số điện thoại</label>
                                <input className="af-input" value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)} />
                            </div>
                            <div className="af-field">
                                <label className="af-label">Email giao dịch</label>
                                <input className="af-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Phân loại CRM */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>PHÂN LOẠI & NGUỒN DÂN DỤNG</h3>

                        <div style={{ marginTop: 24 }}>
                            <label className="af-label" style={{ marginBottom: 16, display: 'block' }}>Loại khách hàng</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                <ClassBox active={form.customerType === 'RETAIL'} icon="" name="Khách lẻ" onClick={() => set("customerType", "RETAIL")} />
                                <ClassBox active={form.customerType === 'DISTRIBUTOR'} icon="" name="Đại lý / Sỉ" onClick={() => set("customerType", "DISTRIBUTOR")} />
                                <ClassBox active={form.customerType === 'PROJECT'} icon="" name="Công trình" onClick={() => set("customerType", "PROJECT")} />
                            </div>
                        </div>

                        <div style={{ marginTop: 32 }}>
                            <label className="af-label" style={{ marginBottom: 16, display: 'block' }}>Nguồn khách hàng</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                <SourceBox active={form.source === 'FACEBOOK'} name="Facebook" onClick={() => set("source", "FACEBOOK")} color="#1877F2" />
                                <SourceBox active={form.source === 'ZALO'} name="Zalo" onClick={() => set("source", "ZALO")} color="#0068FF" />
                                <SourceBox active={form.source === 'WEBSITE'} name="Website" onClick={() => set("source", "WEBSITE")} color="#10b981" />
                                <SourceBox active={form.source === 'REFERRAL'} name="Giới thiệu" onClick={() => set("source", "REFERRAL")} color="#f59e0b" />
                                <SourceBox active={form.source === 'OTHER'} name="Khác" onClick={() => set("source", "OTHER")} color="#64748b" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: ASSIGNMENT & FINANCE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Card 3: Phụ trách & Tài chính */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>NHÂN SỰ & TÀI CHÍNH</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
                            <div className="af-field">
                                <label className="af-label">Nhân viên phụ trách</label>
                                <select className="af-input" value={form.assignedToId} onChange={e => set("assignedToId", e.target.value)}>
                                    <option value="">-- Chọn nhân viên --</option>
                                    {staffs.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName || s.fullname} - {s.employeeId}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="af-field">
                                <label className="af-label">Hạn mức tín dụng (VNĐ)</label>
                                <input className="af-input" type="number" min="0" value={form.creditLimit} onChange={e => set("creditLimit", e.target.value)} />
                                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Hạn mức nợ tối đa cho đơn hàng sau</p>
                            </div>
                            <div className="af-field">
                                <label className="af-label">Ngày sinh / Ngày thành lập</label>
                                <input className="af-input" type="date" value={form.birthday} onChange={e => set("birthday", e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Địa chỉ */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>ĐỊA CHỈ GIAO DỊCH</h3>
                        <div style={{ marginTop: 24 }}>
                            <div className="af-field">
                                <textarea
                                    className="af-textarea"
                                    rows={4}
                                    placeholder="Nhập địa chỉ đầy đủ (Số nhà, đường, phường/xã...)"
                                    value={form.address}
                                    onChange={e => set("address", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES & SUB-COMPONENTS ---
const cardStyle = {
    background: '#fff',
    borderRadius: 24,
    padding: 32,
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #f1f5f9'
};

const cardTitleStyle = {
    fontSize: 12,
    fontWeight: 800,
    color: '#94a3b8',
    letterSpacing: 1.2,
    margin: 0,
    textTransform: 'uppercase'
};

const ClassBox = ({ active, icon, name, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px',
            borderRadius: 16, border: `2px solid ${active ? '#4f46e5' : '#f1f5f9'}`,
            background: active ? '#fff' : '#f8fafc',
            boxShadow: active ? '0 12px 25px -10px rgba(79, 70, 229, 0.25)' : 'none',
            transition: 'all 0.2s', cursor: 'pointer',
            transform: active ? 'translateY(-2px)' : 'none'
        }}
    >
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: 13, color: active ? '#0f172a' : '#64748b', textAlign: 'center' }}>{name}</div>
    </div>
);

const SourceBox = ({ active, name, onClick, color }) => (
    <div
        onClick={onClick}
        style={{
            padding: '12px 10px',
            borderRadius: 12, border: `1px solid ${active ? color : '#f1f5f9'}`,
            background: active ? `${color}10` : '#fff',
            color: active ? color : '#64748b',
            fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s'
        }}
    >
        {name}
    </div>
);