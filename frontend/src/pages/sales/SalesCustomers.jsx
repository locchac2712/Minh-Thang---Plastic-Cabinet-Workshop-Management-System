import { useState } from "react";
import "./SalesPages.css";

const MOCK = [
    { code: "", name: "Công ty TNHH Khách Hàng VIP", contact: "—", phone: "—", limit: 50_000_000, status: "INACTIVE" },
    { code: "", name: "Anh Tuấn Mua Lẻ",             contact: "—", phone: "—", limit: 0,          status: "INACTIVE" },
];

const fmt = (v) => v.toLocaleString("vi-VN") + " đ";

export const SalesCustomers = () => {
    const [search, setSearch] = useState("");

    const filtered = MOCK.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Khách hàng</h1>
                    <p className="sp-sub">Quản lý danh sách khách hàng</p>
                </div>
                <div className="sp-header-actions">
                    <div className="sp-search sp-search--inline">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input placeholder="Tìm kiếm khách hàng..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <button className="sp-btn-primary sp-btn-primary--pill">
                        Thêm khách hàng
                        <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                    <tr>
                        <th>MÃ</th>
                        <th>TÊN</th>
                        <th>LIÊN HỆ</th>
                        <th>SĐT</th>
                        <th>HẠN MỨC</th>
                        <th>TRẠNG THÁI</th>
                        <th>THAO TÁC</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={7} className="sp-empty-row">Không có dữ liệu</td></tr>
                    ) : filtered.map((c, i) => (
                        <tr key={i} className="sp-table__row">
                            <td className="sp-td--muted">{c.code || "—"}</td>
                            <td className="sp-td--name">{c.name}</td>
                            <td className="sp-td--muted">{c.contact}</td>
                            <td className="sp-td--muted">{c.phone}</td>
                            <td className="sp-td--price">{fmt(c.limit)}</td>
                            <td>
                  <span className="sp-tag sp-tag--gray">
                    {c.status === "INACTIVE" ? "Ngưng" : "Hoạt động"}
                  </span>
                            </td>
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
                                <button className="sp-action-btn sp-action-btn--power" title="Vô hiệu hóa">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};