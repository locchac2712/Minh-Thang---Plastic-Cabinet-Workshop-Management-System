package com.tuplastic.erp.payment.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PatchSellerPaymentRequest {

    private String proofImage;

    private String note;

    @Size(max = 50, message = "Phương thức thanh toán không được vượt quá 50 ký tự")
    private String paymentMethod;
}
