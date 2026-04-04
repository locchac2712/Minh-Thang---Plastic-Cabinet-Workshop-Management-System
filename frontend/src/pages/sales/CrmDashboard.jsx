import { useState, useEffect } from "react";
import "./SalesPages.css";
import crmService from "../../services/crmService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";

export const CrmDashboard = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year,  setYear]  = useState(today.getFullYear());
    const [stats, setStats] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadStats();
        loadReminders();
    }, [month, year]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await crmService.getDashboardStats(month, year);
            setStats(data);
        } catch (e) {
            console.error("Lỗi khi tải thống kê CRM", e);
        } finally {
            setLoading(false);
        }
    };

    const loadReminders = async () => {
        try {
            const data = await crmService.getPendingReminders();
            setReminders(data);
        } catch (e) {
            console.error("Lỗi khi tải nhắc hẹn", e);
        }
    };

    const handleResolve = async (id) => {
        try {
            await crmService.resolveReminder(id);
            setReminders(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            alert("Không thể cập nhật trạng thái");
        }
    };

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Tổng quan CRM</h1>
                    <p className="sp-sub">Thống kê hiệu quả kinh doanh và công nợ khách hàng</p>
                </div>
                
                <div className="crm-month-picker">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                        {Array.from({length: 12}, (_, i) => (
                            <option key={i+1} value={i+1}>Tháng {i+1}</option>
                        ))}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>Năm {y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="cf-loading" style={{padding: "100px 0"}}>
                    <div className="cf-spinner"></div>
                    <span>Đang tổng hợp dữ liệu...</span>
                </div>
            ) : stats && (
                <div className="crm-dash-grid">
                    {/* Thẻ Doanh thu thực tế */}
                    <div className="crm-stat-card card-revenue">
                        <div className="crm-stat-label">DOANH THU THỰC TẾ (PAID)</div>
                        <div className="crm-stat-value">{fmt(stats.actualRevenue)}</div>
                        <div className="crm-stat-desc">Tiền túi thực tế trong tháng {month}/{year}</div>
                        <div className="crm-stat-icon">💰</div>
                    </div>

                    {/* Thẻ Tiền nợ mới */}
                    <div className="crm-stat-card card-debt">
                        <div className="crm-stat-label">TIỀN NỢ MỚI PHÁT SINH</div>
                        <div className="crm-stat-value">{fmt(stats.newDebt)}</div>
                        <div className="crm-stat-desc">Số tiền đơn hàng chưa thu hồi trong tháng</div>
                        <div className="crm-stat-icon">📉</div>
                    </div>

                    {/* Thẻ Khách hàng */}
                    <div className="crm-stat-card card-customers">
                        <div className="crm-stat-label">KHÁCH HÀNG MỚI & QUY MÔ</div>
                        <div className="crm-stat-grid">
                            <div>
                                <span style={{color: '#7c3aed'}}>{stats.totalNewCustomers || 0}</span>
                                <small>Tháng này</small>
                            </div>
                            <div>
                                <span>{stats.totalActiveCustomers}</span>
                                <small>Đang hoạt động</small>
                            </div>
                        </div>
                        <div className="crm-stat-icon">👥</div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 24 }}>
                {/* Biểu đồ giả lập */}
                <div className="sp-card">
                    <div className="crm-chart-placeholder">
                        <div className="crm-chart-header">So sánh Doanh thu & Nợ mới (Biểu đồ tháng {month})</div>
                        <div className="crm-bars">
                            <div className="crm-bar-group">
                                <div className="crm-bar-label">Thực thu</div>
                                <div className="crm-bar crm-bar--rev" style={{width: stats?.actualRevenue > 0 ? "80%" : "5%"}}></div>
                            </div>
                            <div className="crm-bar-group">
                                <div className="crm-bar-label">Nợ mới</div>
                                <div className="crm-bar crm-bar--debt" style={{width: stats?.newDebt > 0 ? "40%" : "5%"}}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Widget Nhắc hẹn xử lý */}
                <div className="sp-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔔 Nhắc hẹn của bạn</h3>
                        <span style={{ fontSize: 12, background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{reminders.length} việc cần làm</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                        {reminders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 }}>Tất cả công việc đã hoàn thành! ✨</div>
                        ) : reminders.map(r => (
                            <div key={r.id} style={{ padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{r.customerName}</span>
                                    <span style={{ fontSize: 11, color: '#e11d48', fontWeight: 600 }}>⏰ {new Date(r.reminderDate).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{r.content}</div>
                                <button onClick={() => handleResolve(r.id)} style={{ width: '100%', padding: '6px', fontSize: 11, background: '#f1f5f9', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Đánh dấu hoàn thành</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
