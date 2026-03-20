package com.pcwms.backend.dto;

import lombok.Data;

public class PaymentDTO {
    // FE → BE: tạo link PayOS
    @Data
    public static class CreatePayOSRequest {
        private Long   salesOrderId;   // ID bảng SalesOrder
        private String orderNumber;    // Mã đơn (hiển thị trên PayOS)
        private Long   amount;         // Số tiền (VNĐ, không có phần thập phân)
        private String paymentType;    // "FULL" | "DEPOSIT"
        private String buyerName;      // Tên khách hàng
    }

    // BE → FE: sau khi tạo link thành công
    @Data
    public static class CreatePayOSResponse {
        private String checkoutUrl;
        private String qrCode;
        private String paymentLinkId;
        private Long   orderCode;
    }

    // BE → FE: trạng thái thanh toán (polling)
    @Data
    public static class StatusResponse {
        private String status;   // PENDING | PAID | CANCELLED | EXPIRED
        private Long   amount;
        private String paidAt;
    }

    // PayOS → BE: webhook body
    @Data
    public static class WebhookPayload {
        private String      code;
        private String      desc;
        private Boolean     success;
        private WebhookData data;
        private String      signature;

        @Data
        public static class WebhookData {
            private Long   orderCode;
            private Long   amount;
            private String description;
            private String accountNumber;
            private String reference;
            private String transactionDateTime;
            private String currency;
            private String paymentLinkId;
            private String code;
            private String desc;
            private String counterAccountBankId;
            private String counterAccountBankName;
            private String counterAccountName;
            private String counterAccountNumber;
            private String virtualAccountName;
            private String virtualAccountNumber;
        }
    }
}
