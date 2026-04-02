import { useState } from "react";
import "./SalesPages.css";
import { AddCustomer } from "./AddCustomer.jsx";
import { useCustomers } from "../../hooks/useCustomers";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";

export const SalesCustomers = () => {
    const { customers, loading, error, refetch } = useCustomers();
    const [search, setSearch] = useState("");
    const [showAdd, setShowAdd] = useState(false);

    const filtered = customers.filter(c =>
        (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (c.taxCode?.toLowerCase() || "").includes(search.toLowerCase())
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Khách hàng</h1>

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
                            placeholder="Tìm kiếm khách hàng theo tên, mã..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                
                <div className="so-toolbar-actions">
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowAdd(true)}>
                        Thêm khách hàng <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            <div className="sp-card">
                {loading ? (
                    <div className="cf-loading" style={{padding: "60px 0"}}>
                        <div className="cf-spinner"></div>
                        <span>Đang tải danh sách khách hàng...</span>
                    </div>

                ) : (
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>MÃ</th>
                            <th>TÊN KHÁCH HÀNG</th>
                            <th>LIÊN HỆ</th>
                            <th>SỐ ĐIỆN THOẠI</th>
                            <th>HẠN MỨC</th>
                            <th>THAO TÁC</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="sp-empty-row">Không có dữ liệu</td></tr>
                        ) : filtered.map((c) => (
                            <tr key={c.id || c.taxCode} className="sp-table__row">
                                <td className="sp-td--muted">{c.taxCode || "—"}</td>
                                <td className="sp-td--name">{c.name}</td>
                                <td className="sp-td--muted">{c.contactPerson || "—"}</td>
                                <td className="sp-td--muted">{c.phoneNumber || "—"}</td>
                                <td className="sp-td--price">{fmt(c.creditLimit)}</td>
                                <td className="sp-td--actions">
                                    <button className="sp-action-btn" title="Xem">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                    <button className="sp-action-btn" title="Sửa">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Popups */}
            {showAdd && (
                <AddCustomer 
                    onBack={() => setShowAdd(false)} 
                    onSaved={() => { setShowAdd(false); refetch(); }} 
                />
            )}
        </div>
    );
};