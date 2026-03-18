import React, { useState } from 'react';

export const ApprovalModal = ({ order, onClose, onConfirm }) => {
    const [note, setNote] = useState("");
    const [limit, setLimit] = useState(order.totalAmount || 0);

    return (
        <div className="sp-modal-overlay">
            <div className="sp-modal-content sp-modal--light">
                <span className="sp-modal-title">Xác nhận gửi yêu cầu</span>

                <div className="sp-modal-body">
                    <div className="info-box-light">
                        <p><strong>Mã đơn:</strong> {order.orderNumber}</p>
                        <p><strong>Khách hàng:</strong> {order.customerName}</p>
                        <p><strong>Tổng tiền:</strong> {new Intl.NumberFormat("vi-VN").format(order.totalAmount)} đ</p>
                    </div>

                    <div className="form-group">
                        <label>Hạn mức tín dụng đề xuất (VND):</label>
                        <input
                            type="number"
                            className="sp-input-light"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>Ghi chú:</label>
                        <textarea
                            className="sp-textarea-light"
                            rows="3"
                            placeholder="Nhập nội dung tin nhắn gửi cấp trên..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <div className="sp-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Hủy bỏ
                    </button>
                    <button
                        className="btn-submit"
                        onClick={() => onConfirm(true, limit, note)}
                    >
                        Gửi yêu cầu
                    </button>
                </div>
            </div>
        </div>
    );
};