package com.tuplastic.erp.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverBatchRequest {

    @NotNull(message = "taskId không được để trống")
    private UUID taskId;

    /** Địa chỉ giao của lô này (mỗi lô có thể một điểm khác nhau). */
    @NotBlank(message = "Địa chỉ giao không được để trống")
    private String deliveryAddress;

    /** URL ảnh bằng chứng — bắt buộc khi xác nhận giao lô. */
    @NotBlank(message = "Ảnh bằng chứng giao hàng không được để trống")
    private String deliveryProofImageUrl;
}
