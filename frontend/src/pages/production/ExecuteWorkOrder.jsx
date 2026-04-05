import { useState, useEffect } from "react";
import api from "../../services/api";
import "../sales/SalesPages.css";

const STATUS_MO = {
    PLANNED:     { text: "Chờ sản xuất", cls: "sq-badge--draft" },
    IN_PROGRESS: { text: "Đang sản xuất", cls: "so-badge--producing" },
    COMPLETED:   { text: "Đã hoàn tất",   cls: "so-badge--ready" },
};

const STATUS_PLAN = {
    PLANNED:     { text: "Mới lập",      cls: "sq-badge--draft" },
    IN_PROGRESS: { text: "Đang thực hiện", cls: "so-badge--confirmed" },
    COMPLETED:   { text: "Đã xong",      cls: "so-badge--ready" },
};

export const ExecuteWorkOrder = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPlan, setExpandedPlan] = useState(null);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const res = await api.get("/production-plans");
            setPlans(res.data?.data || []);
        } catch (err) {
            console.error("Lỗi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const updateStatus = async (moId, status) => {
        try {
            await api.patch(`/production-plans/work-orders/${moId}/status?status=${status}`);
            fetchPlans(); // Refresh data
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể cập nhật"));
        }
    };

    if (loading) return <div className="sp-state" style={{ padding: 100 }}><div className="sp-spinner" /></div>;

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Thực thi Lệnh sản xuất</h1>
                    <p className="sp-subtitle">Quản lý tiến độ sản xuất chi tiết cho từng đơn hàng</p>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {plans.length === 0 ? (
                    <div className="sq-empty">
                        <div className="sq-empty__icon">🚀</div>
                        <p>Chưa có kế hoạch nào cần thực thi.</p>
                    </div>
                ) : (
                    plans.filter(p => p.status !== "COMPLETED").map(plan => (
                        <div key={plan.id} className="sp-card" style={{ padding: 0, overflow: "hidden", border: expandedPlan === plan.id ? "2px solid #7c3aed" : "1.5px solid #e2e8f0" }}>
                            <div 
                                style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: expandedPlan === plan.id ? "#f5f3ff" : "white" }}
                                onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                            >
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{ padding: "10px", background: "#ede9fe", borderRadius: "12px", color: "#7c3aed" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "16px", color: "#1e293b" }}>{plan.planName}</div>
                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                            Thời gian: {plan.startDate} → {plan.endDate}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <span className={`sq-badge ${STATUS_PLAN[plan.status]?.cls}`}>{STATUS_PLAN[plan.status]?.text}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" style={{ transform: expandedPlan === plan.id ? "rotate(180deg)" : "none", transition: "0.2s" }} strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            </div>

                            {expandedPlan === plan.id && (
                                <div style={{ padding: "0 20px 20px 20px", borderTop: "1px solid #f1f5f9" }}>
                                    <table className="sp-table" style={{ marginTop: 0 }}>
                                        <thead className="sq-table-head">
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th style={{ textAlign: "center" }}>Số lượng</th>
                                                <th>Trạng thái</th>
                                                <th style={{ textAlign: "right" }}>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {plan.manufactureOrders?.map(mo => (
                                                <tr key={mo.id} className="sp-table__row">
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{mo.product?.name}</div>
                                                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Mã SP: {mo.product?.sku}</div>
                                                    </td>
                                                    <td style={{ textAlign: "center", fontWeight: 800 }}>{mo.quantity}</td>
                                                    <td>
                                                        <span className={`sq-badge ${STATUS_MO[mo.wipStatus]?.cls}`}>{STATUS_MO[mo.wipStatus]?.text}</span>
                                                    </td>
                                                    <td style={{ textAlign: "right" }}>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                            {mo.wipStatus === "PLANNED" && (
                                                                <button title="Bắt đầu" className="sp-action-btn" style={{ color: "#0ea5e9", borderColor: "#bae6fd" }} onClick={() => updateStatus(mo.id, "IN_PROGRESS")}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                                                </button>
                                                            )}
                                                            {mo.wipStatus === "IN_PROGRESS" && (
                                                                <button title="Hoàn tất" className="sp-action-btn" style={{ color: "#10b981", borderColor: "#a7f3d0" }} onClick={() => updateStatus(mo.id, "COMPLETED")}>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                </button>
                                                            )}
                                                            {mo.wipStatus === "COMPLETED" && (
                                                                <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>Đã xong</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .so-badge--producing { background: #e0f2fe; color: #0284c7; border: 1.5px solid #bae6fd; }
                .so-badge--ready { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; }
                .so-badge--confirmed { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; }
            `}</style>
        </div>
    );
};

