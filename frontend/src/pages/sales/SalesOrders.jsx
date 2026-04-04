import React, { useState, useEffect } from "react";
import "./SalesPages.css";
// Giả định bạn đã có component SalesOrderDetail, nếu chưa hãy comment dòng này lại
import { SalesOrderDetail } from "./SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ApprovalModal } from "./ApprovalModal";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";
import manufactureOrderService from "../../services/manufactureOrderService.js";
import { CreateOrder } from "./CreateOrder.jsx";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_VN = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const SHIFTS = [
    { id: "morning", label: "Ca sáng", sub: "8:00 – 12:00", startH: 8, endH: 12 },
    { id: "afternoon", label: "Ca chiều", sub: "13:00 – 17:00", startH: 13, endH: 17 },
];

const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

// Cập nhật logic kiểm tra nằm trong khoảng để chính xác hơn về mặt thời gian
const isInRange = (date, start, end) => {
    if (!start || !end) return false;
    const d = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const s = new Date(start.setHours(0, 0, 0, 0)).getTime();
    const e = new Date(end.setHours(0, 0, 0, 0)).getTime();
    return d > s && d < e;
};

export const SalesOrders = () => {
    const { user } = useAuth();
    const [keyword, setKeyword] = useState("");
    const [payFilter, setPayFilter] = useState("");
    const [page, setPage] = useState(0);
    const [showFilters, setShowFilters] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [selectedForApproval, setSelectedForApproval] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [quickScheduleOrderId, setQuickScheduleOrderId] = useState(null);

    const isSalesStaff = user?.role === "ROLE_SALES_STAFF";
    const isSalesManager = user?.role === "ROLE_SALES_MANAGER";
    const isDirector = user?.role === "ROLE_DIRECTOR";
    const isProductionManager = user?.role === "ROLE_PRODUCTION_MANAGER";

    const { data, loading, error, refetch } = useSalesOrders({
        keyword: keyword || undefined,
        paymentStatus: payFilter || undefined,
        status: statusFilter || undefined,
        page, size: 10,
    });

    const handleApprovalSubmit = async (isApproved, limit, note) => {
        try {
            const payload = { isApproved, newCreditLimit: limit, approvalNote: note };
            await salesOrderService.processApproval(selectedForApproval.id, payload);
            alert(isApproved ? "Phê duyệt đơn hàng thành công!" : "Từ chối đơn hàng thành công!");
            setSelectedForApproval(null);
            refetch();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể xử lý"));
        }
    };

    const orders = data?.content ?? [];

    if (viewId) return (
        <SalesOrderDetail
            orderId={viewId}
            onBack={() => setViewId(null)}
            isSalesStaff={isSalesStaff}
            isSalesManager={isSalesManager}
            isDirector={isDirector}
            isProductionManager={isProductionManager}
        />
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div><h1 className="sp-title">Danh sách Đơn hàng</h1></div>
            </div>

            <div className="so-toolbar-wrap">
                <div className="sp-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input
                        placeholder="Tìm mã đơn hàng, khách hàng..."
                        value={keyword}
                        onChange={e => { setKeyword(e.target.value); setPage(0); }}
                    />
                    <button className={`sq-filter-toggle${showFilters ? " sq-filter-toggle--active" : ""}`} onClick={() => setShowFilters(!showFilters)} title="Lọc nâng cao">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    </button>
                </div>
                {isSalesStaff && (
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)} title="Tạo đơn hàng mới">
                        Tạo đơn hàng
                        <span className="sp-btn-plus">+</span>
                    </button>
                )}
            </div>

            {showFilters && (
                <div className="sq-filter-panel">
                    <div className="sq-f-group">
                        <label className="sq-f-label">Trạng thái</label>
                        <select className="sq-f-input" style={{ width: '100%' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="PROCESSING">Đang sản xuất</option>
                            <option value="DELIVERED">Đã giao</option>
                            <option value="CANCELLED">Hủy</option>
                            <option value="PENDING_APPROVAL">Chờ duyệt</option>
                        </select>
                    </div>
                    <div className="sq-f-group">
                        <label className="sq-f-label">Thanh toán</label>
                        <select className="sq-f-input" style={{ width: '100%' }} value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(0); }}>
                            <option value="">Tất cả thanh toán</option>
                            {Object.entries(PAYMENT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                        </select>
                    </div>
                    <div className="sq-f-group sq-f-group--btns">
                        <label className="sq-f-label">&nbsp;</label>
                        <button className="sq-btn-clear" onClick={() => { setKeyword(""); setStatusFilter(""); setPayFilter(""); setPage(0); }} title="Xóa bộ lọc">✕</button>
                    </div>
                </div>
            )}

            {(loading && orders.length === 0) && <div className="sp-state"><div className="sp-spinner" /><span>Đang tải danh sách đơn hàng...</span></div>}

            {error && !loading && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
            )}

            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Trạng thái</th><th>Thanh toán</th><th>Tổng tiền</th><th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan={7} className="sp-empty-row">
                                <div className="sq-empty">Không tìm thấy đơn hàng nào</div>
                            </td></tr>
                        ) : orders.map(o => {
                            const os = ORDER_STATUS_MAP[o.status?.trim()] || { text: o.status || "—", cls: "so-badge--default" };
                            const py = PAYMENT_STATUS_MAP[o.paymentStatus] || { text: o.paymentStatus || "—", cls: "so-badge--default" };
                            const canSchedule = !o.hasManufactureOrder && (o.paymentStatus === "PAID" || o.paymentStatus === "DEPOSITED");

                            return (
                                <tr key={o.id} className="sp-table__row">
                                    <td><span className="sq-quote-id">{o.orderNumber}</span></td>
                                    <td className="sp-td--name">{o.customerName}</td>
                                    <td>{fmtDate(o.createdDate)}</td>
                                    <td><span className={`sq-badge ${os.cls}`}>{os.text}</span></td>
                                    <td><span className={`sq-badge ${py.cls}`}>{py.text}</span></td>
                                    <td className="sp-td--price">{fmt(o.totalAmount)}</td>
                                    <td className="sp-td--actions">
                                        <button className="sp-action-btn" onClick={() => setViewId(o.id)} title="Xem chi tiết">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                        </button>
                                        {canSchedule && !isDirector && (
                                            <button className="sp-action-btn" onClick={() => setQuickScheduleOrderId(o.id)} title={isSalesStaff ? "Lập lịch giao hàng" : "Lập lịch sản xuất"}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            </button>
                                        )}
                                        {o.status === "PENDING_APPROVAL" && isSalesManager && (
                                            <button className="sp-action-btn" style={{ color: '#3b82f6' }} onClick={() => alert("Đã gửi thông báo yêu cầu phê duyệt tới Giám đốc!")} title="Gửi yêu cầu phê duyệt">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                            </button>
                                        )}
                                        {o.status === "PENDING_APPROVAL" && isDirector && (
                                            <button className="sp-action-btn" style={{ color: '#7c3aed' }} onClick={() => setSelectedForApproval(o)} title="Phê duyệt">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {data && data.totalPages > 1 && (
                    <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: page === 0 ? "#f3f4f6" : "white", cursor: page === 0 ? "not-allowed" : "pointer" }}
                        >
                            ‹ Trước
                        </button>
                        <span>Trang {page + 1} / {data.totalPages}</span>
                        <button
                            onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
                            disabled={page >= data.totalPages - 1}
                            style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: page >= data.totalPages - 1 ? "#f3f4f6" : "white", cursor: page >= data.totalPages - 1 ? "not-allowed" : "pointer" }}
                        >
                            Sau ›
                        </button>
                    </div>
                )}
            </div>

            {selectedForApproval && (
                <ApprovalModal
                    order={selectedForApproval}
                    onClose={() => setSelectedForApproval(null)}
                    onSubmit={handleApprovalSubmit}
                />
            )}

            {quickScheduleOrderId != null && (
                <QuickScheduleModal
                    orderId={quickScheduleOrderId}
                    onClose={() => {
                        setQuickScheduleOrderId(null);
                        refetch(); // Quan trọng: Cập nhật lại trạng thái hasManufactureOrder từ server
                    }}
                />
            )}

            {showCreate && <CreateOrder onBack={() => setShowCreate(false)} />}
        </div>
    );
};

