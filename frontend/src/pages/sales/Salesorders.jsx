import { useState } from "react";
import "./SalesPages.css";
import { CreateOrder } from "./CreateOrder";
import { SalesOrderDetail } from "./SalesOrderDetail";
import { useAuth } from "../../context/AuthContext";

const STATUS_TABS = ["Tất cả","Chờ xác nhận","Đã xác nhận","Đang sản xuất","Sẵn giao","Đã giao","Đã hủy"];

const ORDER_STATUS = {
    PENDING:    { text: "Chờ xác nhận",  cls: "so-badge--pending"    },
    CONFIRMED:  { text: "Đã xác nhận",   cls: "so-badge--confirmed"  },
    PRODUCING:  { text: "Đang sản xuất", cls: "so-badge--producing"  },
    READY:      { text: "Sẵn giao",      cls: "so-badge--ready"      },
    DELIVERED:  { text: "Đã giao",       cls: "so-badge--delivered"  },
    CANCELLED:  { text: "Đã hủy",        cls: "so-badge--cancelled"  },
};

const PRODUCTION_STATUS = {
    NOT_STARTED: { text: "Chưa bắt đầu", cls: "so-badge--pending"   },
    IN_PROGRESS: { text: "Đang sản xuất",cls: "so-badge--producing"  },
    COMPLETED:   { text: "Hoàn thành",   cls: "so-badge--delivered"  },
    ON_HOLD:     { text: "Tạm dừng",     cls: "so-badge--cancelled"  },
};

const DELIVERY_STATUS = {
    PENDING:   { text: "Chờ giao",   cls: "so-badge--pending"   },
    SHIPPING:  { text: "Đang giao",  cls: "so-badge--producing" },
    DELIVERED: { text: "Đã giao",   cls: "so-badge--delivered"  },
    FAILED:    { text: "Giao thất bại", cls: "so-badge--cancelled" },
};

const PAYMENT_STATUS = {
    UNPAID:    { text: "Chưa thanh toán", cls: "so-badge--pending"   },
    PARTIAL:   { text: "Thanh toán một phần", cls: "so-badge--producing" },
    PAID:      { text: "Đã thanh toán",  cls: "so-badge--delivered"  },
    REFUNDED:  { text: "Đã hoàn tiền",   cls: "so-badge--cancelled"  },
};

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// Mock data
const MOCK_ORDERS = [
    {
        id: 1, orderId: "SO-2026-0001",
        customerName: "Công ty TNHH Khách Hàng VIP",
        orderDate: "2026-03-10T08:00:00",
        orderStatus: "PRODUCING",
        productionStatus: "IN_PROGRESS",
        deliveryStatus: "PENDING",
        paymentStatus: "PARTIAL",
        totalAmount: 45_000_000,
        customer: { id: 1, name: "Công ty TNHH Khách Hàng VIP", email: "vip@company.com", phone: "0901234567", address: "123 Nguyễn Văn Linh, Q7, TP.HCM" },
        staff: { fullname: "Phạm Nhân Viên Sale" },
        note: "Khách cần giao trước 30/3",
        deliveryDate: "2026-03-30T00:00:00",
        deliveryAddress: "123 Nguyễn Văn Linh, Q7, TP.HCM",
        items: [
            { id: 1, productName: "Bàn làm việc Gỗ Sồi", productSku: "SP-BAN-001", quantity: 10, unitPrice: 2_500_000, totalLineAmount: 25_000_000 },
            { id: 2, productName: "Ghế xoay văn phòng cao cấp", productSku: "SP-GHE-001", quantity: 20, unitPrice: 1_000_000, totalLineAmount: 20_000_000 },
        ],
        productionProgress: [
            { stage: "Chuẩn bị nguyên liệu", status: "COMPLETED", date: "2026-03-11" },
            { stage: "Gia công sản phẩm", status: "IN_PROGRESS", date: "2026-03-13" },
            { stage: "Kiểm tra chất lượng", status: "NOT_STARTED", date: null },
            { stage: "Đóng gói", status: "NOT_STARTED", date: null },
        ],
        payments: [
            { date: "2026-03-10", amount: 20_000_000, method: "Chuyển khoản", note: "Đặt cọc 50%" },
        ],
    },
    {
        id: 2, orderId: "SO-2026-0002",
        customerName: "Anh Tuấn Mua Lẻ",
        orderDate: "2026-03-12T10:00:00",
        orderStatus: "CONFIRMED",
        productionStatus: "NOT_STARTED",
        deliveryStatus: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount: 3_200_000,
        customer: { id: 2, name: "Anh Tuấn Mua Lẻ", email: "tuan.anh@gmail.com", phone: "0988777666", address: "456 Lê Văn Việt, Q9, TP.HCM" },
        staff: { fullname: "Phạm Nhân Viên Sale" },
        note: "",
        deliveryDate: null,
        deliveryAddress: "456 Lê Văn Việt, Q9, TP.HCM",
        items: [
            { id: 3, productName: "Tủ hồ sơ 3 buồng Gỗ Công Nghiệp", productSku: "SP-TU-002", quantity: 1, unitPrice: 3_200_000, totalLineAmount: 3_200_000 },
        ],
        productionProgress: [
            { stage: "Chuẩn bị nguyên liệu", status: "NOT_STARTED", date: null },
            { stage: "Gia công sản phẩm", status: "NOT_STARTED", date: null },
            { stage: "Kiểm tra chất lượng", status: "NOT_STARTED", date: null },
            { stage: "Đóng gói", status: "NOT_STARTED", date: null },
        ],
        payments: [],
    },
];

