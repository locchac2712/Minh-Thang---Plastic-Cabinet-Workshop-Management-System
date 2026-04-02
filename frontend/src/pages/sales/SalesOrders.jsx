import { useState } from "react";
import "./SalesPages.css";
// Giả định bạn đã có component SalesOrderDetail, nếu chưa hãy comment dòng này lại
import { SalesOrderDetail } from "./SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export const SalesOrders = () => {
    const { user } = useAuth();
    const [keyword, setKeyword] = useState("");
    const [payFilter, setPayFilter] = useState("");
    const [page, setPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // State quản lý xem chi tiết
    const [viewId, setViewId] = useState(null);

    // State quản lý Popup và Ngày dự kiến
    const [showActionPopup, setShowActionPopup] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [plannedStartDate, setPlannedStartDate] = useState("");
    const [plannedEndDate, setPlannedEndDate] = useState("");

    const { data, loading } = useSalesOrders({
        keyword: keyword || undefined,
        paymentStatus: payFilter || undefined,
        page, size: 10,
    });

    const orders = data?.content ?? [];

    const handleOpenAction = (order) => {
        setSelectedOrder(order);
        setPlannedStartDate("");
        setPlannedEndDate("");
        setShowActionPopup(true);
    };

    const handleSave = () => {
        // Logic xử lý lưu ngày dự kiến tại đây
        console.log("Lưu kế hoạch:", { plannedStartDate, plannedEndDate });
        setShowActionPopup(false);
    };

    // LOGIC HIỂN THỊ CHI TIẾT ĐƠN HÀNG
    if (viewId) return (
        <SalesOrderDetail
            orderId={viewId}
            onBack={() => setViewId(null)} // Hàm để quay lại danh sách
        />
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <h1 className="sp-title">Điều phối Sản xuất</h1>
            </div>

            <div className="so-toolbar">
                <div className="so-toolbar-main">
                    <div className="sp-search-outer">
                        <div className="sp-search-container">
                            <div className="sp-search-prefix">🔍</div>
                            <input
                                className="sp-search-input"
                                placeholder="Tìm theo mã đơn hoặc khách hàng..."
                                value={keyword}
                                onChange={e => { setKeyword(e.target.value); setPage(0); }}
                            />
                            <button className="sp-search-suffix" onClick={() => setShowFilters(!showFilters)}>⚙️ Lọc</button>
                        </div>
                        {showFilters && (
                            <div className="so-filter-dropdown-centered">
                                <div className="so-filter-item">
                                    <label>Thanh toán</label>
                                    <select value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(0); }}>
                                        <option value="">Tất cả</option>
                                        {Object.entries(PAYMENT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Trạng thái</th>
                        <th>Thanh toán</th>
                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map(o => (
                        <tr key={o.id} className="sp-table__row">
                            <td>{o.orderNumber}</td>
                            <td>{o.customerName}</td>
                            <td>{fmtDate(o.createdDate)}</td>
                            <td><span className={`so-badge ${(ORDER_STATUS_MAP[o.status] || {}).cls}`}>{ (ORDER_STATUS_MAP[o.status] || {}).text }</span></td>
                            <td><span className={`so-badge ${(PAYMENT_STATUS_MAP[o.paymentStatus] || {}).cls}`}>{ (PAYMENT_STATUS_MAP[o.paymentStatus] || {}).text }</span></td>
                            <td className="sp-td--actions" style={{ justifyContent: 'center' }}>
                                {/* NÚT CON MẮT XEM CHI TIẾT */}
                                <button
                                    className="btn-view-detail"
                                    onClick={() => setViewId(o.id)}
                                    title="Xem chi tiết"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>

                                <button className="btn-select-date" onClick={() => handleOpenAction(o)}>
                                    📅 Chọn ngày
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* POPUP CHỌN NGÀY VỚI NÚT LƯU VÀ HỦY */}
            {showActionPopup && (
                <div className="so-modal-overlay" onClick={() => setShowActionPopup(false)}>
                    <div className="so-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="so-modal-header">
                            <h3>Lập kế hoạch: {selectedOrder?.orderNumber}</h3>
                            <button className="close-btn" onClick={() => setShowActionPopup(false)}>✕</button>
                        </div>
                        <div className="so-modal-body">
                            <div className="date-selection-grid">
                                <div className="date-input-group">
                                    <label>Ngày bắt đầu dự kiến</label>
                                    <input type="date" value={plannedStartDate} onChange={e => setPlannedStartDate(e.target.value)} />
                                </div>
                                <div className="date-input-group">
                                    <label>Ngày kết thúc dự kiến</label>
                                    <input type="date" value={plannedEndDate} onChange={e => setPlannedEndDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-footer-btns">
                                <button className="btn-action-save" onClick={handleSave}>Lưu</button>
                                <button className="btn-action-cancel" onClick={() => setShowActionPopup(false)}>Hủy</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .sp-search-outer { position: relative; width: 66.66%; }
                .sp-search-container { display: flex; align-items: center; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 0 12px; height: 42px; }
                .sp-search-input { flex: 1; border: none; outline: none; padding: 0 10px; }
                .so-filter-dropdown-centered { position: absolute; top: 100%; left: 50%; transform: translateX(-50%); width: 100%; background: white; border: 1px solid #e2e8f0; z-index: 1000; padding: 15px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
                
                /* Nút con mắt xem chi tiết */
                .btn-view-detail {
                    background: white; color: #64748b; border: 1px solid #e2e8f0;
                    padding: 8px; border-radius: 8px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s;
                    margin-right: 8px; /* Khoảng cách với nút chọn ngày */
                }
                .btn-view-detail:hover {
                    background: #f8fafc; border-color: #cbd5e1; color: #1e293b;
                }

                .btn-select-date { 
                    background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd; 
                    padding: 8px 12px; border-radius: 8px; font-weight: 600; cursor: pointer;
                }

                .so-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
                .so-modal-box { background: white; width: 380px; border-radius: 12px; overflow: hidden; }
                .so-modal-header { padding: 12px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
                .so-modal-body { padding: 20px; }
                
                .date-selection-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 25px; }
                .date-input-group label { display: block; font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
                .date-input-group input { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; outline: none; }
                
                .modal-footer-btns { display: flex; gap: 12px; justify-content: flex-end; }
                .btn-action-save { padding: 10px 24px; background: #7c3aed; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .btn-action-cancel { padding: 10px 24px; background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #94a3b8; }
            `}</style>
        </div>
    );
};