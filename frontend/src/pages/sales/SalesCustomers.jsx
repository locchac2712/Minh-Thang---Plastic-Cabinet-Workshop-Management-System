import { useState, useEffect } from "react";
import "./SalesPages.css";
import customerService from "../../services/customerService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";

export const SalesCustomers = ({ onNavigate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("active"); // active | inactive | all
    const [search, setSearch] = useState("");

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const activeParam = statusFilter === "all" ? null : (statusFilter === "active");
            const data = await customerService.getAll(activeParam);
            setCustomers(data);
        } catch (e) {
            setError("Không thể tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [statusFilter]);

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? "ngừng hoạt động" : "khôi phục"} khách hàng này?`)) return;
        try {
            await customerService.changeStatus(id, !currentStatus);
            loadCustomers();
        } catch (e) {
            alert("Lỗi khi cập nhật trạng thái");
        }
    };

    const filtered = customers.filter(c =>
        (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (c.taxCode?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (c.phoneNumber?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Quản lý Khách hàng</h1>
                    <p className="sp-sub">Thông tin chi tiết và trạng thái hoạt động của đối tác</p>
                </div>
            </div>

            <div className="so-toolbar">
                <div className="so-toolbar-main">
                    <div className="sp-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            placeholder="Tìm theo tên, mã, SĐT..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="sp-tabs" style={{marginLeft: 20}}>
                        <button className={`sp-tab ${statusFilter === "active" ? "active" : ""}`} onClick={() => setStatusFilter("active")}>Đang hoạt động</button>
                        <button className={`sp-tab ${statusFilter === "inactive" ? "active" : ""}`} onClick={() => setStatusFilter("inactive")}>Ngừng hoạt động</button>
                    </div>
                </div>
                
                <div className="so-toolbar-actions">
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => onNavigate('add-customer')}>
                        Thêm khách hàng <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            <div className="sp-card">
                {loading ? (
                    <div className="cf-loading" style={{padding: "60px 0"}}>
                        <div className="cf-spinner"></div>
                        <span>Đang tải danh sách...</span>
                    </div>
                ) : (
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>MÃ</th>
                            <th>TÊN KHÁCH HÀNG</th>
                            <th>SĐT / EMAIL</th>
                            <th>HẠN MỨC</th>
                            <th>TRẠNG THÁI</th>
                            <th>THAO TÁC</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="sp-empty-row">Không có dữ liệu</td></tr>
                        ) : filtered.map((c) => (
                            <tr key={c.id} className={`sp-table__row ${!c.active ? "sp-row--inactive" : ""}`}>
                                <td className="sp-td--muted">{c.taxCode || "—"}</td>
                                <td className="sp-td--name">
                                    {c.name}
                                    {!c.active && <span className="sp-badge-status status-inactive">Ngừng</span>}
                                </td>
                                <td className="sp-td--muted">
                                    {c.phoneNumber || "—"}<br/>
                                    <small>{c.email || ""}</small>
                                </td>
                                <td className="sp-td--price">{fmt(c.creditLimit)}</td>
                                <td className="sp-td--muted">
                                    {c.active ? 
                                        <span className="status-dot dot-active">Hoạt động</span> : 
                                        <span className="status-dot dot-inactive">Đã ngừng</span>
                                    }
                                </td>
                                <td className="sp-td--actions">
                                    <button className="sp-action-btn" title="Xem chi tiết" onClick={() => onNavigate('customer-detail', c.id)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>

                                    <button className="sp-action-btn" title="Sửa" onClick={() => onNavigate('edit-customer', c.id)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                    
                                    {c.active ? (
                                        <button className="sp-action-btn sp-btn-danger" title="Ngừng hoạt động" onClick={() => handleToggleStatus(c.id, true)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                            </svg>
                                        </button>
                                    ) : (
                                        <button className="sp-action-btn sp-btn-success" title="Khôi phục" onClick={() => handleToggleStatus(c.id, false)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                            </svg>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};