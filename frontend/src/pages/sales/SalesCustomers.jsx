import React, { useState, useEffect, useRef } from "react";
import "./SalesPages.css";
import customerService from "../../services/customerService";
import { useAuth } from "../../context/AuthContext";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + "đ" : "0đ";

const TooltipWrapper = ({ children, text }) => (
    <div className="sq-tooltip-container">
        {children}
        <span className="sq-tooltip-text">{text}</span>
    </div>
);

export const SalesCustomers = ({ onNavigate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("active"); // active, inactive, all
    
    const { hasRole } = useAuth();

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const activeParam = statusFilter === "all" ? undefined : (statusFilter === "active");
            const data = await customerService.getAll(activeParam);
            setCustomers(data);
        } catch (e) {
            setError("Lỗi: " + (e.response?.data?.message || "Không thể tải danh sách khách hàng"));
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

    const filtered = customers.filter(c => {
        const matchSearch = (c.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
                            (c.taxCode?.toLowerCase() || "").includes(search.toLowerCase()) || 
                            (c.phoneNumber?.toLowerCase() || "").includes(search.toLowerCase());
        return matchSearch;
    });

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Danh sách Khách hàng</h1>
                </div>
            </div>

            <div className="so-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div className="so-toolbar-main" style={{ display: 'flex', alignItems: 'center', gap: 24, flex: 1 }}>
                    <div className="sp-search" style={{ position: 'relative', width: 350 }}>
                        <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: 10, border: '1.5px solid #e2e8f0', outline: 'none', fontSize: 14 }}
                            placeholder="Tìm theo tên, mã, SĐT..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="sp-tabs" style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                        <button className={`sp-tab ${statusFilter === "active" ? "active" : ""}`} 
                                style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: statusFilter === "active" ? "#fff" : "transparent", color: statusFilter === "active" ? "#0f172a" : "#64748b", boxShadow: statusFilter === "active" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
                                onClick={() => setStatusFilter("active")}>Đang hoạt động</button>
                        <button className={`sp-tab ${statusFilter === "inactive" ? "active" : ""}`} 
                                style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: statusFilter === "inactive" ? "#fff" : "transparent", color: statusFilter === "inactive" ? "#0f172a" : "#64748b", boxShadow: statusFilter === "inactive" ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }}
                                onClick={() => setStatusFilter("inactive")}>Ngừng hoạt động</button>
                    </div>
                </div>
                
                <div className="so-toolbar-actions">
                    {hasRole('SALES_STAFF') && (
                        <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => onNavigate('add-customer')}>
                            Thêm khách hàng <span className="sp-btn-plus">+</span>
                        </button>
                    )}
                </div>
            </div>

            {error ? (
                <div className="sp-state sp-state--error">{error}</div>
            ) : (
                <div className="sp-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table className="sp-table">
                        <thead className="sq-table-head" style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>MÃ KH</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>KHÁCH HÀNG</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>SĐT / EMAIL</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>PHÂN LOẠI</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>TRẠNG THÁI</th>
                                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>HẠN MỨC</th>
                                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="sq-empty">Đang tải...</div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="sq-empty">Không tìm thấy khách hàng nào</div></td></tr>
                            ) : filtered.map(c => (
                                <tr key={c.id} className="sp-table__row" style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '16px 24px' }}><span className="sq-quote-id" style={{ fontWeight: 700, color: '#475569' }}>{c.taxCode || "—"}</span></td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="sp-td--name" style={{ fontWeight: 700, color: '#0f172a' }}>{c.name}</div>
                                        {c.address && <div className="sp-td--muted" style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{c.address}</div>}
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div style={{ fontSize: 13, color: '#475569' }}>{c.phoneNumber || "—"}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.email || ""}</div>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155', background: '#f1f5f9', padding: '4px 10px', borderRadius: 6 }}>
                                            {c.customerType?.name || "Chưa phân loại"}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span className={`sq-badge`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, backgroundColor: c.active ? "#ecfdf5" : "#fef2f2", color: c.active ? "#059669" : "#dc2626" }}>
                                            {c.active ? "HOẠT ĐỘNG" : "NGỪNG HĐ"}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px' }} className="sp-td--price" style={{ fontWeight: 700, color: '#0f172a' }}>{fmt(c.creditLimit)}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="sp-td--actions" style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                                            <TooltipWrapper text="Xem chi tiết">
                                                <button className="sp-action-btn" style={{ padding: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} onClick={() => onNavigate('customer-detail', c.id)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                </button>
                                            </TooltipWrapper>

                                            <TooltipWrapper text={c.active ? "Ngừng hoạt động" : "Khôi phục"}>
                                                <button className="sp-action-btn" style={{ padding: 8, background: c.active ? '#fef2f2' : '#ecfdf5', border: '1px solid transparent', borderRadius: 8, cursor: 'pointer' }} onClick={() => handleToggleStatus(c.id, c.active)}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.active ? "#dc2626" : "#059669"} strokeWidth="2.5">
                                                        {c.active ? (
                                                            <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                                                        ) : (
                                                            <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>
                                                        )}
                                                    </svg>
                                                </button>
                                            </TooltipWrapper>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style>{`
                .sq-tooltip-container { position: relative; display: inline-flex; }
                .sq-tooltip-text { visibility: hidden; width: max-content; background-color: #1e293b; color: #fff; text-align: center; border-radius: 6px; padding: 6px 12px; position: absolute; z-index: 1000; bottom: 125%; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.2s; font-size: 11px; font-weight: 700; pointer-events: none; }
                .sq-tooltip-container:hover .sq-tooltip-text { visibility: visible; opacity: 1; }
                .sp-action-btn:hover { border-color: #cbd5e1 !important; background: #f1f5f9 !important; }
            `}</style>
        </div>
    );
};