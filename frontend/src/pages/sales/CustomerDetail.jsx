import { useState, useEffect } from "react";
import "./SalesPages.css";
import crmService from "../../services/crmService";
import customerService from "../../services/customerService";
import salesOrderService, { ORDER_STATUS_MAP } from "../../services/salesOrderService";
import quotationService from "../../services/quotationService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";

export const CustomerDetail = ({ customerId, onBack, onNavigate }) => {
    const [activeTab, setActiveTab] = useState("overview"); // overview, orders, transactions, quotes, notes
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
    if (!customer && !loading) return <div className="cf-loading" style={{padding: 100}}><div className="cf-spinner"></div><span>Đang tải thông tin...</span></div>;
    if (!customer) return null;

    const remainingCredit = (customer.creditLimit || 0) - (customer.currentDebt || 0);

    return (
        <div style={{ padding: '24px 32px', background: '#fafbfc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
            {/* 1. DASHBOARD HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ cursor: 'pointer', marginTop: 12, color: '#64748b' }} onClick={onBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: 1 }}>{customer.taxCode || 'CHƯA CÓ MÃ'}</span>
                            <span style={{ 
                                background: customer.active ? '#e0f2fe' : '#fee2e2', 
                                color: customer.active ? '#0369a1' : '#be123c', 
                                padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 
                            }}>
                                {customer.active ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
                            </span>
                        </div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>{customer.name}</h1>
                        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                            Hợp tác từ {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("vi-VN") : "—"} • Phụ trách: {customer.assignedTo?.fullName || customer.assignedTo?.fullname || 'Chưa gán'}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={() => onNavigate && onNavigate('edit-customer', customer.id)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Chỉnh sửa
                </button>
            </div>

            {/* MAIN DASHBOARD GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 340px) 1fr', gap: 24, alignItems: 'flex-start' }}>
                
                {/* L CỘT TRÁI - SIDEBAR CARDS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* Card 1: Thông tin liên hệ */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>THÔNG TIN LIÊN HỆ</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                            <ContactRow icon="✉️" label="Email giao dịch" value={customer.email} />
                            <ContactRow icon="📞" label="Số điện thoại" value={customer.phoneNumber} />
                            <ContactRow icon="📍" label="Địa chỉ văn phòng" value={customer.address} />
                        </div>
                    </div>

                    {/* Card 2: Phân loại */}
                    <div style={cardStyle}>
                        <h3 style={cardTitleStyle}>PHÂN LOẠI KHÁCH HÀNG</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                            <ClassBox active={customer.customerType === 'DISTRIBUTOR'} icon="🏢" name="Wholesale (Sỉ)" />
                            <ClassBox active={customer.customerType === 'RETAIL'} icon="👤" name="Retail (Lẻ)" />
                            <ClassBox active={customer.customerType === 'PROJECT'} icon="🏗️" name="Project (Dự án)" />
                        </div>
                    </div>

                </div>

                {/* R CỘT PHẢI - RIGHT MAIN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    
                    {/* STATS ROW */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        <div style={cardStyle}>
                            <h3 style={cardTitleStyle}>TỔNG GIÁ TRỊ ĐƠN HÀNG</h3>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>{fmt(stats.totalOrderValue)}</div>
                        </div>
                        <div style={cardStyle}>
                            <h3 style={cardTitleStyle}>CÔNG NỢ HIỆN TẠI</h3>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#e11d48', marginTop: 12 }}>{fmt(customer.currentDebt)}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>Hạn mức còn lại: {fmt(remainingCredit)}</div>
                        </div>
                        <div style={cardStyle}>
                            <h3 style={cardTitleStyle}>ĐƠN HÀNG HOÀN THÀNH</h3>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>{stats.completedOrders}</div>
                        </div>
                    </div>

                    {/* BIG TABBED CARD */}
                    <div style={{ ...cardStyle, padding: 0, minHeight: 400 }}>
                        {/* Tabs Navigation */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 16px', background: '#fff' }}>
                            <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Tổng quan</TabBtn>
                            <TabBtn active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>Đơn hàng</TabBtn>
                            <TabBtn active={activeTab === "quotes"} onClick={() => setActiveTab("quotes")}>Báo giá</TabBtn>
                            <TabBtn active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")}>Giao dịch</TabBtn>
                            <TabBtn active={activeTab === "notes"} onClick={() => setActiveTab("notes")}>Ghi chú & Timeline</TabBtn>
                        </div>

                        {/* Tab Content */}
                        <div style={{ padding: 32 }}>
                            {activeTab === "overview" && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                                    <div>
                                        <h3 style={cardTitleStyle}>CHI TIẾT ĐỊNH DANH</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
                                            <DetailItem label="Họ và tên" value={customer.name} bold />
                                            <DetailItem label="Mã số thuế" value={customer.taxCode} bold />
                                            <DetailItem label="Nguồn khách hàng" value={customer.source} />
                                            <DetailItem label="Ngày tạo hệ thống" value={fmtDate(customer.createdAt)} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 style={cardTitleStyle}>THÔNG SỐ TÍN DỤNG</h3>
                                        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, marginTop: 20, border: '1px solid #f1f5f9' }}>
                                            <DetailItem label="Dư nợ hiện tại" value={fmt(customer.currentDebt)} valueColor="#e11d48" large />
                                            <div style={{ marginTop: 20, marginBottom: 12 }}>
                                                <DetailItem label="Hạn mức cho phép" value={fmt(customer.creditLimit)} bold />
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', background: '#3b82f6', width: `${customer.creditLimit ? Math.min((customer.currentDebt/customer.creditLimit)*100, 100) : 0}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "orders" && (
                                <div>
                                    <table className="sp-table" style={{ margin: 0 }}>
                                        <thead><tr><th>Mã đơn</th><th>Ngày tạo</th><th>Giá trị</th><th>Trạng thái</th></tr></thead>
                                        <tbody>
                                            {(!orders.content || orders.content.length === 0) ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có đơn hàng nào</td></tr> : 
                                                orders.content.map(o => (
                                                    <tr key={o.id}>
                                                        <td style={{ fontWeight: 700, color: '#7c3aed' }}>{o.orderNumber}</td>
                                                        <td>{new Date(o.createdDate).toLocaleDateString("vi-VN")}</td>
                                                        <td style={{ fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                                                        <td><span className={`sp-badge-status ${ORDER_STATUS_MAP[o.status]?.cls}`}>{ORDER_STATUS_MAP[o.status]?.text || o.status}</span></td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === "quotes" && (
                                <div>
                                    <table className="sp-table" style={{ margin: 0 }}>
                                        <thead><tr><th>Mã báo giá</th><th>Ngày tạo</th><th>Hết hạn</th><th>Tổng cộng</th><th>Trạng thái</th></tr></thead>
                                        <tbody>
                                            {(!quotes.content || quotes.content.length === 0) ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có báo giá nào</td></tr> : 
                                                quotes.content.map(q => (
                                                    <tr key={q.id}>
                                                        <td style={{ fontWeight: 700, color: '#0ea5e9' }}>{q.quotationNumber}</td>
                                                        <td>{new Date(q.createdDate).toLocaleDateString("vi-VN")}</td>
                                                        <td>{q.validUntil ? new Date(q.validUntil).toLocaleDateString("vi-VN") : "—"}</td>
                                                        <td style={{ fontWeight: 600 }}>{fmt(q.totalAmount)}</td>
                                                        <td><span className={`sp-badge-status status-${q.status?.toLowerCase()}`}>{q.status}</span></td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === "transactions" && (
                                <div>
                                    <table className="sp-table" style={{ margin: 0 }}>
                                        <thead><tr><th>Ngày</th><th>Số tiền</th><th>Phương thức</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
                                        <tbody>
                                            {payments.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có giao dịch thanh toán nào</td></tr> : 
                                                payments.map(p => (
                                                    <tr key={p.id}>
                                                        <td>{fmtDate(p.transactionDate || p.payosPaidAt)}</td>
                                                        <td style={{ fontWeight: 700, color: '#16a34a' }}>{fmt(p.amount)}</td>
                                                        <td style={{ fontSize: 13 }}>{p.paymentMethod} {p.payosPaymentType ? `(${p.payosPaymentType})` : ''}</td>
                                                        <td style={{ fontSize: 13, color: '#64748b' }}>{p.salesOrder?.orderNumber ? `Đơn hàng: ${p.salesOrder.orderNumber}` : '—'}</td>
                                                        <td>
                                                            <span className={`sp-badge-status status-${p.payosStatus?.toLowerCase() || 'success'}`}>
                                                                {p.payosStatus || 'SUCCESS'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button 
                                            onClick={() => setShowNoteModal(true)}
                                            style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                                            Thêm ghi chú
                                        </button>
                                    </div>
                                    {interactions.length === 0 ? <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Chưa có lịch sử.</div> : 
                                        interactions.map(it => (
                                            <div key={it.id} style={{ padding: 16, border: '1px solid #f1f5f9', borderRadius: 12, background: '#fff' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#f1f5f9', color: '#475569' }}>{it.type}</span>
                                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{fmtDate(it.interactionDate)}</span>
                                                </div>
                                                <div style={{ fontSize: 14, color: '#0f172a' }}>{it.content}</div>
                                                {it.reminderDate && !it.isResolved && (
                                                    <button onClick={() => handleResolve(it.id)} style={{ marginTop: 12, fontSize: 12, background: '#e11d48', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>Đánh dấu hoàn thành</button>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}

                        </div>
                    </div>
                </div>

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
                                    onChange={e => setNewNote({...newNote, type: e.target.value})}
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
                                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Hẹn ngày xử lý (Nếu có)</label>
                                <input 
                                    type="datetime-local" 
                                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                                    value={newNote.reminderDate}
                                    onChange={e => setNewNote({...newNote, reminderDate: e.target.value})}
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

// --- STYLES & SUB-COMPONENTS ---

const cardStyle = {
    background: '#fff',
    borderRadius: 20,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    border: '1px solid #f8fafc'
};

const cardTitleStyle = {
    fontSize: 12,
    fontWeight: 800,
    color: '#94a3b8',
    letterSpacing: 1,
    margin: 0,
    textTransform: 'uppercase'
};

const ContactRow = ({ icon, label, value }) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 40, height: 40, background: '#f8fafc', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#4f46e5' }}>{icon}</div>
        <div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{value || '—'}</div>
        </div>
    </div>
);

const ClassBox = ({ active, icon, name }) => (
    <div style={{ 
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
        borderRadius: 16, border: `2px solid ${active ? '#4f46e5' : '#f8fafc'}`, 
        background: active ? '#fff' : '#f8fafc',
        boxShadow: active ? '0 8px 20px -4px rgba(79, 70, 229, 0.1)' : 'none',
        transition: 'all 0.2s', opacity: active ? 1 : 0.6
    }}>
        <div style={{ fontSize: 24 }}>{icon}</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: active ? '#0f172a' : '#64748b' }}>{name}</div>
    </div>
);

const TabBtn = ({ active, children, onClick }) => (
    <button 
        onClick={onClick}
        style={{ 
            padding: '20px 24px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: active ? 700 : 500, color: active ? '#4f46e5' : '#64748b',
            borderBottom: active ? '3px solid #4f46e5' : '3px solid transparent',
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);

const DetailItem = ({ label, value, bold, large, valueColor }) => (
    <div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{label}</div>
        <div style={{ 
            fontSize: large ? 24 : 14, 
            fontWeight: bold || large ? 700 : 500, 
            color: valueColor || '#0f172a' 
        }}>
            {value || '—'}
        </div>
    </div>
);