/* ================= COMPONENT HỖ TRỢ ================= */

const ShiftSelector = ({ label, onPick, selectedShiftId }) => {
    return (
        <div className="so-shift-group">
            <div className="so-shift-label">{label}</div>
            <div className="so-shift-grid">
                {SHIFTS.map(s => {
                    const isSelected = selectedShiftId === s.id;
                    const Icon = s.id === "morning" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    );

                    return (
                        <button
                            key={s.id}
                            type="button"
                            className={`so-shift-card ${isSelected ? 'so-shift-card--active' : ''}`}
                            onClick={() => onPick(s)}
                        >
                            <div className="so-shift-card__icon">{Icon}</div>
                            <div className="so-shift-card__content">
                                <div className="so-shift-card__title">{s.label}</div>
                                <div className="so-shift-card__time">{s.sub}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const RangeCalendarPicker = ({ startDate, endDate, onRangeChange, busyDates }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const handleDayClick = (dayNum) => {
        const clickedDate = new Date(year, month, dayNum);

        if (!startDate || (startDate && endDate)) {
            // Trường hợp bắt đầu chọn mới hoặc chọn lại từ đầu
            onRangeChange(clickedDate, null);
        } else {
            // Đã có startDate, giờ chọn endDate
            if (clickedDate < startDate) {
                // Nếu click ngày trước startDate thì đặt ngày đó làm startDate mới
                onRangeChange(clickedDate, null);
            } else {
                onRangeChange(startDate, clickedDate);
            }
        }
    };

    return (
        <div className="so-calendar">
            <div className="so-calendar-header">
                <button
                    type="button"
                    className="so-calendar-nav"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <div className="so-calendar-title">{MONTH_VN[month]} {year}</div>
                <button
                    type="button"
                    className="so-calendar-nav"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            </div>

            <div className="so-calendar-grid">
                {DAY_NAMES.map(d => (
                    <div key={d} className="so-calendar-weekday">{d}</div>
                ))}

                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`e-${i}`} className="so-calendar-day--empty" />)}

                {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(year, month, i + 1);
                    const isStart = isSameDay(date, startDate);
                    const isEnd = isSameDay(date, endDate);
                    const inRange = isInRange(new Date(date), startDate, endDate);
                    const isToday = isSameDay(date, new Date());
                    const isSunday = date.getDay() === 0;

                    const isBusy = busyDates.some(busy => {
                        const busyStart = new Date(busy.startDate);
                        const busyEnd = new Date(busy.endDate);
                        return date >= busyStart && date <= busyEnd;
                    });

                    let dayCls = "so-calendar-day";
                    if (isStart) dayCls += " so-calendar-day--start";
                    if (isEnd) dayCls += " so-calendar-day--end";
                    if (inRange) dayCls += " so-calendar-day--range";
                    if (isToday) dayCls += " so-calendar-day--today";
                    if (isBusy) dayCls += " so-calendar-day--busy";
                    if (isSunday) dayCls += " so-calendar-day--sunday";

                    return (
                        <div
                            key={i}
                            className={dayCls}
                            onClick={() => !isBusy && handleDayClick(i + 1)}
                        >
                            <span className="so-calendar-day-num">{i + 1}</span>
                        </div>
                    );
                })}
            </div>
            <div className="so-calendar-footer">
                {!startDate ? "Chọn ngày bắt đầu" : !endDate ? "Chọn ngày kết thúc" : "Đã chọn xong khoảng ngày"}
            </div>
        </div>
    );
};

