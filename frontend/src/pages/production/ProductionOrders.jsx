import { useState } from "react";
import "../sales/SalesPages.css";
import { SalesOrderDetail } from "../sales/SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ORDER_STATUS_MAP } from "../../services/salesOrderService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// Specialized Status Map for Production Orders (Confirmed+)
const PROD_STATUS_MAP = {
    ...ORDER_STATUS_MAP,
    CONFIRMED: { text: "Đã xác nhận", cls: "so-badge--confirmed" },
};

export const ProductionOrders = () => {
    const { user } = useAuth();
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const [viewId, setViewId] = useState(null);
    const [planOrder, setPlanOrder] = useState(null);

    // Filtered by status "CONFIRMED" specifically for the Production Manager view
    const { data, loading, error, refetch } = useSalesOrders({
        keyword: keyword || undefined,
        status: "CONFIRMED",
        page, size: 10,
    });

    const orders = data?.content ?? [];
    const total = data?.totalElements ?? 0;

    if (viewId) return (
        <SalesOrderDetail
            orderId={viewId}
            onBack={() => setViewId(null)}
            isSalesStaff={false} // Production doesn't need sales-specific detail buttons
        />
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Hàng chờ sản xuất</h1>
                </div>
            </div>

            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sq-search-wrap">
                        <div className="sp-search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                                value={keyword}
                                onChange={e => { setKeyword(e.target.value); setPage(0); }}
                            />
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">
                    </div>
                </div>
            </div>

            {loading && (
                <div className="sp-state">
                    <div className="sp-spinner" />
                    <span>Đang tải danh sách đơn hàng đã xác nhận...</span>
                </div>
            )}

            {error && !loading && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontSize: 32 }}>⚠️</span>
                    <span style={{ fontWeight: 600, marginTop: "8px" }}>{error}</span>

                </div>
            )}

            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th style={{ width: "60px" }}>STT</th>
                                <th>Mã đơn hàng</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt hàng</th>
                                <th>Trạng thái</th>
                                <th>Tổng giá trị</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="sp-empty-row">
                                        <div className="sq-empty">
                                            <div className="sq-empty__icon">📦</div>
                                            <p>{keyword ? "Không tìm thấy đơn hàng phù hợp" : "Hiện không có đơn hàng nào chờ sản xuất"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o, idx) => {
                                    const s = PROD_STATUS_MAP[o.status] || { text: o.status, cls: "so-badge--pending" };
                                    return (
                                        <tr key={o.id} className="sp-table__row" style={{ cursor: "pointer" }} onClick={() => setViewId(o.id)}>
                                            <td className="sp-td--muted">{(page * 10) + idx + 1}</td>
                                            <td><span className="so-order-id">{o.orderNumber}</span></td>
                                            <td className="sp-td--name">{o.customerName}</td>
                                            <td className="sp-td--muted">{fmtDate(o.createdDate)}</td>
                                            <td><span className={`so-badge ${s.cls}`}>{s.text}</span></td>
                                            <td className="sp-td--price">{fmt(o.totalAmount)}</td>
                                            <td>
                                                <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                    <button
                                                        className="sp-action-btn"
                                                        title="Xem chi tiết"
                                                        onClick={(e) => { e.stopPropagation(); setViewId(o.id); }}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        className="sp-action-btn"
                                                        title="Lập kế hoạch sản xuất"
                                                        style={{ color: "#7c3aed" }}
                                                        onClick={(e) => { e.stopPropagation(); setPlanOrder(o); }}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {total > 0 && (
                        <div className="sp-pagination">
                            <div className="sp-pagination__left">
                                Hiển thị <b>{(page * 10) + 1} - {Math.min((page + 1) * 10, total)}</b> trong tổng số <b>{total}</b> đơn hàng
                            </div>
                            <div className="sp-pagination__right">
                                <button className="sp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</button>
                                {[...Array(data.totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`sp-page-btn${page === i ? " sp-page-btn--active" : ""}`}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="sp-page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>&gt;</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {planOrder && (
                <PlanModal
                    order={planOrder}
                    onClose={() => setPlanOrder(null)}
                    onSuccess={() => { setPlanOrder(null); refetch(); }}
                />
            )}
            
            <style>{`
                .so-badge--confirmed {
                    background: #f0fdf4;
                    color: #15803d;
                    border: 1.5px solid #bbf7d0;
                }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   MODAL LẬP KẾ HOẠCH
───────────────────────────────────────────────────────────── */
import api from "../../services/api";

const PlanModal = ({ order, onClose, onSuccess }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate]     = useState("");
    const [loading, setLoading]     = useState(false);

    const handleCreate = async () => {
        if (!endDate) return alert("Vui lòng chọn ngày kết thúc dự kiến!");
        setLoading(true);
        try {
            await api.post(`/production-plans/generate?salesOrderId=${order.id}`, {
                startDate,
                endDate
            });
            alert("Đã tạo kế hoạch sản xuất thành công!");
            onSuccess();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể lập kế hoạch"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box" onClick={e => e.stopPropagation()} style={{ width: 450 }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">Lập kế hoạch sản xuất</h3>
                        <span className="sq-modal-sub">Mã đơn: {order.orderNumber}</span>
                    </div>
                </div>
                <div className="sq-modal-body" style={{ padding: "20px 24px" }}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Ngày bắt đầu sản xuất</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8 }}
                        />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Ngày kết thúc dự kiến</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8 }}
                        />
                    </div>
                    <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12, color: "#64748b" }}>
                        💡 Hệ thống sẽ tự động tạo các <b>Lệnh sản xuất</b> cho toàn bộ sản phẩm trong đơn hàng này sau khi bạn xác nhận.
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Hủy</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleCreate} disabled={loading}>
                        {loading ? "Đang tạo..." : "Xác nhận lập kế hoạch"}
                    </button>
                </div>
            </div>
        </div>
    );
};
