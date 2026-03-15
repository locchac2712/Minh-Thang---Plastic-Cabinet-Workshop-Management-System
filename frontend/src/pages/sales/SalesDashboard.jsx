import "./SalesPages.css";

const STAT_CARDS = [
    { label: "Khách hàng của tôi", dot: "#3b82f6" },
    { label: "Báo giá",            dot: "#7c3aed" },
    { label: "Đơn hàng",          dot: "#22c55e" },
    { label: "Doanh thu",          dot: "#f97316" },
];

const ORDER_COLS = ["SỐ ĐƠN", "KHÁCH HÀNG", "TỔNG TIỀN", "TRẠNG THÁI"];
const QUOTE_COLS = ["SỐ BG",  "KHÁCH HÀNG", "TỔNG TIỀN", "TRẠNG THÁI"];

export const SalesDashboard = ({ onNavigate }) => (
    <div className="sp-page">
        <div className="sd-actions">
            <button className="sd-btn-dark" onClick={() => onNavigate("quotes")}>+ Tạo báo giá</button>
            <button className="sd-btn-outline" onClick={() => onNavigate("orders")}>+ Tạo đơn hàng</button>
        </div>
        <div className="sd-stats">
            {STAT_CARDS.map(c => (
                <div key={c.label} className="sd-stat-card">
                    <div className="sd-stat-card__header">
                        <span className="sd-stat-dot" style={{ background: c.dot }} />
                        <span className="sd-stat-label">{c.label}</span>
                    </div>
                    <div className="sd-stat-value">—</div>
                </div>
            ))}
        </div>
        <div className="sd-tables">
            <div className="sd-table-wrap">
                <div className="sd-table-title">Đơn hàng gần đây</div>
                <table className="sp-table">
                    <thead><tr>{ORDER_COLS.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody><tr><td colSpan={4} className="sp-empty-row">Chưa có đơn hàng</td></tr></tbody>
                </table>
            </div>
            <div className="sd-table-wrap">
                <div className="sd-table-title">Báo giá gần đây</div>
                <table className="sp-table">
                    <thead><tr>{QUOTE_COLS.map(c => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody><tr><td colSpan={4} className="sp-empty-row">Chưa có báo giá</td></tr></tbody>
                </table>
            </div>
        </div>
    </div>
);