export const QuickScheduleModal = ({ orderId, onClose }) => {
    const [orderRef, setOrderRef] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startShift, setStartShift] = useState(null);
    const [endShift, setEndShift] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calendarData, setCalendarData] = useState([]);

    useEffect(() => {
        if (orderId) {
            salesOrderService.getById(orderId).then(setOrderRef).catch(console.error);
        }
        // Fetch calendar data to disable busy dates
        manufactureOrderService.getCalendar().then(setCalendarData).catch(console.error);
    }, [orderId]);

    const handleRangeChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        // Reset ca nếu ngày bị xóa
        if (!start) setStartShift(null);
        if (!end) setEndShift(null);
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !startShift || !endShift) {
            alert("Vui lòng chọn đầy đủ ngày và ca sản xuất!");
            return;
        }

        if (!orderRef || !orderRef.details || orderRef.details.length === 0) {
            alert("Không thể tải thông tin đơn hàng hoặc đơn hàng không có sản phẩm!");
            return;
        }

        const sDate = new Date(startDate);
        sDate.setHours(startShift.startH, 0, 0, 0);

        const eDate = new Date(endDate);
        eDate.setHours(endShift.endH, 0, 0, 0);

        if (eDate <= sDate) {
            alert("Thời gian kết thúc phải lớn hơn thời gian bắt đầu!");
            return;
        }

        setLoading(true);
        try {
            // Lập lịch cho tất cả sản phẩm trong đơn hàng
            const promises = orderRef.details.map(item =>
                manufactureOrderService.manualSchedule({
                    salesOrderId: orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    technicalNotes: "",
                    requestedStartDate: sDate.toISOString(),
                    requestedEndDate: eDate.toISOString(),
                })
            );
            await Promise.all(promises);
            alert("Lập lịch sản xuất thành công cho tất cả sản phẩm!");
            onClose();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể lập lịch"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sp-modal-overlay">
            <div className="sp-modal-content sp-modal--light" style={{ width: "500px" }}>
                <div className="sp-modal-header">
                    <span className="sp-modal-title">Lập lịch sản xuất</span>
                    <button className="sp-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="sp-modal-body">
                    <div className="info-box-light" style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", color: "#64748b" }}>Đơn hàng:</span>
                            <span className="so-order-id">{orderRef?.orderNumber || "..."}</span>
                        </div>
                        <div className="so-modal-product-summary">
                            {orderRef?.details?.map((item, idx) => (
                                <div key={idx} className="so-modal-product-item">
                                    <span className="so-modal-product-name">{item.productName}</span>
                                    <span className="so-modal-product-qty">x{item.quantity}</span>
                                </div>
                            ))}
                            {(!orderRef?.details || orderRef.details.length === 0) && (
                                <div className="so-modal-product-empty">Đang tải thông tin sản phẩm...</div>
                            )}
                        </div>
                    </div>

                    <RangeCalendarPicker
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={handleRangeChange}
                        busyDates={calendarData}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                        <div>
                            {startDate && (
                                <ShiftSelector
                                    label={`Bắt đầu (${fmtDate(startDate)})`}
                                    selectedShiftId={startShift?.id}
                                    onPick={setStartShift}
                                />
                            )}
                        </div>
                        <div>
                            {endDate && (
                                <ShiftSelector
                                    label={`Kết thúc (${fmtDate(endDate)})`}
                                    selectedShiftId={endShift?.id}
                                    onPick={setEndShift}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="sp-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : "Xác nhận lập lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
};
