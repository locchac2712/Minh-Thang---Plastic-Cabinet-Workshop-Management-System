import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import "./CreateForms.css";
import "./CustomerDetail.css";
import crmService from "../../services/crmService";
import customerService from "../../services/customerService";
import salesOrderService, { ORDER_STATUS_MAP } from "../../services/salesOrderService";
import quotationService from "../../services/quotationService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";

export const CustomerDetail = ({ customerId, onBack, onEdit }) => {
    const [activeTab, setActiveTab] = useState("orders"); // orders, debt, timeline, quotes
    const [customer, setCustomer] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // UI states
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [newNote, setNewNote] = useState({ type: 'NOTE', content: '', reminderDate: '' });
    const [savingNote, setSavingNote] = useState(false);

    // Stats calculation
    const [stats, setStats] = useState({ totalOrderValue: 0, completedOrders: 0 });

    useEffect(() => {
        if (!customerId) return;

        setLoading(true);
        Promise.all([
            customerService.getById(customerId).then(setCustomer),
            crmService.getInteractions(customerId).then(setInteractions),
            salesOrderService.getAll({ customerId: customerId }).then(data => {
                setOrders(data);
                if (data?.content) {
                    const completed = data.content.filter(o => o.status === 'DELIVERED');
                    const value = data.content.filter(o => o.status !== 'CANCELLED').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                    setStats({ totalOrderValue: value, completedOrders: completed.length });
                }
            }),
            quotationService.getAll({ customerId: customerId }).then(setQuotes),
            crmService.getTransactions(customerId).then(setPayments)
        ]).catch(err => {
            console.error(err);
            setError("Không thể tải dữ liệu khách hàng. Vui lòng thử lại.");
        }).finally(() => setLoading(false));
    }, [customerId]);

    const handleAddNote = async () => {
        if (!newNote.content.trim()) return alert("Vui lòng nhập nội dung");
        setSavingNote(true);
        try {
            await crmService.addInteraction({
                customerId: customerId,
                ...newNote
            });
            const updated = await crmService.getInteractions(customerId);
            setInteractions(updated);
            setShowNoteModal(false);
            setNewNote({ type: 'NOTE', content: '', reminderDate: '' });
        } catch (e) {
            alert("Lỗi khi lưu ghi chú");
        } finally {
            setSavingNote(false);
        }
    };

    const handleResolve = async (id) => {
        try {
            await crmService.resolveReminder(id);
            setInteractions(prev => prev.map(it => it.id === id ? { ...it, isResolved: true } : it));
        } catch (e) {
            alert("Lỗi khi cập nhật");
        }
    };

    if (error) return (
        <div style={{ padding: '100px 32px', textAlign: 'center' }}>
            <div style={{ color: '#e11d48', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{error}</div>
            <button onClick={onBack} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Quay lại</button>
        </div>
    );
    if (!customer && !loading) return <div className="cf-loading" style={{ padding: 100 }}><div className="cf-spinner"></div><span>Đang tải thông tin...</span></div>;
    if (!customer) return null;

    if (!customer && !loading) return <div className="cf-loading" style={{ padding: 100 }}><div className="cf-spinner"></div><span>Đang tải thông tin...</span></div>;
    if (!customer) return null;

    const rawOrders = orders?.content || (Array.isArray(orders) ? orders : []);
    const ordersList = rawOrders.length === 0 ? [
        { id: 101, orderNumber: 'DH-2023-001', createdDate: '2023-11-20T10:00:00', totalAmount: 45000000, status: 'COMPLETED' },
        { id: 102, orderNumber: 'DH-2023-015', createdDate: '2023-10-15T14:30:00', totalAmount: 125000000, status: 'DELIVERED' },
        { id: 103, orderNumber: 'DH-2023-088', createdDate: '2023-09-02T08:15:00', totalAmount: 8500000, status: 'CANCELLED' }
    ] : rawOrders;

    const totalOrderValue = ordersList.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const completedOrdersCount = ordersList.filter(o => ["COMPLETED", "DELIVERED"].includes(o.status)).length;

    const rawInteractions = Array.isArray(interactions) ? interactions : [];
    const interactionList = rawInteractions.length === 0 ? [
        { id: 201, type: 'CALL', content: 'Cuộc gọi tư vấn đơn hàng mới', interactionDate: '2023-11-25T10:30:00', staffName: 'Trần Văn A' },
        { id: 202, type: 'EMAIL', content: 'Gửi báo giá số MT-2023-102', interactionDate: '2023-10-24T15:15:00', staffName: 'Hệ thống' },
        { id: 203, type: 'MEETING', content: 'Thanh toán công nợ đợt 2', interactionDate: '2023-10-20T09:00:00', staffName: 'Kế toán' }
    ] : rawInteractions;
    const latestInteractions = interactionList.slice(0, 3);

    return (
        <div className="cd-container">
            {/* Header */}
            <header className="cd-header">
                <div className="cd-header-left">
                    <div className="cd-avatar">
                        {customer.name?.[0].toUpperCase()}
                    </div>
                    <div className="cd-customer-info">
                        <h1>
                            {customer.name}
                            <span className="cd-status-badge">{customer.active ? "Hoạt động" : "Ngừng hoạt động"}</span>
                        </h1>
                        <div className="cd-customer-meta">
                            Mã KH: <span className="cd-customer-id">{customer.taxCode || "MT-TEMP-" + customer.id}</span> •
                            Phụ trách: <b>{customer.assignedTo?.fullname || "Chưa gán"}</b>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="cd-edit-btn" onClick={onBack} style={{ background: '#f1f5f9', color: '#64748b', border: '1.5px solid #e2e8f0' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        Đóng
                    </button>
                    <button className="cd-edit-btn" onClick={() => onEdit && onEdit(customer.id)} style={{ background: '#003366', color: '#fff', border: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Chỉnh sửa
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="cd-stats-row">
                {activeTab === "debt" ? (
                    <>
                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Tổng dư nợ</span>
                                <div className="cd-stat-icon-box" style={{ background: '#f0f9ff', color: '#1e40af' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M10 3l-7 7h14l-7-7z" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value">{fmt(customer.currentDebt)}</div>
                            <div className="cd-stat-sub">Bao gồm 3 hóa đơn chưa tất toán</div>
                        </div>
                        <div className="cd-stat-card debt-overdue">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Nợ quá hạn</span>
                                <div className="cd-stat-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value" style={{ color: '#ef4444' }}>{fmt(25000000)}</div>
                            <div className="cd-stat-sub" style={{ color: '#ef4444' }}>Quá hạn: 12 ngày</div>
                        </div>
                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Hạn mức tín dụng</span>
                                <div className="cd-stat-icon-box" style={{ background: '#fff7ed', color: '#92400e' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value">{fmt(customer.creditLimit)}</div>
                            <div className="cd-stat-sub">Khả dụng: {fmt(customer.creditLimit - (customer.currentDebt || 0))}</div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Tổng giá trị đơn</span>
                                <div className="cd-stat-icon-box" style={{ background: '#f0f9ff', color: '#0ea5e9' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value">{fmt(totalOrderValue)}</div>
                            <div className="cd-stat-sub up">↑ 12.5% so với năm ngoái</div>
                        </div>

                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Công nợ hiện tại</span>
                                <div className="cd-stat-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value" style={{ color: '#e11d48' }}>{fmt(customer.currentDebt)}</div>
                            <div className="cd-stat-sub">Hạn thanh toán: 15/11/2023</div>
                        </div>

                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Đơn hoàn thành</span>
                                <div className="cd-stat-icon-box" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value">{completedOrdersCount}</div>
                            <div className="cd-stat-sub">Tỷ lệ hủy: 0.2%</div>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="cd-main-grid">
                {/* Main Content */}
                <div className="cd-content-area">
                    <div className="cd-tabs">
                        <button className={`cd-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Lịch sử đơn hàng</button>
                        <button className={`cd-tab-btn ${activeTab === 'debt' ? 'active' : ''}`} onClick={() => setActiveTab('debt')}>Công nợ</button>
                        <button className={`cd-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Ghi chú & Timeline</button>
                        <button className={`cd-tab-btn ${activeTab === 'quotes' ? 'active' : ''}`} onClick={() => setActiveTab('quotes')}>Báo giá liên quan</button>
                    </div>

                    <div className="cd-tab-content">
                        {activeTab === 'orders' && (
                            <table className="cd-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Ngày tạo</th>
                                        <th>Giá trị</th>
                                        <th>Trạng thái</th>
                                        <th style={{ textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ordersList.map(o => (
                                        <tr key={o.id}>
                                            <td style={{ fontWeight: 700, color: '#1d4ed8' }}>{o.orderNumber}</td>
                                            <td>{new Date(o.createdDate).toLocaleDateString("vi-VN")}</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                                            <td>
                                                <span className={`cd-badge-status ${o.status === 'COMPLETED' || o.status === 'DELIVERED' ? 'approved' : o.status === 'CANCELLED' ? 'overdue' : ''}`} style={{ fontSize: 11 }}>
                                                    {o.status === 'COMPLETED' ? 'HOÀN TẤT' : o.status === 'DELIVERED' ? 'ĐÃ GIAO' : o.status === 'CANCELLED' ? 'ĐÃ HỦY' : o.status}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button className="sp-action-btn" title="Xem chi tiết">
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'debt' && (
                            <div className="cd-tab-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Danh sách hóa đơn chưa thanh toán</h3>
                                    <a href="#" className="cd-export-link">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                                        Xuất sao kê
                                    </a>
                                </div>
                                <table className="cd-table">
                                    <thead>
                                        <tr>
                                            <th>Ngày hóa đơn</th>
                                            <th>Số tham chiếu</th>
                                            <th>Tổng tiền</th>
                                            <th>Đã trả</th>
                                            <th>Còn lại</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>15/10/2023</td>
                                            <td style={{ fontWeight: 700, color: '#1e293b' }}>INV-2023-088</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(85000000)}</td>
                                            <td>{fmt(60000000)}</td>
                                            <td style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(25000000)}</td>
                                            <td><span className="cd-badge-status overdue">QUÁ HẠN</span></td>
                                        </tr>
                                        <tr>
                                            <td>22/10/2023</td>
                                            <td style={{ fontWeight: 700, color: '#1e293b' }}>INV-2023-092</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(120000000)}</td>
                                            <td>{fmt(0)}</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(120000000)}</td>
                                            <td><span className="cd-badge-status pending-pay">CHỜ THANH TOÁN</span></td>
                                        </tr>
                                        <tr>
                                            <td>05/11/2023</td>
                                            <td style={{ fontWeight: 700, color: '#1e293b' }}>INV-2023-105</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(5000000)}</td>
                                            <td>{fmt(0)}</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(5000000)}</td>
                                            <td><span className="cd-badge-status pending-pay">CHỜ THANH TOÁN</span></td>
                                        </tr>
                                    </tbody>
                                </table>

                                <h3 className="cd-payment-list-title">Lịch sử thanh toán gần đây</h3>
                                <div className="cd-payment-grid">
                                    <div className="cd-payment-card">
                                        <div className="cd-payment-icon" style={{ background: '#f0fdf4', color: '#166534' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        <div className="cd-payment-info">
                                            <div className="cd-payment-title">Thanh toán {fmt(60000000)}</div>
                                            <div className="cd-payment-meta">25/10/2023 • Chuyển khoản (Techcombank)</div>
                                        </div>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                    <div className="cd-payment-card">
                                        <div className="cd-payment-icon" style={{ background: '#f0fdf4', color: '#166534' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        </div>
                                        <div className="cd-payment-info">
                                            <div className="cd-payment-title">Thanh toán {fmt(15000000)}</div>
                                            <div className="cd-payment-meta">10/10/2023 • Tiền mặt</div>
                                        </div>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div>
                                <div className="cd-timeline-input-container">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        Thêm ghi chú mới
                                    </div>
                                    <textarea
                                        className="cd-timeline-textarea"
                                        placeholder="Nhập nội dung tương tác hoặc ghi chú tại đây..."
                                        value={logForm.content}
                                        onChange={e => setLogForm(p => ({ ...p, content: e.target.value }))}
                                    />
                                    <div className="cd-timeline-input-footer">
                                        <button className="cd-btn-send" onClick={handleAddLog}>Gửi</button>
                                    </div>
                                </div>

                                <div className="cd-timeline-list">
                                    <div className="cd-timeline-today">HÔM NAY, 14:20</div>
                                    <div className="cd-timeline-item active">
                                        <div className="cd-timeline-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>
                                        <div className="cd-timeline-title">Ký kết hợp đồng khung năm 2024 (Contract signed)</div>
                                        <div className="cd-timeline-content">Hợp đồng nguyên tắc cung cấp hạt nhựa PP và PE cho năm 2024 đã được đại diện hai bên ký kết chính thức tại trụ sở khách hàng.</div>
                                        <div className="cd-timeline-meta">Nhân sự: <b>Trần Văn A (Trưởng phòng KD)</b></div>
                                    </div>

                                    <div className="cd-timeline-item">
                                        <div className="cd-timeline-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg></div>
                                        <div className="cd-timeline-today" style={{ marginBottom: 6 }}>28/10/2023, 09:30</div>
                                        <div className="cd-timeline-title">Thăm xưởng sản xuất mới (Site visit)</div>
                                        <div className="cd-timeline-content">Đoàn khảo sát của công ty đã đến thăm quan hệ thống máy ép nhựa mới tại KCN Tân Bình để đánh giá năng lực sản xuất thực tế.</div>
                                        <div className="cd-timeline-meta">Nhân sự: <b>Nguyễn Văn B (Kỹ thuật)</b></div>
                                    </div>

                                    <div className="cd-timeline-item">
                                        <div className="cd-timeline-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
                                        <div className="cd-timeline-today" style={{ marginBottom: 6 }}>24/10/2023, 15:15</div>
                                        <div className="cd-timeline-title">Gửi báo giá số MT-2023-102 (Quote sent)</div>
                                        <div className="cd-timeline-content">Đã gửi email báo giá chi tiết cho lô hàng 50 tấn hạt nhựa nguyên sinh HDPE. Khách hàng đang xem xét các điều khoản thanh toán.</div>
                                        <div className="cd-timeline-meta">Nhân sự: Hệ thống (Tự động)</div>
                                    </div>

                                    <div className="cd-timeline-item">
                                        <div className="cd-timeline-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div>
                                        <div className="cd-timeline-today" style={{ marginBottom: 6 }}>20/10/2023, 10:30</div>
                                        <div className="cd-timeline-title">Cuộc gọi tư vấn đơn hàng mới (Call for consultation)</div>
                                        <div className="cd-timeline-content">Tư vấn về dòng sản phẩm nhựa tái sinh thân thiện môi trường cho dự án gia dụng sắp tới của khách hàng.</div>
                                        <div className="cd-timeline-meta">Nhân sự: <b>Trần Văn A</b></div>
                                    </div>
                                </div>

                                <button className="cd-load-more">Tải thêm hoạt động ∨</button>
                            </div>
                        )}

                        {activeTab === 'quotes' && (
                            <div>
                                <table className="cd-table">
                                    <thead>
                                        <tr>
                                            <th>Số báo giá</th>
                                            <th>Ngày tạo</th>
                                            <th>Hạn hiệu lực</th>
                                            <th>Tổng giá trị</th>
                                            <th>Trạng thái</th>
                                            <th style={{ textAlign: 'center' }}>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: 700, color: '#1d4ed8' }}>BG-2023-110</td>
                                            <td>25/10/2023</td>
                                            <td>25/11/2023</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(42000000)}</td>
                                            <td><span className="cd-badge-status" style={{ background: '#f1f5f9', color: '#64748b' }}>BẢN NHÁP</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                    <button className="sp-action-btn" title="Xem báo giá">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="sp-action-btn" title="Tải xuống">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, color: '#1d4ed8' }}>BG-2023-102</td>
                                            <td>20/10/2023</td>
                                            <td>20/11/2023</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(120000000)}</td>
                                            <td><span className="cd-badge-status" style={{ background: '#fff7ed', color: '#f97316' }}>CHỜ DUYỆT</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                    <button className="sp-action-btn" title="Xem báo giá">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="sp-action-btn" title="Tải xuống">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, color: '#1d4ed8' }}>BG-2023-095</td>
                                            <td>15/10/2023</td>
                                            <td>15/11/2023</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(85000000)}</td>
                                            <td><span className="cd-badge-status approved">ĐÃ DUYỆT</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                    <button className="sp-action-btn" title="Xem báo giá">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="sp-action-btn" title="Tải xuống">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 700, color: '#1d4ed8' }}>BG-2023-088</td>
                                            <td>05/10/2023</td>
                                            <td>05/11/2023</td>
                                            <td style={{ fontWeight: 700 }}>{fmt(30500000)}</td>
                                            <td><span className="cd-badge-status overdue" style={{ textTransform: 'uppercase' }}>TỪ CHỐI</span></td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                    <button className="sp-action-btn" title="Xem báo giá">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button className="sp-action-btn" title="Tải xuống">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <a href="#" className="cd-view-all">Xem tất cả báo giá ∨</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <aside className="cd-sidebar">
                    {/* Contact Info */}
                    <section className="cd-sidebar-section">
                        <h2 className="cd-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            Thông tin liên hệ
                        </h2>

                        <div className="cd-contact-item">
                            <div className="cd-contact-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div>
                            <div>
                                <div className="cd-contact-label">Số điện thoại</div>
                                <div className="cd-contact-value">{customer.phoneNumber || "—"}</div>
                            </div>
                        </div>

                        <div className="cd-contact-item">
                            <div className="cd-contact-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg></div>
                            <div>
                                <div className="cd-contact-label">Email</div>
                                <div className="cd-contact-value">{customer.email || "—"}</div>
                            </div>
                        </div>

                        <div className="cd-contact-item">
                            <div className="cd-contact-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg></div>
                            <div>
                                <div className="cd-contact-label">Địa chỉ</div>
                                <div className="cd-contact-value">{customer.address || "—"}</div>
                            </div>
                        </div>
                    </section>

                    {/* Classification */}
                    <section className="cd-sidebar-section">
                        <h2 className="cd-section-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                            Phân loại khách hàng
                        </h2>
                        <div className="cd-class-grid">
                            <div className="cd-class-box">
                                <div className="cd-class-label">Loại khách</div>
                                <div className="cd-class-value">{customer.customerType === 'RETAIL' ? 'Khách lẻ' : 'Đại lý'}</div>
                            </div>
                            <div className="cd-class-box alt">
                                <div className="cd-class-label">Xếp hạng</div>
                                <div className="cd-class-value">Vàng (Gold)</div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Interactions */}
                    <section className="cd-sidebar-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 className="cd-section-title" style={{ marginBottom: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Tương tác gần đây
                            </h2>
                            <button className="sp-filter-btn" style={{ fontSize: 11, fontWeight: 700 }} onClick={() => setActiveTab('timeline')}>TẤT CẢ</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {latestInteractions.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 10 }}>Chưa có tương tác</div>
                            ) : (
                                latestInteractions.map(it => (
                                    <div key={it.id} style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', marginTop: 5, flexShrink: 0 }}></div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{it.type === 'CALL' ? 'Cuộc gọi tư vấn' : it.type === 'NOTE' ? 'Ghi chú mới' : it.content.substring(0, 20) + '...'}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(it.interactionDate)} • {it.staffName}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            {/* Note Modal */}
            {showNoteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: 450, borderRadius: 24, padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Thêm ghi chú mới</h2>
                            <button onClick={() => setShowNoteModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Loại tương tác</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                                    value={newNote.type}
                                    onChange={e => setNewNote({ ...newNote, type: e.target.value })}
                                >
                                    <option value="NOTE">Ghi chú nhanh</option>
                                    <option value="CALL">Cuộc gọi</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="MEETING">Họp mặt</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Nội dung chi tiết</label>
                                <textarea
                                    placeholder="Nhập nội dung tương tác hoặc ghi chú..."
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, minHeight: 120, resize: 'none', outline: 'none' }}
                                    value={newNote.content}
                                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Hẹn ngày xử lý (Nếu có)</label>
                                <input
                                    type="datetime-local"
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                                    value={newNote.reminderDate}
                                    onChange={e => setNewNote({ ...newNote, reminderDate: e.target.value })}
                                />
                            </div>

                            <button
                                onClick={handleAddNote}
                                disabled={savingNote}
                                style={{
                                    width: '100%', background: '#4f46e5', color: '#fff', border: 'none', padding: '14px',
                                    borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 8,
                                    opacity: savingNote ? 0.7 : 1
                                }}
                            >
                                {savingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

