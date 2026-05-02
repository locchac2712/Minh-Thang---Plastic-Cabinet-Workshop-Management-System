package com.tuplastic.erp.invoice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class IssueInvoiceRequest {

    @NotBlank(message = "URL file hóa đơn không được để trống")
    private String invoiceFileUrl;
}
