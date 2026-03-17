import { useState } from "react";
import "./SalesPages.css";
import { AddProduct } from "./AddProduct.jsx";

const MOCK = [
    { sku: "SP-BAN-001", name: "Bàn làm việc Gỗ Sồi",              unit: "Cái", price: null, status: "DEACTIVATED" },
    { sku: "SP-GHE-001", name: "Ghế xoay văn phòng cao cấp",        unit: "Cái", price: null, status: "DEACTIVATED" },
    { sku: "SP-TU-002",  name: "Tủ hồ sơ 3 buồng Gỗ Công Nghiệp",  unit: "Cái", price: null, status: "DEACTIVATED" },
];

const STATUS = {
    ACTIVE:      { label: "Đang bán",  cls: "sp-dot--green" },
    DRAFT:       { label: "Nháp",      cls: "sp-dot--gray"  },
    DEACTIVATED: { label: "Ngưng",     cls: "sp-dot--red"   },
};

export const SalesProducts = () => {
    const [search,     setSearch]     = useState("");
    const [page,       setPage]       = useState(1);
    const [size,       setSize]       = useState(10);
    const [showAdd,    setShowAdd]    = useState(false);

    const filtered = MOCK.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    if (showAdd) return <AddProduct onBack={() => setShowAdd(false)} onSaved={() => setShowAdd(false)} />;

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Quản lý sản phẩm</h1>
                    <p className="sp-sub">Quản lý danh sách sản phẩm và vật tư trong hệ thống</p>
                </div>
            </div>

            <div className="sp-toolbar">
                <div className="sp-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input placeholder="Tìm theo tên, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button className="sp-filter-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                        </svg>
                    </button>
                </div>
                <button className="sp-btn-primary" onClick={() => setShowAdd(true)}>Thêm sản phẩm</button>
            </div>

            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                    <tr>
                        <th>SKU</th>
                        <th>TÊN SẢN PHẨM</th>
                        <th>ĐƠN VỊ</th>
                        <th>GIÁ BÁN</th>
                        <th>TRẠNG THÁI</th>
                        <th>THAO TÁC</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={6} className="sp-empty-row">Không có dữ liệu</td></tr>
                    ) : filtered.map((p) => {
                        const s = STATUS[p.status] || { label: p.status, cls: "sp-dot--gray" };
                        return (
                            <tr key={p.sku} className="sp-table__row">
                                <td className="sp-td--sku">{p.sku}</td>
                                <td className="sp-td--name">{p.name}</td>
                                <td>{p.unit}</td>
                                <td className="sp-td--price">{p.price ? p.price.toLocaleString("vi-VN") + " đ" : "—"}</td>
                                <td>
                    <span className="sp-status-dot">
                      <span className={`sp-dot ${s.cls}`}/>
                        {s.label}
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
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="sp-pagination">
                    <div className="sp-pagination__left">
                        Hiển thị
                        <select value={size} onChange={e => setSize(Number(e.target.value))} className="sp-size-select">
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        trên {filtered.length} kết quả
                    </div>
                    <div className="sp-pagination__right">
                        <button className="sp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                        <button className="sp-page-btn sp-page-btn--active">{page}</button>
                        <button className="sp-page-btn" onClick={() => setPage(p => p + 1)}>›</button>
                    </div>
                </div>
            </div>
        </div>
    );
};