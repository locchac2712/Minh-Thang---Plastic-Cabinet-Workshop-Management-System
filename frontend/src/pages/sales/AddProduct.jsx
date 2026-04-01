import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import api from "../../services/api";

export const AddProduct = ({ onBack, onSaved }) => {
    const [form, setForm] = useState({
        name: "", sku: "", unit: "", sellingPrice: "", currentStock: 0,
        description: "", imageUrl: "", status: "DRAFT",
    });
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState(null);
    const [toast,   setToast]   = useState(null);

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!form.name || !form.sku || !form.unit) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc (*)");
            return;
        }
        setError(null); setSaving(true);
        try {
            await api.post("/products", {
                ...form,
                sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
                currentStock: Number(form.currentStock) || 0,
            });
            showToast("Thêm sản phẩm thành công!");
            setTimeout(() => { if (onSaved) onSaved(); else onBack(); }, 1200);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
        } finally { setSaving(false); }
    };

    const STATUS_OPTS = [
        { value: "DRAFT",       label: "Nháp" },
        { value: "ACTIVE",      label: "Đang bán" },
        { value: "DEACTIVATED", label: "Ngừng bán" },
    ];

    return (
        <div className="af-page">
            {toast && <div className={`cf-toast cf-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Header */}
            <div className="af-header">
                <h1 className="af-title">Chi tiết sản phẩm</h1>
                <div className="af-header__right">
                    <button className="af-btn-edit" disabled>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Chỉnh sửa
                    </button>
                    <button className="cf-back-btn" onClick={onBack}>Quay lại</button>
                </div>
            </div>
            <p className="af-subtitle">Thông tin chi tiết và lịch sử sản phẩm</p>

            {error && (
                <div className="af-error-banner">
                    {error}
                    <button className="af-error-close" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            <div className="af-body">
                {/* Left: form */}
                <div className="af-card">
                    <div className="af-grid-2">
                        <div className="af-field">
                            <label className="af-label">Tên sản phẩm</label>
                            <input className="af-input" placeholder="Nhập tên sản phẩm..."
                                   value={form.name} onChange={e => set("name", e.target.value)} />
                        </div>
                        <div className="af-field">
                            <label className="af-label">Mã SKU (Mã sản phẩm)</label>
                            <input className="af-input" placeholder="VD:  TS-001"
                                   value={form.sku} onChange={e => set("sku", e.target.value)} />
                        </div>
                    </div>
                    <div className="af-grid-2">
                        <div className="af-field">
                            <label className="af-label">Đơn vị tính</label>
                            <input className="af-input" placeholder="VD: cái, bộ, mét..."
                                   value={form.unit} onChange={e => set("unit", e.target.value)} />
                        </div>
                        <div className="af-field">
                            <label className="af-label">Giá bán (VND)</label>
                            <input className="af-input" type="number" min="0"
                                   value={form.sellingPrice} onChange={e => set("sellingPrice", e.target.value)} />
                        </div>
                    </div>
                    <div className="af-field">
                        <label className="af-label">Tồn kho</label>
                        <input className="af-input af-input--half" type="number" min="0"
                               value={form.currentStock} onChange={e => set("currentStock", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Mô tả sản phẩm</label>
                        <textarea className="af-textarea" rows={4} placeholder="Nhập mô tả chi tiết về sản phẩm..."
                                  value={form.description} onChange={e => set("description", e.target.value)} />
                    </div>
                    <div className="af-field">
                        <label className="af-label">Đường dẫn hình ảnh (URL)</label>
                        <input className="af-input af-input--url" placeholder="https://example.com/image.jpg"
                               value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} />
                    </div>

                    {/* Actions */}
                    <div className="af-actions">
                        <button className="af-btn-save" onClick={handleSave} disabled={saving}>
                            {saving ? "Đang lưu..." : "Lưu sản phẩm"}
                        </button>
                        <button className="af-btn-cancel" onClick={onBack}>Hủy</button>
                    </div>
                </div>

                {/* Right: status sidebar */}
                <div className="af-side">
                    <div className="af-side-card">
                        <div className="af-side-title">TRẠNG THÁI KINH DOANH</div>
                        <div className="af-status-row">
                            <span className="af-status-dot af-status-dot--green"/>
                            <span className="af-status-text">Hoạt động</span>
                            <span className="af-status-badge">Sẵn sàng</span>
                        </div>
                        <div className="af-status-select-wrap">
                            <select className="af-select" value={form.status} onChange={e => set("status", e.target.value)}>
                                {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <button className="af-btn-deactivate">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                            </svg>
                            Ngừng kinh doanh
                        </button>
                    </div>
                    <div className="af-side-card">
                        <div className="af-side-title">THÔNG TIN BỔ SUNG</div>
                        <div className="af-info-row">
                            <span className="af-info-label">MÃ HỆ THỐNG (ID)</span>
                            <span className="af-info-value">#</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};