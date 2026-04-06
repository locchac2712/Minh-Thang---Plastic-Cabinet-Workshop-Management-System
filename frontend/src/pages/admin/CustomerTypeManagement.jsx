import { useState, useEffect } from "react";
import customerTypeService from "../../services/customerTypeService";
import { useAuth } from "../../context/AuthContext";
import "./CustomerTypeManagement.css";

export const CustomerTypeManagement = () => {
    const { token } = useAuth();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: "", code: "", description: "" });
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await customerTypeService.getAll();
            setTypes(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = (type = null) => {
        if (type) {
            setEditingType(type);
            setFormData({ name: type.name, code: type.code, description: type.description || "" });
        } else {
            setEditingType(null);
            setFormData({ name: "", code: "", description: "" });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingType) {
                await customerTypeService.update(editingType.id, formData, token);
            } else {
                await customerTypeService.create(formData, token);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            alert("Lỗi khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa loại khách hàng này?")) return;
        try {
            await customerTypeService.delete(id, token);
            fetchData();
        } catch (err) {
            alert("Lỗi khi xóa dữ liệu (Có thể đang có khách hàng thuộc loại này)");
        }
    };

    return (
        <div className="ctm-container">
            <div className="ctm-header">
                <div>
                    <h1 className="ctm-title">Quản lý Loại khách hàng</h1>
                    <p className="ctm-subtitle">Định nghĩa các nhóm khách hàng để áp dụng chính sách kinh doanh phù hợp.</p>
                </div>
                <button className="ctm-btn ctm-btn--primary" onClick={() => handleOpenModal()}>
                    + Thêm loại mới
                </button>
            </div>

            {loading ? (
                <div className="ctm-loading"><div className="ctm-spinner"></div></div>
            ) : (
                <div className="ctm-card">
                    <table className="ctm-table">
                        <thead>
                            <tr>
                                <th>Mã loại</th>
                                <th>Tên loại</th>
                                <th>Mô tả</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {types.length === 0 ? (
                                <tr><td colSpan="4" className="ctm-empty">Chưa có dữ liệu</td></tr>
                            ) : (
                                types.map(t => (
                                    <tr key={t.id}>
                                        <td><span className="ctm-code-badge">{t.code}</span></td>
                                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                                        <td className="ctm-desc">{t.description || "—"}</td>
                                        <td>
                                            <div className="ctm-actions">
                                                <button className="ctm-action-btn ctm-action-btn--edit" onClick={() => handleOpenModal(t)}>Sửa</button>
                                                <button className="ctm-action-btn ctm-action-btn--delete" onClick={() => handleDelete(t.id)}>Xóa</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="ctm-modal-overlay" onClick={() => setShowModal(false)}>
                    <form className="ctm-modal" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
                        <div className="ctm-modal-header">
                            <h2>{editingType ? "Chỉnh sửa loại khách hàng" : "Thêm loại khách hàng mới"}</h2>
                            <button type="button" className="ctm-modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="ctm-modal-body">
                            <div className="ctm-form-group">
                                <label>Tên loại <span className="ctm-required">*</span></label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="Ví dụ: Khách sỉ"
                                />
                            </div>
                            <div className="ctm-form-group">
                                <label>Mã (Code) <span className="ctm-required">*</span></label>
                                <input 
                                    required 
                                    type="text" 
                                    value={formData.code} 
                                    onChange={e => setFormData({ ...formData, code: e.target.value })} 
                                    placeholder="Ví dụ: WHOLESALE"
                                />
                            </div>
                            <div className="ctm-form-group">
                                <label>Mô tả</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                    placeholder="Mô tả ngắn gọn về loại khách hàng này..."
                                />
                            </div>
                        </div>
                        <div className="ctm-modal-footer">
                            <button type="button" className="ctm-btn ctm-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button type="submit" className="ctm-btn ctm-btn--primary" disabled={saving}>
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
