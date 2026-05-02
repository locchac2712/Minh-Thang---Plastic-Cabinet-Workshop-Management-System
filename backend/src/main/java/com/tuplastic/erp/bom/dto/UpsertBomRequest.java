package com.tuplastic.erp.bom.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Thay toàn bộ định mức (BOM) chuẩn của sản phẩm trong một lần gọi.
 * Danh sách rỗng = xóa hết dòng BOM (không cho phép null; có thể bỏ field hoặc gửi []).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpsertBomRequest {

    @NotNull(message = "items không được null (dùng mảng rỗng để xóa hết BOM)")
    @Valid
    private List<CreateBomItemRequest> items = new ArrayList<>();
}
