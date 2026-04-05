import { useState } from "react";
import api from "../../services/api";

export const ScheduleOrderModal = ({ order, onClose, onSuccess }) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            setError("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await api.post(`/production-plans/generate?salesOrderId=${order.id}`, {
                startDate,
                endDate
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Không thể lập kế hoạch sản xuất");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box" onClick={(e) => e.stopPropagation()} style={{ width: "400px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">Lập kế hoạch sản xuất</h3>
                        <span className="sq-modal-sub">{order.orderNumber}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                
                <form onSubmit={handleSubmit} className="sq-modal-body">
                    {error && <div className="sp-state sp-state--error" style={{ marginBottom: "16px", padding: "10px" }}>⚠️ {error}</div>}
                    
                    <div className="so-filter-item" style={{ marginBottom: "20px" }}>
                        <label className="so-filter-label" style={{ marginBottom: "8px", display: "block" }}>Ngày bắt đầu dự kiến</label>
                        <input 
                            type="date" 
                            className="so-filter-input" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="so-filter-item" style={{ marginBottom: "20px" }}>
                        <label className="so-filter-label" style={{ marginBottom: "8px", display: "block" }}>Ngày kết thúc dự kiến</label>
                        <input 
                            type="date" 
                            className="so-filter-input" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
                        <button 
                            type="button" 
                            className="sp-btn-primary" 
                            style={{ background: "#f1f5f9", color: "#64748b", border: "none" }}
                            onClick={onClose}
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            type="submit" 
                            className="sp-btn-primary" 
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? "Đang xử lý..." : "Xác nhận lập kế hoạch"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
