import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import "./CreateForms.css";
import "./CustomerDetail.css";
import crmService from "../../services/crmService";
import customerService from "../../services/customerService";
import salesOrderService from "../../services/salesOrderService";
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
                const rawData = data?.content || (Array.isArray(data) ? data : []);
                setOrders(rawData);
                const completed = rawData.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');
                const value = rawData.filter(o => o.status !== 'CANCELLED').reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
                setStats({ totalOrderValue: value, completedOrders: completed.length });
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

    if (error) return (
        <div style={{ padding: '100px 32px', textAlign: 'center' }}>
            <div style={{ color: '#e11d48', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{error}</div>
            <button onClick={onBack} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Quay lại</button>
        </div>
    );
    if (loading) return <div className="cf-loading" style={{ padding: 100 }}><div className="cf-spinner"></div><span>Đang tải thông tin...</span></div>;
    if (!customer) return null;

    const ordersList = orders;
    const interactionList = interactions;
    const latestInteractions = interactionList.slice(0, 3);
    const quotesList = Array.isArray(quotes) ? quotes : (quotes?.content || []);

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
                            <div className="cd-stat-sub">Công nợ hiện hành trên hệ thống</div>
                        </div>
                        <div className="cd-stat-card debt-overdue">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Nợ quá hạn</span>
                                <div className="cd-stat-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value" style={{ color: '#ef4444' }}>{fmt(0)}</div>
                            <div className="cd-stat-sub" style={{ color: '#ef4444' }}>Tạm tính theo ngày đến hạn</div>
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
                            <div className="cd-stat-value">{fmt(stats.totalOrderValue)}</div>
                            <div className="cd-stat-sub">Giá trị tích lũy từ các đơn hàng</div>
                        </div>

                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Công nợ hiện tại</span>
                                <div className="cd-stat-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value" style={{ color: '#e11d48' }}>{fmt(customer.currentDebt)}</div>
                            <div className="cd-stat-sub">Dư nợ cần thanh toán</div>
                        </div>

                        <div className="cd-stat-card">
                            <div className="cd-stat-header">
                                <span className="cd-stat-label">Đơn hoàn thành</span>
                                <div className="cd-stat-icon-box" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                            </div>
                            <div className="cd-stat-value">{stats.completedOrders}</div>
                            <div className="cd-stat-sub">Đã giao hàng và hoàn tất</div>
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

                    <div className="cd-tab-content" style={{ padding: 24, background: '#fff', borderRadius: '0 0 16px 16px', border: '1px solid #e2e8f0', borderTop: 'none', minHeight: 400 }}>
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
                                    {ordersList.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có lịch sử đơn hàng</td></tr>
                                    ) : (
                                        ordersList.map(o => (
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'debt' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Hóa đơn chưa thanh toán</h3>
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
                                        {payments.length === 0 ? (
                                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có phát sinh công nợ</td></tr>
                                        ) : (
                                            payments.map(p => (
                                                <tr key={p.id}>
                                                    <td>{new Date(p.interactionDate).toLocaleDateString("vi-VN")}</td>
                                                    <td style={{ fontWeight: 700 }}>{p.id}</td>
                                                    <td style={{ fontWeight: 700 }}>{fmt(p.amount)}</td>
                                                    <td>{fmt(0)}</td>
                                                    <td style={{ fontWeight: 700, color: '#ef4444' }}>{fmt(p.amount)}</td>
                                                    <td><span className="cd-badge-status pending-pay">CHỜ THANH TOÁN</span></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div>
                                <div className="cd-timeline-input-container" style={{ background: '#f8fafc', padding: 20, borderRadius: 16, marginBottom: 24, border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        Thêm ghi chú tương tác
                                    </div>
                                    <textarea
                                        className="cd-timeline-textarea"
                                        style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0', minHeight: 100, marginBottom: 12, outline: 'none' }}
                                        placeholder="Nhập nội dung tương tác..."
                                        value={newNote.content}
                                        onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            className="cd-btn-send" 
                                            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                                            onClick={handleAddNote}
                                            disabled={savingNote}
                                        >
                                            {savingNote ? "Đang lưu..." : "Gửi ghi chú"}
                                        </button>
                                    </div>
                                </div>

                                <div className="cd-timeline-list">
                                    {interactionList.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có hoạt động nào được ghi lại</div>
                                    ) : (
                                        interactionList.map((it, idx) => (
                                            <div key={it.id} className={`cd-timeline-item ${idx === 0 ? 'active' : ''}`}>
                                                <div className="cd-timeline-icon" style={{ background: '#4f46e5', color: '#fff' }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                                </div>
                                                <div className="cd-timeline-today">{fmtDate(it.interactionDate)}</div>
                                                <div className="cd-timeline-title">{it.type} • {it.staffName}</div>
                                                <div className="cd-timeline-content">{it.content}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'quotes' && (
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
                                    {quotesList.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có báo giá liên quan</td></tr>
                                    ) : (
                                        quotesList.map(q => (
                                            <tr key={q.id}>
                                                <td style={{ fontWeight: 700, color: '#1d4ed8' }}>{q.quoteNumber}</td>
                                                <td>{new Date(q.createdDate).toLocaleDateString("vi-VN")}</td>
                                                <td>{new Date(q.expiryDate).toLocaleDateString("vi-VN")}</td>
                                                <td style={{ fontWeight: 700 }}>{fmt(q.totalAmount)}</td>
                                                <td><span className={`cd-badge-status ${q.status === 'APPROVED' ? 'approved' : 'pending'}`}>{q.status}</span></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button className="sp-action-btn">
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                            Phân loại đối tác
                        </h2>
                        <div className="cd-class-grid">
                            <div className="cd-class-box" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                <div className="cd-class-label" style={{ color: '#1e40af' }}>Loại khách</div>
                                <div className="cd-class-value" style={{ color: '#1e3a8a' }}>{customer.customerType?.name || "Chưa phân loại"}</div>
                            </div>
                            <div className="cd-class-box alt" style={{ background: '#fdf2f8', border: '1px solid #fbcfe8' }}>
                                <div className="cd-class-label" style={{ color: '#9d174d' }}>Xếp hạng</div>
                                <div className="cd-class-value" style={{ color: '#831843' }}>Tiềm năng</div>
                            </div>
                        </div>
                        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b' }}>Mã loại:</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{customer.customerType?.code || "—"}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#64748b' }}>Khu vực:</span>
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{customer.area || "—"}</span>
                            </div>
                        </div>
                    </section>

                    {/* Recent Interactions */}
                    <section className="cd-sidebar-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 className="cd-section-title" style={{ marginBottom: 0 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Gần nhất
                            </h2>
                            <button className="sp-filter-btn" style={{ fontSize: 11, fontWeight: 700 }} onClick={() => setActiveTab('timeline')}>XEM TẤT CẢ</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {latestInteractions.length === 0 ? (
                                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: 10 }}>Chưa có tương tác</div>
                            ) : (
                                latestInteractions.map(it => (
                                    <div key={it.id} style={{ display: 'flex', gap: 12 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', marginTop: 5, flexShrink: 0 }}></div>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{it.type}</div>
                                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{it.content.substring(0, 40)}...</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{fmtDate(it.interactionDate)}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};
