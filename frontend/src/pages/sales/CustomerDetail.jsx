import { useState, useEffect } from "react";
import "./SalesPages.css";
import "./AddForm.css";
import "./CreateForms.css";
import crmService from "../../services/crmService";
import customerService from "../../services/customerService";
import salesOrderService, { ORDER_STATUS_MAP } from "../../services/salesOrderService";
import quotationService from "../../services/quotationService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";

export const CustomerDetail = ({ customerId, onBack }) => {
    const [activeTab, setActiveTab] = useState("info"); // info, interactions, orders, quotes
    const [customer, setCustomer] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [orders, setOrders] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form tương tác mới
    const [showLogForm, setShowLogForm] = useState(false);
    const [logForm, setLogForm] = useState({ type: "NOTE", content: "", reminderDate: "" });

    useEffect(() => {
        if (!customerId) return;
        
        const loadInitial = async () => {
             try {
                const data = await customerService.getById(customerId);
                setCustomer(data);
             } catch(e) { console.error(e); }
        };
        loadInitial();
    }, [customerId]);

    useEffect(() => {
        if (!customerId) return;
        if (activeTab === "interactions") {
            setLoading(true);
            crmService.getInteractions(customerId)
                .then(setInteractions)
                .finally(() => setLoading(false));
        } else if (activeTab === "orders") {
            setLoading(true);
            salesOrderService.getAll({ customerId: customerId })
                .then(setOrders)
                .finally(() => setLoading(false));
        } else if (activeTab === "quotes") {
            setLoading(true);
            quotationService.getAll({ customerId: customerId })
                .then(setQuotes)
                .finally(() => setLoading(false));
        }
    }, [activeTab, customerId]);

    const handleAddLog = async () => {
        if (!logForm.content) return;
        try {
            await crmService.addInteraction({
                customerId: customer.id,
                ...logForm,
                reminderDate: logForm.reminderDate ? logForm.reminderDate + ":00" : null
            });
            setLogForm({ type: "NOTE", content: "", reminderDate: "" });
            setShowLogForm(false);
            // Refresh
            const data = await crmService.getInteractions(customer.id);
            setInteractions(data);
        } catch (e) {
            alert("Lỗi khi lưu tương tác");
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

    if (!customer && !loading) return <div className="cf-loading" style={{padding: 100}}><div className="cf-spinner"></div><span>Đang tải thông tin...</span></div>;
    if (!customer) return null;

    return (
        <div className="sp-page" style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            {/* Header / Breadcrumb */}
            <div className="sp-page-header" style={{ marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button className="af-btn-cancel" onClick={onBack} style={{ padding: '8px 12px' }}>
                        ← 
                    </button>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                        {customer.name?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="sp-title" style={{ fontSize: 22, marginBottom: 2 }}>{customer.name}</h1>
                        <p className="sp-sub" style={{ margin: 0 }}>Mã KH: {customer.taxCode || '—'} • Loại: {customer.customerType === 'RETAIL' ? 'Khách lẻ' : 'Đại lý'} • Phụ trách: {customer.assignedTo?.fullname || 'Chưa gán'}</p>
                    </div>
                </div>
            </div>

            <div className="sp-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
                {/* Tabs Navigation */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', background: '#f8fafc' }}>
                    <button onClick={() => setActiveTab("info")} style={tabStyle(activeTab === "info")}>Thông tin chung</button>
                    <button onClick={() => setActiveTab("interactions")} style={tabStyle(activeTab === "interactions")}>Nhật ký & Nhắc hẹn</button>
                    <button onClick={() => setActiveTab("orders")} style={tabStyle(activeTab === "orders")}>Lịch sử mua hàng</button>
                    <button onClick={() => setActiveTab("quotes")} style={tabStyle(activeTab === "quotes")}>Lịch sử báo giá</button>
                </div>

                <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
                    {activeTab === "info" && (
                        <div className="af-card">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                <div className="af-field">
                                    <label className="af-label" style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>Liên hệ & Định danh</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                        <InfoItem label="Số điện thoại" value={customer.phoneNumber} />
                                        <InfoItem label="Email" value={customer.email} />
                                        <InfoItem label="Loại khách hàng" value={customer.customerType === 'RETAIL' ? 'Khách lẻ' : customer.customerType === 'DISTRIBUTOR' ? 'Đại lý' : 'Công trình'} />
                                        <InfoItem label="Nguồn" value={customer.source} />
                                    </div>
                                </div>

                                <div className="af-field">
                                    <label className="af-label" style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>Tài chính & Phụ trách</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Dư nợ hiện tại</div>
                                            <div style={{ fontSize: 18, fontWeight: 700, color: '#e11d48' }}>{fmt(customer.currentDebt)}</div>
                                        </div>
                                        <InfoItem label="Hạn mức tín dụng" value={fmt(customer.creditLimit)} />
                                        <InfoItem label="Sale phụ trách" value={customer.assignedTo?.fullname || 'Chưa gán'} />
                                    </div>
                                </div>
                            </div>

                            <div className="af-field" style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed #e2e8f0' }}>
                                <label className="af-label" style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>Địa chỉ giao hàng / Văn phòng</label>
                                <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>{customer.address || 'Chưa cập nhật địa chỉ'}</div>
                            </div>
                        </div>
                    )}

                    {activeTab === "interactions" && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Dòng thời gian tương tác</h3>
                                <button className="af-btn-save af-btn-save--dark" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => setShowLogForm(!showLogForm)}>
                                    {showLogForm ? "Hủy" : "+ Ghi chú mới"}
                                </button>
                            </div>

                            {showLogForm && (
                                <div className="af-card" style={{ marginBottom: 24, border: '1px solid #7c3aed33', background: '#f8fafc' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <select className="af-input" value={logForm.type} onChange={e => setLogForm(p => ({ ...p, type: e.target.value }))}>
                                            <option value="NOTE">Ghi chú</option>
                                            <option value="CALL">Cuộc gọi</option>
                                            <option value="MEETING">Gặp mặt</option>
                                            <option value="EMAIL">Email</option>
                                        </select>
                                        <div style={{ position: 'relative' }}>
                                            <input className="af-input" type="datetime-local" value={logForm.reminderDate} onChange={e => setLogForm(p => ({ ...p, reminderDate: e.target.value }))} placeholder="Hẹn giờ nhắc" />
                                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Cài đặt nhắc hẹn (nếu cần)</div>
                                        </div>
                                    </div>
                                    <textarea className="af-textarea" placeholder="Nội dung trao đổi với khách hàng..." value={logForm.content} onChange={e => setLogForm(p => ({ ...p, content: e.target.value }))} />
                                    <button className="af-btn-save" style={{ width: '100%', marginTop: 12 }} onClick={handleAddLog}>Lưu nhật ký</button>
                                </div>
                            )}

                            {loading ? <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div> : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {interactions.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Chưa có lịch sử tương tác nào</div> : 
                                        interactions.map(it => (
                                            <div key={it.id} style={interactionCardStyle}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={badgeStyle(it.type)}>{it.type}</span>
                                                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(it.interactionDate)}</span>
                                                </div>
                                                <div style={{ fontSize: 14, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{it.content}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontSize: 11, color: '#64748b' }}>Bởi: <b>{it.staffName}</b></span>
                                                    {it.reminderDate && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ fontSize: 11, color: it.isResolved ? '#059669' : '#e11d48', fontWeight: 600 }}>
                                                                🔔 Hẹn: {fmtDate(it.reminderDate)} {it.isResolved ? '(Đã xong)' : ''}
                                                            </span>
                                                            {!it.isResolved && (
                                                                <button onClick={() => handleResolve(it.id)} style={{ fontSize: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: 4, cursor: 'pointer' }}>Xong</button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "orders" && (
                        <div>
                            {loading ? <div className="cf-loading"><div className="cf-spinner"></div></div> : (
                                <div className="af-card" style={{ padding: 0 }}>
                                    <table className="sp-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Mã đơn</th>
                                                <th>Ngày tạo</th>
                                                <th>Giá trị</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!orders.content || orders.content.length === 0) ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có đơn hàng nào</td></tr> : 
                                                orders.content.map(o => (
                                                    <tr key={o.id}>
                                                        <td style={{ fontWeight: 600, color: '#7c3aed' }}>{o.orderNumber}</td>
                                                        <td>{new Date(o.createdDate).toLocaleDateString("vi-VN")}</td>
                                                        <td style={{ fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                                                        <td>
                                                            <span className={`sp-badge-status ${ORDER_STATUS_MAP[o.status]?.cls}`}>
                                                                {ORDER_STATUS_MAP[o.status]?.text || o.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "quotes" && (
                        <div>
                            {loading ? <div className="cf-loading"><div className="cf-spinner"></div></div> : (
                                <div className="af-card" style={{ padding: 0 }}>
                                    <table className="sp-table" style={{ margin: 0 }}>
                                        <thead>
                                            <tr>
                                                <th>Mã báo giá</th>
                                                <th>Ngày tạo</th>
                                                <th>Hết hạn</th>
                                                <th>Tổng cộng</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(!quotes.content || quotes.content.length === 0) ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có báo giá nào</td></tr> : 
                                                quotes.content.map(q => (
                                                    <tr key={q.id}>
                                                        <td style={{ fontWeight: 600, color: '#0ea5e9' }}>{q.quotationNumber}</td>
                                                        <td>{new Date(q.createdDate).toLocaleDateString("vi-VN")}</td>
                                                        <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("vi-VN") : "—"}</td>
                                                        <td style={{ fontWeight: 600 }}>{fmt(q.totalAmount)}</td>
                                                        <td>
                                                            <span className={`sp-badge-status status-${q.status?.toLowerCase()}`}>
                                                                {q.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const tabStyle = (isActive) => ({
    padding: '16px 20px',
    border: 'none',
    background: 'none',
    fontSize: 14,
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#7c3aed' : '#64748b',
    borderBottom: isActive ? '3px solid #7c3aed' : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
});

const infoItemStyle = { display: 'flex', flexDirection: 'column', gap: 4 };
const InfoItem = ({ label, value }) => (
    <div style={infoItemStyle}>
        <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{value || '—'}</div>
    </div>
);

const interactionCardStyle = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const badgeStyle = (type) => ({
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 6,
    background: type === 'CALL' ? '#dcfce7' : type === 'MEETING' ? '#fef9c3' : type === 'EMAIL' ? '#dbeafe' : '#f1f5f9',
    color: type === 'CALL' ? '#166534' : type === 'MEETING' ? '#854d0e' : type === 'EMAIL' ? '#1e40af' : '#475569',
    textTransform: 'uppercase'
});