const TAB_STATUS_MAP = {
    "Chờ xác nhận": "PENDING",
    "Đã xác nhận":  "CONFIRMED",
    "Đang sản xuất":"PRODUCING",
    "Sẵn giao":     "READY",
    "Đã giao":      "DELIVERED",
    "Đã hủy":       "CANCELLED",
};

export const SalesOrders = () => {
    const { user } = useAuth();
    const [tab,        setTab]        = useState("Tất cả");
    const [showCreate, setShowCreate] = useState(false);
    const [viewOrder,  setViewOrder]  = useState(null);

    const isSalesStaff = user?.role === "ROLE_SALES_STAFF";

    const filtered = tab === "Tất cả"
        ? MOCK_ORDERS
        : MOCK_ORDERS.filter(o => o.orderStatus === TAB_STATUS_MAP[tab]);

    if (showCreate) return <CreateOrder onBack={() => setShowCreate(false)} />;

    if (viewOrder) return (
        <SalesOrderDetail
            order={viewOrder}
            onBack={() => setViewOrder(null)}
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

            {/* Status tabs */}
            <div className="so-tabs">
                {STATUS_TABS.map(t => (
                    <button key={t} className={`so-tab${tab===t?" so-tab--active":""}`} onClick={() => setTab(t)}>{t}</button>
                ))}
            </div>

            {/* Table */}
            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                    <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Trạng thái đơn</th>
                        <th>Tiến độ SX</th>
                        <th>Giao hàng</th>
                        {isSalesStaff && <th>Thanh toán</th>}
                        <th>Tổng tiền</th>
                        <th>Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr><td colSpan={isSalesStaff ? 9 : 8} className="sp-empty-row">
                            <div className="sq-empty"><div className="sq-empty__icon">📋</div><p>Không có đơn hàng nào</p></div>
                        </td></tr>
                    ) : filtered.map(o => {
                        const os = ORDER_STATUS[o.orderStatus]      || { text: o.orderStatus,      cls: "" };
                        const ps = PRODUCTION_STATUS[o.productionStatus] || { text: o.productionStatus, cls: "" };
                        const ds = DELIVERY_STATUS[o.deliveryStatus]  || { text: o.deliveryStatus,  cls: "" };
                        const py = PAYMENT_STATUS[o.paymentStatus]   || { text: o.paymentStatus,   cls: "" };
                        return (
                            <tr key={o.id} className="sp-table__row">
                                <td><span className="so-order-id">{o.orderId}</span></td>
                                <td className="sp-td--name">{o.customerName}</td>
                                <td className="sp-td--muted">{fmtDate(o.orderDate)}</td>
                                <td><span className={`so-badge ${os.cls}`}>{os.text}</span></td>
                                <td><span className={`so-badge ${ps.cls}`}>{ps.text}</span></td>
                                <td><span className={`so-badge ${ds.cls}`}>{ds.text}</span></td>
                                {isSalesStaff && <td><span className={`so-badge ${py.cls}`}>{py.text}</span></td>}
                                <td className="sp-td--price">{fmt(o.totalAmount)}</td>
                                <td className="sp-td--actions">
                                    <button className="sp-action-btn" title="Xem chi tiết" onClick={() => setViewOrder(o)}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export { ORDER_STATUS, PRODUCTION_STATUS, DELIVERY_STATUS, PAYMENT_STATUS };