package com.pcwms.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResponseObject {
    private String status;  // Ví dụ: "SUCCESS", "FAILED"
    private String message; // Ví dụ: "Lấy dữ liệu thành công"
    private Object data;    // Dữ liệu trả về (List, User, Token...)
}