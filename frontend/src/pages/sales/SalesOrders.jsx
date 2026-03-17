import { useState } from "react";
import "./SalesPages.css";
import { CreateOrder } from "./CreateOrder.jsx";
import { SalesOrderDetail } from "./SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ApprovalModal } from "./ApprovalModal";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";


const fmt     = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export const SalesOrders = () => {
    const { user } = useAuth();
    const [keyword,    setKeyword]    = useState("");
    const [payFilter,  setPayFilter]  = useState("");
    const [page,       setPage]       = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [viewId,     setViewId]     = useState(null);
    const [selectedForApproval, setSelectedForApproval] = useState(null);
    const isDirector = user?.role === "ROLE_DIRECTOR" || user?.role === "ROLE_ADMIN";

    const isSalesStaff = user?.role === "ROLE_SALES_STAFF";

    const { data, loading, error, refetch } = useSalesOrders({
        keyword:       keyword       || undefined,
        paymentStatus: payFilter     || undefined,
        page, size: 10,
    });

    const handleApprovalSubmit = async (isApproved, limit, note) => {
        try {
            const payload = {
                isApproved: isApproved,
                newCreditLimit: limit,
                approvalNote: note
            };
            await salesOrderService.processApproval(selectedForApproval.id, payload);
            alert(isApproved ? "Đã phê duyệt!" : "Đã từ chối đơn hàng!");
            setSelectedForApproval(null);
            refetch(); // Load lại danh sách
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể xử lý"));
        }
    };

    const orders = data?.content ?? [];
    const total  = data?.totalElements ?? 0;

    if (showCreate) return <CreateOrder onBack={() => setShowCreate(false)} />;
    if (viewId)     return (
        <SalesOrderDetail
            orderId={viewId}
            onBack={() => setViewId(null)}
            isSalesStaff={isSalesStaff}
        />
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Đơn hàng</h1>
                    <p className="sp-sub">Quản lý đơn hàng bán</p>
                </div>
                <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                    Tạo đơn hàng <span className="sp-btn-plus">+</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="so-toolbar">
                <div className="sp-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input placeholder="Tìm theo mã đơn hoặc khách hàng..."
                           value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                </div>
                {isSalesStaff && (
                    <select className="sq-status-filter" value={payFilter}
                            onChange={e => { setPayFilter(e.target.value); setPage(0); }}>
                        <option value="">Tất cả thanh toán</option>
                        <option value="UNPAID">Chưa thanh toán</option>
                        <option value="PARTIAL">Thanh toán một phần</option>
                        <option value="PAID">Đã thanh toán</option>
                    </select>
                )}
                <span className="so-total-count">{total} đơn hàng</span>
            </div>

            {loading && <div className="sp-state"><div className="sp-spinner"/><span>Đang tải...</span></div>}
            {error && !loading && <div className="sp-state sp-state--error">⚠️ {error}</div>}

            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Ngày đặt</th>
                            <th>Trạng thái đơn</th>
                            {isSalesStaff && <th>Thanh toán</th>}
                            <th>Tổng tiền</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan={isSalesStaff ? 7 : 6} className="sp-empty-row">
                                <div className="sq-empty"><div className="sq-empty__icon">📋</div><p>Không có đơn hàng nào</p></div>
                            </td></tr>
                        ) : orders.map(o => {
                            const os = ORDER_STATUS_MAP[o.status]       || { text: o.status,        cls: "" };
                            const py = PAYMENT_STATUS_MAP[o.paymentStatus] || { text: o.paymentStatus, cls: "" };
                            return (
                                <tr key={o.id} className="sp-table__row">
                                    <td><span className="so-order-id">{o.orderNumber}</span></td>
                                    <td className="sp-td--name">{o.customerName}</td>
                                    <td className="sp-td--muted">{fmtDate(o.createdDate)}</td>
                                    <td><span className={`so-badge ${os.cls}`}>{os.text}</span></td>
                                    {isSalesStaff && <td><span className={`so-badge ${py.cls}`}>{py.text}</span></td>}
                                    <td className="sp-td--price">{fmt(o.totalAmount)}</td>
                                    <td className="sp-td--actions">
                                        <button className="sp-action-btn" title="Xem chi tiết" onClick={() => setViewId(o.id)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </button>
                                        {o.status === "PENDING" && (isDirector || isSalesStaff) && (
                                            <button
                                                className="sp-action-btn"
                                                title={isDirector ? "Phê duyệt đơn" : "Gửi yêu cầu phê duyệt"}
                                                style={{ color: "#a855f7", marginLeft: "10px" }}
                                                onClick={() => setSelectedForApproval(o)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                                </svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    {data?.totalPages > 1 && (
                        <div className="sp-pagination">
                            <span className="sp-pagination__info">{total} đơn hàng</span>
                            <div className="sp-pagination__right">
                                <button className="sp-page-btn" disabled={page===0} onClick={() => setPage(p => p-1)}>‹</button>
                                {Array.from({length: data.totalPages}, (_, i) => (
                                    <button key={i} className={`sp-page-btn${page===i?" sp-page-btn--active":""}`} onClick={() => setPage(i)}>{i+1}</button>
                                ))}
                                <button className="sp-page-btn" disabled={page===data.totalPages-1} onClick={() => setPage(p => p+1)}>›</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {selectedForApproval && (
                <ApprovalModal
                    order={selectedForApproval}
                    onClose={() => setSelectedForApproval(null)}
                    onConfirm={handleApprovalSubmit}
                />
            )}
        </div>
    );
};