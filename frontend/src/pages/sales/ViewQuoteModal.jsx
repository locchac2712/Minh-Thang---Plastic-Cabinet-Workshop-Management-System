import { useState, useEffect } from "react";
import quotationService from "../../services/quotationService.js";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export const ViewQuoteModal = ({ quoteId, onClose }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await quotationService.getById(quoteId);
                setQuote(res);
            } catch (e) {
                console.error("Lỗi tải chi tiết:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [quoteId]);

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Chi tiết Báo giá</h2>
                        <span className="sq-modal-sub">{quote?.quotationNumber || "Đang tải..."}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {loading ? (
                        <div className="sp-state"><div className="sp-spinner" /><span>Đang tải thông tin...</span></div>
                    ) : !quote ? (
                        <div className="sp-state sp-state--error">⚠️ Không tìm thấy dữ liệu báo giá</div>
                    ) : (
                        <div className="sq-view-grid">
                            <div className="sq-view-main">
                                <div className="sq-view-card">
                                    <div className="sq-view-section-title">THÔNG TIN CHUNG</div>
                                    <div className="sq-view-row-grid">
                                        <div className="sq-view-item">
                                            <label>Ngày tạo</label>
                                            <div>{fmtDate(quote.createdDate)}</div>
                                        </div>
                                        <div className="sq-view-item">
                                            <label>Trạng thái</label>
                                            <span className={`sq-badge sq-badge--${(quote.status || "").toLowerCase()}`}>
                                                {quote.status === "DRAFT" ? "Bản nháp" : 
                                                 quote.status === "SENT" ? "Đã gửi" :
                                                 quote.status === "ACCEPTED" ? "Đã chốt" :
                                                 quote.status === "REJECTED" ? "Đã hủy" : "Hết hạn"}
                                            </span>
                                        </div>
                                        <div className="sq-view-item">
                                            <label>Hiệu lực đến</label>
                                            <div>{fmtDate(quote.validUntil)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sq-view-card">
                                    <div className="sq-view-section-title">KHÁCH HÀNG & NHÂN VIÊN</div>
                                    <div className="sq-view-row-grid">
                                        <div className="sq-view-item">
                                            <label>Khách hàng</label>
                                            <div style={{fontWeight: 600}}>{quote.customer?.name}</div>
                                        </div>
                                        <div className="sq-view-item">
                                            <label>Điện thoại</label>
                                            <div>{quote.customer?.phone || "—"}</div>
                                        </div>
                                        <div className="sq-view-item">
                                            <label>Nhân viên xử lý</label>
                                            <div style={{fontWeight: 600}}>{quote.staff?.fullname}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="sq-view-card">
                                    <div className="sq-view-section-title">DANH SÁCH SẢN PHẨM</div>
                                    <table className="sq-view-table">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm</th>
                                                <th>Số lượng</th>
                                                <th>Đơn giá</th>
                                                <th>Chiết khấu</th>
                                                <th style={{textAlign: "right"}}>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(quote.details || []).map((d, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <div style={{fontWeight: 500, color: "#111827"}}>{d.productName}</div>
                                                        <div style={{fontSize: "12px", color: "#6b7280"}}>{d.sku}</div>
                                                    </td>
                                                    <td>{d.quantity}</td>
                                                    <td>{fmt(d.unitPrice)}</td>
                                                    <td>{d.discountPercent}%</td>
                                                    <td style={{textAlign: "right", fontWeight: 600}}>{fmt(d.totalPrice)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="sq-view-sidebar">
                                <div className="sq-view-summary">
                                    <div className="sq-view-summary-title">TỔNG KẾT CHI PHÍ</div>
                                    <div className="sq-view-summary-row">
                                        <span>Tạm tính</span>
                                        <span>{fmt(quote.totalAmount)}</span>
                                    </div>
                                    <div className="sq-view-summary-sep" />
                                    <div className="sq-view-summary-row sq-view-summary-row--total">
                                        <span>Tổng cộng</span>
                                        <span>{fmt(quote.totalAmount)}</span>
                                    </div>
                                </div>

                                {quote.note && (
                                    <div className="sq-view-note">
                                        <label>Ghi chú báo giá</label>
                                        <p>{quote.note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                    {quote?.status === "DRAFT" && (
                        <button className="sq-modal-btn sq-modal-btn--submit">Gửi báo giá</button>
                    )}
                </div>
            </div>

            <style>{`
                .sq-view-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
                .sq-view-main { display: flex; flex-direction: column; gap: 20px; }
                .sq-view-card { background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #f0f0f5; }
                .sq-view-section-title { font-size: 11px; font-weight: 700; color: #9ca3af; letter-spacing: .05em; margin-bottom: 12px; }
                .sq-view-row-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                .sq-view-item label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 4px; }
                .sq-view-item div { font-size: 14px; color: #111827; }
                
                .sq-view-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                .sq-view-table th { text-align: left; font-size: 12px; color: #6b7280; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
                .sq-view-table td { padding: 12px; font-size: 13.5px; border-bottom: 1px solid #f3f4f6; }
                
                .sq-view-summary { background: #111827; border-radius: 14px; padding: 24px; color: #fff; }
                .sq-view-summary-title { font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 16px; }
                .sq-view-summary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
                .sq-view-summary-sep { height: 1px; background: rgba(255,255,255,0.1); margin: 16px 0; }
                .sq-view-summary-row--total { font-weight: 700; font-size: 18px; color: #fff; }
                
                .sq-view-note { margin-top: 20px; padding: 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; }
                .sq-view-note label { font-size: 12px; font-weight: 700; color: #92400e; display: block; margin-bottom: 4px; }
                .sq-view-note p { font-size: 13px; color: #b45309; margin: 0; line-height: 1.5; }
            `}</style>
        </div>
    );
};
