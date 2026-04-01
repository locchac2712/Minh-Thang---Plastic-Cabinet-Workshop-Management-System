import { useState } from "react";
import "./SalesPages.css";
import { AddProduct } from "./AddProduct.jsx";
import { useProducts } from "../../hooks/useProducts";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";

export const SalesProducts = () => {
    const { products, loading, error, refetch } = useProducts();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [showAdd, setShowAdd] = useState(false);

    const filtered = products.filter(p => {
        return (p.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
               (p.sku?.toLowerCase() || "").includes(search.toLowerCase());
    });

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Quản lý sản phẩm</h1>
                    <p className="sp-sub">Quản lý danh sách sản phẩm và vật tư trong hệ thống</p>
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
                            placeholder="Tìm theo tên, SKU..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
                
                <div className="so-toolbar-actions">
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowAdd(true)}>
                        Thêm sản phẩm <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            <div className="sp-card">
                {loading ? (
                    <div className="cf-loading" style={{padding: "60px 0"}}>
                        <div className="cf-spinner"></div>
                        <span>Đang tải danh sách sản phẩm...</span>
                    </div>
                ) : error ? (
                    <div className="af-error-banner" style={{margin: 24}}>
                        <div style={{flex: 1}}>{error}</div>
                        <button className="cf-submit-btn" style={{padding: "6px 16px", fontSize: "12px"}} onClick={refetch}>Thử lại</button>
                    </div>
                ) : (
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>SKU</th>
                            <th>TÊN SẢN PHẨM</th>
                            <th>ĐƠN VỊ</th>
                            <th>GIÁ BÁN</th>
                            <th>THAO TÁC</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="sp-empty-row">Không có dữ liệu</td></tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id || p.sku} className="sp-table__row">
                                <td className="sp-td--sku">{p.sku || "—"}</td>
                                <td className="sp-td--name">{p.name}</td>
                                <td>{p.unit || "—"}</td>
                                <td className="sp-td--price">{fmt(p.sellingPrice)}</td>
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

                {/* Pagination */}
                {!loading && !error && filtered.length > 0 && (
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
                )}
            </div>

            {/* Popups */}
            {showAdd && (
                <AddProduct 
                    onBack={() => setShowAdd(false)} 
                    onSaved={() => { setShowAdd(false); refetch(); }} 
                />
            )}
        </div>
    );
};